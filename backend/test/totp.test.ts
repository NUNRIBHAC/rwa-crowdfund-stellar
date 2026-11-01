// TOTP core: RFC 6238 Appendix B vectors (SHA1, T0=0, 30s step, 8 digits),
// 6-digit default, replay protection, seed encryption round-trip, recovery
// code hashing. No network, no clock dependence (fixed times).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  base32Encode,
  base32Decode,
  hotp,
  totpAt,
  verifyTotp,
  generateSecret,
  encryptSeed,
  decryptSeed,
  generateRecoveryCodes,
  hashRecoveryCode,
} from '../src/totp.js';

// RFC 6238 Appendix B seed: ASCII "12345678901234567890".
const RFC_SEED = base32Encode(Buffer.from('12345678901234567890', 'ascii'));

test('base32 round-trips', () => {
  const buf = Buffer.from('12345678901234567890', 'ascii');
  assert.deepEqual(base32Decode(base32Encode(buf)), buf);
});

test('RFC 6238 Appendix B SHA1 vectors (8 digits)', () => {
  assert.equal(hotp(RFC_SEED, Math.floor(59 / 30), 8), '94287082');
  assert.equal(hotp(RFC_SEED, Math.floor(1111111109 / 30), 8), '07081804');
  assert.equal(hotp(RFC_SEED, Math.floor(1111111111 / 30), 8), '14050471');
  assert.equal(hotp(RFC_SEED, Math.floor(1234567890 / 30), 8), '89005924');
  assert.equal(hotp(RFC_SEED, Math.floor(2000000000 / 30), 8), '69279037');
  assert.equal(hotp(RFC_SEED, Math.floor(20000000000 / 30), 8), '65353130');
});

test('totpAt matches the RFC vector through the time API', () => {
  assert.equal(totpAt(RFC_SEED, 59, 8), '94287082');
  // 6-digit default is the low 6 digits of the 8-digit value.
  assert.equal(totpAt(RFC_SEED, 59), '287082');
});

test('verifyTotp accepts current and adjacent steps only', () => {
  const t = 590;
  const step = Math.floor(t / 30);
  assert.equal(verifyTotp(RFC_SEED, totpAt(RFC_SEED, t), t, -1), step);
  assert.equal(verifyTotp(RFC_SEED, totpAt(RFC_SEED, t - 30), t, -1), step - 1);
  assert.equal(verifyTotp(RFC_SEED, totpAt(RFC_SEED, t + 30), t, -1), step + 1);
  assert.equal(verifyTotp(RFC_SEED, totpAt(RFC_SEED, t - 60), t, -1), null, 'two steps back rejected');
  assert.equal(verifyTotp(RFC_SEED, '000000', t, -1), null);
  assert.equal(verifyTotp(RFC_SEED, '28708', t, -1), null, 'short code rejected');
  assert.equal(verifyTotp(RFC_SEED, 'abcdef', t, -1), null, 'non-digit rejected');
});

test('verifyTotp never reuses a step at or below lastUsedStep (replay)', () => {
  const t = 590;
  const step = Math.floor(t / 30);
  const code = totpAt(RFC_SEED, t);
  const first = verifyTotp(RFC_SEED, code, t, -1);
  assert.equal(first, step);
  // Same code, same time, after persisting lastUsedStep: rejected.
  assert.equal(verifyTotp(RFC_SEED, code, t, first!), null);
  // Next step's code still works.
  assert.equal(verifyTotp(RFC_SEED, totpAt(RFC_SEED, t + 30), t + 30, first!), step + 1);
});

test('seed encryption round-trips and never stores plaintext', () => {
  const secret = generateSecret();
  const payload = encryptSeed('server-secret', secret);
  assert.ok(!payload.includes(secret));
  assert.equal(decryptSeed('server-secret', payload), secret);
  assert.throws(() => decryptSeed('wrong-secret', payload), 'wrong key must fail (GCM auth)');
  // Random IV: same seed encrypts differently each time.
  assert.notEqual(encryptSeed('server-secret', secret), payload);
});

test('recovery codes: 8 unique, hashed storage, format', () => {
  const codes = generateRecoveryCodes();
  assert.equal(codes.length, 8);
  assert.equal(new Set(codes).size, 8);
  for (const c of codes) {
    assert.match(c, /^[A-Z2-7]{5}-[A-Z2-7]{5}$/);
    const h = hashRecoveryCode(c);
    assert.match(h, /^[0-9a-f]{64}$/);
    assert.equal(hashRecoveryCode(c.toLowerCase()), h, 'case-insensitive verify');
  }
});
