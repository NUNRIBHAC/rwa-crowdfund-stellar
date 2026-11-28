import { expect, test } from 'vitest';
import { parseMissingTrustEvidence, trustCriteria } from './trust-evidence';
const fixture = () => ({
  schemaVersion: 1,
  asOf: '2026-11-27',
  scope: 'platform',
  productionEligible: false,
  evidenceComplete: false,
  criteria: trustCriteria.map((criterion) => ({
    criterion,
    state: 'not_provided',
    scope: 'platform',
    sourceUrls: [],
    asOf: null,
    methodology: null,
    population: null,
    period: null,
    reason: null,
  })),
});
test('all sixteen missing states survive without an optimistic completion inference', () => {
  const source = fixture();
  const value = parseMissingTrustEvidence(source, '2026-11-27');
  expect(value.criteria).toHaveLength(16);
  expect(value.evidenceComplete).toBe(false);
  expect(value).not.toBe(source);
});
test('future, malformed or impossible generation dates fail closed', () => {
  for (const asOf of ['2026-11-28', '2026-02-30', 'bad', null])
    expect(() => parseMissingTrustEvidence({ ...fixture(), asOf }, '2026-11-27')).toThrow('API_UNAVAILABLE');
});
test('incomplete, duplicated, reordered and unknown criteria fail closed', () => {
  const source = fixture();
  const cases = [
    source.criteria.slice(1),
    [...source.criteria, source.criteria[0]],
    source.criteria.map(() => source.criteria[0]),
    [...source.criteria].reverse(),
    source.criteria.map((r, i) => (i ? r : { ...r, criterion: 'unknown' })),
  ];
  for (const criteria of cases) expect(() => parseMissingTrustEvidence({ ...source, criteria }, '2026-11-27')).toThrow('API_UNAVAILABLE');
});
test('unsupported evidence, real-money flags and source claims are not rendered as verified', () => {
  for (const key of ['productionEligible', 'evidenceComplete'])
    expect(() => parseMissingTrustEvidence({ ...fixture(), [key]: true }, '2026-11-27')).toThrow('API_UNAVAILABLE');
  for (const mutation of [
    { state: 'documented' },
    { state: 'not_applicable' },
    { state: 'simulation' },
    { sourceUrls: ['https://example.org'] },
    { asOf: '2026-11-27' },
    { scope: 'licensed' },
  ]) {
    const source = fixture();
    Object.assign(source.criteria[0], mutation);
    expect(() => parseMissingTrustEvidence(source, '2026-11-27')).toThrow('API_UNAVAILABLE');
  }
});
test('null, arrays, missing version and invalid current date fail closed', () => {
  for (const input of [null, [], {}, { ...fixture(), schemaVersion: 2 }])
    expect(() => parseMissingTrustEvidence(input, '2026-11-27')).toThrow('API_UNAVAILABLE');
  expect(() => parseMissingTrustEvidence(fixture(), 'bad')).toThrow('API_UNAVAILABLE');
});
