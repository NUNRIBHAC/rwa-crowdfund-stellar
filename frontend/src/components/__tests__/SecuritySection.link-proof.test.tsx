import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import SecuritySection from '../SecuritySection';
const mocks = vi.hoisted(() => ({
  auth: {
    account: { publicKey: 'GSYNTHETIC', authMethod: 'social', email: 'synthetic@example.com' },
    token: 'session-a',
    socialProviders: ['google', 'linkedin', 'telegram', 'github', 'discord', 'farcaster'],
    startFarcasterLinkProof: vi.fn(),
    startFarcasterLink: vi.fn(),
  },
  providers: vi.fn().mockResolvedValue({ providers: ['google', 'farcaster'] }),
  startLink: vi.fn(),
}));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => mocks.auth, describeError: (e: Error) => e.message }));
vi.mock('../AccountDeletionSection', () => ({ default: () => null }));
vi.mock('../../community/api', () => ({
  fetchSessions: vi.fn().mockResolvedValue({ sessions: [] }),
  socialLinkProofProviders: mocks.providers,
  startSocialLink: mocks.startLink,
  startSocialLinkProof: vi.fn(),
  disableTotp: vi.fn(),
  enableTotp: vi.fn(),
  enrollTotp: vi.fn(),
  logoutOtherSessions: vi.fn(),
  requestChallenge: vi.fn(),
  revokeSession: vi.fn(),
}));
beforeEach(() => {
  mocks.auth.token = 'session-a';
  mocks.auth.account.publicKey = 'GSYNTHETIC';
});
afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
  vi.clearAllMocks();
});
it('separates selected target from existing-identity choices without starting the link', async () => {
  render(
    <I18nProvider>
      <SecuritySection />
    </I18nProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Link Google' }));
  expect(await screen.findByRole('group', { name: 'New sign-in method: Google' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Verify using existing Google' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Verify using existing Farcaster' })).toBeTruthy();
  expect(screen.getAllByText(/Link another sign-in method/)).toHaveLength(1);
  expect(mocks.startLink).not.toHaveBeenCalled();
});
it('Farcaster proof is collected separately and is sent only on the next chosen link', async () => {
  mocks.auth.startFarcasterLinkProof.mockResolvedValue('bll_' + 'a'.repeat(48));
  render(
    <I18nProvider>
      <SecuritySection />
    </I18nProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Link Farcaster' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Verify using existing Farcaster' }));
  await waitFor(() => expect(mocks.auth.startFarcasterLinkProof).toHaveBeenCalledOnce());
  await waitFor(() => expect(screen.queryByRole('group', { name: 'New sign-in method: Farcaster' })).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Link Farcaster' }));
  await waitFor(() => expect(mocks.auth.startFarcasterLink).toHaveBeenCalledWith({ providerProof: 'bll_' + 'a'.repeat(48) }));
});

it('keeps all six configured linking providers, including Discord, Telegram and LinkedIn', async () => {
  render(
    <I18nProvider>
      <SecuritySection />
    </I18nProvider>,
  );
  for (const name of ['Google', 'LinkedIn', 'Telegram', 'GitHub', 'Discord', 'Farcaster'])
    expect(await screen.findByRole('button', { name: `Link ${name}` })).toBeTruthy();
});

it('a returned OAuth proof is removed from the URL and cleared when the session changes', async () => {
  const proof = 'bll_' + 'b'.repeat(48);
  history.replaceState(null, '', '/account#link-proof=' + proof);
  const view = render(
    <I18nProvider>
      <SecuritySection />
    </I18nProvider>,
  );
  expect(window.location.hash).toBe('');
  expect((await screen.findByRole('status')).textContent).toContain('Identity confirmed');
  mocks.auth.token = 'session-b';
  view.rerender(
    <I18nProvider>
      <SecuritySection />
    </I18nProvider>,
  );
  await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Link Google' }));
  expect(await screen.findByRole('group', { name: 'New sign-in method: Google' })).toBeTruthy();
  expect(mocks.startLink).not.toHaveBeenCalled();
});
it('an in-flight Farcaster proof cannot carry into a different signed-in account', async () => {
  let resolve!: (value: string) => void;
  mocks.auth.startFarcasterLinkProof.mockReturnValue(
    new Promise<string>((r) => {
      resolve = r;
    }),
  );
  const view = render(
    <I18nProvider>
      <SecuritySection />
    </I18nProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Link Google' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Verify using existing Farcaster' }));
  await waitFor(() => expect(mocks.auth.startFarcasterLinkProof).toHaveBeenCalled());
  mocks.auth.token = 'session-b';
  mocks.auth.account.publicKey = 'GOTHER';
  view.rerender(
    <I18nProvider>
      <SecuritySection />
    </I18nProvider>,
  );
  resolve('bll_' + 'c'.repeat(48));
  await new Promise((r) => setTimeout(r, 0));
  expect(screen.queryByRole('status')).toBeNull();
});
