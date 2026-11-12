import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';
import { createCommunityRouter } from '../src/community-routes.js';

test('HTTP owner/operator isolation, metadata-only lists, registered-campaign lookup and no-store text download', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'application-http-'));
  const store = new FileCommunityStore(path.join(dir, 'state.json'));
  const service = new CommunityService(store);
  const issuer = Keypair.random(),
    operator = Keypair.random(),
    outsider = Keypair.random();
  process.env.OPERATOR_WALLETS = operator.publicKey();
  const app = express();
  app.use(express.json());
  app.use(
    createCommunityRouter({
      service,
      requireAdmin: (_q, r) => {
        r.sendStatus(403);
      },
      applicationCampaign: async (id) =>
        id === 'registered-demo'
          ? {
              id,
              contractId: 'C' + 'A'.repeat(55),
              creator: issuer.publicKey(),
              network: 'testnet',
            }
          : null,
    }),
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.on('listening', r));
  const address = server.address() as { port: number };
  async function login(kp: Keypair) {
    const ch = await createChallenge(store, kp.publicKey());
    return (await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(ch.message)).toString('base64'))).token;
  }
  async function request(p: string, token?: string, body?: unknown) {
    return fetch(`http://127.0.0.1:${address.port}${p}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  try {
    const it = await login(issuer),
      ot = await login(operator),
      xt = await login(outsider);
    assert.equal((await request('/api/issuer-applications')).status, 401);
    const submitted = await request('/api/issuer-applications/drafts', it, {
      projectName: 'Synthetic DEMO',
      country: 'PT',
      instrumentType: 'Testnet escrow',
      targetAmount: '2',
      description: 'Not a real business.',
    });
    const { application } = await submitted.json();
    const root = `/api/issuer-applications/${application.id}`;
    const uploaded = await request(root + '/documents', it, { filename: 'demo.txt', content: 'SYNTHETIC PRIVATE DOCUMENT' });
    assert.equal(uploaded.status, 201);
    const { document } = await uploaded.json();
    assert.equal(document.content, undefined);
    assert.equal((await request(root + '/documents', xt, { filename: 'bad.txt', content: 'not owner' })).status, 404);
    assert.equal((await request(root + '/documents/' + document.id, xt)).status, 404);
    assert.equal((await request(`/api/operator/issuer-applications/${application.id}/documents/${document.id}`, it)).status, 403);
    const read = await request(root + '/documents/' + document.id, it);
    assert.equal(await read.text(), 'SYNTHETIC PRIVATE DOCUMENT');
    assert.equal(read.headers.get('cache-control'), 'no-store');
    assert.match(read.headers.get('content-type')!, /text\/plain/);
    assert.equal((await request(root + '/submit', it, {})).status, 200);
    assert.equal((await request(root + '/documents', it, { filename: 'late.txt', content: 'blocked' })).status, 409);
    assert.equal((await request(`/api/operator/issuer-applications/${application.id}/documents/${document.id}`, ot)).status, 200);
    const listed = await (await request('/api/issuer-applications', it)).json();
    assert.equal(listed.applications[0].documents[0].content, undefined);
    const op = `/api/operator/issuer-applications/${application.id}`;
    assert.equal((await request(op + '/campaign', ot, { campaignId: 'registered-demo' })).status, 409);
    assert.equal((await request(op + '/status', ot, { status: 'approved', note: 'Prototype review only' })).status, 200);
    assert.equal((await request(op + '/campaign', ot, { campaignId: 'missing' })).status, 404);
    assert.equal((await request(op + '/campaign', it, { campaignId: 'registered-demo' })).status, 403);
    assert.equal((await request(op + '/campaign', ot, { campaignId: 'registered-demo' })).status, 200);
    assert.equal((await (await request('/api/issuer-applications', it)).json()).applications[0].campaign.id, 'registered-demo');
    delete process.env.OPERATOR_WALLETS;
    assert.equal((await request(op + '/documents/' + document.id, ot)).status, 503);
  } finally {
    delete process.env.OPERATOR_WALLETS;
    await new Promise<void>((r) => server.close(() => r()));
    await fs.rm(dir, { recursive: true, force: true });
  }
});
