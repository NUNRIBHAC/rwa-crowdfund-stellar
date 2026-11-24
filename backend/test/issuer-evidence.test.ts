import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVIDENCE_AREAS, issuerEvidenceFor, parseIssuerEvidence } from '../src/issuer-evidence.js';
const fixture = () => [
  {
    campaignId: 'synthetic-review-only',
    revisedOn: '2026-11-23',
    sources: [
      { id: 'issuer', title: 'Synthetic issuer statement', url: 'https://issuer.example.org/statement', publisher: 'issuer', retrievedOn: '2026-11-22' },
      {
        id: 'registry',
        title: 'Synthetic registry record',
        url: 'https://registry.example.org/record',
        publisher: 'independent',
        retrievedOn: '2026-11-22',
        publishedOn: '2026-11-21',
      },
    ],
    claims: [
      { id: 'team', area: 'team', text: 'Synthetic issuer claim, not a real person.', status: 'issuer_claim', sourceIds: ['issuer'] },
      {
        id: 'issuer-record',
        area: 'issuer',
        text: 'Synthetic reviewed fact, not a real company.',
        status: 'checked_fact',
        sourceIds: ['registry'],
        review: { checkedOn: '2026-11-23', note: 'Synthetic test review only.' },
      },
    ],
  },
];
const today = '2026-11-24';
test('keeps issuer claims separate from reviewed facts, with explicit unknowns', () => {
  const raw = JSON.stringify(fixture());
  const result = issuerEvidenceFor('synthetic-review-only', raw);
  assert.equal(result.state, 'available');
  assert.equal(result.claims[0].status, 'issuer_claim');
  assert.deepEqual(
    result.unknownAreas,
    EVIDENCE_AREAS.filter((area) => area !== 'issuer'),
  );
  assert.equal(result.revisedOn, '2026-11-23');
  assert.equal(result.sources[1].publishedOn, '2026-11-21');
});
test('no supplied record means unknown, never a verified sample dossier', () => {
  assert.equal(issuerEvidenceFor('demo-solar', '').state, 'not_provided');
  assert.deepEqual(issuerEvidenceFor('demo-solar', JSON.stringify(fixture())).unknownAreas, [...EVIDENCE_AREAS]);
});
test('malformed configuration fails closed without publishing a partial dossier or error text', () => {
  assert.equal(issuerEvidenceFor('demo-solar', '{SECRET').state, 'unavailable');
  assert.deepEqual(issuerEvidenceFor('demo-solar', '{SECRET').claims, []);
});
test('rejects dangling, duplicate and absent source references', () => {
  for (const ids of [[], ['missing'], ['issuer', 'issuer']]) {
    const data = fixture();
    data[0].claims[0].sourceIds = ids;
    assert.throws(() => parseIssuerEvidence(data, today));
  }
  const data = fixture();
  data[0].sources.push(data[0].sources[0]);
  assert.throws(() => parseIssuerEvidence(data, today));
});
test('checked facts need an independent source and an explicit dated human review', () => {
  const data = fixture();
  data[0].claims[1].sourceIds = ['issuer'];
  assert.throws(() => parseIssuerEvidence(data, today));
  const absent = fixture();
  delete (absent[0].claims[1] as { review?: unknown }).review;
  assert.throws(() => parseIssuerEvidence(absent, today));
});
test('rejects invalid or future dates, impossible source chronology and duplicate campaigns', () => {
  for (const day of ['2026-02-30', 'not-a-date', '2027-01-01']) {
    const data = fixture();
    data[0].revisedOn = day;
    assert.throws(() => parseIssuerEvidence(data, today));
  }
  const data = fixture();
  data[0].sources[0].retrievedOn = '2026-11-24';
  assert.throws(() => parseIssuerEvidence(data, today));
  assert.throws(() => parseIssuerEvidence([...fixture(), ...fixture()], today));
});
test('rejects credential-bearing, signed, private-looking and non-HTTPS source URLs', () => {
  for (const url of [
    'http://example.org/file',
    'https://user:password@example.org/file',
    'https://example.org/file?token=private',
    'https://localhost/file',
    'https://127.0.0.1/file',
    'https://internal.local/file',
    'javascript:alert(1)',
  ]) {
    const data = fixture();
    data[0].sources[0].url = url;
    assert.throws(() => parseIssuerEvidence(data, today), url);
  }
});
test('rejects arbitrary fields, reviewer identity and scoring or advice payloads', () => {
  const data = fixture();
  (data[0] as unknown as Record<string, unknown>).riskScore = 90;
  assert.throws(() => parseIssuerEvidence(data, today));
});

test('review cannot predate the source retrieval it claims to have checked', () => {
  const data = fixture();
  data[0].claims[1].review!.checkedOn = '2026-11-21';
  assert.throws(() => parseIssuerEvidence(data, today));
});
