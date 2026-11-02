import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import {
  FileEventArchiveStore,
  PostgresEventArchiveStore,
  archiveCampaignEvents,
  archiveSnapshotJsonl,
  restoreArchiveSnapshot,
  verifyArchiveSnapshot,
  archiveEventHash,
  ARCHIVE_VERSION,
} from '../src/event-archive.js';

const CONTRACT = 'CCUYSC424OJYEWFJHRCKMNBFQHRWWQQICXAZPRXJUM7PBTTYJFXN2Z73';
const kp = Keypair.random().publicKey();
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'event-archive-test-'));
let counter = 0;
const newStore = () => new FileEventArchiveStore(path.join(dir, `archive-${counter++}.json`));

const ev = (id: string, ledger: number, kind = 'contributed') => ({
  id,
  ledger,
  ledgerClosedAt: '2026-11-01T00:00:00Z',
  pagingToken: `pt-${id}`,
  topic: [{ symbol: kind }, { address: kp }],
  value: `xdr-${id}`,
});

const client = (events: ReturnType<typeof ev>[], latest: number, rangeError?: string) => ({
  async getLatestLedger() {
    return { sequence: latest };
  },
  async getEvents(params: Record<string, unknown>) {
    if (rangeError && typeof params.startLedger === 'number' && params.startLedger < 100) throw { code: -32602, message: rangeError };
    return { events };
  },
});

test('archives every contract event verbatim and dedups on re-run', async () => {
  const store = newStore();
  const c = client([ev('e1', 5), ev('e2', 6, 'refunded'), ev('e3', 7, 'withdrawn')], 10);
  const r1 = await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  assert.equal(r1.scanned, 3);
  assert.equal(r1.archived, 3);
  const list = await store.list('qa');
  assert.equal(list.length, 3);
  assert.equal(list[0].topics.length, 2);
  assert.equal(list[0].value, 'xdr-e1');
  assert.equal(list[0].parsedKind, 'contributed');
  assert.equal(list[0].parsedContributor, kp);
  assert.equal(list[1].parsedKind, 'refunded');
  const cp = await store.readCheckpoint('qa');
  assert.equal(cp?.version, ARCHIVE_VERSION);
  assert.equal(cp?.processedThroughLedger, 10);
  const r2 = await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  assert.equal(r2.scanned, 0); // cursor already past latest
  assert.equal(await store.count('qa'), 3);
});

test('idempotent re-archive of the same window counts duplicates, not rows', async () => {
  const store = newStore();
  const c = client([ev('e1', 5)], 10);
  await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  // Simulate a version-bump rescan: wipe the checkpoint, events stay.
  await store.writeCheckpoint('qa', { version: 0, processedThroughLedger: 1, updatedAt: 0 });
  const r = await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  assert.equal(r.archived, 0);
  assert.equal(r.duplicates, 1);
  assert.equal(await store.count('qa'), 1);
});

test('floor range error clamps the start and flags an honest gap', async () => {
  const store = newStore();
  const c = client([ev('e1', 120)], 200, 'ledger range: 100 - 200');
  const r = await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  assert.equal(r.gap, 'start-before-floor');
  const cp = await store.readCheckpoint('qa');
  assert.equal(cp?.gap, 'start-before-floor');
  assert.equal(cp?.floorLedger, 100);
  assert.equal(cp?.processedThroughLedger, 200);
});

test('a full page trips the truncation guard and moves nothing', async () => {
  const store = newStore();
  const many = Array.from({ length: 3 }, (_, i) => ev(`e${i}`, 5));
  const c = client(many, 10);
  await assert.rejects(() => archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store, eventLimit: 3 }), /may be truncated/);
  assert.equal(await store.readCheckpoint('qa'), undefined);
});

test('events without a stable id are skipped rather than duplicated', async () => {
  const store = newStore();
  const noId = { ledger: 5, topic: [{ symbol: 'contributed' }], value: 'x' };
  const c = {
    async getLatestLedger() {
      return { sequence: 10 };
    },
    async getEvents() {
      return { events: [noId, ev('e1', 5)] };
    },
  };
  const r = await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  assert.equal(r.scanned, 1);
  assert.equal(await store.count('qa'), 1);
});

test('snapshot round-trips clean and detects tampering', async () => {
  const store = newStore();
  const c = client([ev('e1', 5), ev('e2', 6)], 10);
  await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  const live = await store.list();
  const snapshot = archiveSnapshotJsonl(live);
  const ok = verifyArchiveSnapshot(snapshot, live);
  assert.equal(ok.ok, true);
  assert.equal(ok.events, 2);

  // Tampered snapshot row content.
  const tampered = archiveSnapshotJsonl(live).replace('xdr-e1', 'xdr-HACKED');
  const bad = verifyArchiveSnapshot(tampered, live);
  assert.equal(bad.ok, false);
  assert.ok(bad.mismatches.some((m) => m.includes('hash does not match')));

  // Live store ahead of the snapshot (restore incomplete).
  const short = verifyArchiveSnapshot(archiveSnapshotJsonl([live[0]]), live);
  assert.equal(short.ok, false);
  assert.ok(short.mismatches.some((m) => m.includes('missing from the snapshot')));

  // Snapshot row absent from live (restore dropped it).
  const dropped = verifyArchiveSnapshot(snapshot, [live[1]]);
  assert.equal(dropped.ok, false);
  assert.ok(dropped.mismatches.some((m) => m.includes('missing from the live archive')));
});

