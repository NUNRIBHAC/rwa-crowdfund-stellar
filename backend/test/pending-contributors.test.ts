import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readPending, pendContribution, clearPending, drainPendingContributors } from '../src/pending-contributors.js';
import { pruneIntents } from '../src/journal.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pending-contrib-'));
process.env.PENDING_CONTRIBUTORS_PATH = path.join(dir, 'pending.json');
const H1 = 'a'.repeat(64);
const H2 = 'b'.repeat(64);

beforeEach(() => {
  fs.rmSync(process.env.PENDING_CONTRIBUTORS_PATH!, { force: true });
});

test('pend persists durably and a fresh read (restart recovery) sees the same proofs', () => {
  pendContribution({ hash: H1, lastError: 'community store down' });
  pendContribution({ hash: H2, campaignId: 'demo-solar', contributor: 'G' + 'A'.repeat(55), lastError: 'rpc down' });
  // Simulate a process restart: no module state is consulted, the file is
  // the only source.
  const after = readPending();
  assert.equal(after.length, 2);
  assert.equal(after[0].hash, H1);
  assert.equal(after[1].campaignId, 'demo-solar');
  // Repeat deferral is an idempotent upsert preserving firstPendingAt.
  const firstAt = after[0].firstPendingAt;
  pendContribution({ hash: H1, lastError: 'still down' });
  const again = readPending();
  assert.equal(again.length, 2);
  assert.equal(again[0].firstPendingAt, firstAt);
  assert.equal(again[0].lastError, 'still down');
  clearPending(H1);
  assert.deepEqual(
    readPending().map((e) => e.hash),
    [H2],
  );
});

test('drain writes fact-complete entries without any network call and removes them on success', async () => {
  pendContribution({ hash: H1, campaignId: 'demo-solar', contributor: 'G' + 'A'.repeat(55), lastError: 'x' });
  const recorded: string[] = [];
  const res = await drainPendingContributors({
    record: async (c, a) => {
      recorded.push(`${c}:${a}`);
    },
    derive: async () => {
      throw new Error('network must not be needed for fact-complete entries');
    },
  });
  assert.equal(res.pending, 0);
  assert.equal(res.drained, 1);
  assert.deepEqual(recorded, [`demo-solar:${'G' + 'A'.repeat(55)}`]);
  assert.deepEqual(readPending(), []);
});

test('drain re-derives hash-only entries from the network (post-prune safe)', async () => {
  pendContribution({ hash: H1, lastError: 'rpc down' });
  const derived: string[] = [];
  const res = await drainPendingContributors({
    record: async () => {},
    derive: async (hash) => {
      derived.push(hash);
      return { campaignId: 'staging-load', contributor: 'G' + 'B'.repeat(55) };
    },
  });
  assert.deepEqual(derived, [H1]);
  assert.equal(res.pending, 0);
  assert.equal(res.drained, 1);
  assert.deepEqual(readPending(), []);
});

test('failed drains keep proofs queued with lastError (extended outage survival)', async () => {
  pendContribution({ hash: H1, campaignId: 'demo-solar', contributor: 'G' + 'A'.repeat(55), lastError: 'x' });
  const res = await drainPendingContributors({
    record: async () => {
      throw new Error('community store still down');
    },
    derive: async () => null,
  });
  assert.equal(res.pending, 1);
  assert.equal(res.drained, 0);
  const after = readPending();
  assert.equal(after[0].hash, H1);
  assert.match(after[0].lastError ?? '', /still down/);
});

test('journal terminal pruning would drop the row, but the pending queue preserves the proof', () => {
  // The hazard main flagged: a SUCCESS intent older than retention is pruned
  // from the journal. The pending queue entry for the same hash survives.
  const old = new Date(Date.now() - 31 * 24 * 3600 * 1000).toISOString();
  const intents = [{ hash: H1, campaign: 'demo-solar', actor: 'G' + 'A'.repeat(55), action: 'contribute', xdr: 'x', status: 'SUCCESS', updatedAt: old }];
  assert.equal(pruneIntents(intents).length, 0, 'journal prunes the terminal row after retention');
  pendContribution({ hash: H1, campaignId: 'demo-solar', contributor: 'G' + 'A'.repeat(55), lastError: 'deferred' });
  assert.equal(readPending().length, 1, 'pending queue still holds the durable proof');
});

test('drained counts successful writes, not dropped proofs or failed writes', async () => {
  for (const [hash, campaignId] of [
    ['a'.repeat(64), 'ok'],
    ['b'.repeat(64), 'fail'],
    ['c'.repeat(64), undefined],
  ])
    pendContribution({ hash, campaignId, contributor: campaignId ? 'G' + 'A'.repeat(55) : undefined });
  const result = await drainPendingContributors({
    record: async (c) => {
      if (c === 'fail') throw new Error('retry');
    },
    derive: async () => null,
  });
  assert.deepEqual(result, { drained: 1, pending: 1 });
  assert.equal(readPending()[0].campaignId, 'fail');
  assert.deepEqual(await drainPendingContributors({ record: async () => {}, derive: async () => null }), { drained: 1, pending: 0 });
  assert.deepEqual(await drainPendingContributors({ record: async () => {}, derive: async () => null }), { drained: 0, pending: 0 });
});
