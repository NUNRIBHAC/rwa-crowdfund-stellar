import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertTestSafeDatabaseUrl, isTestProcess } from '../src/test-storage-guard.js';
import { journalBackend, resetJournalBackendForTests } from '../src/journal.js';
import { communityStoreFromEnv } from '../src/community.js';
import { eventArchiveBackend } from '../src/event-archive.js';

const HOSTED = 'postgres://user:secret@db-abc123.us-east-2.aws.neon.tech/neondb';
const LOCAL_URLS = ['postgres://user:secret@localhost:5432/testdb', 'postgres://user:secret@127.0.0.1/testdb', 'postgres://user:secret@[::1]/testdb'];

test('guard is inert outside a test process, even for hosted URLs', () => {
  assert.doesNotThrow(() => assertTestSafeDatabaseUrl(HOSTED, 'SOME_DATABASE_URL', { NODE_ENV: 'production' }));
  assert.doesNotThrow(() => assertTestSafeDatabaseUrl(HOSTED, 'SOME_DATABASE_URL', {}));
});

test('test process + hosted URL refuses, names the source var, offers no bypass', () => {
  assert.throws(
    () => assertTestSafeDatabaseUrl(HOSTED, 'SOROBAN_JOURNAL_DATABASE_URL', { NODE_ENV: 'test' }),
    /test isolation: refusing Postgres connection.*SOROBAN_JOURNAL_DATABASE_URL.*no bypass/s,
  );
});

test('test process + empty URL refuses (fail closed)', () => {
  assert.throws(() => assertTestSafeDatabaseUrl(undefined, 'COMMUNITY_DATABASE_URL', { NODE_ENV: 'test' }), /test isolation: COMMUNITY_DATABASE_URL is empty/);
});

test('test process + unparseable DSN refuses (fail closed)', () => {
  assert.throws(() => assertTestSafeDatabaseUrl('not a url at all', 'X_DATABASE_URL', { NODE_ENV: 'test' }), /test isolation: refusing Postgres connection/);
});

test('test process + local disposable database URLs are allowed', () => {
  for (const url of LOCAL_URLS) {
    assert.doesNotThrow(() => assertTestSafeDatabaseUrl(url, 'SOME_DATABASE_URL', { NODE_ENV: 'test' }));
  }
});

// The suite itself runs under NODE_ENV=test, so the integration cases below
// exercise the guard exactly as a leaked live-container run would hit it.

test('journalBackend: inherited hosted journal config rejects in tests instead of connecting', async () => {
  process.env.SOROBAN_JOURNAL_BACKEND = 'postgres';
  process.env.SOROBAN_JOURNAL_DATABASE_URL = HOSTED;
  try {
    resetJournalBackendForTests();
    await assert.rejects(journalBackend(), /test isolation: refusing Postgres connection/);
  } finally {
    delete process.env.SOROBAN_JOURNAL_BACKEND;
    delete process.env.SOROBAN_JOURNAL_DATABASE_URL;
    resetJournalBackendForTests();
  }
});

test('communityStoreFromEnv: inherited hosted community config rejects in tests', async () => {
  process.env.COMMUNITY_DATABASE_URL = HOSTED;
  try {
    await assert.rejects(communityStoreFromEnv(), /test isolation: refusing Postgres connection/);
  } finally {
    delete process.env.COMMUNITY_DATABASE_URL;
  }
});

test('eventArchiveBackend: inherited hosted archive config rejects in tests', async () => {
  process.env.EVENT_ARCHIVE_DATABASE_URL = HOSTED;
  try {
    await assert.rejects(eventArchiveBackend(), /test isolation: refusing Postgres connection/);
  } finally {
    delete process.env.EVENT_ARCHIVE_DATABASE_URL;
  }
});

test('isTestProcess matches both the npm marker and the direct node --test marker', () => {
  assert.equal(isTestProcess({ NODE_ENV: 'test' }), true);
  // `node --test file` (no npm script, no NODE_ENV) still arms the guard:
  // node sets NODE_TEST_CONTEXT in every test file process (verified
  // empirically on node 24: value 'child-v8').
  assert.equal(isTestProcess({ NODE_TEST_CONTEXT: 'child-v8' }), true);
  assert.equal(isTestProcess({ NODE_ENV: 'production' }), false);
  assert.equal(isTestProcess({}), false);
});

test('direct runner invocation marker refuses hosted URLs without NODE_ENV', () => {
  assert.throws(
    () => assertTestSafeDatabaseUrl(HOSTED, 'SOROBAN_JOURNAL_DATABASE_URL', { NODE_TEST_CONTEXT: 'child-v8' }),
    /test isolation: refusing Postgres connection/,
  );
});

// --- QA review gaps G1/G2 ---------------------------------------------------

import { assertExplicitFileStorePath, assertPooledDatabaseUrlTestSafe } from '../src/test-storage-guard.js';
import { PostgresJournal } from '../src/journal.js';
import { PostgresCommunityStore } from '../src/community-store.js';
import { PostgresEventArchiveStore } from '../src/event-archive.js';
import { readPendingStrict } from '../src/pending-contributors.js';
import { Pool } from 'pg';

