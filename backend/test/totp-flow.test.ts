// TOTP second-factor lifecycle: enroll -> enable -> login gated by ticket ->
// complete with code or recovery code -> replay/lockout/disable. The seed
// comes from the enroll response exactly like a real authenticator onboarding
// would receive it; COMMUNITY_TOTP_KEY is a test-only server secret.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { createChallenge, verifyChallenge, enrollTotp, enableTotp, disableTotp, completeTotpLogin, publicAccount } from '../src/accounts.js';
import { totpAt } from '../src/totp.js';

process.env.COMMUNITY_TOTP_KEY = 'test-only-server-secret';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'totp-flow-'));
let counter = 0;
const newStore = () => new FileCommunityStore(path.join(dir, `store-${counter++}.json`));

async function challengeAndSign(store: FileCommunityStore, kp: Keypair) {
  const { message } = await createChallenge(store, kp.publicKey());
  const sig = Buffer.from(kp.signMessage(message)).toString('base64');
  return verifyChallenge(store, kp.publicKey(), sig);
}

test('enroll -> enable -> login requires ticket -> complete issues session', async () => {
  const store = newStore();
  const kp = Keypair.random();
  const first = await challengeAndSign(store, kp);
  assert.ok(!('requiresTotp' in first), 'no factor yet: direct session');

  const { otpauthUrl, manualKey } = await enrollTotp(store, kp.publicKey());
  assert.match(otpauthUrl, /^otpauth:\/\/totp\//);
  const { recoveryCodes } = await enableTotp(store, kp.publicKey(), totpAt(manualKey, Math.floor(Date.now() / 1000)));
  assert.equal(recoveryCodes.length, 8);

  const gated = await challengeAndSign(store, kp);
  assert.ok('requiresTotp' in gated, 'login now gated');
  assert.ok(!('token' in gated), 'no session before the second factor');

  const done = await completeTotpLogin(store, (gated as { ticket: string }).ticket, totpAt(manualKey, Math.floor(Date.now() / 1000)));
  assert.match(done.token, /^bls_/);
  assert.equal(done.account.publicKey, kp.publicKey());
});

test('wrong code, replay, recovery single-use', async () => {
  const store = newStore();
  const kp = Keypair.random();
  await challengeAndSign(store, kp);
  const { manualKey } = await enrollTotp(store, kp.publicKey());
  const { recoveryCodes } = await enableTotp(store, kp.publicKey(), totpAt(manualKey, Math.floor(Date.now() / 1000)));

  // wrong code rejected
  const g1 = await challengeAndSign(store, kp);
  await assert.rejects(completeTotpLogin(store, (g1 as { ticket: string }).ticket, '000000'), (e: Error) => (e as { status?: number }).status === 401);

  // correct code works; replaying the SAME code on a new login fails
  const g2 = await challengeAndSign(store, kp);
  const code = totpAt(manualKey, Math.floor(Date.now() / 1000));
  await completeTotpLogin(store, (g2 as { ticket: string }).ticket, code);
  const g3 = await challengeAndSign(store, kp);
  await assert.rejects(completeTotpLogin(store, (g3 as { ticket: string }).ticket, code), (e: Error) => (e as { status?: number }).status === 401);

  // recovery code works once, then is burned
  const g4 = await challengeAndSign(store, kp);
  await completeTotpLogin(store, (g4 as { ticket: string }).ticket, recoveryCodes[0]);
  const g5 = await challengeAndSign(store, kp);
  await assert.rejects(completeTotpLogin(store, (g5 as { ticket: string }).ticket, recoveryCodes[0]), (e: Error) => (e as { status?: number }).status === 401);
});

test('disable requires a valid code and lifts the gate', async () => {
  const store = newStore();
  const kp = Keypair.random();
  await challengeAndSign(store, kp);
  const { manualKey } = await enrollTotp(store, kp.publicKey());
  await enableTotp(store, kp.publicKey(), totpAt(manualKey, Math.floor(Date.now() / 1000)));
  await assert.rejects(disableTotp(store, kp.publicKey(), '000000'), (e: Error) => (e as { status?: number }).status === 401);
  await disableTotp(store, kp.publicKey(), totpAt(manualKey, Math.floor(Date.now() / 1000)));
  const again = await challengeAndSign(store, kp);
  assert.ok(!('requiresTotp' in again), 'gate lifted after disable');
});

test('fail closed without a server secret; serializer never leaks the enrollment', async () => {
  const store = newStore();
  const kp = Keypair.random();
  await challengeAndSign(store, kp);
  const saved = process.env.COMMUNITY_TOTP_KEY;
  delete process.env.COMMUNITY_TOTP_KEY;
  delete process.env.PLATFORM_SECRET;
  await assert.rejects(enrollTotp(store, kp.publicKey()), (e: Error) => (e as { status?: number }).status === 503);
  process.env.COMMUNITY_TOTP_KEY = saved;

  const { manualKey } = await enrollTotp(store, kp.publicKey());
  await enableTotp(store, kp.publicKey(), totpAt(manualKey, Math.floor(Date.now() / 1000)));
  const state = await store.read();
  const acct = state.accounts[kp.publicKey()];
  const pub = publicAccount(acct);
  assert.equal(pub.totpEnabled, true);
  assert.ok(!('totp' in pub), 'enrollment never serialized');
  assert.ok(!JSON.stringify(pub).includes(manualKey), 'seed never serialized');
});

test('lockout after repeated failures blocks even a correct code', async () => {
  const store = newStore();
  const kp = Keypair.random();
  await challengeAndSign(store, kp);
  const { manualKey } = await enrollTotp(store, kp.publicKey());
  await enableTotp(store, kp.publicKey(), totpAt(manualKey, Math.floor(Date.now() / 1000)));
  for (let i = 0; i < 5; i++) {
    const g = await challengeAndSign(store, kp);
    await assert.rejects(completeTotpLogin(store, (g as { ticket: string }).ticket, '999999'), (e: Error) => (e as { status?: number }).status === 401);
  }
  const g6 = await challengeAndSign(store, kp);
  await assert.rejects(
    completeTotpLogin(store, (g6 as { ticket: string }).ticket, totpAt(manualKey, Math.floor(Date.now() / 1000))),
    (e: Error) => (e as { status?: number }).status === 429,
  );
});
