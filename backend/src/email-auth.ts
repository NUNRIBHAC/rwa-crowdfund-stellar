// Email + password registration/login, sitting NEXT TO the wallet-challenge
// flow (accounts.ts), not replacing it.
//
// Why this exists: the wallet flow proves key ownership but asks every
// visitor to install Freighter first. Email registration lets a demo visitor
// create an account with email + password, verify the address, and log in.
//
// Identity model: an email account gets a server-generated THROWAWAY Stellar
// keypair whose secret is discarded at creation. The account therefore has a
// public key like every other account (sessions, comments and the invested
// news feed all key on it), but nobody can sign for it - on-chain actions
// (contributing) still require connecting a real wallet, unchanged. Linking
// an email account to a wallet account is a deliberate follow-up, not a side
// effect of registration.
//
// Fail-closed email: verification requires a Mailer (mailer.ts). No
// configured provider -> registration/resend answer 503 and nothing is
// created half-way. Tests inject a capturing fake.
//
// Storage (community store, data minimization):
//   emailCredentials[normalizedEmail] = { email, passwordRecord, publicKey,
//     verified, verifyTokenHash|null, verifyExpiresAt|null, createdAt,
//     failedAttempts, lockUntil }
// The scrypt record embeds its own params+salt; the verify token is stored
// sha256-hashed and single-use. Raw tokens and passwords are never stored.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Keypair } from '@stellar/stellar-sdk';
import type { Account, CommunityStore, EmailCredential } from './community-store.js';
import { AuthError, hashToken, SESSION_TTL_MS, TOTP_TICKET_TTL_MS } from './accounts.js';
import type { Mailer } from './mailer.js';

export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const EMAIL_MAX_FAILURES = 5;
export const EMAIL_LOCK_MS = 5 * 60 * 1000;
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 200;

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

