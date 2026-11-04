import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readPendingStrict } from '../src/pending-contributors.js';
import { walletDeletionRetention, type WalletDeletionRetentionEvidence } from '../src/deletion-retention.js';
const clear = (): WalletDeletionRetentionEvidence => ({
  journal: { intents: [] },
  pending: [],
  history: { complete: true, hasRecords: false },
  campaignCreatorKeys: [],
  coherent: true,
});
test('absence from local records cannot replace complete coherent chain-history evidence', () => {
  assert.equal(walletDeletionRetention(clear(), 'wallet'), 'clear');
  for (const evidence of [
    { ...clear(), coherent: false },
    { ...clear(), history: { complete: false, hasRecords: false } },
    { ...clear(), journal: { intents: [], quarantined: [{ reason: 'bad', possiblySigned: true }] } },
    { ...clear(), pending: [{ hash: 'a'.repeat(64), firstPendingAt: 1 }] },
  ])
    assert.equal(walletDeletionRetention(evidence, 'wallet'), 'unavailable');
});
test('journal, pending, creator and historic records block even a current zero balance', () => {
  for (const evidence of [
    { ...clear(), history: { complete: true, hasRecords: true } },
    { ...clear(), campaignCreatorKeys: ['wallet'] },
    { ...clear(), journal: { intents: [{ actor: 'wallet' } as any] } },
    { ...clear(), pending: [{ hash: 'a'.repeat(64), firstPendingAt: 1, contributor: 'wallet' }] },
  ])
    assert.equal(walletDeletionRetention(evidence, 'wallet'), 'protected');
});
test('strict pending proof reader distinguishes missing from malformed and unreadable', () => {
  const old = process.env.PENDING_CONTRIBUTORS_PATH;
  const dir = mkdtempSync(join(tmpdir(), 'strict-pending-'));
  const p = join(dir, 'pending.json');
  process.env.PENDING_CONTRIBUTORS_PATH = p;
  try {
    assert.deepEqual(readPendingStrict(), []);
    for (const raw of ['{', '{}', '[{}]', JSON.stringify([{ hash: 'a'.repeat(64), firstPendingAt: 'wrong' }])]) {
      writeFileSync(p, raw);
      assert.throws(() => readPendingStrict());
    }
    writeFileSync(p, JSON.stringify([{ hash: 'a'.repeat(64), firstPendingAt: 1 }]));
    assert.equal(readPendingStrict().length, 1);
    process.env.PENDING_CONTRIBUTORS_PATH = dir;
    assert.throws(() => readPendingStrict());
  } finally {
    if (old === undefined) delete process.env.PENDING_CONTRIBUTORS_PATH;
    else process.env.PENDING_CONTRIBUTORS_PATH = old;
  }
});
