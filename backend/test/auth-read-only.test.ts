import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { emptyCommunityState, type CommunityStore } from '../src/community-store.js';
import { authenticateWithSession } from '../src/accounts.js';
test('bearer authentication never writes, refuses malformed/unknown/expired/revoked/deleted and does not cache successful sessions', async () => {
  const token = `bls_${'1'.repeat(48)}`;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const state = emptyCommunityState();
  state.accounts.owner = { publicKey: 'owner', displayName: null, createdAt: 1 };
  state.sessions[tokenHash] = { tokenHash, publicKey: 'owner', createdAt: 10, expiresAt: 100 };
  let reads = 0,
    changes = 0;
  const store: CommunityStore = {
    read: async () => {
      reads++;
      return structuredClone(state);
    },
    change: async () => {
      changes++;
      throw new Error('authentication must not write');
    },
  };
  assert.deepEqual(await authenticateWithSession(store, `Bearer ${token}`, 99), { account: state.accounts.owner, sessionCreatedAt: 10 });
  const copy = await authenticateWithSession(store, `Bearer ${token}`, 99);
  copy.account.displayName = 'changed';
  assert.equal(state.accounts.owner.displayName, null);
  await assert.rejects(authenticateWithSession(store, `Bearer ${token}`, 100), /expired or unknown/);
  await assert.rejects(authenticateWithSession(store, `Bearer bls_${'2'.repeat(48)}`, 99), /expired or unknown/);
  delete state.sessions[tokenHash];
  await assert.rejects(authenticateWithSession(store, `Bearer ${token}`, 99), /expired or unknown/);
  state.sessions[tokenHash] = { tokenHash, publicKey: 'owner', createdAt: 10, expiresAt: 100 };
  delete state.accounts.owner;
  await assert.rejects(authenticateWithSession(store, `Bearer ${token}`, 99), /expired or unknown/);
  const before = reads;
  for (const header of [undefined, '', token, 'Bearer malformed', `Bearer bls_${'a'.repeat(47)}`])
    await assert.rejects(authenticateWithSession(store, header, 99), /missing or malformed/);
  assert.equal(reads, before);
  assert.equal(changes, 0);
  assert.equal(reads, 6);
});
