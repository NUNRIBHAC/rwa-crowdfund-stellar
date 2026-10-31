import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileCampaigns, RECONCILIATION_SEMANTICS } from '../src/reconciliation.js';
import type { Intent } from '../src/journal.js';

const intent = (over: Partial<Intent>): Intent => ({
  hash: 'a'.repeat(64),
  campaign: 'c1',
  actor: 'G'.repeat(56),
  action: 'contribute',
  xdr: 'AAAA',
  status: 'SUCCESS',
  amount: '100',
  ...over,
});

test('journal-covered sums SUCCESS contributes only; remainder is off-journal volume, never a loss claim', () => {
  const r = reconcileCampaigns(
    [{ id: 'c1', raised: '350' }],
    [
      intent({ amount: '100' }),
      intent({ hash: 'b'.repeat(64), amount: '200' }),
      intent({ hash: 'c'.repeat(64), action: 'refund', amount: '50' }),
      intent({ hash: 'd'.repeat(64), action: 'withdraw', amount: undefined }),
      intent({ hash: 'e'.repeat(64), status: 'PENDING' }),
      intent({ hash: 'f'.repeat(64), status: 'FAILED' }),
    ],
    2,
  );
  assert.equal(r.quarantinedIntents, 2);
  const c = r.campaigns[0];
  assert.equal(c.journalCovered, '300');
  // Refunds and withdraws do NOT reduce the contract's cumulative counter.
  assert.equal(c.notJournalCovered, '50');
  assert.equal(c.successRefunds, 1);
  assert.equal(c.successWithdraws, 1);
  assert.deepEqual(c.openIntentHashes, ['e'.repeat(64)]);
  assert.equal(c.failedIntents, 1);
  assert.ok(c.notes.some((n) => n.includes('outside this app')));
  assert.ok(!RECONCILIATION_SEMANTICS.match(/lost|missing funds|balanced/i) || RECONCILIATION_SEMANTICS.includes('not missing funds'));
});

test('exact journal coverage reports zero not-journal-covered without verdict language', () => {
  const r = reconcileCampaigns([{ id: 'c1', raised: '100' }], [intent({ amount: '100' })], 0);
  assert.equal(r.campaigns[0].notJournalCovered, '0');
  assert.equal(r.campaigns[0].notes.length, 0);
});

test('negative difference is labeled as cross-deployment history, not an alarm', () => {
  const r = reconcileCampaigns([{ id: 'c1', raised: '50' }], [intent({ amount: '100' })], 0);
  assert.equal(r.campaigns[0].notJournalCovered, '-50');
  assert.ok(r.campaigns[0].notes.some((n) => n.includes('different deployment or registry history')));
});

test('unavailable on-chain read is noted, not guessed', () => {
  const r = reconcileCampaigns([{ id: 'c1', raised: null }], [intent({ amount: '100' })], 0);
  assert.equal(r.campaigns[0].notJournalCovered, null);
  assert.ok(r.campaigns[0].notes.some((n) => n.includes('unavailable')));
});

test('SUCCESS contributes without an amount field are counted, excluded from the sum and disclosed', () => {
  const r = reconcileCampaigns(
    [{ id: 'c1', raised: '300' }],
    [intent({ amount: '100' }), intent({ hash: 'b'.repeat(64), amount: undefined }), intent({ hash: 'c'.repeat(64), amount: undefined })],
    0,
  );
  const c = r.campaigns[0];
  assert.equal(c.successContributes, 3);
  assert.equal(c.journalCovered, '100');
  assert.ok(c.notes.some((n) => n.includes('no amount field')));
});

test('intents from other campaigns do not leak into a campaign row', () => {
  const r = reconcileCampaigns(
    [{ id: 'c1', raised: '100' }, { id: 'c2', raised: '500' }],
    [intent({ amount: '100' }), intent({ campaign: 'c2', hash: 'b'.repeat(64), amount: '500' })],
    0,
  );
  assert.equal(r.campaigns[0].journalCovered, '100');
  assert.equal(r.campaigns[1].journalCovered, '500');
});
