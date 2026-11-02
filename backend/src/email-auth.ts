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
import { normalizeMailLocale, resetEmail, verificationEmail } from './email-templates.js';
import { AuthError, hashToken, SESSION_TTL_MS, TOTP_TICKET_TTL_MS } from './accounts.js';
import type { Mailer } from './mailer.js';

export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_MAIL_BUDGET_PER_HOUR = 50;
// Brevo free tier is 300 sends/day (help.brevo.com Free-plan FAQ, verified
// 2026-11-02); the default stays below it so the app cap bites before the
// provider's, in every calendar day, under a rolling window.
export const DEFAULT_MAIL_BUDGET_PER_DAY = 250;
const MAIL_BUDGET_WINDOW_MS = 60 * 60 * 1000;
const MAIL_BUDGET_DAY_MS = 24 * 60 * 60 * 1000;
const PROVIDER_THROTTLE_MUTE_MS = 5 * 60 * 1000;

// Global outbound-mail budget: one rolling hour of send timestamps, reserved
// INSIDE the atomic store change so concurrent requests cannot both pass a
// full budget, and persisted so a restart/redeploy cannot reset it. This caps
// what rotating recipient+IP combinations can drain from the provider, which
// the per-email and per-IP limits alone cannot. On a provider failure the
// caller refunds the slot (best-effort: a lost refund only tightens the cap).
function reserveMailSlot(state: { mailSendLog: number[]; mailProviderMutedUntil?: number | null }, now: number, maxPerHour: number, maxPerDay: number): void {
  if (state.mailProviderMutedUntil && state.mailProviderMutedUntil > now) {
    throw new AuthError(503, 'email provider rate-limited; retry in a few minutes', 'email_provider_throttled');
  }
  const log = state.mailSendLog.filter((t) => now - t < MAIL_BUDGET_DAY_MS);
  if (log.length >= maxPerDay || log.filter((t) => now - t < MAIL_BUDGET_WINDOW_MS).length >= maxPerHour) {
    throw new AuthError(503, 'email sending budget exhausted; retry later', 'email_budget_exceeded');
  }
  log.push(now);
  state.mailSendLog = log;
}

// Provider answered 429: pause ALL sends briefly (global backoff), so a
// throttled provider is not hammered by immediate retries.
async function noteProviderThrottle(store: CommunityStore, now: number): Promise<void> {
  await store
    .change((state) => {
      state.mailProviderMutedUntil = now + PROVIDER_THROTTLE_MUTE_MS;
    })
    .catch(() => undefined);
}

function isProviderThrottle(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === 'email_provider_throttled';
}

async function refundMailSlot(store: CommunityStore, at: number): Promise<void> {
  await store
    .change((state) => {
      const log = state.mailSendLog;
      const i = log.lastIndexOf(at);
      if (i >= 0) log.splice(i, 1);
    })
    .catch(() => undefined);
}
// Pre-flight view of the persisted global mail budget (admin verification
// tooling): slots remaining in the rolling hour/day windows plus any active
// provider-mute, so a test batch can be checked against reality before it
// starts instead of assuming capacity from the configured caps.
export function mailBudgetStatus(
  state: { mailSendLog: number[]; mailProviderMutedUntil?: number | null },
  now: number,
  maxPerHour: number,
  maxPerDay: number,
): { hourRemaining: number; dayRemaining: number; providerMutedUntil: number | null } {
  const log = state.mailSendLog.filter((t) => now - t < MAIL_BUDGET_DAY_MS);
  return {
    hourRemaining: Math.max(0, maxPerHour - log.filter((t) => now - t < MAIL_BUDGET_WINDOW_MS).length),
    dayRemaining: Math.max(0, maxPerDay - log.length),
    providerMutedUntil: state.mailProviderMutedUntil && state.mailProviderMutedUntil > now ? state.mailProviderMutedUntil : null,
  };
}

// One outbound mail that CONSUMES the persisted global budget exactly like
// the auth routes do: the slot is reserved inside the atomic store change,
// a provider 429 mutes all sends, and a failed send refunds its slot.
// Admin verification tooling must go through this so test sends can never
// bypass the cap real user mail shares.
export async function sendBudgetedMail(
  store: CommunityStore,
  mailer: Mailer,
  mail: { to: string; subject: string; text: string },
  now: number,
  maxPerHour: number,
  maxPerDay: number,
): Promise<void> {
  await store.change((state) => {
    reserveMailSlot(state, now, maxPerHour, maxPerDay);
  });
  try {
    await mailer.send(mail);
  } catch (err) {
    if (isProviderThrottle(err)) await noteProviderThrottle(store, now);
    await refundMailSlot(store, now);
    throw err;
  }
}

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const EMAIL_RESEND_COOLDOWN_MS = 10 * 60 * 1000;
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

