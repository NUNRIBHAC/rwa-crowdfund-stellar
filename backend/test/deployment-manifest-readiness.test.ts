import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { createCommunityTestDirectory } from '../src/test-storage-guard.js';
import { resetDatabaseRuntimeForTests, databaseReadiness, databaseMetrics } from '../src/database-runtime.js';
import { resetDeploymentManifestBackendForTests } from '../src/deployment-manifest.js';
import { resetJournalBackendForTests } from '../src/journal.js';
import { warmDatabaseReadiness } from '../src/server.js';

// A dedicated DEPLOYMENT_MANIFEST_DATABASE_URL is a readiness identity of its
// own: databaseReadiness() counts it in `expected`, and only a constructed
// manifest store calls trackDatabasePool() for it. Nothing else builds the
// store at startup, so without the warm-up the identity is never tracked and
// /health (503 when database.ready is false) reports not-ready although the
// database is reachable. This test pins the warm-up invariant: after it runs,
// every expected identity has a tracked state, so readiness is decided by real
// probes instead of by a permanently unknown identity.
test('startup warm-up registers a dedicated deployment-manifest database identity', async () => {
  const dir = createCommunityTestDirectory();
  const saved = { ...process.env };
  // Unreachable localhost fixture: a probe fails fast with ECONNREFUSED, so no
  // test ever reaches a real database. The assertions are about the identity
  // being registered, not about this fixture being healthy.
  const manifestUrl = 'postgres://warmup:warmup@127.0.0.1:1/manifest';
  try {
    for (const key of [
      'COMMUNITY_DATABASE_URL',
      'SOROBAN_JOURNAL_DATABASE_URL',
      'EVENT_ARCHIVE_DATABASE_URL',
      'DEPLOYMENT_MANIFEST_DATABASE_URL',
      'SOROBAN_JOURNAL_BACKEND',
      'EVENT_ARCHIVE_BACKEND',
      'DEPLOYMENT_MANIFEST_BACKEND',
      'COMMUNITY_REQUIRE_POSTGRES',
      'DEPLOYMENT_MANIFEST_PATH',
    ])
      delete process.env[key];
    process.env.COMMUNITY_STORE_PATH = join(dir, 'community.json');
    process.env.SOROBAN_INTENTS_PATH = join(dir, 'journal.json');
    process.env.EVENT_ARCHIVE_PATH = join(dir, 'archive.json');
    process.env.DEPLOYMENT_MANIFEST_DATABASE_URL = manifestUrl;

    resetDatabaseRuntimeForTests();
    resetDeploymentManifestBackendForTests();
    resetJournalBackendForTests();

    await warmDatabaseReadiness();

    const readiness = databaseReadiness();
    assert.equal(readiness.configured, 1, 'the dedicated manifest database is the only expected identity');
    assert.equal(databaseMetrics().length, readiness.configured, 'every expected identity has a tracked state');
    assert.equal(readiness.unavailable, 1, 'the unreachable fixture is reported unavailable by its own probe');
    assert.equal(readiness.ready, false, '/health stays not-ready while that probe fails');

    // A later tick reuses the cached store instead of tracking a second state.
    await warmDatabaseReadiness();
    assert.equal(databaseMetrics().length, 1, 'repeat warm-up reuses the cached manifest store');
  } finally {
    process.env = saved;
    resetDatabaseRuntimeForTests();
    resetDeploymentManifestBackendForTests();
    resetJournalBackendForTests();
    rmSync(dir, { recursive: true, force: true });
  }
});

// The warm-up stays manifest-specific: with no dedicated manifest URL there is
// no manifest identity to register, and readiness must not depend on the
// manifest store existing.
test('warm-up leaves readiness unchanged when no dedicated manifest database is configured', async () => {
  const dir = createCommunityTestDirectory();
  const saved = { ...process.env };
  try {
    for (const key of [
      'COMMUNITY_DATABASE_URL',
      'SOROBAN_JOURNAL_DATABASE_URL',
      'EVENT_ARCHIVE_DATABASE_URL',
      'DEPLOYMENT_MANIFEST_DATABASE_URL',
      'SOROBAN_JOURNAL_BACKEND',
      'EVENT_ARCHIVE_BACKEND',
      'DEPLOYMENT_MANIFEST_BACKEND',
      'COMMUNITY_REQUIRE_POSTGRES',
      'DEPLOYMENT_MANIFEST_PATH',
    ])
      delete process.env[key];
    process.env.COMMUNITY_STORE_PATH = join(dir, 'community.json');
    process.env.SOROBAN_INTENTS_PATH = join(dir, 'journal.json');
    process.env.EVENT_ARCHIVE_PATH = join(dir, 'archive.json');

    resetDatabaseRuntimeForTests();
    resetDeploymentManifestBackendForTests();
    resetJournalBackendForTests();

    await warmDatabaseReadiness();

    assert.deepEqual(databaseReadiness(), { ready: true, configured: 0, unavailable: 0 });
    assert.equal(databaseMetrics().length, 0, 'file stores track no database identity');
  } finally {
    process.env = saved;
    resetDatabaseRuntimeForTests();
    resetDeploymentManifestBackendForTests();
    resetJournalBackendForTests();
    rmSync(dir, { recursive: true, force: true });
  }
});
