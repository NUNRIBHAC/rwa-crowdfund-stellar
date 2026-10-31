import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';

// Regression: the community router must be reachable through the real server
// app. The router used to be app.use()d only after the async store boot,
// landing behind the legacy POST catch-all, so every community POST answered
// 410 through the real server even though direct-router tests passed.
let dir: string;
let base: string;
let srv: ReturnType<import('express').Express['listen']>;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'community-store-'));
  process.env.COMMUNITY_STORE_PATH = join(dir, 'store.json');
  const { app } = await import('../src/server.js');
  await new Promise<void>((resolve) => {
    srv = app.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = srv.address();
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
});

after(async () => {
  await new Promise((resolve) => srv.close(resolve));
  rmSync(dir, { recursive: true, force: true });
  delete process.env.COMMUNITY_STORE_PATH;
});

test('POST /api/auth/challenge reaches the community router through the real app (not the legacy 410 catch-all)', async () => {
  const res = await fetch(`${base}/api/auth/challenge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ publicKey: 'not-a-key' }),
  });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error ?? '', /invalid Stellar public key/);
});

test('full login roundtrip through the real app: challenge, sign, verify, replay rejected', async () => {
  const kp = Keypair.random();
  const challengeRes = await fetch(`${base}/api/auth/challenge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ publicKey: kp.publicKey() }),
  });
  assert.equal(challengeRes.status, 200);
  const { message } = (await challengeRes.json()) as { message: string };
  const signature = Buffer.from(kp.sign(Buffer.from(message, 'utf8'))).toString('base64');
  const verifyRes = await fetch(`${base}/api/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ publicKey: kp.publicKey(), signature }),
  });
  assert.equal(verifyRes.status, 200);
  const { token } = (await verifyRes.json()) as { token: string };
  assert.match(token, /^bls_/);
  const replay = await fetch(`${base}/api/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ publicKey: kp.publicKey(), signature }),
  });
  assert.equal(replay.status, 401);
  const me = await fetch(`${base}/api/auth/me`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(me.status, 200);
});

test('GET /api/notifications passes the community path gate (401 without token, not 404)', async () => {
  const res = await fetch(`${base}/api/notifications`);
  assert.equal(res.status, 401);
});

test('GET /api/comments/mine passes the community path gate (401 without token, not 404)', async () => {
  const res = await fetch(`${base}/api/comments/mine`);
  assert.equal(res.status, 401);
});

test('GET /api/news passes the community path gate (public 200, not 404)', async () => {
  const res = await fetch(`${base}/api/news`);
  assert.equal(res.status, 200);
});

test('GET /api/operator/tickets passes the community path gate (401 without token, not 404)', async () => {
  const res = await fetch(`${base}/api/operator/tickets`);
  assert.equal(res.status, 401);
});

test('legacy campaign write catch-all still answers 410 for non-community POSTs', async () => {
  const res = await fetch(`${base}/api/campaigns`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(res.status, 410);
});

test('GET /api/companies/mine passes the community path gate (401 without token, not 404)', async () => {
  const res = await fetch(`${base}/api/companies/mine`);
  assert.equal(res.status, 401);
});

test('GET /api/auth/sessions passes the community path gate (401 without token, not 404)', async () => {
  const res = await fetch(`${base}/api/auth/sessions`);
  assert.equal(res.status, 401);
});

test('GET /api/operator/companies passes the community path gate (401 without token, not 404)', async () => {
  const res = await fetch(`${base}/api/operator/companies`);
  assert.equal(res.status, 401);
});
