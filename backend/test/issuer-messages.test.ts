// Investor-issuer messaging: private per-investor threads with the operator.
// Access matrix proven over HTTP: anonymous 401, non-investor 403, unknown
// campaign 404, entitlement-verification failure fails closed (503, never a
// public fallback), investors see only their own thread, operator replies are
// labeled operator (no verified issuer exists), notifications fire both ways.
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
const investor2Kp = Keypair.random();
const outsiderKp = Keypair.random();
process.env.OPERATOR_WALLETS = operatorKp.publicKey();

let entitlementMode: 'ok' | 'throw' = 'ok';
const investorEntitlement = async (campaignId: string, publicKey: string) => {
  if (entitlementMode === 'throw') throw new Error('horizon down (synthetic)');
  if (campaignId !== 'demo-campaign') return { registered: false, balanceUnits: 0n, contributedBefore: false };
  if (publicKey === investorKp.publicKey() || publicKey === investor2Kp.publicKey())
    return { registered: true, balanceUnits: 10000000n, contributedBefore: true };
  return { registered: true, balanceUnits: 0n, contributedBefore: false };
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'imsg-test-'));
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
    /* not JSON */
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

test('messaging lifecycle with access matrix and fail-closed gates', async () => {
  const opToken = await login(operatorKp);
  const invToken = await login(investorKp);
  const inv2Token = await login(investor2Kp);
  const outToken = await login(outsiderKp);

  // anonymous: 401 on both read and write
  assert.equal((await api('GET', '/api/campaigns/demo-campaign/messages')).status, 401);
  assert.equal((await api('POST', '/api/campaigns/demo-campaign/messages', { body: { body: 'hi' } })).status, 401);

  // outsider (registered, no balance): 403 investor_only on read and write
  const outGet = await api('GET', '/api/campaigns/demo-campaign/messages', { token: outToken });
  assert.equal(outGet.status, 403);
  assert.equal(outGet.json.code, 'investor_only');
  assert.equal((await api('POST', '/api/campaigns/demo-campaign/messages', { token: outToken, body: { body: 'hi' } })).status, 403);

  // unknown campaign: 404 for an entitled investor
  const nf = await api('GET', '/api/campaigns/no-such-campaign/messages', { token: invToken });
  assert.equal(nf.status, 404);

  // verification failure fails closed 503 on read AND write - never open
  entitlementMode = 'throw';
  const down1 = await api('GET', '/api/campaigns/demo-campaign/messages', { token: invToken });
  assert.equal(down1.status, 503);
  assert.equal(down1.json.code, 'verification_unavailable');
  assert.equal((await api('POST', '/api/campaigns/demo-campaign/messages', { token: invToken, body: { body: 'hi' } })).status, 503);
  entitlementMode = 'ok';

  // investor posts; authorRole investor; operator notified
  const post = await api('POST', '/api/campaigns/demo-campaign/messages', {
    token: invToken,
    body: { body: 'Question about the distribution schedule.' },
  });
  assert.equal(post.status, 201);
  assert.equal(post.json.authorRole, 'investor');
  assert.equal(post.json.investorKey, investorKp.publicKey());
  assert.equal(post.json.campaignId, 'demo-campaign');

  const opNotifs = await api('GET', '/api/notifications', { token: opToken });
  assert.equal(opNotifs.status, 200);
  assert.ok(
    (opNotifs.json.notifications ?? []).some((n: any) => n.kind === 'issuer_message'),
    'operator notified of new investor message',
  );

  // input validation: empty and over-length bodies rejected
  assert.equal((await api('POST', '/api/campaigns/demo-campaign/messages', { token: invToken, body: { body: '   ' } })).status, 400);
  assert.equal((await api('POST', '/api/campaigns/demo-campaign/messages', { token: invToken, body: { body: 'x'.repeat(4001) } })).status, 400);

  // investor reads own thread
  const thread = await api('GET', '/api/campaigns/demo-campaign/messages', { token: invToken });
  assert.equal(thread.status, 200);
  assert.equal(thread.json.messages.length, 1);
  assert.equal(thread.json.messages[0].body, 'Question about the distribution schedule.');

  // thread isolation: second investor's thread is empty
  const thread2 = await api('GET', '/api/campaigns/demo-campaign/messages', { token: inv2Token });
  assert.equal(thread2.status, 200);
  assert.equal(thread2.json.messages.length, 0);

  // operator lists all threads of the campaign via the same endpoint
  const opList = await api('GET', '/api/campaigns/demo-campaign/messages', { token: opToken });
  assert.equal(opList.status, 200);
  assert.equal(opList.json.messages.length, 1);

  // operator may NOT post through the investor endpoint
  const opWrong = await api('POST', '/api/campaigns/demo-campaign/messages', { token: opToken, body: { body: 'reply' } });
  assert.equal(opWrong.status, 403);
  assert.equal(opWrong.json.code, 'operator_reply_route');

  // operator replies through the operator endpoint naming the thread; investor notified
  const reply = await api('POST', '/api/operator/campaigns/demo-campaign/messages', {
    token: opToken,
    body: { investorKey: investorKp.publicKey(), body: 'Scheduled for Q3 - see the latest report.' },
  });
  assert.equal(reply.status, 201);
  assert.equal(reply.json.authorRole, 'operator');

  const invNotifs = await api('GET', '/api/notifications', { token: invToken });
  assert.ok(
    (invNotifs.json.notifications ?? []).some((n: any) => n.kind === 'issuer_message'),
    'investor notified of operator reply',
  );

  // full thread in order for the investor
  const full = await api('GET', '/api/campaigns/demo-campaign/messages', { token: invToken });
  assert.equal(full.json.messages.length, 2);
  assert.equal(full.json.messages[0].authorRole, 'investor');
  assert.equal(full.json.messages[1].authorRole, 'operator');
  assert.ok(full.json.messages[0].createdAt <= full.json.messages[1].createdAt);

  // operator reply into a nonexistent thread: 404
  const noThread = await api('POST', '/api/operator/campaigns/demo-campaign/messages', {
    token: opToken,
    body: { investorKey: investor2Kp.publicKey(), body: 'nobody here' },
  });
  assert.equal(noThread.status, 404);

  // non-operator cannot reach the operator endpoint at all
  const notOp = await api('POST', '/api/operator/campaigns/demo-campaign/messages', {
    token: invToken,
    body: { investorKey: investorKp.publicKey(), body: 'spoof' },
  });
  assert.ok([401, 403].includes(notOp.status));
});
