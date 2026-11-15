import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { createCommunityTestDirectory } from '../src/test-storage-guard.js';
import { trackDatabasePool, resetDatabaseRuntimeForTests } from '../src/database-runtime.js';

test('real /health handler reflects pending, success and idle-pool failure without SQL per poll', async () => {
  const dir = createCommunityTestDirectory();
  process.env.COMMUNITY_STORE_PATH = join(dir, 'fixture.json');
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  try {
    // Initialize the router with a disposable file fixture first, then exercise
    // only the DB readiness state through a fake pool. Never connect to PG.
    await fetch(`${base}/api/news`);
    resetDatabaseRuntimeForTests();
    const url = 'postgres://fixture:fixture@127.0.0.1/fixture';
    process.env.COMMUNITY_DATABASE_URL = url;
    let calls = 0;
    const raw = new EventEmitter() as any;
    raw.query = async () => {
      calls++;
      return { rows: [] };
    };
    const pool = trackDatabasePool(raw, url);
    assert.equal((await fetch(`${base}/health`)).status, 503);
    await pool.query('SELECT 1');
    for (let i = 0; i < 50; i++) assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal(calls, 1);
    raw.emit('error', new Error('idle pool disconnected'));
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).database.ready, false);
    assert.equal(calls, 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    delete process.env.COMMUNITY_STORE_PATH;
    delete process.env.COMMUNITY_DATABASE_URL;
    resetDatabaseRuntimeForTests();
    rmSync(dir, { recursive: true, force: true });
  }
});
