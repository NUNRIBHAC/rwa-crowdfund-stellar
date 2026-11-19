import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { StrKey } from '@stellar/stellar-sdk';
import { createCommunityTestDirectory } from '../src/test-storage-guard.js';
import { sorobanDeps, sorobanCampaigns } from '../src/soroban.js';

// Regression cover for the discovery wiring in server.ts.
//
// The sitemap lists campaign IDS only, so it reads the campaign registry with
// no chain call. The list route keeps reading live chain state. These tests
// run against the REAL server app, so they fail if the registration in
// server.ts goes back to a per-request chain read, and they fail if the
// registry read starts publishing ids the list route would not serve.
//
// Adapter evidence only: the RPC client is replaced by a counter that throws,
// so a chain call is visible as a failure, never as a slow test.

// Syntactically valid contract addresses, built from a repeated byte so the
// fixture holds no copied address literal. The registry only validates the
// StrKey shape, and these tests never reach the chain.
const contractAddress = (fill: number): string => StrKey.encodeContract(Buffer.alloc(32, fill));

const ALPHA = contractAddress(0x11);
const BETA = contractAddress(0x22);
const GAMMA_V2_TOKEN = contractAddress(0x33);
const GAMMA_V2_OFFERING = contractAddress(0x44);

let dir: string;
let srv: ReturnType<import('express').Express['listen']>;
let base: string;

function setRegistry(entries: unknown[]): void {
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify(entries);
}

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.STELLAR_NETWORK = 'testnet';
  dir = createCommunityTestDirectory();
  process.env.COMMUNITY_STORE_PATH = join(dir, 'store.json');
  setRegistry([{ id: 'alpha', name: 'Alpha', contractId: ALPHA }]);
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
  delete process.env.SOROBAN_CAMPAIGNS_JSON;
});

test('the registered sitemap route never makes a chain call', async () => {
  // A chain call must be impossible, not merely fast: this client throws.
  const original = sorobanDeps.client;
  let chainCalls = 0;
  sorobanDeps.client = () => {
    chainCalls++;
    throw new Error('chain read attempted from the sitemap');
  };
  try {
    setRegistry([
      { id: 'alpha', name: 'Alpha', contractId: ALPHA },
      { id: 'beta', name: 'Beta', contractId: BETA },
    ]);

    // The real server app, with the wiring server.ts registers.
    const res = await fetch(`${base}/sitemap.xml`);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /\/campaigns\/alpha<\/loc>/);
    assert.match(body, /\/campaigns\/beta<\/loc>/);
    assert.equal(chainCalls, 0, 'the sitemap route must not create an RPC client');

    // The same registry is what the live list route reads, so an entry the
    // sitemap publishes is an entry the list route attempts to serve.
    await assert.rejects(() => sorobanCampaigns(), /chain read attempted from the sitemap/);
    assert.equal(chainCalls, 1, 'the list route must still read live chain state');
  } finally {
    sorobanDeps.client = original;
  }
});

test('the sitemap publishes exactly the v1 registry ids', async () => {
  setRegistry([
    { id: 'alpha', name: 'Alpha', contractId: ALPHA },
    { id: 'beta', name: 'Beta', contractId: BETA },
    {
      id: 'gamma-v2',
      name: 'Gamma (v2)',
      contractSet: 'v2',
      tokenContractId: GAMMA_V2_TOKEN,
      offeringContractId: GAMMA_V2_OFFERING,
    },
  ]);

  const res = await fetch(`${base}/sitemap.xml`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /\/campaigns\/alpha<\/loc>/);
  assert.match(body, /\/campaigns\/beta<\/loc>/);
  // A v2 contract-set entry is not served by the v1 list route, so it must
  // not be published either.
  assert.ok(!body.includes('/campaigns/gamma-v2'), 'a v2 entry is never published');
  // The static page list is still present and campaign URLs are not
  // duplicated or replaced.
  assert.match(body, /\/campaigns<\/loc>/);
  assert.equal((body.match(/\/campaigns\/alpha/g) ?? []).length, 1);
});

test('an invalid registry still serves the static sitemap and stays out of it', async () => {
  setRegistry([{ id: 'bad', name: 'Bad', contractId: 'not-a-contract' }]);

  const res = await fetch(`${base}/sitemap.xml`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /\/campaigns<\/loc>/);
  assert.ok(!body.includes('/campaigns/bad'), 'an invalid registry entry is never published');
});
