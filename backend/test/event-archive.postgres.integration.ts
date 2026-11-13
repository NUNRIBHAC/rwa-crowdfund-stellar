import test from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { StrKey, Networks } from '@stellar/stellar-sdk';
import { PostgresEventArchiveStore, archiveCampaignEvents, archiveIdentity, archiveSnapshotJsonl, verifyArchiveSnapshot } from '../src/event-archive.js';
const url = new URL(process.env.ARCHIVE_TEST_DATABASE_URL ?? 'invalid:');
if (url.hostname !== '127.0.0.1' || url.pathname !== '/archive_identity_test') throw new Error('requires isolated local archive_identity_test database');
const pool = new Pool({ connectionString: url.href });
const contract = StrKey.encodeContract(Buffer.alloc(32, 1)),
  replacement = StrKey.encodeContract(Buffer.alloc(32, 2));
test('real Postgres: legacy preservation, scoped checkpoint/event keys, reset hold and snapshot parity', async () => {
  try {
    const store = new PostgresEventArchiveStore(pool);
    await store.writeCheckpoint('qa', { version: 1, processedThroughLedger: 1000, updatedAt: 1 });
    const old = {
      eventId: 'same',
      campaignId: 'qa',
      contractId: contract,
      ledger: 5,
      ledgerClosedAt: null,
      pagingToken: null,
      topics: [],
      value: 'old',
      parsedKind: null,
      parsedContributor: null,
      archivedAt: 'old',
      archiveVersion: 1,
    };
    await store.put([old]);
    let hash = 'a'.repeat(64),
      sequence = 100;
    const client = {
      getNetwork: async () => ({ passphrase: Networks.TESTNET }),
      getLatestLedger: async () => ({ sequence, id: hash }),
      getLedgers: async (q: { startLedger: number }) => ({ ledgers: [{ sequence: q.startLedger, hash }] }),
      getEvents: async () => ({ events: [{ id: 'same', ledger: 5, topic: [], value: 'new' }] }),
    };
    const args = { client, store, campaignId: 'qa', contractId: contract };
    await archiveCampaignEvents(args);
    await archiveCampaignEvents({ ...args, contractId: replacement });
    await archiveCampaignEvents({
      ...args,
      client: { ...client, getNetwork: async () => ({ passphrase: Networks.PUBLIC }) },
      networkPassphrase: Networks.PUBLIC,
    });
    assert.equal(await store.count(), 4);
    assert.equal((await store.readCheckpoint('qa'))?.version, 1);
    assert.equal((await store.readCheckpoint('qa', archiveIdentity(contract)))?.version, 2);
    hash = 'b'.repeat(64);
    sequence = 20;
    await assert.rejects(archiveCampaignEvents(args), /regression/);
    await archiveCampaignEvents({ ...args, epoch: 'reset-2' });
    assert.equal(await store.count(), 5);
    const events = await store.list();
    assert.ok(events.some((e) => e.value === 'old' && !e.identity));
    assert.equal(await store.put(events), 0);
    assert.equal(verifyArchiveSnapshot(archiveSnapshotJsonl(events), events).ok, true);
    const keys = await pool.query('SELECT event_id FROM event_archive');
    assert.equal(new Set(keys.rows.map((r) => r.event_id)).size, 5);
  } finally {
    await pool.end();
  }
});
