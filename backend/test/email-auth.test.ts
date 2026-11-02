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

async function api(baseUrl: string, method: string, p: string, opts: { token?: string; body?: unknown } = {}) {
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

test('unverified duplicate registration re-issues a fresh token', async () => {
  const mailer = new FakeMailer();
  const url = await startApp(mailer);
  await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'twice@example.com', password: 'original password' },
  });
  const first = mailer.lastToken();
  await api(url, 'POST', '/api/auth/email/register', {
    body: { email: 'twice@example.com', password: 'original password' },
  });
  assert.equal(mailer.sent.length, 2);
  const second = mailer.lastToken();
  assert.notEqual(first, second);
  // The first token was superseded.
  const stale = await api(url, 'POST', '/api/auth/email/verify', {
    body: { email: 'twice@example.com', token: first },
  });
  assert.equal(stale.status, 401);
  const fresh = await api(url, 'POST', '/api/auth/email/verify', {
    body: { email: 'twice@example.com', token: second },
  });
  assert.equal(fresh.status, 200);
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
