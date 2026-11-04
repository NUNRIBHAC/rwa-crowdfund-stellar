import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';
import { DistributionSimulationLedger } from '../src/distribution-simulation.js';
import { createDistributionSimulationRouter } from '../src/distribution-simulation-routes.js';
import type { ShareRegisterPayload } from '../src/share-register.js';

test('local real HTTP sessions enforce allowlist, two actors and exact simulated lifecycle without hosted writes', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'distribution-http-'));
  const store = new FileCommunityStore(path.join(dir, 'accounts.json'));
  let operators: string[] = [];
  const ledger = new DistributionSimulationLedger(path.join(dir, 'simulation.json'));
  const register = {
    campaignId: 'synthetic',
    generatedAt: 'fixture',
    network: 'testnet',
    demo: true,
    semantics: '',
    notes: [],
    totals: {} as never,
    contributors: [
      { publicKey: 'synthetic-holder-A', netIntended: '3' },
      { publicKey: 'synthetic-holder-B', netIntended: '1' },
    ] as never,
  } satisfies ShareRegisterPayload;
  const app = express();
  app.use(express.json());
  app.use(
    '/local-rehearsal',
    createDistributionSimulationRouter({
      mode: 'test_only',
      store,
      ledger,
      operatorWallets: () => operators,
      syntheticRegister: async (id) => (id === 'synthetic' ? register : null),
    }),
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.on('listening', r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/local-rehearsal`;
  const login = async () => {
    const kp = Keypair.random();
    const c = await createChallenge(store, kp.publicKey());
    return { wallet: kp.publicKey(), token: (await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(c.message)).toString('base64'))).token };
  };
  const request = (url: string, token?: string, body?: unknown) =>
    fetch(`${base}${url}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    const a = await login(),
      b = await login(),
      outsider = await login();
    const originalCommunity = await store.read();
    const prep = '/campaigns/synthetic/distributions';
    const input = { total: '10', idempotencyKey: 'local-first' };
    assert.equal((await request(prep, undefined, input)).status, 401);
    assert.equal((await request(prep, a.token, input)).status, 503);
    operators = [a.wallet, b.wallet];
    assert.equal((await request(prep, outsider.token, input)).status, 403);
    assert.equal((await request(prep, a.token, { ...input, actor: b.wallet })).status, 400);
    assert.equal((await request('/campaigns/absent/distributions', a.token, input)).status, 404);
    const created = await request(prep, a.token, input);
    assert.equal(created.status, 201);
    const draft = await created.json();
    const item = `/distributions/${draft.id}`;
    assert.equal(created.headers.get('cache-control'), 'no-store');
    assert.equal((await (await request(prep, a.token, input)).json()).id, draft.id);
    assert.equal((await request(item, a.token, { action: 'simulate' })).status, 409);
    assert.equal((await request(item, a.token, { action: 'approve' })).status, 409);
    assert.equal((await request(item, b.token, { action: 'approve' })).status, 200);
    const result = await (await request(item, b.token, { action: 'simulate' })).json();
    assert.equal(result.state, 'simulated');
    assert.equal(result.legalEffect, false);
    assert.deepEqual(
      result.receipts.map((r: { amount: string }) => r.amount),
      ['7.5', '2.5'],
    );
    assert.equal((await request(item, b.token, { action: 'simulate' })).status, 409);
    operators = [a.wallet];
    assert.equal((await request(item, b.token)).status, 403, 'operator removal is checked on every request');
    assert.equal((await (await request(item, a.token)).json()).state, 'simulated');
    assert.deepEqual(await store.read(), originalCommunity, 'no community journal, application or account data changed');
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
