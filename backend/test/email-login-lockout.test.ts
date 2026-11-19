// Progressive login lockout (email-auth.ts): a run of wrong passwords must
// not bench the account owner for a flat five minutes. The first lockout is
// short and each consecutive lockout doubles up to a cap, so targeted
// lockout abuse is cheap to escape while brute force stays expensive.
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

test('lockout delay schedule: short first, doubling, capped', () => {
  assert.equal(emailLockMs(1), EMAIL_LOCK_BASE_MS);
  assert.equal(emailLockMs(2), EMAIL_LOCK_BASE_MS * 2);
  assert.equal(emailLockMs(3), EMAIL_LOCK_BASE_MS * 4);
  assert.equal(emailLockMs(100), EMAIL_LOCK_MAX_MS);
  assert.ok(EMAIL_LOCK_BASE_MS < 5 * 60 * 1000, 'first lockout must be shorter than the old flat 5-minute lock');
});

test('after 5 wrong passwords the first lock is 1 minute, not 5', async () => {
  const now = 1_000_000;
  const store = await verifiedStore(now);
  await failLogins(store, EMAIL_MAX_FAILURES, now);
  // During the lock the correct password is throttled (429), as before.
  await assert.rejects(loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 1), (err: unknown) => {
    assert.equal((err as { status?: number }).status, 429);
    return true;
  });
  // 61 seconds later the owner is back in: a targeted attacker benched the
  // account for one minute, not five.
  const ok = await loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 61_000);
  assert.ok('token' in ok || 'requiresTotp' in ok);
});

test('consecutive lockouts escalate and a successful login resets the escalation', async () => {
  const now = 2_000_000;
  const store = await verifiedStore(now);
  // First strike: locked 1 minute.
  await failLogins(store, EMAIL_MAX_FAILURES, now);
  // Second strike right after the first lock expires: locked 2 minutes.
  await failLogins(store, EMAIL_MAX_FAILURES, now + 61_000);
  await assert.rejects(loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 61_000 + 61_000 + 1), (err: unknown) => {
    assert.equal((err as { status?: number }).status, 429);
    return true;
  });
  const ok = await loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 61_000 + 120_001);
  assert.ok('token' in ok || 'requiresTotp' in ok);
  // A real login clears the escalation: the next attack starts at 1 minute again.
  await failLogins(store, EMAIL_MAX_FAILURES, now + 400_000);
  await assert.rejects(loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 400_000 + 30_000), (err: unknown) => {
    assert.equal((err as { status?: number }).status, 429);
    return true;
  });
  const ok2 = await loginEmail(store, { email: 'owner@example.com', password: 'the right password' }, now + 400_000 + 61_000);
  assert.ok('token' in ok2 || 'requiresTotp' in ok2);
});
