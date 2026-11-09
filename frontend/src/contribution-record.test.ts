import { describe, expect, it } from 'vitest';
import { contributionRecord, type ContributionActivity } from './contribution-record';
const actor = 'G' + 'A'.repeat(55);
const now = '2026-11-09T16:00:00.000Z';
const sample = (): ContributionActivity => ({
  hash: 'a'.repeat(64),
  campaign: 'staging-load',
  action: 'contribute',
  status: 'SUCCESS',
  amount: '0.1000001',
  createdAt: '2026-11-04T07:12:18.000Z',
  updatedAt: null,
});
const record = (row = sample(), a = actor, n: unknown = 'testnet', p: unknown = false) => contributionRecord(row, a, n, p, now);
describe('testnet contribution journal export', () => {
  it('preserves exact decimal text, provenance and honest timestamps', () => {
    const row = sample(),
      r = record(row)!;
    expect(r.recordedAmount).toBe('0.1000001');
    expect(r.recordedCreatedAt).toBe(row.createdAt);
    expect(r.exportedAt).toBe(now);
    expect(r.source).toBe('platform-journal');
    expect(r.limitations.join(' ')).toMatch(/not independently/i);
    expect(r.limitations.join(' ')).toMatch(/latest 50/);
    expect(r.limitations.join(' ')).toMatch(/Not a legal receipt/);
    expect(row).toEqual(sample());
  });
  for (const status of ['PENDING', 'UNKNOWN', 'FAILED', 'NOT_FOUND', 'BUILT', 'SIGNED'])
    it('never exports ' + status, () => expect(record({ ...sample(), status })).toBeNull());
  for (const action of ['refund', 'withdraw', 'create', '']) it('never relabels ' + action, () => expect(record({ ...sample(), action })).toBeNull());
  for (const amount of [null, 'UNKNOWN'])
    it('preserves unknown amount ' + amount, () => {
      const r = record({ ...sample(), amount })!;
      expect(r.recordedAmount).toBe(amount);
      expect(r.amountBasis).toMatch(/not independently/);
    });
  for (const amount of ['-1', '0', '0.0000000', '1e2', '1.00000001', 'NaN', 'Infinity', '', '170141183460469231731687303715884.105728'])
    it('rejects invalid amount ' + amount, () => expect(record({ ...sample(), amount })).toBeNull());
  it('preserves high precision without Number rounding', () =>
    expect(record({ ...sample(), amount: '9007199254740993.1234567' })?.recordedAmount).toBe('9007199254740993.1234567'));
  it('requires explicit testnet and not production eligible', () => {
    expect(record(sample(), actor, 'public')).toBeNull();
    expect(contributionRecord(sample(), actor, undefined, false, now)).toBeNull();
    expect(record(sample(), actor, 'testnet', true)).toBeNull();
    expect(contributionRecord(sample(), actor, 'testnet', undefined, now)).toBeNull();
  });
  it('rejects missing, invalid and injected identities', () => {
    expect(record(sample(), '')).toBeNull();
    expect(record({ ...sample(), hash: 'bad' })).toBeNull();
    expect(record({ ...sample(), campaign: '../../x' })).toBeNull();
  });
  it('rejects malformed timestamps but never invents missing timestamps', () => {
    expect(record({ ...sample(), createdAt: 'yesterday' })).toBeNull();
    expect(record({ ...sample(), createdAt: '2026-02-31T00:00:00.000Z' })).toBeNull();
    expect(record({ ...sample(), createdAt: null })?.recordedCreatedAt).toBeNull();
  });
  it('contains no secret/envelope material from overwide input', () => {
    const row = { ...sample(), signedXdr: 'PRIVATE', secret: 'PRIVATE', token: 'PRIVATE' };
    expect(JSON.stringify(record(row))).not.toContain('PRIVATE');
  });
  it('does not alter actor or silently imply asset issuer/ledger proof', () => {
    const r = record()!;
    expect(r.actor).toBe(actor);
    expect(r.amountUnit).toMatch(/issuer is not provided/);
    expect(r).not.toHaveProperty('ledger');
    expect(r).not.toHaveProperty('confirmed');
  });
  it('fails closed for null row', () => expect(record(null as unknown as ContributionActivity)).toBeNull());
});
