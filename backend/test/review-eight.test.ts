import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import { Pool } from 'pg';
import { FileCommunityStore } from '../src/community-store.js';
import { disableTotp, enrollTotp, enableTotp, TOTP_LOCK_MS, TOTP_MAX_FAILURES } from '../src/accounts.js';
import { totpAt } from '../src/totp.js';
import { requestPasswordReset, EMAIL_RESEND_COOLDOWN_MS } from '../src/email-auth.js';
import { assertTestSafeDatabaseUrl, assertPooledDatabaseUrlTestSafe } from '../src/test-storage-guard.js';
import { PostgresDeploymentManifestStore, deploymentManifestBackend, resetDeploymentManifestBackendForTests } from '../src/deployment-manifest.js';
import { pendContribution, clearPending, readPending, drainPendingContributors } from '../src/pending-contributors.js';
import {
  FileEventArchiveStore,
  archiveCampaignEvents,
  archiveIdentity,
  archiveSnapshotJsonl,
  restoreArchiveSnapshot,
  verifyArchiveSnapshot,
} from '../src/event-archive.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-eight-'));
let seq = 0;
const newStore = () => new FileCommunityStore(path.join(dir, `community-${seq++}.json`));
const archive = () => new FileEventArchiveStore(path.join(dir, `archive-${seq++}.json`));
const at = 1_800_000_000_000;
const contract = 'CCUYSC424OJYEWFJHRCKMNBFQHRWWQQICXAZPRXJUM7PBTTYJFXN2Z73';
after(() => fs.rmSync(dir, { recursive: true, force: true }));

