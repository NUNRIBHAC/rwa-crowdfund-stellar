import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';

// Server-dispatch regression: COMMUNITY_PATH in server.ts decides which
// /api/* requests reach the community router. The share-register.pdf route
// exists (community-routes.ts, requireAdmin) but the gate regex only listed
// json|csv, so the PDF fell through to the generic 404 on staging. These
// tests pin the gate: all three share-register formats must DISPATCH (reach
// the admin guard -> 401 anonymous), never fall through (-> 404).
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'community-dispatch-'));
process.env.STELLAR_NETWORK = 'testnet';
process.env.USDC_ISSUER = Keypair.random().publicKey();
process.env.SOROBAN_INTENTS_PATH = path.join(tmp, 'intents.json');
process.env.COMMUNITY_STORE_PATH = path.join(tmp, 'community-store.json');
process.env.ADMIN_SECRET = 'dispatch-test-admin';

const { app } = await import('../src/server.js');

let srv: ReturnType<typeof app.listen>;
let base = '';

before(async () => {
  srv = app.listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  const addr = srv.address();
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
});

after(async () => {
  await new Promise<void>((r) => srv.close(() => r()));
});

test('share-register.json/csv/pdf all dispatch through the community gate to the admin guard', async () => {
  for (const ext of ['json', 'csv', 'pdf']) {
    const res = await fetch(`${base}/api/campaigns/demo-solar/share-register.${ext}`);
    assert.notEqual(res.status, 404, `share-register.${ext} fell through the community gate (route unreachable)`);
    assert.equal(res.status, 401, `share-register.${ext} must reach requireAdmin anonymously`);
  }
});

test('query string on the pdf route still dispatches', async () => {
  const res = await fetch(`${base}/api/campaigns/demo-solar/share-register.pdf?download=1`);
  assert.equal(res.status, 401);
});

test('campaign messages routes dispatch through the community gate (anonymous -> 401, never 404)', async () => {
  const get = await fetch(`${base}/api/campaigns/demo-solar/messages`);
  assert.notEqual(get.status, 404, 'messages GET fell through the community gate (route unreachable)');
  assert.equal(get.status, 401, 'messages GET must reach the auth guard anonymously');
  const post = await fetch(`${base}/api/campaigns/demo-solar/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(post.status, 401, 'messages POST must reach the auth guard anonymously');
});

test('non-community paths still fall through the gate', async () => {
  const res = await fetch(`${base}/api/campaigns/demo-solar/share-register.xml`);
  assert.equal(res.status, 404, 'unrelated extensions must not be claimed by the community gate');
});

test('corporate-actions routes dispatch through the community gate to the admin guard', async () => {
  const get = await fetch(`${base}/api/campaigns/demo-solar/corporate-actions/cap-table.json`);
  assert.equal(get.status, 401, 'cap-table must reach requireAdmin anonymously');
  const post = await fetch(`${base}/api/campaigns/demo-solar/corporate-actions/distribution-preview`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"total":"10"}',
  });
  assert.equal(post.status, 401, 'distribution-preview must reach requireAdmin anonymously');
});
