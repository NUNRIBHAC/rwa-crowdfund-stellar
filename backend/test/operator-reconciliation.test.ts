import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';
import { createCommunityRouter } from '../src/community-routes.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'op-recon-test-'));
let counter = 0;
const operatorKp = Keypair.random();
const userKp = Keypair.random();

async function makeServer(withProvider: boolean) {
  const store = new FileCommunityStore(path.join(dir, `store-${counter++}.json`));
  const service = new CommunityService(store, { retentionDays: 90 });
  const app = express();
  app.use(express.json());
  app.use(
    createCommunityRouter({
      service,
      requireAdmin: (_req, _res, next) => next(),
      ...(withProvider
        ? {
            reconciliation: async () => ({ generatedAt: '2026-10-31T16:00:00.000Z', network: 'testnet', semantics: 's', campaigns: [], quarantinedIntents: 0 }),
          }
        : {}),
    }),
  );
  const srv = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = srv.address();
  const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
  const tokenFor = async (kp: Keypair) => {
    const { message } = await createChallenge(store, kp.publicKey());
    const sig = Buffer.from(kp.sign(Buffer.from(message, 'utf8'))).toString('base64');
    return (await verifyChallenge(store, kp.publicKey(), sig)).token;
  };
  return { srv, base, tokenFor };
}

after(() => {
  delete process.env.OPERATOR_WALLETS;
  fs.rmSync(dir, { recursive: true, force: true });
});

test('operator reconciliation serves the provider payload to a designated operator', async () => {
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();
  const { srv, base, tokenFor } = await makeServer(true);
  const token = await tokenFor(operatorKp);
  const res = await fetch(`${base}/api/operator/reconciliation`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.network, 'testnet');
  srv.close();
});

test('operator reconciliation fails closed without OPERATOR_WALLETS and rejects non-operators', async () => {
  const { srv, base, tokenFor } = await makeServer(true);
  delete process.env.OPERATOR_WALLETS;
  let res = await fetch(`${base}/api/operator/reconciliation`, { headers: { authorization: `Bearer ${await tokenFor(operatorKp)}` } });
  assert.equal(res.status, 503);
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();
  res = await fetch(`${base}/api/operator/reconciliation`, { headers: { authorization: `Bearer ${await tokenFor(userKp)}` } });
  assert.equal(res.status, 403);
  srv.close();
});

test('operator reconciliation reports 503 when the provider is not wired', async () => {
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();
  const { srv, base, tokenFor } = await makeServer(false);
  const res = await fetch(`${base}/api/operator/reconciliation`, { headers: { authorization: `Bearer ${await tokenFor(operatorKp)}` } });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.match(body.error, /not wired/);
  srv.close();
});