async function accountStore() {
  const store = newStore();
  const pk = Keypair.random().publicKey();
  await store.change((s) => {
    s.accounts[pk] = { publicKey: pk, displayName: null, createdAt: at };
  });
  return { store, pk };
}
async function totpStore() {
  process.env.COMMUNITY_TOTP_KEY = 'review-test-only-key';
  const { store, pk } = await accountStore();
  const { manualKey } = await enrollTotp(store, pk);
  const { recoveryCodes } = await enableTotp(store, pk, totpAt(manualKey, at / 1000), at);
  return { store, pk, manualKey, recoveryCodes };
}
test('R1 disable failures persist and lock out even a valid recovery code', async () => {
  const { store, pk, recoveryCodes } = await totpStore();
  for (let i = 0; i < TOTP_MAX_FAILURES; i++) {
    await assert.rejects(disableTotp(store, pk, 'invalid', at), (e: any) => e.status === 401);
    const t = (await store.read()).accounts[pk].totp!;
    assert.equal(t.failedAttempts, i === TOTP_MAX_FAILURES - 1 ? 0 : i + 1);
  }
  assert.equal((await store.read()).accounts[pk].totp!.lockUntil, at + TOTP_LOCK_MS);
  await assert.rejects(disableTotp(store, pk, recoveryCodes[0], at), (e: any) => e.status === 429);
  assert.ok((await store.read()).accounts[pk].totp);
  await disableTotp(store, pk, recoveryCodes[0], at + TOTP_LOCK_MS);
  assert.equal((await store.read()).accounts[pk].totp, undefined);
});
test('R1 existing login lock also blocks disable with valid TOTP', async () => {
  const { store, pk, manualKey } = await totpStore();
  await store.change((s) => {
    s.accounts[pk].totp!.lockUntil = at + TOTP_LOCK_MS;
  });
  await assert.rejects(disableTotp(store, pk, totpAt(manualKey, at / 1000), at), (e: any) => e.status === 429);
});
async function resetStore() {
  const { store, pk } = await accountStore();
  await store.change((s) => {
    s.emailCredentials['test@example.com'] = {
      email: 'test@example.com',
      passwordRecord: 'unused',
      publicKey: pk,
      verified: true,
      verifyTokenHash: null,
      verifyExpiresAt: null,
      createdAt: at,
      failedAttempts: 0,
      lockUntil: null,
    };
  });
  return store;
}
test('R2 concurrent reset requests reserve one cooldown before mail completes', async () => {
  const store = await resetStore();
  let finish!: () => void;
  const blocked = new Promise<void>((r) => {
    finish = r;
  });
  let sends = 0;
  const mailer = {
    send: async () => {
      sends++;
      await blocked;
    },
  };
  const one = requestPasswordReset(store, mailer, { email: 'test@example.com' }, at);
  while (!sends) await new Promise((r) => setTimeout(r, 1));
  const two = requestPasswordReset(store, mailer, { email: 'test@example.com' }, at);
  await new Promise((r) => setTimeout(r, 20));
  finish();
  await Promise.all([one, two]);
  assert.equal(sends, 1);
  assert.equal((await store.read()).mailSendLog.length, 1);
});
test('R2 failed delivery releases only its reservation and clears unusable token', async () => {
  const store = await resetStore();
  await assert.rejects(
    requestPasswordReset(
      store,
      {
        send: async () => {
          throw new Error('provider down');
        },
      },
      { email: 'test@example.com' },
      at,
    ),
    /provider down/,
  );
  const cred = (await store.read()).emailCredentials['test@example.com'];
  assert.equal(cred.resetTokenHash, null);
  assert.equal(cred.resetExpiresAt, null);
  assert.equal(cred.resetSentAt, undefined);
  let sends = 0;
  await requestPasswordReset(
    store,
    {
      send: async () => {
        sends++;
      },
    },
    { email: 'test@example.com' },
    at,
  );
  assert.equal(sends, 1);
});
test('R2 late old failure cannot clear a newer reservation after cooldown', async () => {
  const store = await resetStore();
  let reject!: (e: Error) => void;
  let started = false;
  const pending = requestPasswordReset(
    store,
    {
      send: async () => {
        started = true;
        await new Promise<void>((_, r) => {
          reject = r;
        });
      },
    },
    { email: 'test@example.com' },
    at,
  );
  while (!started) await new Promise((r) => setTimeout(r, 1));
  await requestPasswordReset(store, { send: async () => {} }, { email: 'test@example.com' }, at + EMAIL_RESEND_COOLDOWN_MS);
  const newer = (await store.read()).emailCredentials['test@example.com'].resetTokenHash;
  reject(new Error('old send failed'));
  await assert.rejects(pending, /old send failed/);
  assert.equal((await store.read()).emailCredentials['test@example.com'].resetTokenHash, newer);
  assert.equal((await store.read()).emailCredentials['test@example.com'].resetSentAt, at + EMAIL_RESEND_COOLDOWN_MS);
});
for (const suffix of ['?host=remote.example', '?host=localhost&host=remote.example', '?host=%72emote.example', '?hostaddr=198.51.100.1', '?service=live']) {
  test(`R3 effective target override refuses ${suffix}`, () => {
    assert.throws(() => assertTestSafeDatabaseUrl('postgres://localhost/test' + suffix, 'TEST_URL', { NODE_ENV: 'test' }), /test isolation/);
  });
}
test('R3 postgres protocol required and local overrides/socket remain local', async () => {
  assert.throws(() => assertTestSafeDatabaseUrl('https://localhost/test', 'TEST_URL', { NODE_ENV: 'test' }), /test isolation/);
  assert.doesNotThrow(() => assertTestSafeDatabaseUrl('postgres://localhost/test?host=%2Fvar%2Frun%2Fpostgresql', 'TEST_URL', { NODE_ENV: 'test' }));
  const pool = new Pool({ connectionString: 'postgres://localhost/test?host=remote.example' });
  assert.throws(() => assertPooledDatabaseUrlTestSafe(pool), /test isolation/);
  await pool.end();
});
test('R4 manifest rejects hosted factory URL before connecting', async () => {
  const saved = process.env.DEPLOYMENT_MANIFEST_DATABASE_URL;
  try {
    process.env.DEPLOYMENT_MANIFEST_DATABASE_URL = 'postgres://user:secret@remote.example/db';
    resetDeploymentManifestBackendForTests();
    await assert.rejects(deploymentManifestBackend(), /test isolation/);
  } finally {
    if (saved === undefined) delete process.env.DEPLOYMENT_MANIFEST_DATABASE_URL;
    else process.env.DEPLOYMENT_MANIFEST_DATABASE_URL = saved;
    resetDeploymentManifestBackendForTests();
  }
});
test('R4 manifest constructor rejects real hosted pools, allows injected fakes', async () => {
  const pool = new Pool({ connectionString: 'postgres://remote.example/db' });
  assert.throws(() => new PostgresDeploymentManifestStore(pool), /test isolation/);
  assert.doesNotThrow(() => new PostgresDeploymentManifestStore({ query: async () => ({ rows: [] }) } as never));
  await pool.end();
});
const event = (id: string, ledger = 5) => ({ id, ledger, topic: [], value: 'xdr' });
test('R5 missing stable event identity stops the window before writes/checkpoint', async () => {
  const store = archive();
  const client = {
    getNetwork: async () => ({ passphrase: 'Test SDF Network ; September 2015' }),
    getLatestLedger: async () => ({ sequence: 10, id: 'a'.repeat(64) }),
    getEvents: async () => ({ events: [event('ok'), { ledger: 6, topic: [], value: 'xdr' }] }),
  };
  await assert.rejects(archiveCampaignEvents({ client, campaignId: 'qa', contractId: contract, store }), /stable id/);
  assert.equal(await store.count(), 0);
  assert.equal(await store.readCheckpoint('qa', archiveIdentity(contract)), undefined);
});
test('R5 pagingToken fallback remains a stable id; future windows stay separate', async () => {
  const store = archive();
  const client = {
    getNetwork: async () => ({ passphrase: 'Test SDF Network ; September 2015' }),
    getLatestLedger: async () => ({ sequence: 10, id: 'a'.repeat(64) }),
    getEvents: async () => ({
      events: [
        { ledger: 5, pagingToken: 'stable', topic: [], value: 'xdr' },
        { ledger: 20, topic: [], value: 'future' },
      ],
    }),
  };
  await archiveCampaignEvents({ client, campaignId: 'qa', contractId: contract, store });
  assert.equal((await store.list())[0].eventId, 'stable');
  assert.equal((await store.readCheckpoint('qa', archiveIdentity(contract)))!.processedThroughLedger, 10);
});
test('R6 corrupt queue never becomes empty or gets overwritten by pend/clear/drain', async () => {
  const saved = process.env.PENDING_CONTRIBUTORS_PATH;
  const file = path.join(dir, 'pending-corrupt.json');
  process.env.PENDING_CONTRIBUTORS_PATH = file;
  try {
    for (const raw of ['{broken', '{}', '[{"hash":"invalid","firstPendingAt":1}]']) {
      fs.writeFileSync(file, raw);
      assert.throws(() => readPending());
      assert.throws(() => pendContribution({ hash: 'a'.repeat(64) }));
      assert.throws(() => clearPending('a'.repeat(64)));
      await assert.rejects(
        drainPendingContributors({
          record: async () => {
            assert.fail('must not record');
          },
          derive: async () => null,
        }),
      );
      assert.equal(fs.readFileSync(file, 'utf8'), raw);
    }
  } finally {
    if (saved === undefined) delete process.env.PENDING_CONTRIBUTORS_PATH;
    else process.env.PENDING_CONTRIBUTORS_PATH = saved;
  }
});
async function snapshot() {
  const store = archive();
  await archiveCampaignEvents({
    client: {
      getNetwork: async () => ({ passphrase: 'Test SDF Network ; September 2015' }),
      getLatestLedger: async () => ({ sequence: 10, id: 'a'.repeat(64) }),
      getEvents: async () => ({ events: [event('one'), event('two', 6)] }),
    },
    campaignId: 'qa',
    contractId: contract,
    store,
  });
  return { text: archiveSnapshotJsonl(await store.list()), events: await store.list() };
}
test('R7 truncated restore refuses to mutate the target and reports header count', async () => {
  const { text } = await snapshot();
  const target = archive();
  const result = await restoreArchiveSnapshot(text.split('\n').slice(0, 2).join('\n') + '\n', target);
  assert.equal(result.restored, 0);
  assert.ok(result.errors.some((e) => /header claims/.test(e)));
  assert.equal(await target.count(), 0);
});
test('R7 incorrect aggregate hash fails both restore and verification', async () => {
  const { text, events } = await snapshot();
  const lines = text.trim().split('\n');
  const header = JSON.parse(lines[0]);
  header.sha256 = '0'.repeat(64);
  lines[0] = JSON.stringify(header);
  const modified = lines.join('\n') + '\n';
  const result = await restoreArchiveSnapshot(modified, archive());
  assert.equal(result.restored, 0);
  assert.ok(result.errors.some((e) => /aggregate/.test(e)));
  assert.equal(verifyArchiveSnapshot(modified, events).ok, false);
});

