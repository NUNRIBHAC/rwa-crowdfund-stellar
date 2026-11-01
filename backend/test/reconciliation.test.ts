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
  // Journal amounts are human-USDC decimals; the contract counter is
  // 7-decimal base units. 100 USDC + 200 USDC = 3000000000 base units.
  const r = reconcileCampaigns(
    [{ id: 'c1', raised: '3000000050' }],
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
  assert.equal(c.journalCovered, '3000000000');
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
  const r = reconcileCampaigns([{ id: 'c1', raised: '1000000000' }], [intent({ amount: '100' })], 0);
  assert.equal(r.campaigns[0].notJournalCovered, '0');
  assert.equal(r.campaigns[0].notes.length, 0);
});

test('decimal amounts convert to base units instead of being dropped as unparseable', () => {
  const r = reconcileCampaigns([{ id: 'c1', raised: '7500000' }], [intent({ amount: '0.5' }), intent({ hash: 'b'.repeat(64), amount: '0.25' })], 0);
  const c = r.campaigns[0];
  assert.equal(c.journalCovered, '7500000');
  assert.equal(c.notJournalCovered, '0');
  assert.equal(c.notes.length, 0);
});

test('malformed or out-of-range amounts are excluded with an explicit per-intent note', () => {
  const r = reconcileCampaigns(
    [{ id: 'c1', raised: '1000000000' }],
    [intent({ amount: '100' }), intent({ hash: 'b'.repeat(64), amount: 'abc' }), intent({ hash: 'c'.repeat(64), amount: '0' })],
    0,
  );
  const c = r.campaigns[0];
  assert.equal(c.journalCovered, '1000000000');
  assert.equal(c.notJournalCovered, '0');
  assert.equal(c.successContributes, 3);
  assert.ok(c.notes.some((n) => n.includes('b'.repeat(64)) && n.includes('malformed or out-of-range')));
  assert.ok(c.notes.some((n) => n.includes('c'.repeat(64)) && n.includes('malformed or out-of-range')));
  assert.ok(!c.notes.some((n) => n.includes('unparseable')));
});

test('negative difference is labeled as cross-deployment history, not an alarm', () => {
  const r = reconcileCampaigns([{ id: 'c1', raised: '50' }], [intent({ amount: '100' })], 0);
  assert.equal(r.campaigns[0].notJournalCovered, '-999999950');
  assert.ok(r.campaigns[0].notes.some((n) => n.includes('different deployment or registry history')));
});

test('unavailable on-chain read is noted, not guessed', () => {
  const r = reconcileCampaigns([{ id: 'c1', raised: null }], [intent({ amount: '100' })], 0);
  assert.equal(r.campaigns[0].notJournalCovered, null);
  assert.ok(r.campaigns[0].notes.some((n) => n.includes('unavailable')));
});

test('SUCCESS contributes without an amount field are counted, excluded from the sum and disclosed', () => {
  const r = reconcileCampaigns(
    [{ id: 'c1', raised: '1000000300' }],
    [intent({ amount: '100' }), intent({ hash: 'b'.repeat(64), amount: undefined }), intent({ hash: 'c'.repeat(64), amount: undefined })],
    0,
  );
  const c = r.campaigns[0];
  assert.equal(c.successContributes, 3);
  assert.equal(c.journalCovered, '1000000000');
  assert.ok(c.notes.some((n) => n.includes('no amount field')));
});

test('intents from other campaigns do not leak into a campaign row', () => {
  const r = reconcileCampaigns(
    [
      { id: 'c1', raised: '100' },
      { id: 'c2', raised: '500' },
    ],
    [intent({ amount: '100' }), intent({ campaign: 'c2', hash: 'b'.repeat(64), amount: '500' })],
    0,
  );
  assert.equal(r.campaigns[0].journalCovered, '1000000000');
  assert.equal(r.campaigns[1].journalCovered, '5000000000');
});
