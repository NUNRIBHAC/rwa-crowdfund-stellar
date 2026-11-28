import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import About from './About';
import { trustCriteria } from '../trust-evidence';
import { en } from '../i18n/locales/en';
import type { Locale } from '../i18n';
import { trustEvidenceTestCopy } from '../trust-evidence-test-copy';
const state = vi.hoisted(() => ({ locale: 'en', api: vi.fn() }));
vi.mock('../api', () => ({ api: state.api }));
vi.mock('../i18n', () => ({ useI18n: () => ({ locale: state.locale, m: { ...en, trustEvidence: trustEvidenceTestCopy[state.locale as Locale] } }) }));
afterEach(() => {
  cleanup();
  state.api.mockReset();
});
const payload = () => ({
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
for (const locale of Object.keys(trustEvidenceTestCopy) as Locale[])
  test(`About mounts all sixteen translated evidence rows in ${locale}`, async () => {
    state.locale = locale;
    state.api.mockResolvedValue(payload());
    render(<About />);
    const copy = trustEvidenceTestCopy[locale];
    await waitFor(() => expect(screen.getAllByText(copy.missing)).toHaveLength(16));
    expect(screen.getByRole('heading', { name: copy.title })).toBeTruthy();
    for (const criterion of trustCriteria) expect(screen.getByRole('heading', { name: copy.criteria[criterion] })).toBeTruthy();
  });
test('locale switch updates mounted evidence copy without refetching or cross-locale fallback', async () => {
  state.locale = 'en';
  state.api.mockResolvedValue(payload());
  const view = render(<About />);
  await waitFor(() => expect(screen.getAllByText(trustEvidenceTestCopy.en.missing)).toHaveLength(16));
  state.locale = 'ar';
  view.rerender(<About />);
  expect(screen.getAllByText(trustEvidenceTestCopy.ar.missing)).toHaveLength(16);
  expect(screen.queryByText(trustEvidenceTestCopy.en.title)).toBeNull();
  expect(state.api).toHaveBeenCalledTimes(1);
});
