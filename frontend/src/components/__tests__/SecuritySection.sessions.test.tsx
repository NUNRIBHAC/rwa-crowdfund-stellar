import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import SecuritySection from '../SecuritySection';
const mocks = vi.hoisted(() => ({
  auth: { account: { publicKey: 'GQA_A', authMethod: 'wallet' }, token: 'session-a', socialProviders: [] },
  sessions: vi.fn(),
}));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => mocks.auth, describeError: (e: Error) => e.message }));
vi.mock('../AccountDeletionSection', () => ({ default: () => null }));
vi.mock('../../community/api', () => ({
  fetchSessions: mocks.sessions,
  socialLinkProofProviders: vi.fn(),
  startSocialLink: vi.fn(),
  startSocialLinkProof: vi.fn(),
  disableTotp: vi.fn(),
  enableTotp: vi.fn(),
  enrollTotp: vi.fn(),
  logoutOtherSessions: vi.fn(),
  requestChallenge: vi.fn(),
  revokeSession: vi.fn(),
}));
function pending() {
  let resolve!: (value: { sessions: object[] }) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{ sessions: object[] }>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const view = () => (
  <I18nProvider>
    <SecuritySection />
  </I18nProvider>
);
const row = (id: string) => ({ id, current: true, createdAt: 1, expiresAt: 2 });
beforeEach(() => {
  mocks.auth.account = { publicKey: 'GQA_A', authMethod: 'wallet' };
  mocks.auth.token = 'session-a';
  mocks.sessions.mockReset();
});
afterEach(cleanup);
it('does not claim an empty list before the response, then shows populated sessions', async () => {
  const request = pending();
  mocks.sessions.mockReturnValue(request.promise);
  render(view());
  expect(screen.getByRole('status').textContent).toContain('Loading');
  expect(screen.queryByText('No active sessions.')).toBeNull();
  await act(async () => request.resolve({ sessions: [row('current-a')] }));
  expect(await screen.findByText('current-a')).toBeTruthy();
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.queryByText('No active sessions.')).toBeNull();
});
it('shows empty only after a successful empty response', async () => {
  const request = pending();
  mocks.sessions.mockReturnValue(request.promise);
  render(view());
  expect(screen.queryByText('No active sessions.')).toBeNull();
  await act(async () => request.resolve({ sessions: [] }));
  expect(await screen.findByText('No active sessions.')).toBeTruthy();
  expect(screen.queryByRole('status')).toBeNull();
});
it('shows the load error without claiming that the list is empty', async () => {
  const request = pending();
  mocks.sessions.mockReturnValue(request.promise);
  render(view());
  await act(async () => request.reject(new Error('Unable to load sessions')));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Unable to load sessions');
  expect(screen.queryByText('No active sessions.')).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
});
it('ignores a stale success after switching accounts', async () => {
  const first = pending(),
    second = pending();
  mocks.sessions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const page = render(view());
  mocks.auth.account = { publicKey: 'GQA_B', authMethod: 'wallet' };
  mocks.auth.token = 'session-b';
  page.rerender(view());
  await act(async () => first.resolve({ sessions: [row('foreign-a')] }));
  expect(screen.queryByText('foreign-a')).toBeNull();
  expect(screen.getByRole('status')).toBeTruthy();
  await act(async () => second.resolve({ sessions: [row('current-b')] }));
  expect(await screen.findByText('current-b')).toBeTruthy();
});
it('ignores a stale error after a new session response', async () => {
  const first = pending(),
    second = pending();
  mocks.sessions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const page = render(view());
  mocks.auth.token = 'session-b';
  page.rerender(view());
  await act(async () => second.resolve({ sessions: [row('current-b')] }));
  await act(async () => first.reject(new Error('Stale failure')));
  expect(screen.queryByText('Stale failure')).toBeNull();
  expect(screen.getByText('current-b')).toBeTruthy();
});

it('treats a malformed response as an error, not empty or a render crash', async () => {
  mocks.sessions.mockResolvedValue({});
  render(view());
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Something went wrong on the server. Please try again.');
  expect(screen.queryByText('No active sessions.')).toBeNull();
});
