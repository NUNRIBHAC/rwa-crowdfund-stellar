import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { FileCommunityStore } from '../src/community-store.js';
import { advanceDemoJourney, readDemoJourney } from '../src/demo-journey.js';
test('entire synthetic business -> investor -> matching receipts persists without real workflow writes', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'synthetic-journey-'));
  try {
    const file = path.join(dir, 'state.json');
    const store = new FileCommunityStore(file);
    const owner = { publicKey: 'synthetic-owner', displayName: null, createdAt: 1 };
    const other = { ...owner, publicKey: 'another-owner' };
    await store.change((s) => {
      s.accounts[owner.publicKey] = owner;
      s.accounts[other.publicKey] = other;
    });
    const before = await store.read();
    await assert.rejects(advanceDemoJourney(store, owner, { action: 'contribute' }), /out of order/);
    await assert.rejects(advanceDemoJourney(store, owner, { action: 'submit_application', passport: 'never collected' }));
    for (const action of ['submit_application', 'attach_document', 'review', 'approve', 'create_campaign', 'complete_onboarding', 'contribute']) {
      const view = await advanceDemoJourney(store, owner, { action }, 10);
      const again = await advanceDemoJourney(store, owner, { action }, 11);
      assert.deepEqual(again, view, 'retries are idempotent');
    }
    const result = await readDemoJourney(new FileCommunityStore(file), owner);
    assert.equal(result.nextAction, null);
    assert.equal(result.realFundsMoved, false);
    assert.equal(result.realIdentityVerified, false);
    assert.equal(result.realInvestmentEligible, false);
    assert.deepEqual(result.business.contribution, result.investor.contribution);
    assert.equal(result.investor.contribution?.amount, '10');
    assert.equal(result.investor.contribution?.transactionHash, null);
    assert.equal(result.investor.contribution?.campaignId, result.campaignId);
    assert.match(result.document!.sha256, /^[a-f0-9]{64}$/);
    assert.equal((await readDemoJourney(store, other)).id, null);
    const after = await store.read();
    delete after.accounts[owner.publicKey].demoJourney;
    assert.deepEqual(after, before, 'no real application, assessment, campaign or contributor mutation');
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('HTTP simulation requires auth, rejects skipped/extra-data steps and isolates accounts', async () => {
  const express = (await import('express')).default;
  const { Keypair } = await import('@stellar/stellar-sdk');
  const { CommunityService } = await import('../src/community.js');
  const { createCommunityRouter } = await import('../src/community-routes.js');
  const { createChallenge, verifyChallenge } = await import('../src/accounts.js');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'simulation-http-'));
  const store = new FileCommunityStore(path.join(dir, 'state.json'));
  const app = express();
  app.use(express.json());
  app.use(
    createCommunityRouter({
      service: new CommunityService(store),
      requireAdmin: (_q, r) => {
        r.sendStatus(403);
      },
    }),
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.on('listening', r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/auth/demo-journey`;
  async function login() {
    const kp = Keypair.random();
    const c = await createChallenge(store, kp.publicKey());
    return (await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(c.message)).toString('base64'))).token;
  }
  async function req(token?: string, body?: unknown) {
    return fetch(base, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  try {
    assert.equal((await req()).status, 401);
    const a = await login(),
      b = await login();
    assert.equal((await req(a, { action: 'contribute' })).status, 409);
    assert.equal((await req(a, { action: 'submit_application', identity: 'not collected' })).status, 400);
    assert.equal((await req(a, { action: 'submit_application' })).status, 200);
    const own = await req(a);
    assert.equal(own.headers.get('cache-control'), 'no-store');
    assert.equal((await own.json()).completed.length, 1);
    assert.equal((await (await req(b)).json()).id, null);
    for (const action of ['attach_document', 'review', 'approve', 'create_campaign', 'complete_onboarding', 'contribute']) {
      assert.equal((await req(a, { action })).status, 200);
    }
    const final = await (await req(a)).json();
    assert.equal(final.nextAction, null);
    assert.deepEqual(final.business.contribution, final.investor.contribution);
    assert.equal(final.realFundsMoved, false);
    assert.equal(final.investor.contribution.transactionHash, null);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    await fs.rm(dir, { recursive: true, force: true });
  }
});
