// Progressive login penalty (email-auth.ts): wrong passwords face short,
// escalating penalty windows, and the CORRECT password is never locked out -
// it clears the penalty and logs in even inside the window, so targeted
// lockout abuse can never bench the account owner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FileCommunityStore } from '../src/community-store.js';
import { registerEmail, verifyEmailToken, loginEmail, EMAIL_MAX_FAILURES, emailLockMs, EMAIL_LOCK_BASE_MS, EMAIL_LOCK_MAX_MS } from '../src/email-auth.js';
import type { Mailer } from '../src/mailer.js';

class FakeMailer implements Mailer {
  sent: { to: string; subject: string; text: string }[] = [];
  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    this.sent.push(message);
  }
}

let counter = 0;
async function verifiedStore(now: number) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `email-lockout-${counter++}-`));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const mailer = new FakeMailer();
  await registerEmail(store, mailer, { email: 'owner@example.com', password: 'the right password' }, now);
  const token = mailer.sent.at(-1)!.text.match(/blv_[0-9a-f]{48}/)![0];
  await verifyEmailToken(store, { email: 'owner@example.com', token, password: 'the right password' }, now);
  return store;
}

async function failLogins(store: FileCommunityStore, count: number, now: number) {
  for (let i = 0; i < count; i++) {
    await assert.rejects(loginEmail(store, { email: 'owner@example.com', password: 'wrong password!' }, now), (err: unknown) => {
      assert.equal((err as { code?: string }).code, 'credentials_invalid');
      return true;
    });
  }
}

test('penalty schedule: short first, doubling, capped', () => {
  assert.equal(emailLockMs(1), EMAIL_LOCK_BASE_MS);
  assert.equal(emailLockMs(2), EMAIL_LOCK_BASE_MS * 2);
  assert.equal(emailLockMs(3), EMAIL_LOCK_BASE_MS * 4);
  assert.equal(emailLockMs(100), EMAIL_LOCK_MAX_MS);
  assert.ok(EMAIL_LOCK_BASE_MS < 5 * 60 * 1000, 'first penalty must be shorter than the old flat 5-minute lock');
});

test('the correct password is never locked out: it clears the penalty inside the window', async () => {
  const now = 1_000_000;
  const store = await verifiedStore(now);
  await failLogins(store, EMAIL_MAX_FAILURES, now);
  // Inside the penalty window the owner still gets in with the right password.
  const ok = await loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 1);
  assert.ok('token' in ok || 'requiresTotp' in ok);
  // The success cleared the escalation: the next attack starts at 1 minute again.
  await failLogins(store, EMAIL_MAX_FAILURES, now + 2);
  const ok2 = await loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 3);
  assert.ok('token' in ok2 || 'requiresTotp' in ok2);
});

test('wrong guesses inside the window are refused and extend the penalty', async () => {
  const now = 2_000_000;
  const store = await verifiedStore(now);
  // Strike 1: penalty window of 1 minute.
  await failLogins(store, EMAIL_MAX_FAILURES, now);
  // A wrong guess inside the window: 429, and the strike escalates (2 minutes from now).
  await assert.rejects(loginEmail(store, { email: 'owner@example.com', password: 'wrong password!' }, now + 30_000), (err: unknown) => {
    assert.equal((err as { status?: number }).status, 429);
    return true;
  });
  // Still penalized at 61s (window extended to 30s + 2min = 150s)...
  await assert.rejects(loginEmail(store, { email: 'owner@example.com', password: 'wrong password!' }, now + 61_000), (err: unknown) => {
    assert.equal((err as { status?: number }).status, 429);
    return true;
  });
  // ...but the owner logs in throughout.
  const ok = await loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 62_000);
  assert.ok('token' in ok || 'requiresTotp' in ok);
});

test('consecutive penalties escalate when no successful login intervenes', async () => {
  const now = 3_000_000;
  const store = await verifiedStore(now);
  await failLogins(store, EMAIL_MAX_FAILURES, now);
  // Second strike right after the first window expires: penalty is 2 minutes.
  await failLogins(store, EMAIL_MAX_FAILURES, now + 61_000);
  await assert.rejects(loginEmail(store, { email: 'owner@example.com', password: 'wrong password!' }, now + 61_000 + 61_000 + 1), (err: unknown) => {
    assert.equal((err as { status?: number }).status, 429);
    return true;
  });
  // Owner unaffected, and the login resets the escalation.
  const ok = await loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 61_000 + 62_000);
  assert.ok('token' in ok || 'requiresTotp' in ok);
});
