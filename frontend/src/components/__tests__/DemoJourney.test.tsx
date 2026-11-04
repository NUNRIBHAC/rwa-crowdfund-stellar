import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import DemoJourney from '../DemoJourney';
import { I18nProvider } from '../../i18n';
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => ({ account: { publicKey: 'synthetic' }, token: 'owner-token' }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const actions = ['submit_application', 'attach_document', 'review', 'approve', 'create_campaign', 'complete_onboarding', 'contribute'];
test('connected simulation persists matching receipt IDs and never calls real workflow endpoints', async () => {
  const completed: string[] = [];
  const urls: string[] = [];
  const receipt = {
    id: 'simulation:fixture:contribution',
    campaignId: 'simulation:fixture:campaign',
    amount: '10',
    unit: 'SIMULATED_UNITS',
    status: 'SIMULATED',
    transactionHash: null,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, init) => {
      urls.push(url);
      if (init?.method === 'POST') {
        const { action } = JSON.parse(init.body);
        expect(action).toBe(actions[completed.length]);
        completed.push(action);
      }
      return {
        ok: true,
        json: async () => ({
          completed,
          nextAction: actions[completed.length] ?? null,
          applicationId: completed.length ? 'simulation:fixture:application' : null,
          campaignId: completed.length >= 5 ? receipt.campaignId : null,
          document: null,
          business: { contribution: completed.length === 7 ? receipt : null },
          investor: { contribution: completed.length === 7 ? receipt : null },
        }),
      };
    }),
  );
  const first = render(
    <I18nProvider>
      <DemoJourney />
    </I18nProvider>,
  );
  for (const name of [
    'Submit synthetic application',
    'Attach synthetic project document',
    'Simulate document review',
    'Simulate application approval',
    'Create simulated campaign',
    'Complete simulated investor checks',
    'Record simulated contribution',
  ]) {
    const button = await screen.findByRole('button', { name });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button);
  }
  await screen.findByText(/Simulation complete/);
  expect(screen.getAllByText(receipt.id)).toHaveLength(2);
  expect(screen.getAllByText('10 simulated units')).toHaveLength(2);
  expect(urls.every((u) => u === '/api/auth/demo-journey')).toBe(true);
  first.unmount();
  render(
    <I18nProvider>
      <DemoJourney />
    </I18nProvider>,
  );
  await screen.findByText(/Simulation complete/);
  expect(screen.getAllByText(receipt.id)).toHaveLength(2);
  expect(screen.getByText(/No real application/)).toBeTruthy();
});
