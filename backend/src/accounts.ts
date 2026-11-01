import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import type { Account, CommunityStore } from './community-store.js';
import { generateSecret, encryptSeed, decryptSeed, verifyTotp, generateRecoveryCodes, hashRecoveryCode } from './totp.js';

// Wallet-challenge authentication for the demo platform.
//
// Registration and login are the same flow: prove ownership of a Stellar
// public key by signing a single-use, short-lived, domain-separated message
// (the same message Freighter's signMessage produces a signature over). No
// passwords, no email, no third-party provider - the wallet is the identity,
// matching the contribution flow that already uses Freighter.
//
// This is real proof-of-key ownership. It is NOT KYC: it says nothing about
// who the person is, and it must never be wired to unlock investment limits,
// cash-outs or compliance gates (see IMPLEMENTATION.md).
//
// Data minimization: an account stores only the public key and an optional
// display name. Session tokens are stored sha256-hashed; the raw token is
// returned to the client once and never logged.

export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const DISPLAY_NAME_MAX = 40;

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function isValidPublicKey(publicKey: string): boolean {
  return StrKey.isValidEd25519PublicKey(publicKey);
}

export function validateDisplayName(name: unknown): string | null {
  if (name === null || name === undefined || name === '') return null;
  if (typeof name !== 'string') throw new AuthError(400, 'displayName must be a string');
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > DISPLAY_NAME_MAX) throw new AuthError(400, `displayName must be at most ${DISPLAY_NAME_MAX} characters`);
  // No control characters; keep URLs out of display names to reduce spoofing
  // and link spam in comments.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F]|[\u007F-\u009F]/.test(trimmed)) throw new AuthError(400, 'displayName contains unsupported characters');
  if (/https?:\/\//i.test(trimmed) || /\bwww\./i.test(trimmed)) throw new AuthError(400, 'displayName must not contain links');
  return trimmed;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createChallenge(store: CommunityStore, publicKey: string, now = Date.now()): Promise<{ message: string; expiresAt: number }> {
  if (!isValidPublicKey(publicKey)) throw new AuthError(400, 'invalid Stellar public key');
  const id = randomBytes(16).toString('hex');
  const nonce = randomBytes(16).toString('hex');
  const expiresAt = now + CHALLENGE_TTL_MS;
  // Domain-separated, human-readable, explicitly not a transaction. Wallets
  // show this text to the signer; it must say what it is for.
  const message = [
    'Blockallisto demo login',
    `account: ${publicKey}`,
    `nonce: ${nonce}`,
    `expires: ${new Date(expiresAt).toISOString()}`,
    'Signing this proves wallet ownership only. It is not a transaction and moves no funds.',
  ].join('\n');
  await store.change((state) => {
    state.challenges[id] = { id, publicKey, message, expiresAt, used: false };
  });
  return { message, expiresAt };
}

export async function verifyChallenge(
  store: CommunityStore,
  publicKey: string,
  signatureBase64: string,
  now = Date.now(),
): Promise<{ token: string; expiresAt: number; account: Account } | { requiresTotp: true; ticket: string; expiresAt: number; account: Account }> {
  if (!isValidPublicKey(publicKey)) throw new AuthError(400, 'invalid Stellar public key');
  let signature: Buffer;
  try {
    signature = Buffer.from(signatureBase64, 'base64');
    if (signature.length !== 64) throw new Error('bad length');
  } catch {
    throw new AuthError(400, 'signature must be base64-encoded 64-byte Ed25519');
  }
  // Find a matching unused, unexpired challenge and mark it used atomically
  // before verifying, so a signature cannot be replayed against two concurrent
  // verify calls.
  const found = await store.change((state) => {
    const challenge = Object.values(state.challenges).find(
      (c) => c.publicKey === publicKey && !c.used && c.expiresAt > now && verifySignature(publicKey, c.message, signature),
    );
    if (!challenge) return null;
    challenge.used = true;
    const account =
      state.accounts[publicKey] ??
      (state.accounts[publicKey] = {
        publicKey,
        displayName: null,
        createdAt: now,
      });
    // Second factor: wallet signature alone is not enough when TOTP is
    // enabled - issue a one-purpose ticket instead of a session.
    if (account.totp?.status === 'enabled') {
      const ticket = `blt_${randomBytes(24).toString('hex')}`;
      const expiresAt = now + TOTP_TICKET_TTL_MS;
      state.totpTickets[ticket] = { id: ticket, publicKey, expiresAt };
      return { requiresTotp: true as const, ticket, expiresAt, account: { ...account }, challenge };
    }
    const token = `bls_${randomBytes(24).toString('hex')}`;
    const session = {
      tokenHash: hashToken(token),
      publicKey,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };
    state.sessions[session.tokenHash] = session; // keyed by hash; the raw token is never stored
    return {
      token,
      expiresAt: session.expiresAt,
      account: { ...account },
      challenge,
    };
  });
  if (!found) throw new AuthError(401, 'no matching login challenge: request a new challenge, check the signature, and retry before expiry');
  if ('requiresTotp' in found) {
    const ticketed = found as { requiresTotp: true; ticket: string; expiresAt: number; account: Account };
    return { requiresTotp: true, ticket: ticketed.ticket, expiresAt: ticketed.expiresAt, account: ticketed.account };
  }
  return {
    token: found.token,
    expiresAt: found.expiresAt,
    account: found.account,
  };
}

// What clients may ever see of an account. The TOTP enrollment (encrypted
// seed, recovery hashes, counters) is server-only and NEVER serialized.
export function publicAccount(account: Account): {
  publicKey: string;
  displayName: string | null;
  createdAt: number;
  totpEnabled: boolean;
} {
  return {
    publicKey: account.publicKey,
    displayName: account.displayName,
    createdAt: account.createdAt,
    totpEnabled: account.totp?.status === 'enabled',
  };
}

export const TOTP_TICKET_TTL_MS = 5 * 60 * 1000;
export const TOTP_MAX_FAILURES = 5;
export const TOTP_LOCK_MS = 5 * 60 * 1000;

// Server secret for seed encryption: dedicated env first, the platform
// secret as fallback; missing either means 2FA is honestly unavailable
// (fail closed, no plaintext fallback).
function totpServerSecret(): string {
  const secret = process.env.COMMUNITY_TOTP_KEY ?? process.env.PLATFORM_SECRET;
  if (!secret) throw new AuthError(503, 'second factor is not configured on this deployment');
  return secret;
}

export async function enrollTotp(store: CommunityStore, publicKey: string): Promise<{ otpauthUrl: string; manualKey: string }> {
  const serverSecret = totpServerSecret();
  const seed = generateSecret();
  const encSeed = encryptSeed(serverSecret, seed);
  const result = await store.change((state) => {
    const account = state.accounts[publicKey];
    if (!account) throw new AuthError(404, 'account not found');
    if (account.totp?.status === 'enabled') throw new AuthError(409, 'second factor already enabled; disable it first');
    account.totp = {
      status: 'pending',
      encSeed,
      lastUsedStep: -1,
      recoveryHashes: [],
      enabledAt: null,
      failedAttempts: 0,
      lockUntil: null,
    };
    return true;
  });
  if (!result) throw new AuthError(500, 'enrollment failed');
  const label = encodeURIComponent(`Blockallisto:${publicKey.slice(0, 8)}`);
  const issuer = encodeURIComponent('Blockallisto (demo)');
  return {
    otpauthUrl: `otpauth://totp/${label}?secret=${seed}&issuer=${issuer}`,
    manualKey: seed,
  };
}

export async function enableTotp(store: CommunityStore, publicKey: string, code: string, now = Date.now()): Promise<{ recoveryCodes: string[] }> {
  const serverSecret = totpServerSecret();
  const outcome = await store.change((state) => {
    const account = state.accounts[publicKey];
    const enrollment = account?.totp;
    if (!account || !enrollment) throw new AuthError(400, 'no pending second-factor enrollment');
    if (enrollment.status === 'enabled') throw new AuthError(409, 'second factor already enabled');
    const seed = decryptSeed(serverSecret, enrollment.encSeed);
    const step = verifyTotp(seed, code, Math.floor(now / 1000), enrollment.lastUsedStep);
    if (step === null) return null;
    const recoveryCodes = generateRecoveryCodes();
    enrollment.status = 'enabled';
    enrollment.enabledAt = now;
    // The enrollment code verifies but does NOT consume its step: the first
    // login usually happens inside the same 30s window with the same code
    // shown by the authenticator. Replay protection (lastUsedStep) applies
    // to logins from then on.
    enrollment.recoveryHashes = recoveryCodes.map(hashRecoveryCode);
    enrollment.failedAttempts = 0;
    enrollment.lockUntil = null;
    return recoveryCodes;
  });
  if (!outcome) throw new AuthError(401, 'code did not match; check your authenticator and retry');
  return { recoveryCodes: outcome };
}

export async function completeTotpLogin(
  store: CommunityStore,
  ticket: string,
  code: string,
  now = Date.now(),
): Promise<{ token: string; expiresAt: number; account: Account }> {
  const serverSecret = totpServerSecret();
  const found = await store.change((state) => {
    const t = state.totpTickets[ticket];
    if (!t || t.expiresAt <= now) return null;
    const account = state.accounts[t.publicKey];
    const enrollment = account?.totp;
    if (!account || !enrollment || enrollment.status !== 'enabled') return null;
    if (enrollment.lockUntil && enrollment.lockUntil > now) {
      throw new AuthError(429, 'too many failed attempts; retry in a few minutes');
    }
    const seed = decryptSeed(serverSecret, enrollment.encSeed);
    const step = verifyTotp(seed, code, Math.floor(now / 1000), enrollment.lastUsedStep);
    let ok = false;
    if (step !== null) {
      enrollment.lastUsedStep = step;
      ok = true;
    } else {
      // Recovery code path: single-use, consumed atomically in this change.
      const hash = hashRecoveryCode(code);
      const idx = enrollment.recoveryHashes.findIndex((h) => h.length === hash.length && timingSafeEqual(Buffer.from(h), Buffer.from(hash)));
      if (idx !== -1) {
        enrollment.recoveryHashes.splice(idx, 1);
        ok = true;
      }
    }
    if (!ok) {
      enrollment.failedAttempts += 1;
      if (enrollment.failedAttempts >= TOTP_MAX_FAILURES) {
        enrollment.lockUntil = now + TOTP_LOCK_MS;
        enrollment.failedAttempts = 0;
      }
      return null;
    }
    enrollment.failedAttempts = 0;
    enrollment.lockUntil = null;
    delete state.totpTickets[ticket];
    const token = `bls_${randomBytes(24).toString('hex')}`;
    const session = {
      tokenHash: hashToken(token),
      publicKey: account.publicKey,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };
    state.sessions[session.tokenHash] = session;
    return { token, expiresAt: session.expiresAt, account: { ...account } };
  });
  if (!found) throw new AuthError(401, 'invalid or expired ticket or wrong code; sign in again');
  return found;
}

export async function disableTotp(store: CommunityStore, publicKey: string, code: string, now = Date.now()): Promise<void> {
  const serverSecret = totpServerSecret();
  const ok = await store.change((state) => {
    const account = state.accounts[publicKey];
    const enrollment = account?.totp;
    if (!account || !enrollment || enrollment.status !== 'enabled') throw new AuthError(400, 'second factor is not enabled');
    const seed = decryptSeed(serverSecret, enrollment.encSeed);
    const step = verifyTotp(seed, code, Math.floor(now / 1000), enrollment.lastUsedStep);
    if (step !== null) {
      enrollment.lastUsedStep = step;
    } else {
      const hash = hashRecoveryCode(code);
      const idx = enrollment.recoveryHashes.findIndex((h) => h.length === hash.length && timingSafeEqual(Buffer.from(h), Buffer.from(hash)));
      if (idx === -1) return false;
    }
    delete account.totp;
    return true;
  });
  if (!ok) throw new AuthError(401, 'code did not match; second factor not disabled');
}

function verifySignature(publicKey: string, message: string, signature: Buffer): boolean {
  try {
    // Freighter (freighter-api v5+) signs per SEP-53: ed25519 over
    // SHA-256("Stellar Signed Message:\n" || message-utf8). verifyMessage
    // applies that framing; raw-message signatures are rejected.
    return Keypair.fromPublicKey(publicKey).verifyMessage(message, signature);
  } catch {
    return false;
  }
}

export async function authenticate(store: CommunityStore, authorizationHeader: string | undefined, now = Date.now()): Promise<Account> {
  const token = authorizationHeader?.match(/^Bearer (bls_[0-9a-f]{48})$/)?.[1];
  if (!token) throw new AuthError(401, 'missing or malformed bearer token');
  const tokenHash = hashToken(token);
  const account = await store.change((state) => {
    const session = state.sessions[tokenHash];
    if (!session || session.expiresAt <= now) return null;
    const account = state.accounts[session.publicKey];
    return account ? { ...account } : null;
  });
  if (!account) throw new AuthError(401, 'session expired or unknown; log in again');
  return account;
}

export async function logout(store: CommunityStore, authorizationHeader: string | undefined): Promise<void> {
  const token = authorizationHeader?.match(/^Bearer (bls_[0-9a-f]{48})$/)?.[1];
  if (!token) return;
  const tokenHash = hashToken(token);
  await store.change((state) => {
    delete state.sessions[tokenHash];
  });
}

export type SessionInfo = {
  // Short non-secret handle: a prefix of the token hash. Enough to address a
  // session for revocation, useless for authenticating.
  id: string;
  createdAt: number;
  expiresAt: number;
  current: boolean;
};

export async function listSessions(
  store: CommunityStore,
  publicKey: string,
  authorizationHeader: string | undefined,
  now = Date.now(),
): Promise<SessionInfo[]> {
  const currentHash = authorizationHeader?.match(/^Bearer (bls_[0-9a-f]{48})$/)?.[1];
  const current = currentHash ? hashToken(currentHash) : null;
  const state = await store.read();
  return Object.values(state.sessions)
    .filter((sess) => sess.publicKey === publicKey && sess.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((sess) => ({
      id: sess.tokenHash.slice(0, 12),
      createdAt: sess.createdAt,
      expiresAt: sess.expiresAt,
      current: sess.tokenHash === current,
    }));
}

export async function revokeSession(store: CommunityStore, publicKey: string, sessionId: string): Promise<boolean> {
  if (!/^[0-9a-f]{12}$/.test(sessionId)) throw new AuthError(400, 'invalid session id');
  return store.change((state) => {
    const entry = Object.values(state.sessions).find((sess) => sess.publicKey === publicKey && sess.tokenHash.startsWith(sessionId));
    if (!entry) return false;
    delete state.sessions[entry.tokenHash];
    return true;
  });
}

export async function logoutOtherSessions(store: CommunityStore, publicKey: string, authorizationHeader: string | undefined): Promise<number> {
  const currentHash = authorizationHeader?.match(/^Bearer (bls_[0-9a-f]{48})$/)?.[1];
  const current = currentHash ? hashToken(currentHash) : null;
  return store.change((state) => {
    let removed = 0;
    for (const sess of Object.values(state.sessions)) {
      if (sess.publicKey === publicKey && sess.tokenHash !== current) {
        delete state.sessions[sess.tokenHash];
        removed += 1;
      }
    }
    return removed;
  });
}

export async function setDisplayName(store: CommunityStore, publicKey: string, name: unknown): Promise<Account> {
  const displayName = validateDisplayName(name);
  return store.change((state) => {
    const account = state.accounts[publicKey];
    if (!account) throw new AuthError(404, 'account not found');
    account.displayName = displayName;
    return { ...account };
  });
}

// Constant-time comparison helper for future admin-identity upgrades; the
// current admin gate lives in server.ts.
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
