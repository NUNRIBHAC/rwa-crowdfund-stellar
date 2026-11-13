import { createCommunityTestDirectory } from '../src/test-storage-guard.js';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PostgresCommunityStore, emptyCommunityState } from '../src/community-store.js';
import type { CommunityState } from '../src/community-store.js';

// Simulated pg pool (no connect()): records queries and serves the single
// JSON document row from memory.
function fakePool() {
  let doc: CommunityState | null = null;
  const queries: string[] = [];
  return {
    queries,
    async query(text: string, params?: unknown[]) {
      queries.push(text);
      if (text.startsWith('CREATE TABLE')) return { rows: [] };
      if (text.startsWith('SELECT doc FROM community_store')) {
        return { rows: doc ? [{ doc }] : [] };
      }
      if (text.startsWith('INSERT INTO community_store')) {
        doc = JSON.parse(params![1] as string);
        return { rows: [] };
      }
      throw new Error('unexpected query: ' + text);
    },
    async end() {},
  };
}

test('PostgresCommunityStore: schema init, empty read, locked change round-trip', async () => {
  const pool = fakePool();
  const store = new PostgresCommunityStore(pool);
  assert.deepEqual(await store.read(), emptyCommunityState());
  const out = await store.change((state) => {
    state.accounts['GABC'] = { publicKey: 'GABC', displayName: 'Demo', createdAt: 1 };
    return 'done';
  });
  assert.equal(out, 'done');
  const again = await store.read();
  assert.equal(again.accounts['GABC'].displayName, 'Demo');
  assert.ok(pool.queries.some((q) => q.startsWith('CREATE TABLE IF NOT EXISTS community_store')));
  assert.ok(pool.queries.some((q) => q.startsWith('INSERT INTO community_store')));
});

test('PostgresCommunityStore: rejects a corrupted stored document', async () => {
  const pool = fakePool();
  const store = new PostgresCommunityStore(pool);
  await store.change((state) => {
    state.accounts['GABC'] = { publicKey: 'GABC', displayName: null, createdAt: 1 };
  });
  // Corrupt the stored document behind the store's back.
  await pool.query('INSERT INTO community_store (id, doc, updated_at) VALUES ($1, $2, now())', ['main', JSON.stringify({ version: 99 })]);
  await assert.rejects(() => store.read(), /invalid community store/);
});

test('communityStoreFromEnv: fails closed when durable storage is required but unconfigured', async () => {
  const { communityStoreFromEnv } = await import('../src/community.js');
  const saved = { ...process.env };
  try {
    delete process.env.COMMUNITY_DATABASE_URL;
    delete process.env.SOROBAN_JOURNAL_DATABASE_URL;
    process.env.SOROBAN_JOURNAL_BACKEND = 'postgres';
    await assert.rejects(() => communityStoreFromEnv(), /refusing to fall back/);
    process.env.SOROBAN_JOURNAL_BACKEND = 'file';
    const dir = createCommunityTestDirectory();
    process.env.COMMUNITY_STORE_PATH = join(dir, 'community.json');
    const store = await communityStoreFromEnv();
    assert.equal(store.constructor.name, 'FileCommunityStore');
    rmSync(dir, { recursive: true, force: true });
  } finally {
    process.env = saved;
  }
});
