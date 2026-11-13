import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Networks, StrKey } from '@stellar/stellar-sdk';
import { FileEventArchiveStore, archiveCampaignEvents, archiveSnapshotJsonl, restoreArchiveSnapshot, verifyArchiveSnapshot } from '../src/event-archive.js';
const a = StrKey.encodeContract(Buffer.alloc(32, 1)),
  b = StrKey.encodeContract(Buffer.alloc(32, 2));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-identity-'));
let n = 0;
const fresh = () => new FileEventArchiveStore(path.join(root, String(n++)));
function chain() {
  let sequence = 100,
    hash = 'a'.repeat(64);
  const queries: number[] = [];
  const client = {
    getNetwork: async () => ({ passphrase: Networks.TESTNET }),
    getLatestLedger: async () => ({ sequence, id: hash }),
    getLedgers: async (q: { startLedger: number }) => ({ ledgers: [{ sequence: q.startLedger, hash }] }),
    getEvents: async (q: Record<string, unknown>) => {
      queries.push(Number(q.startLedger));
      return { events: [{ id: 'same-id', ledger: 5, topic: [], value: 'original' }] };
    },
  };
  return {
    client,
    queries,
    reset: (s: number, h: string) => {
      sequence = s;
      hash = h;
    },
  };
}
const opts = (
  store: FileEventArchiveStore,
  client: ReturnType<typeof chain>['client'],
  contractId = a,
  epoch = 'initial',
  networkPassphrase = Networks.TESTNET,
) => ({ store, client, campaignId: 'qa', contractId, epoch, networkPassphrase });
test('F1 replacement contract and network cannot inherit cursor or collapse identical event ids', async () => {
  const store = fresh(),
    c = chain();
  await archiveCampaignEvents(opts(store, c.client));
  const result = await archiveCampaignEvents(opts(store, c.client, b));
  assert.equal(result.archived, 1);
  await archiveCampaignEvents(opts(store, { ...c.client, getNetwork: async () => ({ passphrase: Networks.PUBLIC }) }, a, 'initial', Networks.PUBLIC));
  assert.equal(await store.count(), 3);
});
test('F1 ledger regression or changed anchor holds without reusing cursor or relabeling old rows', async () => {
  const store = fresh(),
    c = chain();
  await archiveCampaignEvents(opts(store, c.client));
  const before = await store.list();
  c.reset(20, 'b'.repeat(64));
  await assert.rejects(archiveCampaignEvents(opts(store, c.client)), /chain|anchor|reset/i);
  assert.deepEqual(await store.list(), before);
  c.reset(200, 'b'.repeat(64));
  await assert.rejects(archiveCampaignEvents(opts(store, c.client)), /chain|anchor|reset/i);
  assert.deepEqual(await store.list(), before);
});
test('F1 explicit new epoch preserves old rows and snapshot identity instead of merging ids', async () => {
  const store = fresh(),
    c = chain();
  await archiveCampaignEvents(opts(store, c.client));
  c.reset(20, 'b'.repeat(64));
  await archiveCampaignEvents(opts(store, c.client, a, 'reset-2'));
  assert.equal(await store.count(), 2);
  const snapshot = archiveSnapshotJsonl(await store.list());
  const restored = fresh();
  assert.deepEqual(await restoreArchiveSnapshot(snapshot, restored), { restored: 2, refused: 0, errors: [] });
  assert.equal(verifyArchiveSnapshot(snapshot, await restored.list()).ok, true);
});
test('F1 unbound legacy checkpoint and events survive without being stamped current', async () => {
  const store = fresh(),
    c = chain();
  await store.writeCheckpoint('qa', { version: 1, processedThroughLedger: 1000, updatedAt: 1 });
  const old = {
    eventId: 'same-id',
    campaignId: 'qa',
    contractId: a,
    ledger: 5,
    ledgerClosedAt: null,
    pagingToken: null,
    topics: [],
    value: 'legacy',
    parsedKind: null,
    parsedContributor: null,
    archivedAt: 'old',
    archiveVersion: 1,
  };
  await store.put([old]);
  const result = await archiveCampaignEvents(opts(store, c.client));
  assert.equal(result.archived, 1);
  assert.equal(await store.count(), 2);
  assert.deepEqual(await store.readCheckpoint('qa'), { version: 1, processedThroughLedger: 1000, updatedAt: 1 });
  assert.ok((await store.list()).some((e) => e.value === 'legacy' && e.archivedAt === 'old'));
});

test('F1 unavailable anchor holds after retention expiry; explicit new epoch is a separate preserved scope', async () => {
  const store = fresh(),
    c = chain();
  await archiveCampaignEvents(opts(store, c.client));
  const before = await store.list();
  c.reset(200, 'a'.repeat(64));
  c.client.getLedgers = async () => {
    throw new Error('anchor outside retention');
  };
  await assert.rejects(archiveCampaignEvents(opts(store, c.client)), /retention/);
  assert.deepEqual(await store.list(), before);
  await archiveCampaignEvents(opts(store, c.client, a, 'reviewed-gap'));
  assert.equal(await store.count(), 2);
});
test('F1 v1 snapshot restores without silently adding identity and preserves old hashes', async () => {
  const store = fresh();
  const legacy = {
    eventId: 'legacy-id',
    campaignId: 'qa',
    contractId: a,
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
  let snapshot = archiveSnapshotJsonl([legacy]);
  const lines = snapshot.trim().split('\n');
  const header = JSON.parse(lines[0]);
  header.version = 1;
  lines[0] = JSON.stringify(header);
  snapshot = lines.join('\n') + '\n';
  assert.deepEqual(await restoreArchiveSnapshot(snapshot, store), { restored: 1, refused: 0, errors: [] });
  assert.equal(verifyArchiveSnapshot(snapshot, await store.list()).ok, true);
  assert.deepEqual(await store.list(), [legacy]);
});

test('F1 wrong RPC network refuses to stamp events into configured namespace', async () => {
  const store = fresh(),
    c = chain();
  await assert.rejects(
    archiveCampaignEvents(opts(store, { ...c.client, getNetwork: async () => ({ passphrase: Networks.PUBLIC }) })),
    /network does not match/,
  );
  assert.equal(await store.count(), 0);
});
