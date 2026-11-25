import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@stellar/stellar-sdk';
import { createCommunityTestDirectory } from '../src/test-storage-guard.js';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';

test('real server mounts every setup endpoint before the API catch-all and defaults to disabled without upstream I/O', async () => {
  const previous = { flag: process.env.TESTNET_SETUP_ENABLED, store: process.env.COMMUNITY_STORE_PATH };
  delete process.env.TESTNET_SETUP_ENABLED;
  const directory = createCommunityTestDirectory();
  process.env.COMMUNITY_STORE_PATH = join(directory, 'community.json');
  const originalFetch = globalThis.fetch;
  const upstream: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (new URL(url).hostname === '127.0.0.1') return originalFetch(input, init);
    upstream.push(url);
    throw new Error('unexpected network access in synthetic server test');
  };
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const actor = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 1)).publicKey();
  try {
    for (const path of ['/status', '/fund-xlm', '/trustline/build', '/trustline/submit']) {
      const response = await fetch(base + '/api/testnet-setup' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, ...(path.endsWith('submit') ? { xdr: '' } : {}) }),
      });
      assert.equal(response.status, 503, path);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), { code: 'TESTNET_SETUP_DISABLED' });
    }
    assert.deepEqual(upstream, []);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    globalThis.fetch = originalFetch;
    if (previous.flag === undefined) delete process.env.TESTNET_SETUP_ENABLED;
    else process.env.TESTNET_SETUP_ENABLED = previous.flag;
    if (previous.store === undefined) delete process.env.COMMUNITY_STORE_PATH;
    else process.env.COMMUNITY_STORE_PATH = previous.store;
  }
});
