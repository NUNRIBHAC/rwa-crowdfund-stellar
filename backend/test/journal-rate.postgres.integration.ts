import test from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { PostgresJournal } from '../src/journal.js';

// Explicitly invoked integration test, never points at the app's database.
const url = new URL(process.env.JOURNAL_RATE_TEST_DATABASE_URL ?? 'invalid:');
if (url.hostname !== '127.0.0.1' || url.pathname !== '/f2_test') throw new Error('requires an isolated local f2_test database');
const pool = new Pool({ connectionString: url.href, max: 16 });
const day = 86400000;
async function fresh() {
  const journal = new PostgresJournal(pool);
  await journal.rateLimit('warmup', 1, 60000);
  await pool.query('TRUNCATE soroban_rate_hits');
  return new PostgresJournal(pool);
}
async function seed(key: string, age: number) {
  await pool.query("INSERT INTO soroban_rate_hits (key,at) VALUES ($1,now()-($2 * interval '1 millisecond'))", [key, age]);
}
test('real Postgres: expiry, index plan, bounded batch and concurrent admission', async () => {
  try {
    let journal = await fresh();
    await seed('abandoned', day + 1000);
    await seed('long-live', day - 10000);
    await seed('short-live', 1000);
    await journal.rateLimit('new', 2, 60000);
    assert.deepEqual(
      (await pool.query('SELECT key FROM soroban_rate_hits ORDER BY key')).rows.map((r) => r.key),
      ['long-live', 'new', 'short-live'],
    );
    await pool.query('SET enable_seqscan=off');
    const plan = await pool.query(
      "EXPLAIN (FORMAT JSON) SELECT seq FROM soroban_rate_hits WHERE at<now()-interval '24 hours' ORDER BY at LIMIT 1000 FOR UPDATE SKIP LOCKED",
    );
    assert.match(JSON.stringify(plan.rows), /soroban_rate_hits_at/);
    await pool.query('RESET enable_seqscan');
    journal = await fresh();
    await pool.query("INSERT INTO soroban_rate_hits (key,at) SELECT 'old:'||i,now()-interval '25 hours' FROM generate_series(1,1100) i");
    await journal.rateLimit('new', 2, 60000);
    assert.equal(Number((await pool.query("SELECT count(*) FROM soroban_rate_hits WHERE key LIKE 'old:%'")).rows[0].count), 100);
    const peers = [await fresh(), new PostgresJournal(pool)];
    await seed('long-window', 90000);
    const results = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => peers[i % 2].rateLimit('shared', 3, 60000)));
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 3);
    assert.equal(Number((await pool.query("SELECT count(*) FROM soroban_rate_hits WHERE key='shared'")).rows[0].count), 3);
    await assert.rejects(peers[0].rateLimit('long-window', 1, day), /rate limit exceeded/);
    assert.equal(Number((await pool.query("SELECT count(*) FROM pg_locks WHERE locktype='advisory'")).rows[0].count), 0);
  } finally {
    await pool.end();
  }
});