test('G1: constructor-injected real pg Pool with a hosted URL refuses in test processes', () => {
  const hostedPool = new Pool({ connectionString: HOSTED });
  assert.throws(() => new PostgresJournal(hostedPool), /test isolation: refusing Postgres connection/);
  assert.throws(() => new PostgresCommunityStore(hostedPool), /test isolation: refusing Postgres connection/);
  assert.throws(() => new PostgresEventArchiveStore(hostedPool), /test isolation: refusing Postgres connection/);
  return hostedPool.end();
});

test('G1: constructor-injected real pg Pool with a local URL passes the guard', async () => {
  const localPool = new Pool({ connectionString: 'postgres://user:secret@localhost:5432/testdb' });
  // Guard-level assertion only: constructing a store would start a real
  // schema-init connection to the (absent) local server after the test ends.
  assert.doesNotThrow(() => assertPooledDatabaseUrlTestSafe(localPool));
  await localPool.end();
});

test('G1: fake pools without inspectable connectionString remain injectable', () => {
  const fake = { query: async () => ({ rows: [] }) };
  assert.doesNotThrow(() => assertPooledDatabaseUrlTestSafe(fake, { NODE_ENV: 'test' }));
  assert.doesNotThrow(() => new PostgresJournal(fake as never));
});

test('G2: file store defaults under inherited cwd refuse in test processes', () => {
  assert.throws(() => assertExplicitFileStorePath(undefined, 'SOROBAN_INTENTS_PATH', { NODE_ENV: 'test' }), /test isolation: SOROBAN_INTENTS_PATH is not set/);
  assert.doesNotThrow(() => assertExplicitFileStorePath('/tmp/isolated/intents.json', 'SOROBAN_INTENTS_PATH', { NODE_ENV: 'test' }));
  assert.doesNotThrow(() => assertExplicitFileStorePath(undefined, 'SOROBAN_INTENTS_PATH', { NODE_ENV: 'production' }));
});

test('G2: journalBackend file branch refuses the working-directory default in tests', () => {
  delete process.env.SOROBAN_JOURNAL_BACKEND;
  delete process.env.SOROBAN_INTENTS_PATH;
  try {
    resetJournalBackendForTests();
    // journalBackend() throws synchronously before returning the memoized promise.
    assert.throws(() => journalBackend(), /test isolation: SOROBAN_INTENTS_PATH is not set/);
  } finally {
    resetJournalBackendForTests();
  }
});

test('G2: communityStoreFromEnv refuses the file default in tests', async () => {
  delete process.env.COMMUNITY_DATABASE_URL;
  delete process.env.SOROBAN_JOURNAL_DATABASE_URL;
  delete process.env.SOROBAN_JOURNAL_BACKEND;
  delete process.env.COMMUNITY_STORE_PATH;
  await assert.rejects(communityStoreFromEnv(), /test isolation: COMMUNITY_STORE_PATH is not set/);
});

test('G2: eventArchiveBackend refuses the file default in tests', async () => {
  delete process.env.EVENT_ARCHIVE_DATABASE_URL;
  delete process.env.COMMUNITY_DATABASE_URL;
  delete process.env.SOROBAN_JOURNAL_DATABASE_URL;
  delete process.env.EVENT_ARCHIVE_BACKEND;
  delete process.env.SOROBAN_JOURNAL_BACKEND;
  delete process.env.EVENT_ARCHIVE_PATH;
  await assert.rejects(eventArchiveBackend(), /test isolation: EVENT_ARCHIVE_PATH is not set/);
});

test('G2: pending-contributors store refuses the derived default in tests', () => {
  delete process.env.PENDING_CONTRIBUTORS_PATH;
  delete process.env.SOROBAN_INTENTS_PATH;
  assert.throws(() => readPendingStrict(), /test isolation: PENDING_CONTRIBUTORS_PATH/);
});

test('G1b: Pool({host}) object config with a hosted endpoint refuses in tests', () => {
  const p = new Pool({ host: 'db-abc123.us-east-2.aws.neon.tech', database: 'neondb' });
  assert.throws(() => new PostgresJournal(p), /test isolation: refusing Postgres connection/);
  return p.end();
});

test('G1b: bare Pool() inheriting PGHOST refuses in tests (pg resolves PGHOST lazily)', async () => {
  process.env.PGHOST = 'db-abc123.us-east-2.aws.neon.tech';
  try {
    const p = new Pool({});
    assert.throws(() => new PostgresJournal(p), /test isolation: refusing Postgres connection.*inherited PGHOST/s);
    await p.end();
  } finally {
    delete process.env.PGHOST;
  }
});

test('G1b: bare Pool() without PGHOST defaults to localhost and passes the guard', async () => {
  delete process.env.PGHOST;
  const p = new Pool({});
  assert.doesNotThrow(() => assertPooledDatabaseUrlTestSafe(p));
  await p.end();
});

test('G1b: unix-socket host config passes the guard (local)', async () => {
  const p = new Pool({ host: '/var/run/postgresql' });
  assert.doesNotThrow(() => assertPooledDatabaseUrlTestSafe(p));
  await p.end();
});
