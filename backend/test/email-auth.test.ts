import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';
import { confirmPasswordReset, registerEmail, requestPasswordReset, resendVerification, verifyEmailToken } from '../src/email-auth.js';
import type { Mailer } from '../src/mailer.js';

// Route-level tests for email+password registration (email-auth.ts). A
// capturing fake mailer stands in for the provider; the no-mailer case
// proves the fail-closed 503.

const ADMIN = 'test-admin-secret';
const requireAdmin: express.RequestHandler = (req, res, next) => {
  const ok = timingSafeEqual(
    createHash('sha256')
      .update(req.header('x-admin-key') ?? '')
      .digest(),
    createHash('sha256').update(ADMIN).digest(),
  );
  if (!ok) {
    res.status(401).json({ error: 'missing or invalid admin key' });
    return;
  }
  next();
};

class FakeMailer implements Mailer {
  sent: { to: string; subject: string; text: string }[] = [];
  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    this.sent.push(message);
  }
  lastToken(): string {
    const body = this.sent.at(-1)?.text ?? '';
    const token = body.match(/blv_[0-9a-f]{48}/)?.[0];
    assert.ok(token, 'captured email carries a verification token');
    return token;
  }
}

function extractToken(text: string): string {
  const token = text.match(/blv_[0-9a-f]{48}/)?.[0];
  assert.ok(token, 'email carries a verification token');
  return token;
}

