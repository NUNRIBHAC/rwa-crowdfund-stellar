import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  trackDatabasePool,
  databaseKey,
  databaseMetrics,
  databaseReadiness,
  refreshDatabaseReadiness,
  resetDatabaseRuntimeForTests,
} from '../src/database-runtime.js';
import { backgroundTask, startBackgroundTask, retryingSingleFlight } from '../src/background-task.js';
import { PostgresCommunityStore, emptyCommunityState } from '../src/community-store.js';

const url = 'postgres://test:secret@localhost/app';
const env = { COMMUNITY_DATABASE_URL: url };
const blocked = () => Object.assign(new Error('Your account has restrictions: planLimitReached'), { code: 'P0001' });

test('query meter, shared direct/pooled circuit, quota backoff and recovery; no error/secret in metrics', async () => {
  resetDatabaseRuntimeForTests();
  let now = 100,
    calls = 0,
    failing = true;
  const raw = new EventEmitter() as any;
  raw.query = async () => {
    calls++;
    if (failing) throw blocked();
    return { rows: [] };
  };
  const pool = trackDatabasePool(raw, url, () => now);
  const alias = trackDatabasePool(raw, url.replace('localhost', 'pooled.localhost'), () => now);
  assert.equal(databaseKey(url), databaseKey(url.replace('localhost', 'pooled.localhost')));
  assert.equal(databaseReadiness(env, now).ready, false);
  await assert.rejects(pool.query('SELECT sensitive'), /planLimitReached/);
  for (let i = 0; i < 100; i++) await assert.rejects(alias.query('SELECT 1'), /temporarily unavailable/);
  assert.equal(calls, 1);
  await refreshDatabaseReadiness(now);
  assert.equal(calls, 1);
  assert.equal(databaseReadiness(env, now).ready, false);
  assert.doesNotMatch(JSON.stringify(databaseMetrics()), /secret|sensitive|planLimitReached|postgres/);
  failing = false;
  now += 60 * 60_000;
  await pool.query('SELECT 1');
  assert.equal(databaseReadiness(env, now).ready, true);
  raw.emit('error', Object.assign(new Error('idle socket failure'), { code: 'ECONNRESET' }));
  assert.equal(databaseReadiness(env, now).ready, false);
});

test('probes are single-flight, skip fresh successes, stop using closed pools and recover after backoff', async () => {
  resetDatabaseRuntimeForTests();
  let now = 100,
    calls = 0;
  const raw = {
    query: async () => {
      calls++;
      return { rows: [] };
    },
    end: async () => {},
  };
  const pool = trackDatabasePool(raw, url, () => now);
  await Promise.all(Array.from({ length: 50 }, () => refreshDatabaseReadiness(now)));
  assert.equal(calls, 1);
  for (let i = 0; i < 100; i++) {
    databaseReadiness(env, now);
    await refreshDatabaseReadiness(now);
  }
  assert.equal(calls, 1);
  now += 5 * 60_000;
  await refreshDatabaseReadiness(now);
  assert.equal(calls, 2);
  await pool.end();
  now += 7 * 60_000;
  await refreshDatabaseReadiness(now);
  assert.equal(calls, 2);
  assert.equal(databaseReadiness(env, now).ready, false);
  trackDatabasePool(raw, url, () => now);
  await refreshDatabaseReadiness(now);
  assert.equal(calls, 3);
  assert.equal(databaseReadiness(env, now).ready, true);
});

test('client failures allow rollback and release while new work fails closed', async () => {
  resetDatabaseRuntimeForTests();
  const statements: string[] = [];
  let released = 0;
  const client = {
    query: async (sql: string) => {
      statements.push(sql);
      if (sql === 'SELECT broken') throw blocked();
      return { rows: [] };
    },
    release: () => released++,
  };
  const pool = trackDatabasePool({ connect: async () => client, query: client.query }, url, () => 100);
  const c = await pool.connect();
  await c.query('BEGIN');
  await assert.rejects(c.query('SELECT broken'));
  await c.query('ROLLBACK');
  c.release();
  await assert.rejects(pool.connect());
  assert.deepEqual(statements, ['BEGIN', 'SELECT broken', 'ROLLBACK']);
  assert.equal(released, 1);
});