async function issueVerification(
  store: CommunityStore,
  mailer: Mailer,
  credential: EmailCredential,
  now: number,
  maxPerHour: number,
  maxPerDay: number,
): Promise<void> {
  const token = `blv_${randomBytes(24).toString('hex')}`;
  await store.change((state) => {
    const current = state.emailCredentials[credential.email];
    if (!current) throw new AuthError(404, 'account not found');
    reserveMailSlot(state, now, maxPerHour, maxPerDay);
    current.verifyTokenHash = createHash('sha256').update(token).digest('hex');
    current.verifyExpiresAt = now + VERIFY_TOKEN_TTL_MS;
  });
  // Send AFTER the hash is durably stored: a delivered token must always be
  // redeemable. If the send throws, the caller reports failure and the user
  // can request a fresh token via resend.
  const mail = verificationEmail(normalizeMailLocale(credential.preferredLocale), credential.email, token);
  try {
    await mailer.send({ to: credential.email, subject: mail.subject, text: mail.text });
  } catch (err) {
    if (isProviderThrottle(err)) await noteProviderThrottle(store, now);
    await refundMailSlot(store, now);
    throw err;
  }
}

// Register a new email account. Anti-enumeration: the response is identical
// whether the address is new, unverified (a fresh token is sent) or already
// verified (nothing is sent). The route rate-limits on top.
export async function registerEmail(
  store: CommunityStore,
  mailer: Mailer,
  input: { email: unknown; password: unknown; locale?: unknown },
  now = Date.now(),
  maxPerHour = DEFAULT_MAIL_BUDGET_PER_HOUR,
  maxPerDay = DEFAULT_MAIL_BUDGET_PER_DAY,
): Promise<{ status: 'verification-sent' }> {
  const email = normalizeEmail(input.email);
  const password = validatePassword(input.password);
  const locale = normalizeMailLocale(input.locale);
  const created = await store.change((state) => {
    const existing = state.emailCredentials[email];
    if (existing?.verified) return null; // verified duplicate: stay silent
    // Unverified duplicate: re-issue below, unless a verification mail went
    // out moments ago (per-email cooldown; the response stays uniform).
    if (existing) {
      if (existing.resendSentAt && now - existing.resendSentAt < EMAIL_RESEND_COOLDOWN_MS) return null;
      existing.preferredLocale = locale;
      return existing;
    }
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
      resetTokenHash: null,
      resetExpiresAt: null,
      resetSentAt: null,
      resendSentAt: null,
      preferredLocale: locale,
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
  await issueVerification(store, mailer, created, now, maxPerHour, maxPerDay);
  // Cooldown marker only after a successful send: a provider failure (503)
  // must not lock the user out of an immediate retry.
  await store.change((state) => {
    const current = state.emailCredentials[email];
    if (current) current.resendSentAt = now;
  });
  return { status: 'verification-sent' };
}

export async function resendVerification(
  store: CommunityStore,
  mailer: Mailer,
  input: { email: unknown; locale?: unknown },
  now = Date.now(),
  maxPerHour = DEFAULT_MAIL_BUDGET_PER_HOUR,
  maxPerDay = DEFAULT_MAIL_BUDGET_PER_DAY,
): Promise<{ status: 'verification-sent' }> {
  const email = normalizeEmail(input.email);
  const credential = await store.change((state) => {
    const existing = state.emailCredentials[email];
    if (!existing || existing.verified) return null;
    // Per-email cooldown on top of the route's per-IP limit: repeated resend
    // requests must not turn into unsolicited mail to the address owner.
    if (existing.resendSentAt && now - existing.resendSentAt < EMAIL_RESEND_COOLDOWN_MS) return null;
    if (input.locale !== undefined) existing.preferredLocale = normalizeMailLocale(input.locale);
    return existing;
  });
  if (!credential) return { status: 'verification-sent' }; // same anti-enumeration shape
  await issueVerification(store, mailer, credential, now, maxPerHour, maxPerDay);
  // Mark the cooldown only after a successful send: a provider failure (503)
  // must not lock the user out of an immediate retry.
  await store.change((state) => {
    const current = state.emailCredentials[email];
    if (current) current.resendSentAt = now;
  });
  return { status: 'verification-sent' };
}

// Request a password reset. Anti-enumeration: the response is identical for
// unknown, unverified and verified addresses; only a verified address with no
// mail inside the cooldown window actually receives a token. The route
// rate-limits per IP on top of the per-email cooldown.
export async function requestPasswordReset(
  store: CommunityStore,
  mailer: Mailer,
  input: { email: unknown; locale?: unknown },
  now = Date.now(),
  maxPerHour = DEFAULT_MAIL_BUDGET_PER_HOUR,
  maxPerDay = DEFAULT_MAIL_BUDGET_PER_DAY,
): Promise<{ status: 'reset-sent' }> {
  const email = normalizeEmail(input.email);
  const prepared = await store.change((state) => {
    const credential = state.emailCredentials[email];
    if (!credential || !credential.verified) return null;
    if (credential.resetSentAt && now - credential.resetSentAt < EMAIL_RESEND_COOLDOWN_MS) return null;
    if (input.locale !== undefined) credential.preferredLocale = normalizeMailLocale(input.locale);
    const token = `blr_${randomBytes(24).toString('hex')}`;
    reserveMailSlot(state, now, maxPerHour, maxPerDay);
    credential.resetTokenHash = createHash('sha256').update(token).digest('hex');
    credential.resetExpiresAt = now + RESET_TOKEN_TTL_MS;
    return { token, locale: credential.preferredLocale };
  });
  if (!prepared) return { status: 'reset-sent' };
  const mail = resetEmail(normalizeMailLocale(prepared.locale), email, prepared.token);
  try {
    await mailer.send({
      to: email,
      subject: mail.subject,
      text: mail.text,
    });
  } catch (err) {
    if (isProviderThrottle(err)) await noteProviderThrottle(store, now);
    await refundMailSlot(store, now);
    throw err;
  }
  // Cooldown marker only after a successful send (provider 503 -> free retry).
  await store.change((state) => {
    const current = state.emailCredentials[email];
    if (current) current.resetSentAt = now;
  });
  return { status: 'reset-sent' };
}

// Confirm a password reset. The token is single-use; on success every
// existing session for the account is revoked (inbox access is not session
// possession) and TOTP, when enabled, stays on - a reset never strips the
// second factor.
export async function confirmPasswordReset(
  store: CommunityStore,
  input: { email: unknown; token: unknown; password: unknown },
  now = Date.now(),
): Promise<{ status: 'password-reset' }> {
  const email = normalizeEmail(input.email);
  if (typeof input.token !== 'string' || !/^blr_[0-9a-f]{48}$/.test(input.token)) {
    throw new AuthError(401, 'invalid or expired reset token; request a new one', 'token_expired');
  }
  const password = validatePassword(input.password);
  const tokenHash = createHash('sha256').update(input.token).digest('hex');
  const ok = await store.change((state) => {
    const credential = state.emailCredentials[email];
    if (
      !credential ||
      !credential.resetTokenHash ||
      !credential.resetExpiresAt ||
      credential.resetExpiresAt <= now ||
      credential.resetTokenHash.length !== tokenHash.length ||
      !timingSafeEqual(Buffer.from(credential.resetTokenHash), Buffer.from(tokenHash))
    ) {
      return null;
    }
    const account = state.accounts[credential.publicKey];
    if (!account) throw new AuthError(500, 'account record missing');
    credential.passwordRecord = hashPassword(password);
    credential.resetTokenHash = null; // single-use
    credential.resetExpiresAt = null;
    credential.failedAttempts = 0;
    credential.lockUntil = null;
    for (const [id, session] of Object.entries(state.sessions)) {
      if (session.publicKey === credential.publicKey) delete state.sessions[id];
    }
    for (const [id, ticket] of Object.entries(state.totpTickets ?? {})) {
      if (ticket.publicKey === credential.publicKey) delete state.totpTickets[id];
    }
    return true;
  });
  if (!ok) throw new AuthError(401, 'invalid or expired reset token; request a new one', 'token_expired');
  return { status: 'password-reset' };
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
