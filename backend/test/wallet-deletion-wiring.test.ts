import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';
import { createDeletionChallenge } from '../src/deletion-proof.js';
import { deleteEmailAccount } from '../src/account-deletion.js';
import { prepareWalletDeletionWiring, walletDeletionWiring, WALLET_VERDICT_MAX_AGE_MS } from '../src/wallet-deletion-wiring.js';

const now = 1800000000000;

async function fixture() {
  const store = new FileCommunityStore(join(mkdtempSync(join(tmpdir(), 'deletion-wiring-')), 'store.json'));
  const kp = Keypair.random();
  const challenge = await createChallenge(store, kp.publicKey(), now);
  const login = await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(challenge.message)).toString('base64'), now);
  assert.ok('token' in login);
  return { store, kp, authorization: `Bearer ${login.token}` };
}

async function proof(store: FileCommunityStore, kp: Keypair, authorization: string, at: number) {
  const challenge = await createDeletionChallenge(store, authorization, at);
  return { confirmation: 'DELETE', nonce: challenge.nonce, signature: Buffer.from(kp.signMessage(challenge.message)).toString('base64') };
}

test('clear verdict with fresh recheck deletes; protected and stale fail closed', async () => {
  const { store, kp, authorization } = await fixture();
  let clock = now;
  let verdict: 'clear' | 'protected' | 'unavailable' = 'clear';
  const wiring = walletDeletionWiring(
    async () => verdict,
    () => clock,
  );

  await deleteEmailAccount(store, authorization, await proof(store, kp, authorization, now), [], now, wiring.check, wiring.recheck);
  assert.equal((await store.read()).accounts[kp.publicKey()], undefined);

  const second = await fixture();
  verdict = 'protected';
  const protectedInput = await proof(second.store, second.kp, second.authorization, now);
  const beforeProtected = await second.store.read();
  await assert.rejects(deleteEmailAccount(second.store, second.authorization, protectedInput, [], now, wiring.check, wiring.recheck), {
    code: 'deletion_protected_records',
  });
  // A protected verdict stops before the proof is consumed.
  assert.deepEqual(await second.store.read(), beforeProtected);

  const third = await fixture();
  verdict = 'clear';
  clock = now;
  const input = await proof(third.store, third.kp, third.authorization, now);
  await wiring.check(third.kp.publicKey());
  clock = now + WALLET_VERDICT_MAX_AGE_MS + 1;
  await assert.rejects(
    deleteEmailAccount(third.store, third.authorization, input, [], now, async () => 'clear', wiring.recheck),
    {
      code: 'deletion_unavailable',
    },
  );
  assert.ok((await third.store.read()).accounts[third.kp.publicKey()]);
});

test('recheck reads only the latest verdict and never a missing one', async () => {
  let verdict: 'clear' | 'protected' | 'unavailable' = 'protected';
  const wiring = walletDeletionWiring(
    async () => verdict,
    () => now,
  );
  const key = 'G' + 'A'.repeat(55);
  assert.equal(wiring.recheck(key), 'unavailable');
  assert.equal(await wiring.check(key), 'protected');
  assert.equal(wiring.recheck(key), 'protected');
  verdict = 'clear';
  assert.equal(await wiring.check(key), 'clear');
  assert.equal(wiring.recheck(key), 'clear');
});

test('throwing or malformed verdict functions fail closed to unavailable', async () => {
  const throwing = walletDeletionWiring(async () => {
    throw new Error('sources down');
  });
  assert.equal(await throwing.check('G' + 'B'.repeat(55)), 'unavailable');
  const forged = walletDeletionWiring(async () => 'clear!!' as 'clear');
  const key = 'G' + 'C'.repeat(55);
  assert.equal(await forged.check(key), 'unavailable');
  assert.equal(forged.recheck(key), 'unavailable');
});

test('concurrent checks per owner serialize and the recheck reflects completion order', async () => {
  const order: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const wiring = walletDeletionWiring(async () => {
    order.push('start');
    await gate;
    order.push('end');
    return 'clear';
  });
  const key = 'G' + 'D'.repeat(55);
  const first = wiring.check(key);
  const second = wiring.check(key);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(order, ['start']);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(order, ['start', 'end', 'start', 'end']);
  assert.equal(wiring.recheck(key), 'clear');
});

test('prepareWalletDeletionWiring binds the real composer and fails closed on empty sources', async () => {
  // An empty sources object is not valid evidence; the composed verdict must
  // become unavailable, never clear and never throw past the adapter.
  const wiring = prepareWalletDeletionWiring({} as never, () => now);
  assert.equal(await wiring.check('G' + 'E'.repeat(55)), 'unavailable');
  assert.equal(wiring.recheck('G' + 'E'.repeat(55)), 'unavailable');
});