export function normalizeEmail(email: unknown): string {
  if (typeof email !== 'string') throw new AuthError(400, 'email must be a string', 'invalid_input');
  const normalized = email.trim().toLowerCase();
  // Deliberately simple: one @, non-empty labels, a dot in the domain. The
  // verification round-trip, not regex cleverness, proves the address.
  if (!/^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/.test(normalized)) {
    throw new AuthError(400, 'invalid email address', 'email_invalid');
  }
  return normalized;
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string') throw new AuthError(400, 'password must be a string', 'invalid_input');
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new AuthError(400, `password must be at least ${PASSWORD_MIN_LENGTH} characters`, 'password_short');
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    throw new AuthError(400, `password must be at most ${PASSWORD_MAX_LENGTH} characters`, 'password_long');
  }
  return password;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `s2$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export function verifyPassword(password: string, record: string): boolean {
  const parts = record.split('$');
  if (parts.length !== 6 || parts[0] !== 's2') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  let derived: Buffer;
  let expected: Buffer;
  try {
    derived = scryptSync(password, Buffer.from(saltB64, 'base64'), SCRYPT_KEYLEN, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    expected = Buffer.from(hashB64, 'base64');
  } catch {
    return false;
  }
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function verificationEmailText(email: string, token: string): string {
  return [
    'Welcome to the Blockallisto demo.',
    '',
    `Confirm this email address for account ${email} with this single-use verification token (valid 24 hours):`,
    '',
    token,
    '',
    'If you did not register, ignore this message - the account stays unverified and cannot log in.',
    'This is a demo deployment on Stellar testnet. No real funds are involved.',
  ].join('\n');
}

async function issueVerification(store: CommunityStore, mailer: Mailer, credential: EmailCredential, now: number): Promise<void> {
  const token = `blv_${randomBytes(24).toString('hex')}`;
  await store.change((state) => {
    const current = state.emailCredentials[credential.email];
    if (!current) throw new AuthError(404, 'account not found');
    current.verifyTokenHash = createHash('sha256').update(token).digest('hex');
    current.verifyExpiresAt = now + VERIFY_TOKEN_TTL_MS;
  });
  // Send AFTER the hash is durably stored: a delivered token must always be
  // redeemable. If the send throws, the caller reports failure and the user
  // can request a fresh token via resend.
  await mailer.send({
    to: credential.email,
    subject: 'Blockallisto demo - verify your email',
    text: verificationEmailText(credential.email, token),
  });
}

// Register a new email account. Anti-enumeration: the response is identical
// whether the address is new, unverified (a fresh token is sent) or already
// verified (nothing is sent). The route rate-limits on top.
export async function registerEmail(
  store: CommunityStore,
  mailer: Mailer,
  input: { email: unknown; password: unknown },
  now = Date.now(),
): Promise<{ status: 'verification-sent' }> {
  const email = normalizeEmail(input.email);
  const password = validatePassword(input.password);
  const created = await store.change((state) => {
    const existing = state.emailCredentials[email];
    if (existing?.verified) return null; // verified duplicate: stay silent
    if (existing) return existing; // unverified: re-issue token below
    // Throwaway identity keypair: gives the account a normal public key
    // while proving nothing and controlling nothing. The secret is NEVER
    // stored - see the module header.
    const publicKey = Keypair.random().publicKey();
    const credential: EmailCredential = {
      email,
      passwordRecord: hashPassword(password),
      publicKey,
      verified: false,
      verifyTokenHash: null,
      verifyExpiresAt: null,
      createdAt: now,
      failedAttempts: 0,
      lockUntil: null,
    };
    state.emailCredentials[email] = credential;
    state.accounts[publicKey] = {
      publicKey,
      displayName: null,
      createdAt: now,
      authMethod: 'email',
      email,
    } satisfies Account;
    return credential;
  });
  if (!created) return { status: 'verification-sent' };
  await issueVerification(store, mailer, created, now);
  return { status: 'verification-sent' };
}

export async function resendVerification(
  store: CommunityStore,
  mailer: Mailer,
  input: { email: unknown },
  now = Date.now(),
): Promise<{ status: 'verification-sent' }> {
  const email = normalizeEmail(input.email);
  const credential = await store.change((state) => {
    const existing = state.emailCredentials[email];
    return existing && !existing.verified ? existing : null;
  });
  if (!credential) return { status: 'verification-sent' }; // same anti-enumeration shape
  await issueVerification(store, mailer, credential, now);
  return { status: 'verification-sent' };
}

// Verify the token and log the user in immediately: they just proved the
// inbox, so a separate password round-trip adds nothing.
export async function verifyEmailToken(
  store: CommunityStore,
  input: { email: unknown; token: unknown },
  now = Date.now(),
): Promise<{ token: string; expiresAt: number; account: Account }> {
  const email = normalizeEmail(input.email);
  if (typeof input.token !== 'string' || !/^blv_[0-9a-f]{48}$/.test(input.token)) {
    throw new AuthError(400, 'invalid verification token', 'token_invalid');
  }
  const tokenHash = createHash('sha256').update(input.token).digest('hex');
  const result = await store.change((state) => {
    const credential = state.emailCredentials[email];
    if (
      !credential ||
      credential.verified ||
      !credential.verifyTokenHash ||
      !credential.verifyExpiresAt ||
      credential.verifyExpiresAt <= now ||
      credential.verifyTokenHash.length !== tokenHash.length ||
      !timingSafeEqual(Buffer.from(credential.verifyTokenHash), Buffer.from(tokenHash))
    ) {
      return null;
    }
    credential.verified = true;
    credential.verifyTokenHash = null; // single-use
    credential.verifyExpiresAt = null;
    const account = state.accounts[credential.publicKey];
    if (!account) throw new AuthError(500, 'account record missing');
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
  if (!result) throw new AuthError(401, 'invalid or expired verification token; request a new one', 'token_expired');
  return result;
}

export async function loginEmail(
  store: CommunityStore,
  input: { email: unknown; password: unknown },
  now = Date.now(),
): Promise<{ token: string; expiresAt: number; account: Account } | { requiresTotp: true; ticket: string; expiresAt: number; account: Account }> {
  const email = normalizeEmail(input.email);
  if (typeof input.password !== 'string') throw new AuthError(400, 'password must be a string');
  const result = await store.change((state) => {
    const credential = state.emailCredentials[email];
    if (!credential) return null;
    if (credential.lockUntil && credential.lockUntil > now) {
      throw new AuthError(429, 'too many failed attempts; retry in a few minutes', 'login_throttled');
    }
    if (!verifyPassword(input.password as string, credential.passwordRecord)) {
      credential.failedAttempts += 1;
      if (credential.failedAttempts >= EMAIL_MAX_FAILURES) {
        credential.lockUntil = now + EMAIL_LOCK_MS;
        credential.failedAttempts = 0;
      }
      return null;
    }
    credential.failedAttempts = 0;
    credential.lockUntil = null;
    if (!credential.verified) return { unverified: true as const };
    const account = state.accounts[credential.publicKey];
    if (!account) throw new AuthError(500, 'account record missing');
    // Second-factor parity with the wallet flow: a correct password alone is
    // never enough when TOTP is enabled - issue a one-purpose ticket instead
    // of a session (completeTotpLogin then applies replay/lockout rules).
    if (account.totp?.status === 'enabled') {
      const ticket = `blt_${randomBytes(24).toString('hex')}`;
      const expiresAt = now + TOTP_TICKET_TTL_MS;
      state.totpTickets[ticket] = { id: ticket, publicKey: account.publicKey, expiresAt };
      return { requiresTotp: true as const, ticket, expiresAt, account: { ...account } };
    }
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
  if (!result) throw new AuthError(401, 'invalid email or password', 'credentials_invalid');
  if ('unverified' in result) {
    throw new AuthError(403, 'email not verified yet; check your inbox or request a new verification token', 'email_unverified');
  }
  return result;
}