test('readiness fails closed on missing/malformed config and stale evidence without SQL', () => {
  resetDatabaseRuntimeForTests();
  assert.equal(databaseReadiness({ SOROBAN_JOURNAL_BACKEND: 'postgres' }).ready, false);
  assert.equal(databaseReadiness({ COMMUNITY_DATABASE_URL: 'invalid' }).ready, false);
  assert.equal(databaseReadiness({}).ready, true);
});

test('background rejection is handled and overlapping ticks share one run', async () => {
  let runs = 0,
    failures = 0;
  const tick = backgroundTask(
    async () => {
      runs++;
      await new Promise((r) => setTimeout(r, 10));
      throw blocked();
    },
    () => {
      failures++;
    },
  );
  await Promise.all(Array.from({ length: 100 }, () => tick()));
  assert.equal(runs, 1);
  assert.equal(failures, 1);
  await tick();
  assert.equal(runs, 2);
});

test('test imports schedule no background jobs; failed singleton retries once per backoff window', async () => {
  let runs = 0,
    now = 100;
  assert.equal(
    startBackgroundTask(
      async () => {
        runs++;
      },
      1,
      () => {},
      { NODE_ENV: 'test' },
    ),
    undefined,
  );
  assert.equal(runs, 0);
  const get = retryingSingleFlight(
    async () => {
      runs++;
      throw blocked();
    },
    { now: () => now },
  );
  for (let i = 0; i < 100; i++) await assert.rejects(get());
  assert.equal(runs, 1);
  now += 60_000;
  await assert.rejects(get());
  assert.equal(runs, 2);
});

test('no-op prune avoids UPDATE but real edits retain transaction/lock/COMMIT and failure rollback', async () => {
  const statements: string[] = [];
  let row = emptyCommunityState();
  let releases = 0;
  const client = {
    query: async (sql: string, args?: unknown[]) => {
      statements.push(sql);
      if (sql.startsWith('SELECT doc')) return { rows: [{ doc: structuredClone(row) }] };
      if (sql.startsWith('INSERT')) row = JSON.parse(String(args?.[1]));
      return { rows: [] };
    },
    release: () => releases++,
  };
  const store = new PostgresCommunityStore({ connect: async () => client, query: client.query, end: async () => {} } as any);
  assert.equal(statements.length, 0, 'constructor does not launch unobserved SQL');
  await store.change(() => {});
  assert.equal(statements.length, 8, 'four schema-init + four no-op transaction SQL calls');
  assert.equal(statements.filter((s) => s.startsWith('INSERT')).length, 0);
  statements.length = 0;
  await store.change((s) => {
    s.notifications.example = { id: 'example' } as any;
  });
  assert.equal(statements.length, 5);
  assert.equal(statements.filter((s) => s.startsWith('INSERT')).length, 1);
  assert.ok(statements.at(-1)?.startsWith('COMMIT'));
  statements.length = 0;
  await assert.rejects(
    store.change(() => {
      throw new Error('invalid');
    }),
  );
  assert.equal(statements.at(-1), 'ROLLBACK');
  assert.equal(releases, 4); // init + three changes
});

test('advisory unlock bypasses an open circuit, failed clients are destroyed and COMMIT failure degrades readiness', async () => {
  resetDatabaseRuntimeForTests();
  let now = 100;
  const sql: string[] = [];
  let discard: unknown;
  const raw = {
    query: async (q: string) => {
      sql.push(q);
      if (q === 'COMMIT') throw Object.assign(new Error('lost commit response'), { code: 'ECONNRESET' });
      return { rows: [] };
    },
    release: (d: unknown) => {
      discard = d;
    },
  };
  const pool = trackDatabasePool({ connect: async () => raw, query: raw.query }, url, () => now);
  const c = await pool.connect();
  await c.query('SELECT 1');
  assert.equal(databaseReadiness(env, now).ready, true);
  await assert.rejects(c.query('COMMIT'));
  await c.query('SELECT pg_advisory_unlock(hashtext($1))', ['fixture']);
  c.release();
  assert.equal(discard, true);
  assert.equal(databaseReadiness(env, now).ready, false);
  now += 60_000;
  await pool.query('SELECT 1');
  assert.equal(databaseReadiness(env, now).ready, true);
  assert.ok(sql.includes('SELECT pg_advisory_unlock(hashtext($1))'));
});

test('background error callback cannot turn handled DB failure into a rejected timer', async () => {
  await backgroundTask(
    async () => {
      throw blocked();
    },
    () => {
      throw new Error('logger failed');
    },
  )();
});