test('R3 final query host wins exactly as pg resolves it, including IPv6', async () => {
  for (const url of [
    'postgresql://localhost/test?host=remote.example&host=127.0.0.1',
    'postgres://localhost/test?host=::1',
    'postgres://%2Fvar%2Frun%2Fpostgresql/test',
  ])
    assert.doesNotThrow(() => assertTestSafeDatabaseUrl(url, 'TEST_URL', { NODE_ENV: 'test' }));
  assert.throws(() => assertTestSafeDatabaseUrl('postgres://localhost/test?host=%XX', 'TEST_URL', { NODE_ENV: 'test' }), /test isolation/);
  assert.doesNotThrow(() => assertPooledDatabaseUrlTestSafe({ options: { host: 'remote.example' } }, { NODE_ENV: 'production' }));
});
test('R4 file manifest factory also refuses implicit working-directory defaults during tests', async () => {
  const saved = { ...process.env };
  try {
    for (const key of [
      'DEPLOYMENT_MANIFEST_BACKEND',
      'DEPLOYMENT_MANIFEST_DATABASE_URL',
      'DEPLOYMENT_MANIFEST_PATH',
      'SOROBAN_JOURNAL_BACKEND',
      'SOROBAN_JOURNAL_DATABASE_URL',
      'COMMUNITY_REQUIRE_POSTGRES',
      'COMMUNITY_DATABASE_URL',
    ])
      delete process.env[key];
    resetDeploymentManifestBackendForTests();
    await assert.rejects(deploymentManifestBackend(), /test isolation/);
  } finally {
    process.env = saved;
    resetDeploymentManifestBackendForTests();
  }
});
test('R5 malformed ledger/response cannot produce a completed checkpoint', async () => {
  for (const events of [[{ ...event('bad'), ledger: 'bad' }], null]) {
    const store = archive();
    const client = {
      getNetwork: async () => ({ passphrase: 'Test SDF Network ; September 2015' }),
      getLatestLedger: async () => ({ sequence: 10, id: 'a'.repeat(64) }),
      getEvents: async () => ({ events }),
    };
    await assert.rejects(archiveCampaignEvents({ client, campaignId: 'qa', contractId: contract, store }), /refusing to advance checkpoint/);
    assert.equal(await store.readCheckpoint('qa', archiveIdentity(contract)), undefined);
  }
});
test('R5 a bad second window preserves the last fully processed checkpoint', async () => {
  const store = archive();
  const client = {
    getNetwork: async () => ({ passphrase: 'Test SDF Network ; September 2015' }),
    getLatestLedger: async () => ({ sequence: 20, id: 'a'.repeat(64) }),
    getEvents: async (q: Record<string, unknown>) => ({ events: Number(q.startLedger) > 10 ? [{ ledger: 15, value: 'xdr' }] : [event('first')] }),
  };
  await assert.rejects(archiveCampaignEvents({ client, campaignId: 'qa', contractId: contract, store, windowLedgers: 10 }), /stable id/);
  assert.equal((await store.readCheckpoint('qa', archiveIdentity(contract)))!.processedThroughLedger, 10);
  assert.equal(await store.count(), 1);
});
test('R6 filesystem read errors also stop writes, and missing file alone means empty', () => {
  const saved = process.env.PENDING_CONTRIBUTORS_PATH;
  try {
    process.env.PENDING_CONTRIBUTORS_PATH = dir;
    assert.throws(() => pendContribution({ hash: 'a'.repeat(64) }));
    assert.ok(fs.statSync(dir).isDirectory());
    process.env.PENDING_CONTRIBUTORS_PATH = path.join(dir, 'absent.json');
    assert.deepEqual(readPending(), []);
  } finally {
    if (saved === undefined) delete process.env.PENDING_CONTRIBUTORS_PATH;
    else process.env.PENDING_CONTRIBUTORS_PATH = saved;
  }
});
test('R7 valid empty snapshots restore and verify without writes', async () => {
  const text = archiveSnapshotJsonl([]);
  assert.deepEqual(await restoreArchiveSnapshot(text, archive()), { restored: 0, refused: 0, errors: [] });
  assert.equal(verifyArchiveSnapshot(text, []).ok, true);
});
test('R7 invalid header version/count/hash formats fail closed', async () => {
  const { text } = await snapshot();
  for (const change of [{ version: 999 }, { events: -1 }, { events: 1.5 }, { sha256: 'not-a-hash' }]) {
    const lines = text.trim().split('\n');
    lines[0] = JSON.stringify({ ...JSON.parse(lines[0]), ...change });
    const target = archive();
    const result = await restoreArchiveSnapshot(lines.join('\n'), target);
    assert.equal(result.restored, 0);
    assert.ok(result.errors.length);
    assert.equal(await target.count(), 0);
  }
});
test('R7 duplicate ids and malformed row declarations cannot be reported restored', async () => {
  const { text } = await snapshot();
  for (const row of ['{broken', JSON.stringify({ sha256: 'bad', event: {} })]) {
    const lines = text.trim().split('\n');
    lines[1] = row;
    const result = await restoreArchiveSnapshot(lines.join('\n'), archive());
    assert.equal(result.restored, 0);
    assert.ok(result.errors.length);
  }
  const first = JSON.parse(text.trim().split('\n')[1]).event;
  const duplicate = archiveSnapshotJsonl([first, first]);
  const result = await restoreArchiveSnapshot(duplicate, archive());
  assert.equal(result.restored, 0);
  assert.ok(result.errors.some((e) => /duplicate/.test(e)));
});
