import { afterEach, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import IssuerEvidence, { type EvidenceCopy, type EvidenceDossier } from './IssuerEvidence';
afterEach(cleanup);
const copy: EvidenceCopy = {
  title: 'Dossier',
  note: 'Review assertions are not a guarantee.',
  loading: 'Loading',
  notProvided: 'Not provided',
  unavailable: 'Unavailable',
  revisedOn: 'Revised',
  issuerClaim: 'Issuer claim',
  checkedFact: 'Reviewed fact',
  corrected: 'Correction pending review',
  unknown: 'Unknown areas',
  sources: 'Sources',
  issuerSource: 'Issuer source',
  independentSource: 'Independent source',
  retrievedOn: 'Retrieved',
  publishedOn: 'Published',
  reviewedOn: 'Reviewed',
  corrections: 'Corrections',
  areas: {
    issuer: 'Issuer',
    team: 'Team',
    track_record: 'Track record',
    financials: 'Financials',
    offer_documents: 'Offer documents',
    milestones: 'Milestones',
  },
};
const evidence: EvidenceDossier = {
  campaignId: 'synthetic',
  state: 'available',
  revisedOn: '2026-11-25',
  sources: [{ id: 's', title: 'Registry', url: 'https://registry.example.org/record', publisher: 'independent', retrievedOn: '2026-11-24' }],
  claims: [
    {
      id: 'c',
      area: 'issuer',
      text: 'Synthetic assertion',
      status: 'checked_fact',
      sourceIds: ['s'],
      review: { checkedOn: '2026-11-24', note: 'Review assertion only' },
    },
  ],
  corrections: [],
  unknownAreas: ['team'],
};
test('renders claim status, source provenance, dates and unknowns without write controls', () => {
  const { container, getByText } = render(<IssuerEvidence evidence={evidence} copy={copy} />);
  expect(getByText('Reviewed fact')).toBeTruthy();
  expect(getByText('Synthetic assertion')).toBeTruthy();
  expect(getByText('Unknown areas')).toBeTruthy();
  expect(container.querySelector('a')?.getAttribute('rel')).toContain('noopener');
  expect(container.querySelectorAll('button,input,form')).toHaveLength(0);
});
test('corrections supersede the reviewed badge and retain original source history', () => {
  const { getByText, queryByText } = render(
    <IssuerEvidence
      evidence={{ ...evidence, corrections: [{ id: 'fix', claimId: 'c', correctedOn: '2026-11-25', note: 'Review withdrawn', sourceIds: ['s'] }] }}
      copy={copy}
    />,
  );
  expect(getByText('Correction pending review')).toBeTruthy();
  expect(queryByText('Reviewed fact')).toBeNull();
  expect(getByText(/Review withdrawn/)).toBeTruthy();
});
test('unavailable and loading never become a false empty or checked dossier', () => {
  const view = render(<IssuerEvidence evidence={null} copy={copy} loading />);
  expect(view.getByRole('status').textContent).toBe('Loading');
  view.rerender(<IssuerEvidence evidence={null} copy={copy} />);
  expect(view.getByRole('status').textContent).toBe('Unavailable');
  expect(view.queryByText('Reviewed fact')).toBeNull();
});
test('unprovided source is explicit and unsafe links are never rendered', () => {
  const view = render(<IssuerEvidence evidence={{ ...evidence, state: 'not_provided', claims: [], sources: [] }} copy={copy} />);
  expect(view.getByText('Not provided')).toBeTruthy();
  view.rerender(<IssuerEvidence evidence={{ ...evidence, sources: [{ ...evidence.sources[0], url: 'javascript:alert(1)' }] }} copy={copy} />);
  expect(view.container.querySelector('a')).toBeNull();
});
