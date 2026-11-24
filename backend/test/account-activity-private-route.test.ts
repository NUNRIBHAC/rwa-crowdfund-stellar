import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';

test('activity is private, wallet-session scoped, cookie compatible, revocable and fail-closed', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'private-activity-'));
  const store = new FileCommunityStore(join(dir, 'accounts.json'));
  const wallet = Keypair.random();
  const challenge = await createChallenge(store, wallet.publicKey());
  const login = await verifyChallenge(store, wallet.publicKey(), Buffer.from(wallet.signMessage(challenge.message)).toString('base64'));
  const calls: string[] = [];
  let fail = false;
  const app = express();
  app.use(
    createCommunityRouter({
      service: new CommunityService(store),
      requireAdmin: (_q, r) => {
        r.sendStatus(403);
      },
      accountActivity: async (actor) => {
        if (fail) throw Error('PRIVATE-PROVIDER-DIAGNOSTIC');
        calls.push(actor);
        return [{ hash: 'synthetic-private', status: 'BUILT', amount: '1' }];
      },
    }),
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((ok) => server.once('listening', ok));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/account/activity`;
  const headers = { authorization: `Bearer ${login.token}` };
  try {
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await fetch(base + '?actor=' + wallet.publicKey())).status, 401);
    assert.equal(calls.length, 0);
    assert.equal((await fetch(base + '?actor=' + Keypair.random().publicKey(), { headers })).status, 400);
    assert.equal(calls.length, 0);
    const own = await fetch(base, { headers });
    assert.equal(own.status, 200);
    assert.equal(own.headers.get('cache-control'), 'no-store');
    assert.equal((await own.json()).activity[0].hash, 'synthetic-private');
    assert.deepEqual(calls, [wallet.publicKey()]);
    assert.equal((await fetch(base, { headers: { cookie: `__Host-blockallisto-session=${login.token}` } })).status, 200);
    const other = Keypair.random();
    const otherChallenge = await createChallenge(store, other.publicKey());
    const otherLogin = await verifyChallenge(store, other.publicKey(), Buffer.from(other.signMessage(otherChallenge.message)).toString('base64'));
    assert.equal((await fetch(base, { headers: { authorization: `Bearer ${otherLogin.token}` } })).status, 200);
    assert.equal(calls.at(-1), other.publicKey());
    calls.pop();
    fail = true;
    const failed = await fetch(base, { headers });
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { code: 'API_UNAVAILABLE' });
    fail = false;
    for (const authMethod of ['email', 'social'] as const) {
      await store.change((state) => {
        state.accounts[wallet.publicKey()].authMethod = authMethod;
      });
      assert.equal((await fetch(base, { headers })).status, 403);
    }
    assert.equal(calls.length, 2);
    await store.change((state) => {
      delete state.accounts[wallet.publicKey()].authMethod;
      for (const session of Object.values(state.sessions)) session.expiresAt = Date.now() - 1;
    });
    assert.equal((await fetch(base, { headers })).status, 401);
    assert.equal(calls.length, 2);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((ok) => server.close(() => ok()));
    rmSync(dir, { recursive: true, force: true });
  }
});
