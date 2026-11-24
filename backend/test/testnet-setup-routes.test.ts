import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import type { AddressInfo } from 'node:net';
import { testnetSetupRouter, testnetSetupPorts } from '../src/testnet-setup-routes.js';
import { TEST_USDC_ISSUER, TESTNET_HORIZON, type SetupPorts, type TestnetSetupConfig } from '../src/testnet-setup.js';
const address = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 1)).publicKey();
const config: TestnetSetupConfig = { enabled: true, network: 'testnet', horizon: TESTNET_HORIZON, issuer: TEST_USDC_ISSUER };
const ports: SetupPorts = { loadAccount: async () => ({ sequence: '4', balances: [] }), fundXlm: async () => {}, submit: async () => ({ hash: '' }) };
async function withApp(
  run: (post: (path: string, body: unknown) => Promise<{ response: Response; body: unknown }>) => Promise<void>,
  options: Partial<TestnetSetupConfig> = {},
  overrides: Partial<SetupPorts> = {},
) {
  const app = express();
  app.use(express.json({ limit: '12kb' }));
  app.use('/api/testnet-setup', testnetSetupRouter({ ...config, ...options }, { ...ports, ...overrides }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/testnet-setup`;
  try {
    await run(async (path, body) => {
      const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return { response, body: await response.json() };
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
}
test('router status is no-store and testnet-only', () =>
  withApp(async (post) => {
    const r = await post('/status', { actor: address });
    assert.equal(r.response.status, 200);
    assert.equal(r.response.headers.get('cache-control'), 'no-store');
    assert.equal((r.body as { network: string }).network, 'testnet');
  }));
test('router disabled by default configuration gate before upstream I/O', () =>
  withApp(
    async (post) => {
      for (const path of ['/status', '/fund-xlm', '/trustline/build', '/trustline/submit']) {
        const r = await post(path, { actor: address, ...(path.endsWith('submit') ? { xdr: '' } : {}) });
        assert.equal(r.response.status, 503);
        assert.deepEqual(r.body, { code: 'TESTNET_SETUP_DISABLED' });
      }
    },
    { enabled: false },
    {
      loadAccount: async () => {
        throw new Error('must not call');
      },
    },
  ));
test('router rejects missing actor, extra fields and missing signed XDR', () =>
  withApp(async (post) => {
    for (const [path, body, code] of [
      ['/status', {}, 'TESTNET_ADDRESS_INVALID'],
      ['/status', { actor: 1 }, 'TESTNET_ADDRESS_INVALID'],
      ['/status', { actor: 'G'.repeat(65) }, 'TESTNET_ADDRESS_INVALID'],
      ['/status', { actor: address, secret: 'not accepted' }, 'TESTNET_REQUEST_INVALID'],
      ['/trustline/submit', { actor: address }, 'TESTNET_TRANSACTION_INVALID'],
    ] as const) {
      const r = await post(path, body);
      assert.equal(r.response.status, 400);
      assert.deepEqual(r.body, { code });
    }
  }));
test('router never exposes upstream text', () =>
  withApp(
    async (post) => {
      const r = await post('/status', { actor: address });
      assert.equal(r.response.status, 502);
      assert.deepEqual(r.body, { code: 'TESTNET_UPSTREAM_UNAVAILABLE' });
    },
    {},
    {
      loadAccount: async () => {
        throw new Error('private upstream details');
      },
    },
  ));
test('router has a bounded per-IP budget', () =>
  withApp(async (post) => {
    for (let i = 0; i < 30; i++) assert.equal((await post('/status', { actor: address })).response.status, 200);
    const r = await post('/status', { actor: address });
    assert.equal(r.response.status, 429);
    assert.equal(r.response.headers.get('retry-after'), '60');
  }));
test('router builds unsigned XDR but malformed submissions never send', () =>
  withApp(
    async (post) => {
      const built = await post('/trustline/build', { actor: address });
      assert.equal(built.response.status, 200);
      assert.equal(typeof (built.body as { xdr: string }).xdr, 'string');
      const invalid = await post('/trustline/submit', { actor: address, xdr: 'invalid' });
      assert.equal(invalid.response.status, 400);
    },
    {},
    {
      submit: async () => {
        throw new Error('must not call');
      },
    },
  ));
test('adapter locks upstream origin and disables redirects', async () => {
  const original = globalThis.fetch;
  try {
    const seen: string[] = [];
    globalThis.fetch = async (url, init) => {
      seen.push(String(url));
      assert.equal(init?.redirect, 'error');
      assert.ok(init?.signal);
      return Response.json({ account_id: address, sequence: '4', balances: [{ asset_type: 'native', balance: '10000' }] });
    };
    const p = testnetSetupPorts();
    assert.equal((await p.loadAccount(address))?.sequence, '4');
    await p.fundXlm(address);
    assert.equal(seen[0], TESTNET_HORIZON + '/accounts/' + address);
    assert.equal(seen[1], 'https://friendbot.stellar.org?addr=' + address);
  } finally {
    globalThis.fetch = original;
  }
});
test('adapter accepts only 404 as confirmed absence', async () => {
  const original = globalThis.fetch;
  try {
    const p = testnetSetupPorts();
    globalThis.fetch = async () => new Response('', { status: 404 });
    assert.equal(await p.loadAccount(address), null);
    globalThis.fetch = async () => new Response('', { status: 500 });
    await assert.rejects(p.loadAccount(address));
    await assert.rejects(p.fundXlm(address));
  } finally {
    globalThis.fetch = original;
  }
});
test('adapter rejects malformed account data', async () => {
  const original = globalThis.fetch;
  try {
    const p = testnetSetupPorts();
    for (const value of [
      null,
      [],
      {},
      { account_id: 'other', sequence: '4', balances: [] },
      { account_id: address, sequence: 4, balances: [] },
      { account_id: address, sequence: 'NaN', balances: [] },
      { account_id: address, sequence: '4', balances: [null] },
      { account_id: address, sequence: '4', balances: [{ asset_type: 'native', balance: '-1' }] },
      { account_id: address, sequence: '4', balances: [{ asset_type: 'credit_alphanum4', balance: '2' }] },
    ]) {
      globalThis.fetch = async () => Response.json(value);
      await assert.rejects(p.loadAccount(address));
    }
  } finally {
    globalThis.fetch = original;
  }
});

test('global budget bounds distinct client cardinality and releases every expired slot', async () => {
  const previousDepth = process.env.TRUST_PROXY_DEPTH;
  process.env.TRUST_PROXY_DEPTH = '1';
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  let reads = 0;
  const app = express();
  app.use(express.json());
  app.use(
    '/setup',
    testnetSetupRouter(config, {
      ...ports,
      loadAccount: async () => {
        reads++;
        return { sequence: '4', balances: [] };
      },
    }),
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/setup/status`;
  const post = (ip: string) =>
    fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ actor: address }) });
  try {
    for (let i = 0; i < 120; i++) assert.equal((await post(`198.51.100.${i}`)).status, 200);
    assert.equal(reads, 120);
    const denied = await post('203.0.113.1');
    assert.equal(denied.status, 429);
    assert.equal(denied.headers.get('retry-after'), '60');
    assert.equal(reads, 120);
    now += 59999;
    assert.equal((await post('203.0.113.2')).status, 429);
    now += 1;
    // Exact cutoff removes all old per-IP and global entries. A fresh set can enter.
    for (let i = 0; i < 120; i++) assert.equal((await post(`192.0.2.${i}`)).status, 200);
    assert.equal(reads, 240);
    assert.equal((await post('203.0.113.3')).status, 429);
    now += 60000;
    assert.equal((await post('198.51.100.0')).status, 200);
  } finally {
    Date.now = originalNow;
    if (previousDepth === undefined) delete process.env.TRUST_PROXY_DEPTH;
    else process.env.TRUST_PROXY_DEPTH = previousDepth;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
