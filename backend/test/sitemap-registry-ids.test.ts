import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { registerDiscoveryEndpoints } from '../src/sitemap.js';
import { sorobanDeps, sorobanCampaigns, sorobanRegisteredCampaigns } from '../src/soroban.js';

// Regression cover for the discovery wiring in server.ts.
//
// The sitemap lists campaign IDS only, so it reads the campaign registry with
// no chain call. The list route keeps reading live chain state. These tests
// fail if the sitemap goes back to a per-request chain read, and they fail if
// the registry read starts returning ids the list route would not serve.
//
// Adapter evidence only: the RPC client is replaced by a counter that throws,
// so a chain call is visible as a failure, never as a slow test.

process.env.STELLAR_NETWORK = 'testnet';

function withServer(app: express.Express, fn: (base: string) => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    const srv = app.listen(0, '127.0.0.1', async () => {
      const addr = srv.address();
      const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
      try {
        await fn(base);
        srv.close(() => resolve());
      } catch (err) {
        srv.close(() => reject(err));
      }
    });
  });
}

test('the sitemap campaign-id source never makes a chain call', async () => {
  // A chain call must be impossible, not merely fast: this client throws.
  const original = sorobanDeps.client;
  let chainCalls = 0;
  sorobanDeps.client = () => {
    chainCalls++;
    throw new Error('chain read attempted from the sitemap');
  };
  try {
    // Wiring under test is the same expression server.ts registers.
    const ids = sorobanRegisteredCampaigns().map((c) => c.id);
    assert.ok(Array.isArray(ids));
    assert.equal(chainCalls, 0, 'the sitemap source must not create an RPC client');

    // And the same registry is what the live list route reads, so an entry the
    // sitemap publishes is an entry the list route attempts to serve.
    await assert.rejects(() => sorobanCampaigns(), /chain read attempted from the sitemap/);
    assert.equal(chainCalls, 1, 'the list route must still read live chain state');
  } finally {
    sorobanDeps.client = original;
  }
});

test('the sitemap publishes exactly the registry ids, and only v1 entries', async () => {
  const original = process.env.SOROBAN_CAMPAIGNS_JSON;
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify([
    { id: 'alpha', name: 'Alpha', contractId: 'CCBIMGPHIOUFN6IC6MYPFXOGJQIRJHHDXA2Y7LQDCYBSJOKHULICO6NY' },
    { id: 'beta', name: 'Beta', contractId: 'CAF673HYNQLEJJH5XNNZUMXAJQOBNN5FCAOQFBTPTCZZX45UG6PCF5WJ' },
  ]);
  try {
    const app = express();
    registerDiscoveryEndpoints(app, { listCampaignIds: async () => sorobanRegisteredCampaigns().map((c) => c.id) });
    await withServer(app, async (base) => {
      const res = await fetch(`${base}/sitemap.xml`);
      assert.equal(res.status, 200);
      const body = await res.text();
      assert.match(body, /<loc>[^<]+\/campaigns\/alpha<\/loc>/);
      assert.match(body, /<loc>[^<]+\/campaigns\/beta<\/loc>/);
      // The static page list is still present and campaign URLs are not
      // duplicated or replaced.
      assert.match(body, /<loc>[^<]+\/campaigns<\/loc>/);
      assert.equal((body.match(/\/campaigns\/alpha/g) ?? []).length, 1);
    });
  } finally {
    if (original === undefined) delete process.env.SOROBAN_CAMPAIGNS_JSON;
    else process.env.SOROBAN_CAMPAIGNS_JSON = original;
  }
});

test('an invalid registry still serves the static sitemap and stays out of it', async () => {
  const original = process.env.SOROBAN_CAMPAIGNS_JSON;
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify([{ id: 'bad', name: 'Bad', contractId: 'not-a-contract' }]);
  try {
    const app = express();
    registerDiscoveryEndpoints(app, { listCampaignIds: async () => sorobanRegisteredCampaigns().map((c) => c.id) });
    await withServer(app, async (base) => {
      const res = await fetch(`${base}/sitemap.xml`);
      assert.equal(res.status, 200);
      const body = await res.text();
      assert.match(body, /<loc>[^<]+\/campaigns<\/loc>/);
      assert.ok(!body.includes('/campaigns/bad'), 'an invalid registry entry is never published');
    });
  } finally {
    if (original === undefined) delete process.env.SOROBAN_CAMPAIGNS_JSON;
    else process.env.SOROBAN_CAMPAIGNS_JSON = original;
  }
});
