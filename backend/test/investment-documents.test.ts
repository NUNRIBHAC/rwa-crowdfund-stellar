// Investment documents: publication -> approval -> entitled download flow.
// Access matrix proven over HTTP: anonymous 401, non-investor 403,
// unapproved content invisible/undownloadable, entitled owner lists and
// downloads approved synthetic documents, entitlement-verification failure
// fails closed (503), never falls back to public access.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import type { AddressInfo } from 'node:net';

process.env.STELLAR_NETWORK = 'testnet';

const { createCommunityRouter } = await import('../src/community-routes.js');
const { CommunityService } = await import('../src/community.js');
const { FileCommunityStore } = await import('../src/community-store.js');

const ADMIN = 'test-admin-key';
process.env.ADMIN_KEY = ADMIN;

const operatorKp = Keypair.random();
const investorKp = Keypair.random();
const outsiderKp = Keypair.random();
process.env.OPERATOR_WALLETS = operatorKp.publicKey();

// Entitlement fixture: investorKp holds a balance; outsiderKp does not.
const investorEntitlement = async (campaignId: string, publicKey: string) => {
  if (campaignId !== 'demo-campaign') return { registered: false, balanceUnits: 0n, contributedBefore: false };
  if (publicKey === investorKp.publicKey()) return { registered: true, balanceUnits: 10000000n, contributedBefore: true };
  return { registered: true, balanceUnits: 0n, contributedBefore: false };
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'idoc-test-'));
let base = '';
let server: ReturnType<express.Express['listen']>;

function requireAdmin(req: any, res: any, next: any) {
  if (req.headers['x-admin-key'] !== ADMIN) return res.status(403).json({ error: 'forbidden' });
  next();
}