test('archiveEventHash is stable and content-sensitive', () => {
  const a = {
    ...ev('e1', 5),
    eventId: 'e1',
    campaignId: 'qa',
    contractId: CONTRACT,
    ledger: 5,
    ledgerClosedAt: 't',
    pagingToken: null,
    topics: ['t1'],
    value: 'v',
    parsedKind: 'contributed',
    parsedContributor: null,
    archivedAt: 'x',
    archiveVersion: 1,
  };
  const b = { ...a, value: 'v2' };
  assert.equal(archiveEventHash(a), archiveEventHash({ ...a }));
  assert.notEqual(archiveEventHash(a), archiveEventHash(b));
  assert.equal(archiveEventHash({ ...a, archivedAt: 'different' }), archiveEventHash(a)); // archive time is not content
});

test('isolated restore reconstructs a fresh store from the snapshot and passes verification', async () => {
  const source = newStore();
  const c = client([ev('e1', 5), ev('e2', 6), ev('e3', 7, 'refunded')], 10);
  await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store: source });
  const snapshot = archiveSnapshotJsonl(await source.list());

  const restored = newStore();
  const r = await restoreArchiveSnapshot(snapshot, restored);
  assert.equal(r.restored, 3);
  assert.equal(r.refused, 0);
  const proof = verifyArchiveSnapshot(snapshot, await restored.list());
  assert.equal(proof.ok, true, JSON.stringify(proof));

  // Corrupt one row: refused, the rest still restore, verification shows
  // exactly the missing row.
  const corrupted = snapshot.replace('xdr-e2', 'xdr-HACKED');
  const partial = newStore();
  const r2 = await restoreArchiveSnapshot(corrupted, partial);
  assert.equal(r2.restored, 2);
  assert.equal(r2.refused, 1);
  assert.equal(r2.errors.length, 1);
  const proof2 = verifyArchiveSnapshot(snapshot, await partial.list());
  assert.equal(proof2.ok, false);
  assert.ok(proof2.mismatches.some((m) => m.includes('e2')));
});

test('truncated snapshot is detected by the header count check', () => {
  const events = [
    {
      eventId: 'e1',
      campaignId: 'qa',
      contractId: CONTRACT,
      ledger: 5,
      ledgerClosedAt: 't',
      pagingToken: null,
      topics: ['t'],
      value: 'v1',
      parsedKind: 'contributed',
      parsedContributor: null,
      archivedAt: 'x',
      archiveVersion: 1,
    },
    {
      eventId: 'e2',
      campaignId: 'qa',
      contractId: CONTRACT,
      ledger: 6,
      ledgerClosedAt: 't',
      pagingToken: null,
      topics: ['t'],
      value: 'v2',
      parsedKind: 'contributed',
      parsedContributor: null,
      archivedAt: 'x',
      archiveVersion: 1,
    },
  ];
  const full = archiveSnapshotJsonl(events);
  const truncated = full.split('\n').slice(0, 2).join('\n') + '\n';
  const v = verifyArchiveSnapshot(truncated, events);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => e.includes('header claims')));
});

test('restore refuses a snapshot without a valid integrity header', async () => {
  const store = newStore();
  const c = client([ev('e1', 5), ev('e2', 6)], 10);
  await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  const live = await store.list();
  const headerless = archiveSnapshotJsonl(live).split('\n').slice(1).join('\n');

  const target = newStore();
  const r = await restoreArchiveSnapshot(headerless, target);
  assert.equal(r.restored, 0);
  assert.ok(r.errors.some((e) => e.includes('header')));
  assert.equal(await target.count(), 0);
});

test('verify rejects a snapshot whose first line is an event, not a header', async () => {
  const store = newStore();
  const c = client([ev('e1', 5), ev('e2', 6)], 10);
  await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  const live = await store.list();
  const headerless = archiveSnapshotJsonl(live).split('\n').slice(1).join('\n');
  // Restoring the headerless file would lose the first event; verification
  // against the remainder would pass. The header check fails closed first.
  const v = verifyArchiveSnapshot(headerless, live.slice(1));
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => e.includes('header')));
});

test('file store serializes concurrent mutations without losing events', async () => {
  const store = newStore();
  const c = client(Array.from({ length: 40 }, (_, i) => ev(`e${i}`, 5 + i)), 100);
  await archiveCampaignEvents({ client: c, campaignId: 'qa', contractId: CONTRACT, store });
  const live = await store.list();
  const target = newStore();
  // Eight concurrent single-event puts plus interleaved checkpoint writes:
  // without serialization each put reads the same base doc and the last
  // rename wins, silently dropping the others.
  await Promise.all(
    live.map((e, i) =>
      i % 5 === 4
        ? Promise.all([target.put([e]), target.writeCheckpoint('qa', { version: ARCHIVE_VERSION, processedThroughLedger: e.ledger })]).then(() => undefined)
        : target.put([e]),
    ),
  );
  assert.equal(await target.count(), 40);
  assert.ok(await target.readCheckpoint('qa'));
});

test('postgres store retries a failed init instead of caching the rejection', async () => {
  let fail = true;
  const pool = {
    async query() {
      if (fail) throw new Error('db unreachable');
      return { rows: [{ n: 0 }], rowCount: 0 };
    },
  };
  const store = new PostgresEventArchiveStore(pool as never);
  await assert.rejects(() => store.count(), /db unreachable/);
  fail = false;
  // Second call must retry the init, not reuse the rejected promise.
  assert.equal(await store.count(), 0);
});
