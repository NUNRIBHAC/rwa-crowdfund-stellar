// TOTP second factor (RFC 6238) for wallet-login accounts.
//
// Design notes (security review targets):
// - Defaults follow the authenticator-app convention: HMAC-SHA1, 6 digits,
//   30-second period. Verification accepts the previous and next step for
//   clock skew but never a step at or below the account's last used step
//   (replay protection; the caller persists lastUsedStep atomically).
// - Seeds are never stored in plaintext: encryptSeed/decryptSeed use
//   AES-256-GCM with a key derived via HKDF-SHA256 from the server secret
//   under a purpose label, so the seed at rest is useless without the server
//   key and the key is never the raw server secret.
// - Recovery codes are shown exactly once at enable time; only their
//   SHA-256 hashes are stored, and consumption is single-use.
// - Constant-time comparisons everywhere a secret-derived value is checked.
import { createHmac, createCipheriv, createDecipheriv, hkdfSync, randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export const TOTP_DIGITS = 6;
export const TOTP_PERIOD = 30;
export const RECOVERY_CODE_COUNT = 8;
const HKDF_INFO = 'blockallisto-totp-seed-encryption-v1';

// --- base32 (RFC 4648, no padding) ---
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of s.toUpperCase().replace(/=+$/, '')) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

// --- RFC 6238 core ---
export function generateSecret(): string {
  // 160 bits, the conventional authenticator seed size.
  return base32Encode(randomBytes(20));
}

export function hotp(secretBase32: string, counter: number, digits = TOTP_DIGITS): string {
  const key = base32Decode(secretBase32);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', key).update(msg).digest();
  const offset = h[h.length - 1] & 0x0f;
  const binary = ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  return String(binary % 10 ** digits).padStart(digits, '0');
}

export function totpAt(secretBase32: string, unixSeconds: number, digits = TOTP_DIGITS): string {
  return hotp(secretBase32, Math.floor(unixSeconds / TOTP_PERIOD), digits);
}

// Returns the matched time step on success, null on failure. The caller must
// persist lastUsedStep = matched step to make replay impossible.
export function verifyTotp(secretBase32: string, code: string, unixSeconds: number, lastUsedStep: number, windowSteps = 1): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const step = Math.floor(unixSeconds / TOTP_PERIOD);
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const candidate = step + delta;
    if (candidate <= lastUsedStep) continue;
    const expected = hotp(secretBase32, candidate);
    const a = Buffer.from(expected);
    const b = Buffer.from(code);
    if (a.length === b.length && timingSafeEqual(a, b)) return candidate;
  }
  return null;
}

// --- seed encryption at rest (AES-256-GCM, HKDF-derived purpose key) ---
function totpKey(serverSecret: string): Buffer {
  return Buffer.from(hkdfSync('sha256', serverSecret, 'blockallisto-totp-salt-v1', HKDF_INFO, 32));
}

export function encryptSeed(serverSecret: string, seedBase32: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', totpKey(serverSecret), iv);
  const ct = Buffer.concat([cipher.update(seedBase32, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join('.');
}

export function decryptSeed(serverSecret: string, payload: string): string {
  const parts = payload.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') throw new Error('unknown seed payload');
  const [, ivB64, tagB64, ctB64] = parts;
  const decipher = createDecipheriv('aes-256-gcm', totpKey(serverSecret), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
}

// --- recovery codes (single-use; only hashes stored) ---
export function generateRecoveryCodes(): string[] {
  // 10 base32 chars (50 bits) per code; formatted XXXXX-XXXXX for reading.
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = base32Encode(randomBytes(7)).slice(0, 10);
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase()).digest('hex');
}