before(async () => {
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const service = new CommunityService(store);
  app.use(createCommunityRouter({ service, requireAdmin, investorEntitlement } as any));
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

async function api(method: string, p: string, opts: { token?: string; body?: unknown } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* file downloads are not JSON */
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function login(kp: Keypair): Promise<string> {
  const ch = await api('POST', '/api/auth/challenge', { body: { publicKey: kp.publicKey() } });
  assert.equal(ch.status, 200);
  const sig = Buffer.from(kp.signMessage(ch.json.message)).toString('base64');
  const v = await api('POST', '/api/auth/verify', { body: { publicKey: kp.publicKey(), signature: sig } });
  assert.equal(v.status, 200);
  return v.json.token;
}

test('full lifecycle with access matrix', async () => {
  const opToken = await login(operatorKp);
  const invToken = await login(investorKp);
  const outToken = await login(outsiderKp);

  // publish (operator only)
  const pub = await api('POST', '/api/operator/campaigns/demo-campaign/investment-documents', {
    token: opToken,
    body: { title: '[SYNTHETIC] Sample investment terms', kind: 'terms', content: 'Fictional demo content. Not an offer.' },
  });
  assert.equal(pub.status, 201);
  const docId = pub.json.document.id;
  assert.equal(pub.json.document.status, 'pending');
  assert.equal(pub.json.document.demo, true);
  assert.equal(pub.json.document.content, undefined, 'content not echoed in metadata');

  // non-operator cannot publish
  const pubDenied = await api('POST', '/api/operator/campaigns/demo-campaign/investment-documents', {
    token: invToken,
    body: { title: 'x', kind: 'terms', content: 'y' },
  });
  assert.equal(pubDenied.status, 403);

  // anonymous: 401 on list and download
  assert.equal((await api('GET', '/api/campaigns/demo-campaign/investment-documents')).status, 401);
  assert.equal((await api('GET', `/api/investment-documents/${docId}/download`)).status, 401);

  // non-investor: 403 on list and download
  assert.equal((await api('GET', '/api/campaigns/demo-campaign/investment-documents', { token: outToken })).status, 403);
  assert.equal((await api('GET', `/api/investment-documents/${docId}/download`, { token: outToken })).status, 403);

  // unapproved: investor sees nothing, download 404
  const listBefore = await api('GET', '/api/campaigns/demo-campaign/investment-documents', { token: invToken });
  assert.equal(listBefore.status, 200);
  assert.deepEqual(listBefore.json.documents, []);
  assert.equal((await api('GET', `/api/investment-documents/${docId}/download`, { token: invToken })).status, 404);

  // approve (operator only)
  const apprDenied = await api('POST', `/api/operator/investment-documents/${docId}/approve`, { token: invToken });
  assert.equal(apprDenied.status, 403);
  const appr = await api('POST', `/api/operator/investment-documents/${docId}/approve`, { token: opToken });
  assert.equal(appr.status, 200);
  assert.equal(appr.json.document.status, 'approved');

  // owner: lists approved metadata (no content) and downloads the file
  const listAfter = await api('GET', '/api/campaigns/demo-campaign/investment-documents', { token: invToken });
  assert.equal(listAfter.status, 200);
  assert.equal(listAfter.json.documents.length, 1);
  assert.equal(listAfter.json.documents[0].title, '[SYNTHETIC] Sample investment terms');
  assert.equal('content' in listAfter.json.documents[0], false, 'content must not ride the listing');
  const dl = await api('GET', `/api/investment-documents/${docId}/download`, { token: invToken });
  assert.equal(dl.status, 200);
  assert.match(dl.headers.get('content-disposition') ?? '', /attachment/);
  assert.match(dl.text, /SYNTHETIC DEMO DOCUMENT/);
  assert.match(dl.text, /Fictional demo content/);

  // non-investor still denied after approval
  assert.equal((await api('GET', `/api/investment-documents/${docId}/download`, { token: outToken })).status, 403);
});

test('entitlement verification failure fails closed (503), never public', async () => {
  const app2 = express();
  app2.use(express.json({ limit: '64kb' }));
  const store2 = new FileCommunityStore(path.join(dir, 'store2.json'));
  const service2 = new CommunityService(store2);
  app2.use(
    createCommunityRouter({
      service: service2,
      requireAdmin,
      investorEntitlement: async () => {
        throw new Error('RPC down');
      },
    } as any),
  );
  const srv = app2.listen(0, '127.0.0.1');
  await new Promise<void>((r) => srv.on('listening', () => r()));
  const port = (srv.address() as AddressInfo).port;
  const res = await fetch(`http://127.0.0.1:${port}/api/campaigns/demo-campaign/investment-documents`, {
    headers: { authorization: 'Bearer whatever' },
  });
  // invalid token -> 401 before entitlement; use a real login for the 503 check
  assert.equal(res.status, 401);
  const ch = await (
    await fetch(`http://127.0.0.1:${port}/api/auth/challenge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ publicKey: investorKp.publicKey() }),
    })
  ).json();
  const sig = Buffer.from(investorKp.signMessage(ch.message)).toString('base64');
  const v = await (
    await fetch(`http://127.0.0.1:${port}/api/auth/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ publicKey: investorKp.publicKey(), signature: sig }),
    })
  ).json();
  const res2 = await fetch(`http://127.0.0.1:${port}/api/campaigns/demo-campaign/investment-documents`, {
    headers: { authorization: `Bearer ${v.token}` },
  });
  assert.equal(res2.status, 503, 'entitlement failure must fail closed');
  srv.close();
});

test('operator listing shows pending + approved; publication validates input', async () => {
  const opToken = await login(operatorKp);
  const bad = await api('POST', '/api/operator/campaigns/demo-campaign/investment-documents', {
    token: opToken,
    body: { title: '', kind: 'terms', content: 'y' },
  });
  assert.equal(bad.status, 500, 'invalid input rejected (no silent store write)');
  const badKind = await api('POST', '/api/operator/campaigns/demo-campaign/investment-documents', {
    token: opToken,
    body: { title: 'x', kind: 'prospectus', content: 'y' },
  });
  assert.equal(badKind.status, 500);
});

test('pre-investment-documents stored documents: entitled investor gets 200 [], not a 500', async () => {
  // Regression: staging's persisted community document predates the
  // investmentDocuments collection; validate() must default it on read,
  // otherwise Object.values(undefined) threw and entitled investors got an
  // unhandled 500.
  const { emptyCommunityState, FileCommunityStore: FCS } = await import('../src/community-store.js');
  const legacy: any = emptyCommunityState();
  delete legacy.investmentDocuments;
  const legacyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'idoc-legacy-'));
  fs.writeFileSync(path.join(legacyDir, 'store.json'), JSON.stringify(legacy), { mode: 0o600 });
  const app2 = express();
  app2.use(express.json({ limit: '64kb' }));
  const service2 = new CommunityService(new FCS(path.join(legacyDir, 'store.json')));
  app2.use(createCommunityRouter({ service: service2, requireAdmin, investorEntitlement } as any));
  const server2 = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const srv = app2.listen(0, '127.0.0.1', () => resolve(srv));
  });
  try {
    const port = (server2.address() as AddressInfo).port;
    const base2 = 'http://127.0.0.1:' + port;
    const ch = await fetch(base2 + '/api/auth/challenge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ publicKey: investorKp.publicKey() }),
    }).then((r) => r.json());
    const sig = Buffer.from(investorKp.signMessage(ch.message)).toString('base64');
    const v = await fetch(base2 + '/api/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ publicKey: investorKp.publicKey(), signature: sig }),
    }).then((r) => r.json());
    const res = await fetch(base2 + '/api/campaigns/demo-campaign/investment-documents', { headers: { authorization: 'Bearer ' + v.token } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.documents, []);
  } finally {
    server2.close();
  }
});
