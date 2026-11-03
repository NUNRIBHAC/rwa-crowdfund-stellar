import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import InvestorOnboarding from '../InvestorOnboarding';
import { I18nProvider } from '../../i18n';
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => ({ account: { publicKey: 'G' }, token: 'owner-token' }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test('saved account progress updates without asserting real identity or investment eligibility', async () => {
  const calls: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      calls.push(init);
      return {
        ok: true,
        json: async () => ({
          progress: { identity: init?.method === 'PUT' ? 'passed' : 'not_started', risksAcknowledged: false, updatedAt: 1 },
          assessmentSaved: false,
          assessmentCurrent: false,
          warningReady: false,
          eligibility: 'demo_incomplete',
          demo: true,
          realInvestmentEligible: false,
          realIdentityVerified: false,
        }),
      };
    }),
  );
  render(
    <I18nProvider>
      <InvestorOnboarding />
    </I18nProvider>,
  );
  await screen.findByText('Demo incomplete: complete the steps below.');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'passed' } });
  await waitFor(() => expect(calls.length).toBe(2));
  expect(screen.getByText(/not a real identity check/)).toBeTruthy();
  expect(screen.getByText(/Assessment, simulation or warning step missing/)).toBeTruthy();
});
