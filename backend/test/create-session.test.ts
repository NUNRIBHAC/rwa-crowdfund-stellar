import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createSession, SESSION_TTL_MS } from '../src/accounts.js';
import { emptyCommunityState, type Account } from '../src/community-store.js';

test('createSession issues a bearer token, stores only its SHA256 hash, and returns the TTL', () => {
  const state = emptyCommunityState();
  const account: Account = { publicKey: 'owner', displayName: null, createdAt: 1000 };
  const now = 10000;
  const { token, expiresAt, account: returnedAccount } = createSession(state, account, now);

  assert.match(token, /^bls_[0-9a-f]{48}$/);
  assert.equal(token.length, 4 + 48);
  assert.equal(expiresAt, now + SESSION_TTL_MS);
  assert.deepEqual(returnedAccount, account);
  assert.notEqual(returnedAccount, account); // shallow copy returned

  const hashes = Object.keys(state.sessions);
  assert.equal(hashes.length, 1);
  const stored = state.sessions[hashes[0]];
  assert.equal(stored.publicKey, 'owner');
  assert.equal(stored.createdAt, now);
  assert.equal(stored.expiresAt, now + SESSION_TTL_MS);
  assert.equal(stored.tokenHash, createHash('sha256').update(token).digest('hex'));
  assert.equal(JSON.stringify(state.sessions).includes(token), false);
  returnedAccount.displayName = 'changed snapshot';
  assert.equal(account.displayName, null);
  assert.equal(stored.publicKey, account.publicKey);
});

test('createSession produces distinct tokens and hashes for each call', () => {
  const state = emptyCommunityState();
  const account: Account = { publicKey: 'owner', displayName: null, createdAt: 1 };
  const a = createSession(state, account, 1);
  const b = createSession(state, account, 1);

  assert.notEqual(a.token, b.token);
  assert.notEqual(Object.keys(state.sessions)[0], Object.keys(state.sessions)[1]);
  assert.equal(Object.keys(state.sessions).length, 2);
});
