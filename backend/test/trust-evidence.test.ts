import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyTrustEvidence, validateTrustEvidence, portfolioConcentration } from '../src/trust-evidence.js';
test('all sixteen start explicitly missing, never complete', () => {
  const rows = emptyTrustEvidence('operator testnet prototype');
  assert.equal(rows.length, 16);
  assert(rows.every((r) => r.state === 'not_provided'));
  assert.equal(validateTrustEvidence(rows, '2026-11-27').length, 16);
});
test('missing and duplicate criterion rejected', () => {
  const r = emptyTrustEvidence('x');
  r[0] = r[1];
  assert.throws(() => validateTrustEvidence(r, '2026-11-27'));
  assert.throws(() => validateTrustEvidence(r.slice(1), '2026-11-27'));
});
test('URL alone does not document a criterion', () => {
  const r = emptyTrustEvidence('x');
  r[0].state = 'documented';
  r[0].sourceUrls = ['https://example.org'];
  assert.throws(() => validateTrustEvidence(r, '2026-11-27'));
});
test('metric needs dated population period and methodology', () => {
  const r = emptyTrustEvidence('x');
  const x = r.find((v) => v.criterion === 'community_size')!;
  Object.assign(x, { state: 'documented', asOf: '2026-11-27', sourceUrls: ['https://example.org'] });
  assert.throws(() => validateTrustEvidence(r, '2026-11-27'));
  Object.assign(x, {
    population: 'unique active verified test accounts, not investors',
    methodology: 'count once by stable account ID',
    period: { from: '2026-11-01', to: '2026-11-27' },
  });
  assert.equal(validateTrustEvidence(r, '2026-11-27').length, 16);
});
test('not applicable needs evidence, not inferred missingness', () => {
  const r = emptyTrustEvidence('x');
  r[0].state = 'not_applicable';
  assert.throws(() => validateTrustEvidence(r, '2026-11-27'));
});
test('simulation requires an explicit reason', () => {
  const r = emptyTrustEvidence('x');
  r[0].state = 'simulation';
  assert.throws(() => validateTrustEvidence(r, '2026-11-27'));
  r[0].reason = 'synthetic fixture, not a real operator';
  validateTrustEvidence(r, '2026-11-27');
});
test('future and invalid calendar dates rejected', () => {
  for (const d of ['2026-02-30', '2027-01-01']) {
    const r = emptyTrustEvidence('x');
    r[0].asOf = d;
    assert.throws(() => validateTrustEvidence(r, '2026-11-27'));
  }
});
test('empty portfolio is unavailable, not zero concentration', () => assert.equal(portfolioConcentration([]).state, 'unavailable'));
test('offering and issuer concentration use exact positive minor units', () => {
  const r = portfolioConcentration([
    { offeringId: 'a', issuerId: 'i', currency: 'EUR', amount: 1n },
    { offeringId: 'b', issuerId: 'i', currency: 'EUR', amount: 2n },
    { offeringId: 'c', issuerId: 'j', currency: 'EUR', amount: 3n },
  ]);
  assert.equal(r.state, 'calculated');
  if (r.state === 'calculated') {
    assert.equal(r.total, 6n);
    assert.equal(r.offerings[0].basisPoints, 1666n);
    assert.equal(r.issuers[0].basisPoints, 5000n);
  }
});
test('mixed currency, duplicate offers, negative and zero positions rejected', () => {
  const a = { offeringId: 'a', issuerId: 'i', currency: 'EUR', amount: 1n };
  for (const b of [{ ...a }, { ...a, offeringId: 'b', currency: 'USD' }, { ...a, offeringId: 'b', amount: 0n }, { ...a, offeringId: 'b', amount: -1n }])
    assert.throws(() => portfolioConcentration([a, b]));
});
