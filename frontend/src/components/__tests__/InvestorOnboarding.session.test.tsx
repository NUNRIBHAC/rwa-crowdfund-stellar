import { StrictMode } from 'react';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import InvestorOnboarding from '../InvestorOnboarding';
import { I18nProvider } from '../../i18n';
const mock = vi.hoisted(() => ({ auth: { account: { publicKey: 'A' } as { publicKey: string } | null, token: 'token-a' }, read: vi.fn(), save: vi.fn() }));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => mock.auth }));
vi.mock('../../community/api', () => ({ fetchDemoOnboarding: mock.read, saveDemoOnboarding: mock.save }));
const saved = (identity = 'not_started', eligibility = 'demo_incomplete') => ({
  progress: { identity, risksAcknowledged: false, updatedAt: 1 },
  assessmentCurrent: false,
  warningReady: false,
  eligibility,
  demo: true,
  realInvestmentEligible: false,
  realIdentityVerified: false,
});
const view = () => (
  <I18nProvider>
    <InvestorOnboarding />
  </I18nProvider>
);
beforeEach(() => {
  mock.auth = { account: { publicKey: 'A' }, token: 'token-a' };
  mock.read.mockReset();
  mock.save.mockReset();
});
afterEach(cleanup);
test('loading is visible and failed initial load can be retried without a write', async () => {
  mock.read.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(saved());
  render(view());
  expect(screen.getByRole('status').textContent).toContain('Loading');
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh saved progress' }));
  await screen.findByRole('combobox');
  expect(mock.read).toHaveBeenCalledTimes(2);
  expect(mock.save).not.toHaveBeenCalled();
});
test('refresh reads saved assessment changes rather than rewriting progress', async () => {
  mock.read.mockResolvedValueOnce(saved()).mockResolvedValueOnce({ ...saved('passed', 'demo_ready'), assessmentCurrent: true, warningReady: true });
  render(view());
  await screen.findByRole('combobox');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh saved progress' }));
  await screen.findByText('Demo steps complete. Real investment remains unavailable.');
  expect(mock.save).not.toHaveBeenCalled();
});
test('late old account read cannot populate a newly signed-in account', async () => {
  let resolveA!: (value: unknown) => void;
  mock.read
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveA = resolve;
        }),
    )
    .mockResolvedValueOnce(saved('rejected', 'demo_blocked'));
  const page = render(view());
  mock.auth = { account: { publicKey: 'B' }, token: 'token-b' };
  page.rerender(view());
  await screen.findByText('Demo blocked by the chosen identity scenario.');
  await act(async () => {
    resolveA(saved('passed', 'demo_ready'));
  });
  expect(screen.queryByText('Demo steps complete. Real investment remains unavailable.')).toBeNull();
  expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('rejected');
});
test('late save cannot expose previous account progress after account switch', async () => {
  let resolveSave!: (value: unknown) => void;
  mock.read.mockResolvedValueOnce(saved()).mockResolvedValueOnce(saved('pending'));
  mock.save.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
  );
  const page = render(view());
  await screen.findByRole('combobox');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'passed' } });
  mock.auth = { account: { publicKey: 'B' }, token: 'token-b' };
  page.rerender(view());
  await waitFor(() => expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('pending'));
  await act(async () => {
    resolveSave(saved('passed', 'demo_ready'));
  });
  expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('pending');
});
test('sign-out clears progress even while a request remains pending', async () => {
  let resolveA!: (value: unknown) => void;
  mock.read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveA = resolve;
      }),
  );
  const page = render(view());
  mock.auth = { account: null, token: '' };
  page.rerender(view());
  await act(async () => {
    resolveA(saved('passed', 'demo_ready'));
  });
  expect(screen.getByText('Sign in to save your demo progress.')).toBeTruthy();
  expect(screen.queryByRole('combobox')).toBeNull();
});
test('failed save retains confirmed progress and reports failure', async () => {
  mock.read.mockResolvedValue(saved());
  mock.save.mockRejectedValue(new Error('save failed'));
  render(view());
  await screen.findByRole('combobox');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'passed' } });
  await screen.findByText('save failed');
  expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('not_started');
});

test('StrictMode effect replay ignores the cancelled first read', async () => {
  let resolveFirst!: (value: unknown) => void;
  mock.read
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    )
    .mockResolvedValueOnce(saved('rejected', 'demo_blocked'));
  render(<StrictMode>{view()}</StrictMode>);
  await screen.findByText('Demo blocked by the chosen identity scenario.');
  await act(async () => {
    resolveFirst(saved('passed', 'demo_ready'));
  });
  expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('rejected');
});

test('refresh and progress controls stay disabled while saving', async () => {
  let resolveSave!: (value: unknown) => void;
  mock.read.mockResolvedValue(saved());
  mock.save.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
  );
  render(view());
  await screen.findByRole('combobox');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'passed' } });
  expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true);
  expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByRole('button', { name: 'Refresh saved progress' }) as HTMLButtonElement).disabled).toBe(true);
  expect(mock.read).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolveSave(saved('passed'));
  });
  expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(false);
});