async function startApp(mailer: Mailer | null): Promise<string> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-auth-'));
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const service = new CommunityService(store);
  app.use(createCommunityRouter({ service, requireAdmin, mailer }));
  const srv = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  servers.push(srv);
  return `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
}

const servers: ReturnType<express.Express['listen']>[] = [];
after(() => servers.forEach((s) => s.close()));

const verificationPasswords = new Map<string, string>();
async function api(baseUrl: string, method: string, p: string, opts: { token?: string; body?: unknown } = {}) {
  if (p === '/api/auth/email/register' && opts.body) {
    const body = opts.body as { email: string; password: string };
    const key = baseUrl + ':' + String(body.email).trim().toLowerCase();
    if (typeof body.password === 'string' && body.password.length >= 12 && !verificationPasswords.has(key)) verificationPasswords.set(key, body.password);
  }
  if (p === '/api/auth/email/verify' && opts.body) {
    const body = opts.body as { email: string; password?: string };
    opts = {
      ...opts,
      body: {
        ...body,
        password: body.password ?? verificationPasswords.get(baseUrl + ':' + String(body.email).trim().toLowerCase()) ?? 'verification-password-test',
      },
    };
  }
  const res = await fetch(baseUrl + p, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  return { status: res.status, json: (await res.json()) as any };
}

test('registration fails closed (503) without a configured mailer and stores nothing', async () => {
  const url = await startApp(null);
  const res = await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'a@example.com', password: 'long-enough-password' },
  });
  assert.equal(res.status, 503);
  assert.match(res.json.error, /email provider not configured/);
  // Stable machine-readable code for client-side localization.
  assert.equal(res.json.code, 'email_provider_unconfigured');
  // Nothing half-created: login cannot succeed afterwards.
  const login = await api(url, 'POST', '/api/auth/email/login', {
    body: { email: 'a@example.com', password: 'long-enough-password' },
  });
  assert.equal(login.status, 401);
  assert.equal(login.json.code, 'credentials_invalid');
});

test('recipient allowlist guard at the route: blocked delivery keeps one unverified account for a safe retry', async () => {
  const mailer = new FakeMailer();
  const { AllowlistMailer } = await import('../src/mailer.js');
  const url = await startApp(new AllowlistMailer(mailer, new Set(['nunrib@sapo.pt'])));
  const blocked = await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'visitor@example.com', password: 'long-enough-password' },
  });
  assert.equal(blocked.status, 503);
  assert.equal(blocked.json.code, 'email_recipient_restricted');
  assert.equal(mailer.sent.length, 0); // nothing left the platform
  // The credential is created before delivery. Keep it unverified, with its
  // original password, so an allowed retry can finish without duplication.
  const pending = await api(url, 'POST', '/api/auth/email/login', {
    body: { email: 'visitor@example.com', password: 'long-enough-password' },
  });
  assert.equal(pending.status, 403);
  assert.equal(pending.json.code, 'email_unverified');
  const allowed = await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'nunrib@sapo.pt', password: 'long-enough-password' },
  });
  assert.equal(allowed.status, 200);
  assert.equal(mailer.sent.length, 1);
});

test('known failures carry stable localization codes', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  const bad = await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'not-an-email', password: 'long-enough-password' },
  });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.code, 'email_invalid');
  const weak = await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'codes@example.com', password: 'short' },
  });
  assert.equal(weak.status, 400);
  assert.equal(weak.json.code, 'password_short');
  // Unknown errors stay codeless (raw honest fallback on the client).
  const unverified = await api(url, 'POST', '/api/auth/email/verify', {
    body: { email: 'codes@example.com', token: 'blv_' + '0'.repeat(48) },
  });
  assert.equal(unverified.status, 401);
  assert.equal(unverified.json.code, 'token_expired');
});

test('full flow: register -> verification email -> verify -> session; token is single-use', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);

  const reg = await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'Nuno@Example.com ', password: 'correct horse battery' },
  });
  assert.equal(reg.status, 200);
  assert.deepEqual(reg.json, { status: 'verification-sent' });
  assert.equal(mailer.sent.length, 1);
  assert.equal(mailer.sent[0].to, 'nuno@example.com'); // normalized
  assert.match(mailer.sent[0].text, /demo/);
  const token = extractToken(mailer.sent[0].text);

  // Unverified login is refused distinctly.
  const early = await api(url, 'POST', '/api/auth/email/login', {
    body: { email: 'nuno@example.com', password: 'correct horse battery' },
  });
  assert.equal(early.status, 403);
  assert.match(early.json.error, /not verified/);

  // Wrong token rejected.
  const wrong = await api(url, 'POST', '/api/auth/email/verify', {
    body: { email: 'nuno@example.com', token: `blv_${'0'.repeat(48)}` },
  });
  assert.equal(wrong.status, 401);

  // Right token verifies AND logs in.
  const verified = await api(url, 'POST', '/api/auth/email/verify', {
    body: { email: 'nuno@example.com', token },
  });
  assert.equal(verified.status, 200);
  assert.match(verified.json.token, /^bls_[0-9a-f]{48}$/);
  assert.equal(verified.json.account.authMethod, 'email');
  assert.equal(verified.json.account.email, 'nuno@example.com');
  assert.equal(verified.json.account.totpEnabled, false);

  // The session authenticates against /me.
  const me = await api(url, 'GET', '/api/auth/me', { token: verified.json.token });
  assert.equal(me.status, 200);
  assert.equal(me.json.account.email, 'nuno@example.com');

  // Token is single-use.
  const replay = await api(url, 'POST', '/api/auth/email/verify', {
    body: { email: 'nuno@example.com', token },
  });
  assert.equal(replay.status, 401);

  // Password login now works too.
  const login = await api(url, 'POST', '/api/auth/email/login', {
    body: { email: 'nuno@example.com', password: 'correct horse battery' },
  });
  assert.equal(login.status, 200);
  assert.match(login.json.token, /^bls_/);
});

test('wrong passwords: 401, then lockout after 5 failures', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'lock@example.com', password: 'the right password' },
  });
  const token = mailer.lastToken();
  await api(url, 'POST', '/api/auth/email/verify', { body: { email: 'lock@example.com', token } });

  for (let i = 0; i < 5; i++) {
    const bad = await api(url, 'POST', '/api/auth/email/login', {
      body: { email: 'lock@example.com', password: 'wrong password!' },
    });
    assert.equal(bad.status, 401, `attempt ${i + 1}`);
  }
  const locked = await api(url, 'POST', '/api/auth/email/login', {
    body: { email: 'lock@example.com', password: 'the right password' },
  });
  assert.equal(locked.status, 429);
});

test('anti-enumeration: duplicate and unknown addresses get the identical response', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'dup@example.com', password: 'first password 1' },
  });
  await api(url, 'POST', '/api/auth/email/verify', {
    body: { email: 'dup@example.com', token: mailer.lastToken() },
  });
  assert.equal(mailer.sent.length, 1);

  // Verified duplicate: same response, NO new email, password unchanged.
  const dup = await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'dup@example.com', password: 'attacker chosen pw' },
  });
  assert.equal(dup.status, 200);
  assert.deepEqual(dup.json, { status: 'verification-sent' });
  assert.equal(mailer.sent.length, 1);
  const oldPw = await api(url, 'POST', '/api/auth/email/login', {
    body: { email: 'dup@example.com', password: 'first password 1' },
  });
  assert.equal(oldPw.status, 200);
  const newPw = await api(url, 'POST', '/api/auth/email/login', {
    body: { email: 'dup@example.com', password: 'attacker chosen pw' },
  });
  assert.equal(newPw.status, 401);

  // Resend for an unknown address: same response, nothing sent.
  const resend = await api(url, 'POST', '/api/auth/email/resend', { body: { email: 'ghost@example.com' } });
  assert.equal(resend.status, 200);
  assert.deepEqual(resend.json, { status: 'verification-sent' });
  assert.equal(mailer.sent.length, 1);

  // Resend for the verified account: same response, nothing sent.
  const resendVerified = await api(url, 'POST', '/api/auth/email/resend', { body: { email: 'dup@example.com' } });
  assert.equal(resendVerified.status, 200);
  assert.equal(mailer.sent.length, 1);
});

test('unverified duplicate registration inside the cooldown window is silent; the first token stays valid', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'twice@example.com', password: 'original password' },
  });
  const first = mailer.lastToken();
  // Immediate duplicate: per-email cooldown keeps the response uniform but
  // sends nothing; the original token is NOT superseded.
  await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'twice@example.com', password: 'original password' },
  });
  assert.equal(mailer.sent.length, 1);
  const stillValid = await api(url, 'POST', '/api/auth/email/verify', {
    body: { email: 'twice@example.com', token: first },
  });
  assert.equal(stillValid.status, 200);
});

test('TOTP parity: password alone never yields a session when 2FA is enabled', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  process.env.COMMUNITY_TOTP_KEY = 'test-totp-key';
  try {
    await api(url, 'POST', '/api/auth/email/register', {
      body: { email: 'totp@example.com', password: 'the right password' },
    });
    const verified = await api(url, 'POST', '/api/auth/email/verify', {
      body: { email: 'totp@example.com', token: mailer.lastToken() },
    });
    const session = verified.json.token as string;

    // Enroll + enable TOTP on the email account through the existing routes.
    const enroll = await api(url, 'POST', '/api/auth/totp/enroll', { token: session });
    assert.equal(enroll.status, 200);
    const manualKey = enroll.json.manualKey as string;
    const { totpAt } = await import('../src/totp.js');
    const code = totpAt(manualKey, Math.floor(Date.now() / 1000));
    const enable = await api(url, 'POST', '/api/auth/totp/enable', { token: session, body: { code } });
    assert.equal(enable.status, 200);

    // Password login must now return a ticket, NOT a session.
    const login = await api(url, 'POST', '/api/auth/email/login', {
      body: { email: 'totp@example.com', password: 'the right password' },
    });
    assert.equal(login.status, 200);
    assert.equal(login.json.requiresTotp, true);
    assert.match(login.json.ticket, /^blt_/);
    assert.equal(login.json.token, undefined);

    // The ticket completes through the same second-factor endpoint.
    const code2 = totpAt(manualKey, Math.floor(Date.now() / 1000));
    const done = await api(url, 'POST', '/api/auth/totp/complete', {
      body: { ticket: login.json.ticket, code: code2 },
    });
    assert.equal(done.status, 200);
    assert.match(done.json.token, /^bls_/);
  } finally {
    delete process.env.COMMUNITY_TOTP_KEY;
  }
});

test('input validation: malformed email, short password, wrong types', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  for (const email of ['not-an-email', 'a@b', '@x.com', 'a b@c.com', 42]) {
    const res = await api(url, 'POST', '/api/auth/email/register', {
      body: { email, password: 'long-enough-password' },
    });
    assert.equal(res.status, 400, JSON.stringify(email));
  }
  const short = await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'v@example.com', password: 'short' },
  });
  assert.equal(short.status, 400);
  const badTokenShape = await api(url, 'POST', '/api/auth/email/verify', {
    body: { email: 'v@example.com', token: '../../etc/passwd' },
  });
  assert.equal(badTokenShape.status, 400);
  assert.equal(mailer.sent.length, 0);
});

function extractResetToken(text: string): string {
  const token = text.match(/blr_[0-9a-f]{48}/)?.[0];
  assert.ok(token, 'email carries a reset token');
  return token;
}

async function verifiedAccount(url: string, mailer: FakeMailer, email: string, password: string): Promise<string> {
  await api(url, 'POST', '/api/auth/email/register', { body: { email, password } });
  const token = extractToken(mailer.sent.at(-1)!.text);
  const verified = await api(url, 'POST', '/api/auth/email/verify', { body: { email, token } });
  assert.equal(verified.status, 200);
  return verified.json.token as string;
}

test('password reset: uniform silence for unknown and unverified addresses', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);

  const unknown = await api(url, 'POST', '/api/auth/email/reset-request', {
    body: { email: 'ghost@example.com' },
  });
  assert.deepEqual(unknown.json, { status: 'reset-sent' });
  assert.equal(mailer.sent.length, 0);

  await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'pending@example.com', password: 'correct horse battery' },
  });
  assert.equal(mailer.sent.length, 1); // the verification mail
  const unverified = await api(url, 'POST', '/api/auth/email/reset-request', {
    body: { email: 'pending@example.com' },
  });
  assert.deepEqual(unverified.json, { status: 'reset-sent' });
  assert.equal(mailer.sent.length, 1); // no reset mail for an unverified account
});

test('password reset: full flow revokes sessions, keeps TOTP rule, token single-use', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  const email = 'resettable@example.com';
  const session = await verifiedAccount(url, mailer, email, 'old password one');

  const req = await api(url, 'POST', '/api/auth/email/reset-request', { body: { email } });
  assert.deepEqual(req.json, { status: 'reset-sent' });
  assert.equal(mailer.sent.length, 2);
  assert.match(mailer.sent[1].subject, /reset/i);
  assert.match(mailer.sent[1].text, /demo deployment on Stellar testnet/);
  const resetToken = extractResetToken(mailer.sent[1].text);

  // Per-email cooldown: an immediate second request sends nothing new.
  const again = await api(url, 'POST', '/api/auth/email/reset-request', { body: { email } });
  assert.deepEqual(again.json, { status: 'reset-sent' });
  assert.equal(mailer.sent.length, 2);

  // Wrong token rejected with the stable localization code.
  const wrong = await api(url, 'POST', '/api/auth/email/reset-confirm', {
    body: { email, token: `blr_${'0'.repeat(48)}`, password: 'new password two' },
  });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.json.code, 'token_expired');

  // Right token resets.
  const done = await api(url, 'POST', '/api/auth/email/reset-confirm', {
    body: { email, token: resetToken, password: 'new password two' },
  });
  assert.equal(done.status, 200);
  assert.deepEqual(done.json, { status: 'password-reset' });

  // Every pre-reset session is revoked.
  const me = await api(url, 'GET', '/api/auth/me', { token: session });
  assert.equal(me.status, 401);

  // Old password fails, new password logs in.
  const oldLogin = await api(url, 'POST', '/api/auth/email/login', {
    body: { email, password: 'old password one' },
  });
  assert.equal(oldLogin.status, 401);
  const newLogin = await api(url, 'POST', '/api/auth/email/login', {
    body: { email, password: 'new password two' },
  });
  assert.equal(newLogin.status, 200);
  assert.match(newLogin.json.token, /^bls_/);

  // Single-use: replaying the reset token fails.
  const replay = await api(url, 'POST', '/api/auth/email/reset-confirm', {
    body: { email, token: resetToken, password: 'third password three' },
  });
  assert.equal(replay.status, 401);
});

test('password reset: confirm validates password policy and clears lockout', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  const email = 'locked@example.com';
  await verifiedAccount(url, mailer, email, 'first password ok');

  // Lock the account out with 5 bad logins.
  for (let i = 0; i < 5; i++) {
    await api(url, 'POST', '/api/auth/email/login', { body: { email, password: 'wrong wrong wrong' } });
  }
  const locked = await api(url, 'POST', '/api/auth/email/login', { body: { email, password: 'first password ok' } });
  assert.equal(locked.status, 429);

  await api(url, 'POST', '/api/auth/email/reset-request', { body: { email } });
  const resetToken = extractResetToken(mailer.sent.at(-1)!.text);

  // Short password rejected even with a valid token; token stays redeemable.
  const short = await api(url, 'POST', '/api/auth/email/reset-confirm', {
    body: { email, token: resetToken, password: 'short' },
  });
  assert.equal(short.status, 400);
  assert.equal(short.json.code, 'password_short');

  const done = await api(url, 'POST', '/api/auth/email/reset-confirm', {
    body: { email, token: resetToken, password: 'second password ok' },
  });
  assert.equal(done.status, 200);

  // Lockout cleared: immediate login with the new password works.
  const login = await api(url, 'POST', '/api/auth/email/login', { body: { email, password: 'second password ok' } });
  assert.equal(login.status, 200);
});

test('verification resend: per-email cooldown caps repeat mail, response stays uniform', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  const email = 'cooldown@example.com';
  await api(url, 'POST', '/api/auth/email/register', { body: { email, password: 'correct horse battery' } });
  assert.equal(mailer.sent.length, 1);

  // Registration's own send starts the cooldown: an immediate duplicate
  // registration and an immediate explicit resend both stay silent (and the
  // anti-enumeration response shape never changes).
  const dup = await api(url, 'POST', '/api/auth/email/register', { body: { email, password: 'correct horse battery' } });
  assert.deepEqual(dup.json, { status: 'verification-sent' });
  const capped = await api(url, 'POST', '/api/auth/email/resend', { body: { email } });
  assert.deepEqual(capped.json, { status: 'verification-sent' });
  assert.equal(mailer.sent.length, 1);

  // The original token still verifies.
  const token = extractToken(mailer.sent[0].text);
  const verified = await api(url, 'POST', '/api/auth/email/verify', { body: { email, token } });
  assert.equal(verified.status, 200);

  // Verified account: resend stays silent.
  const afterVerify = await api(url, 'POST', '/api/auth/email/resend', { body: { email } });
  assert.deepEqual(afterVerify.json, { status: 'verification-sent' });
  assert.equal(mailer.sent.length, 1);
});

test('resend after cooldown refreshes stored locale; omitted locale preserves it; unknown falls back to en', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-auth-locale-'));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const mailer = new FakeMailer();
  const email = 'locale-refresh@example.com';
  const t0 = 1_800_000_000_000;
  const MIN = 60 * 1000;
  const storedLocale = async () => (await store.read()).emailCredentials[email]?.preferredLocale;

  await registerEmail(store, mailer, { email, password: 'correct horse battery', locale: 'pt' }, t0);
  assert.equal(mailer.sent[0].subject, 'Demonstração Blockallisto - confirme o seu email');
  assert.equal(await storedLocale(), 'pt');

  // Inside the cooldown a resend sends nothing and must NOT touch the locale.
  await resendVerification(store, mailer, { email, locale: 'de' }, t0 + 5 * MIN);
  assert.equal(mailer.sent.length, 1);
  assert.equal(await storedLocale(), 'pt');

  // Past the cooldown the resend refreshes the stored locale and mails in it.
  await resendVerification(store, mailer, { email, locale: 'de' }, t0 + 11 * MIN);
  assert.equal(mailer.sent.length, 2);
  assert.equal(mailer.sent[1].subject, 'Blockallisto-Demo - bestätigen Sie Ihre E-Mail');
  assert.equal(await storedLocale(), 'de');

  // An omitted locale preserves the stored one.
  await resendVerification(store, mailer, { email }, t0 + 22 * MIN);
  assert.equal(mailer.sent.length, 3);
  assert.equal(mailer.sent[2].subject, 'Blockallisto-Demo - bestätigen Sie Ihre E-Mail');
  assert.equal(await storedLocale(), 'de');

  // An unknown locale normalizes to English.
  await resendVerification(store, mailer, { email, locale: 'xx' }, t0 + 33 * MIN);
  assert.equal(mailer.sent.length, 4);
  assert.equal(mailer.sent[3].subject, 'Blockallisto demo - verify your email');
  assert.equal(await storedLocale(), 'en');
});

test('cooldown timing (direct calls with injected clock): resend and reset send again after the window', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-auth-clock-'));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const mailer = new FakeMailer();
  const email = 'clock@example.com';
  const t0 = 1_800_000_000_000;

  await registerEmail(store, mailer, { email, password: 'correct horse battery' }, t0);
  assert.equal(mailer.sent.length, 1);

  // Inside the window: silent. Past it: a fresh token goes out.
  await resendVerification(store, mailer, { email }, t0 + 5 * 60 * 1000);
  assert.equal(mailer.sent.length, 1);
  await resendVerification(store, mailer, { email }, t0 + 11 * 60 * 1000);
  assert.equal(mailer.sent.length, 2);

  // Duplicate registration after the window re-issues and supersedes.
  const superseded = mailer.sent[1].text.match(/blv_[0-9a-f]{48}/)![0];
  await registerEmail(store, mailer, { email, password: 'correct horse battery' }, t0 + 22 * 60 * 1000);
  assert.equal(mailer.sent.length, 3);
  const token = extractToken(mailer.sent[2].text);
  assert.notEqual(token, superseded);
  await assert.rejects(verifyEmailToken(store, { email, token: superseded, password: 'correct horse battery' }, t0 + 23 * 60 * 1000));
  mailer.sent.length = 0; // keep later indexes simple
  await verifyEmailToken(store, { email, token, password: 'correct horse battery' }, t0 + 23 * 60 * 1000);

  // Reset cooldown follows the same rule.
  await requestPasswordReset(store, mailer, { email }, t0 + 30 * 60 * 1000);
  assert.equal(mailer.sent.length, 1);
  await requestPasswordReset(store, mailer, { email }, t0 + 35 * 60 * 1000);
  assert.equal(mailer.sent.length, 1);
  await requestPasswordReset(store, mailer, { email }, t0 + 41 * 60 * 1000);
  assert.equal(mailer.sent.length, 2);

  // The reset token from the last mail still confirms.
  const resetToken = extractResetToken(mailer.sent[1].text);
  const done = await confirmPasswordReset(store, { email, token: resetToken, password: 'fresh password ok' }, t0 + 32 * 60 * 1000);
  assert.deepEqual(done, { status: 'password-reset' });

  // Expired reset token rejected: a token issued at t0+31min is stale 2h later.
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'email-auth-clock2-'));
  const store2 = new FileCommunityStore(path.join(dir2, 'store.json'));
  const mailer2 = new FakeMailer();
  await registerEmail(store2, mailer2, { email, password: 'correct horse battery' }, t0);
  const vtoken = extractToken(mailer2.sent[0].text);
  await verifyEmailToken(store2, { email, token: vtoken, password: 'correct horse battery' }, t0 + 60 * 1000);
  await requestPasswordReset(store2, mailer2, { email }, t0 + 2 * 60 * 1000);
  const stale = extractResetToken(mailer2.sent[1].text);
  await assert.rejects(confirmPasswordReset(store2, { email, token: stale, password: 'fresh password ok' }, t0 + 3 * 60 * 60 * 1000), (err: unknown) => {
    assert.ok(err instanceof Error);
    assert.equal((err as { code?: string }).code, 'token_expired');
    return true;
  });
});

test('global mail budget: cap, refund on provider failure, window pruning, persistence, concurrency', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-budget-'));
  const file = path.join(dir, 'store.json');
  const store = new FileCommunityStore(file);
  const mailer = new FakeMailer();
  const t0 = 1_800_000_000_000;
  const pw = { password: 'correct horse battery' };

  // Budget 2/hour: two sends pass, the third is refused before any provider call.
  await registerEmail(store, mailer, { email: 'one@example.com', ...pw }, t0, 2);
  await registerEmail(store, mailer, { email: 'two@example.com', ...pw }, t0, 2);
  assert.equal(mailer.sent.length, 2);
  await assert.rejects(registerEmail(store, mailer, { email: 'three@example.com', ...pw }, t0, 2), (err: unknown) => {
    assert.equal((err as { code?: string }).code, 'email_budget_exceeded');
    assert.equal((err as { status?: number }).status, 503);
    return true;
  });
  assert.equal(mailer.sent.length, 2);

  // Persistence: a fresh store instance over the same file still sees the spent budget.
  const reopened = new FileCommunityStore(file);
  await assert.rejects(registerEmail(reopened, mailer, { email: 'four@example.com', ...pw }, t0 + 60 * 1000, 2));
  assert.equal(mailer.sent.length, 2);

  // Window pruning: after the rolling hour, sending resumes.
  await registerEmail(reopened, mailer, { email: 'later@example.com', ...pw }, t0 + 61 * 60 * 1000, 2);
  assert.equal(mailer.sent.length, 3);

  // Refund: a provider failure frees the reserved slot for an immediate retry.
  const failing: Mailer = { send: () => Promise.reject(new Error('provider down')) };
  await assert.rejects(registerEmail(reopened, failing, { email: 'retry@example.com', ...pw }, t0 + 62 * 60 * 1000, 2));
  await registerEmail(reopened, mailer, { email: 'retry@example.com', ...pw }, t0 + 62 * 60 * 1000, 2);
  assert.equal(mailer.sent.length, 4);

  // Concurrency: budget 1, two simultaneous registrations - exactly one sends.
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'email-budget-race-'));
  const raceStore = new FileCommunityStore(path.join(dir2, 'store.json'));
  const raceMailer = new FakeMailer();
  const results = await Promise.allSettled([
    registerEmail(raceStore, raceMailer, { email: 'r1@example.com', ...pw }, t0, 1),
    registerEmail(raceStore, raceMailer, { email: 'r2@example.com', ...pw }, t0, 1),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter((r) => r.status === 'rejected').length, 1);
  assert.equal(raceMailer.sent.length, 1);
});

test('daily mail budget: day cap bites before the provider daily quota, hour cap still applies', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-day-budget-'));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const mailer = new FakeMailer();
  const t0 = 1_800_000_000_000;
  const pw = { password: 'correct horse battery' };

  // maxPerHour 50 (high), maxPerDay 3: three sends pass (spaced past the
  // per-email cooldown), the fourth fails on the DAY budget.
  await registerEmail(store, mailer, { email: 'd1@example.com', ...pw }, t0, 50, 3);
  await registerEmail(store, mailer, { email: 'd2@example.com', ...pw }, t0 + 11 * 60 * 1000, 50, 3);
  await registerEmail(store, mailer, { email: 'd3@example.com', ...pw }, t0 + 22 * 60 * 1000, 50, 3);
  assert.equal(mailer.sent.length, 3);
  await assert.rejects(registerEmail(store, mailer, { email: 'd4@example.com', ...pw }, t0 + 33 * 60 * 1000, 50, 3), (err: unknown) => {
    assert.equal((err as { code?: string }).code, 'email_budget_exceeded');
    return true;
  });
  assert.equal(mailer.sent.length, 3);

  // Next rolling day: sending resumes.
  await registerEmail(store, mailer, { email: 'd5@example.com', ...pw }, t0 + 25 * 60 * 60 * 1000, 50, 3);
  assert.equal(mailer.sent.length, 4);
});

test('provider 429: global backoff mutes all sends briefly, then recovers', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-throttle-'));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const { MailerError } = await import('../src/mailer.js');
  const throttled: Mailer = { send: () => Promise.reject(new MailerError(503, 'rate-limited', 'email_provider_throttled')) };
  const mailer = new FakeMailer();
  const t0 = 1_800_000_000_000;
  const pw = { password: 'correct horse battery' };

  // Provider throttles: the send fails AND mutes every later attempt.
  await assert.rejects(registerEmail(store, throttled, { email: 't1@example.com', ...pw }, t0), (err: unknown) => {
    assert.equal((err as { code?: string }).code, 'email_provider_throttled');
    return true;
  });
  // Muted: a different recipient is refused BEFORE any provider call.
  await assert.rejects(registerEmail(store, mailer, { email: 't2@example.com', ...pw }, t0 + 60 * 1000), (err: unknown) => {
    assert.equal((err as { code?: string }).code, 'email_provider_throttled');
    return true;
  });
  assert.equal(mailer.sent.length, 0);
  // After the mute window: sends recover (throttled slot was refunded).
  await registerEmail(store, mailer, { email: 't3@example.com', ...pw }, t0 + 6 * 60 * 1000);
  assert.equal(mailer.sent.length, 1);
});

test('harassment upper bound across ALL send paths (register+resend+reset), injected clock', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-bound-'));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const mailer = new FakeMailer();
  const t0 = 1_800_000_000_000;
  const MIN = 60 * 1000;
  const pw = { password: 'correct horse battery' };

  // Case 1: UNVERIFIED victim. Attacker hammers register+resend+reset every
  // minute for 3 simulated hours. Reset is ineligible (account unverified);
  // register/resend share one cooldown.
  const victim1 = 'victim1@example.com';
  await registerEmail(store, mailer, { email: victim1, ...pw }, t0);
  for (let m = 1; m <= 180; m++) {
    const now = t0 + m * MIN;
    await registerEmail(store, mailer, { email: victim1, ...pw }, now).catch(() => undefined);
    await resendVerification(store, mailer, { email: victim1 }, now).catch(() => undefined);
    await requestPasswordReset(store, mailer, { email: victim1 }, now).catch(() => undefined);
  }
  const toVictim1 = mailer.sent.filter((x) => x.to === victim1);
  assert.equal(toVictim1.filter((x) => /reset your password/.test(x.subject)).length, 0); // reset never eligible
  // Sends land at t0, t0+10, ..., t0+180min -> 19 total; any sliding 60-min
  // window (start exclusive) contains at most 6.
  assert.equal(toVictim1.length, 19);
  // Sliding-window bound, from the known schedule: sends at t0 + k*10min
  // (k=0..18). For any start s, sends in (s, s+60min] <= 6 by the spacing.
  const times = Array.from({ length: 19 }, (_, k) => t0 + k * 10 * MIN);
  for (let w = 0; w <= 120; w++) {
    const s = t0 + w * MIN;
    const c = times.filter((t) => t > s && t <= s + 60 * MIN).length;
    assert.ok(c <= 6, `window at +${w}min has ${c} sends`);
  }

  // Case 2: VERIFIED victim. Register/resend go silent; only reset mails,
  // same 10-min cadence.
  const victim2 = 'victim2@example.com';
  await registerEmail(store, mailer, { email: victim2, ...pw }, t0);
  const vtoken = extractToken(mailer.sent.at(-1)!.text);
  await verifyEmailToken(store, { email: victim2, token: vtoken, password: 'correct horse battery' }, t0 + MIN);
  const base = mailer.sent.length;
  for (let m = 2; m <= 182; m++) {
    const now = t0 + m * MIN;
    await registerEmail(store, mailer, { email: victim2, ...pw }, now).catch(() => undefined);
    await resendVerification(store, mailer, { email: victim2 }, now).catch(() => undefined);
    await requestPasswordReset(store, mailer, { email: victim2 }, now).catch(() => undefined);
  }
  const toVictim2 = mailer.sent.slice(base).filter((x) => x.to === victim2);
  assert.ok(toVictim2.every((x) => /reset your password/.test(x.subject))); // reset only
  assert.equal(toVictim2.length, 19); // t0+2, +12, ..., +182 (first reset at +2, then 10-min cadence)
  for (let w = 0; w <= 122; w++) {
    const s = t0 + w * MIN;
    const times2 = Array.from({ length: 19 }, (_, k) => t0 + (2 + k * 10) * MIN);
    const c = times2.filter((t) => t > s && t <= s + 60 * MIN).length;
    assert.ok(c <= 6, `verified window at +${w}min has ${c} sends`);
  }
});

test('email login reports the server-designated operator flag immediately and never grants it to ordinary accounts', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  const email = 'operator-login@example.com';
  const password = 'long-enough-operator-password';
  await api(url, 'POST', '/api/auth/email/register', { body: { email, password } });
  await api(url, 'POST', '/api/auth/email/verify', { body: { email, token: mailer.lastToken() } });
  const first = await api(url, 'POST', '/api/auth/email/login', { body: { email, password } });
  assert.equal(first.status, 200);
  assert.equal(first.json.isOperator, false);
  const old = process.env.OPERATOR_WALLETS;
  try {
    process.env.OPERATOR_WALLETS = first.json.account.publicKey;
    const second = await api(url, 'POST', '/api/auth/email/login', { body: { email, password } });
    assert.equal(second.status, 200);
    assert.equal(second.json.isOperator, true);
    const me = await api(url, 'GET', '/api/auth/me', { token: second.json.token });
    assert.equal(me.json.isOperator, second.json.isOperator);
  } finally {
    if (old === undefined) delete process.env.OPERATOR_WALLETS;
    else process.env.OPERATOR_WALLETS = old;
  }
});

test('allowlist failure then retry preserves identity and password and refunds the failed mail slot', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-allowlist-retry-'));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const mailer = new FakeMailer();
  const { AllowlistMailer } = await import('../src/mailer.js');
  const input = { email: 'retry@example.com', password: 'original-long-password' };
  const now = Date.now();
  try {
    await assert.rejects(registerEmail(store, new AllowlistMailer(mailer, new Set()), input, now), { code: 'email_recipient_restricted' });
    const failed = await store.read();
    const identity = failed.emailCredentials[input.email].publicKey;
    const passwordRecord = failed.emailCredentials[input.email].passwordRecord;
    assert.equal(failed.emailCredentials[input.email].verified, false);
    assert.equal(failed.emailCredentials[input.email].resendSentAt, null);
    assert.equal(failed.mailSendLog.length, 0);
    assert.equal(Object.keys(failed.accounts).length, 1);
    assert.equal(mailer.sent.length, 0);
    await registerEmail(store, new AllowlistMailer(mailer, new Set([input.email])), { ...input, password: 'different-long-password' }, now + 1);
    const retried = await store.read();
    assert.equal(retried.emailCredentials[input.email].publicKey, identity);
    assert.equal(retried.emailCredentials[input.email].passwordRecord, passwordRecord);
    assert.equal(Object.keys(retried.accounts).length, 1);
    assert.equal(mailer.sent.length, 1);
    assert.equal(retried.mailSendLog.length, 1);
    assert.equal(retried.emailCredentials[input.email].resendSentAt, now + 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
