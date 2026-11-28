import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import TrustEvidencePanel, { type TrustEvidenceCopy } from './TrustEvidencePanel';
import { trustCriteria } from '../trust-evidence';
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('../api', () => ({ api: mocks.api }));
afterEach(() => {
  cleanup();
  mocks.api.mockReset();
});
const copy: TrustEvidenceCopy = {
  title: 'Fixture title',
  notice: 'Fixture notice',
  loading: 'Fixture loading',
  unavailable: 'Fixture unavailable',
  missing: 'Fixture missing',
  criteria: Object.fromEntries(trustCriteria.map((k) => [k, `Fixture ${k}`])) as TrustEvidenceCopy['criteria'],
};
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
test('renders exactly sixteen missing evidence rows using provided labels', async () => {
  mocks.api.mockResolvedValue(fixture());
  render(<TrustEvidencePanel copy={copy} />);
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(16));
  expect(screen.getAllByText(copy.missing)).toHaveLength(16);
  for (const k of trustCriteria) expect(screen.getByRole('heading', { name: copy.criteria[k] })).toBeTruthy();
  expect(mocks.api).toHaveBeenCalledTimes(1);
  expect(mocks.api).toHaveBeenCalledWith('/api/transparency/evidence');
});
test('loading state does not claim missing or completed evidence', () => {
  mocks.api.mockReturnValue(new Promise(() => {}));
  render(<TrustEvidencePanel copy={copy} />);
  expect(screen.getByRole('status').textContent).toBe(copy.loading);
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
});
test('API failure displays translated generic error without raw diagnostics', async () => {
  mocks.api.mockRejectedValue(new Error('PRIVATE_PROVIDER_DETAIL'));
  render(<TrustEvidencePanel copy={copy} />);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(copy.unavailable));
  expect(screen.queryByText(/PRIVATE_PROVIDER_DETAIL/)).toBeNull();
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
});
test('optimistic malformed response fails closed, never displayed as verified', async () => {
  mocks.api.mockResolvedValue({ ...fixture(), evidenceComplete: true });
  render(<TrustEvidencePanel copy={copy} />);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(copy.unavailable));
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
});
