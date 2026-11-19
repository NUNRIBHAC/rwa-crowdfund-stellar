import test from 'node:test';
// Liveness/readiness split: /livez answers while any dependency is down;
// /health additionally proves the durable pending queue accepts a write when
// PENDING_CONTRIBUTORS_PATH is configured, and degrades to 503 when it does
// not. The probe is cached 30s per path, so polls never hammer the disk.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCommunityTestDirectory } from '../src/test-storage-guard.js';

test('/livez is 200 even when readiness dependencies are down', async () => {
  const dir = createCommunityTestDirectory();
  process.env.COMMUNITY_STORE_PATH = join(dir, 'fixture.json');
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  try {
    process.env.COMMUNITY_DATABASE_URL = 'postgres://fixture:fixture@127.0.0.1/fixture';
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 503);
    assert.equal((await health.json()).ok, false);
    const livez = await fetch(`${base}/livez`);
    assert.equal(livez.status, 200);
    assert.deepEqual(await livez.json(), { ok: true });
  } finally {
    delete process.env.COMMUNITY_DATABASE_URL;
    server.close();
  }
});

test('/health proves the pending queue is writable when PENDING_CONTRIBUTORS_PATH is set', async () => {
  const dir = createCommunityTestDirectory();
  process.env.COMMUNITY_STORE_PATH = join(dir, 'fixture.json');
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  try {
    await fetch(`${base}/api/news`); // initialize the community store fixture
    const queueDir = join(dir, 'queue');
    mkdirSync(queueDir, { recursive: true });
    process.env.PENDING_CONTRIBUTORS_PATH = join(queueDir, 'pending.json');
    const good = await fetch(`${base}/health`);
    assert.equal(good.status, 200);
    const goodBody = await good.json();
    assert.deepEqual(goodBody.queue, { configured: true, ok: true });
    // Second poll inside the 30s cache window serves the same answer.
    assert.equal((await (await fetch(`${base}/health`)).json()).queue.ok, true);
  } finally {
    delete process.env.PENDING_CONTRIBUTORS_PATH;
    server.close();
  }
});
