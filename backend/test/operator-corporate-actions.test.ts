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
import type { ShareRegisterPayload } from '../src/share-register.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'op-corp-test-'));
let counter = 0;
const operatorKp = Keypair.random();
const userKp = Keypair.random();
const register = (rows: unknown[]): ShareRegisterPayload =>
  ({
    campaignId: 'c1',
    generatedAt: 'now',
    network: 'testnet',
    demo: true,
    semantics: '',
    totals: {} as never,
    notes: [],
    contributors: rows as never,
  }) as ShareRegisterPayload;

async function makeServer(provider: 'absent' | 'null' | 'rows', rows: unknown[] = []) {
  const store = new FileCommunityStore(path.join(dir, `store-${counter++}.json`));
  const service = new CommunityService(store, { retentionDays: 90 });
  const app = express();
  app.use(express.json());
  app.use(
    createCommunityRouter({
      service,
      requireAdmin: (_req, _res, next) => next(),
      ...(provider === 'rows' ? { shareRegister: async () => register(rows) } : provider === 'null' ? { shareRegister: async () => null } : {}),
    }),
  );
  const srv = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = srv.address();
  const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
  const tokenFor = async (kp: Keypair) => {
    const { message } = await createChallenge(store, kp.publicKey());
    return (await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(message)).toString('base64'))).token;
  };
  return { srv, base, tokenFor };
}

after(() => {
  delete process.env.OPERATOR_WALLETS;
  fs.rmSync(dir, { recursive: true, force: true });
});

const cap = (base: string, token: string, id = 'c1') =>
  fetch(`${base}/api/operator/campaigns/${id}/corporate-actions/cap-table`, { headers: { authorization: `Bearer ${token}` } });
const prev = (base: string, token: string, body: unknown) =>
  fetch(`${base}/api/operator/campaigns/c1/corporate-actions/distribution-preview`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

test('operator corporate actions: cap table and preview for a designated operator, unavailable with an unknown holder', async () => {
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();
  const { srv, base, tokenFor } = await makeServer('rows', [
    { publicKey: 'A', netIntended: '60' },
    { publicKey: 'B', netIntended: '40' },
  ]);
  const token = await tokenFor(operatorKp);
  const c = await cap(base, token);
  assert.equal(c.status, 200);
  assert.equal(((await c.json()) as { knownBase: string }).knownBase, '100');
  const p = await prev(base, token, { total: '10' });
  const body = (await p.json()) as { status: string; rows: { amount: string }[] };
  assert.equal(body.status, 'illustration');
  assert.deepEqual(
    body.rows.map((r) => r.amount),
    ['6', '4'],
  );
  assert.equal((await prev(base, token, { total: 'x' })).status, 400);
  assert.equal((await prev(base, token, {})).status, 400);
  srv.close();
  const u = await makeServer('rows', [
    { publicKey: 'A', netIntended: '60' },
    { publicKey: 'U', netIntended: 'UNKNOWN' },
  ]);
  const ut = await u.tokenFor(operatorKp);
  const up = (await (await prev(u.base, ut, { total: '10' })).json()) as { status: string; rows: unknown[]; excludedUnknownHolderCount: number };
  assert.equal(up.status, 'unavailable');
  assert.deepEqual(up.rows, []);
  assert.equal(up.excludedUnknownHolderCount, 1);
  u.srv.close();
});

test('operator corporate actions: non-operator 403, fail-closed 503 without allowlist, unknown campaign 404, no provider 503, anonymous 401', async () => {
  const { srv, base, tokenFor } = await makeServer('rows');
  delete process.env.OPERATOR_WALLETS;
  assert.equal((await cap(base, await tokenFor(operatorKp))).status, 503);
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();
  assert.equal((await cap(base, await tokenFor(userKp))).status, 403);
  assert.equal((await prev(base, await tokenFor(userKp), { total: '1' })).status, 403);
  assert.equal((await fetch(`${base}/api/operator/campaigns/c1/corporate-actions/cap-table`)).status, 401);
  srv.close();
  const n = await makeServer('null');
  assert.equal((await cap(n.base, await n.tokenFor(operatorKp))).status, 404);
  n.srv.close();
  const a = await makeServer('absent');
  assert.equal((await cap(a.base, await a.tokenFor(operatorKp))).status, 503);
  a.srv.close();
});
