// Social sign-in entry point: the panel shows a per-provider button only when
// the deployment configures that provider (abuse-config), and the button
// starts the backend flow.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import SignInPanel from '../SignInPanel';

vi.mock('../../community/CommunityAuth', () => ({
  useCommunityAuth: () => globalThis.__authMock,
}));

function auth(over: Record<string, unknown>) {
  return {
    account: null,
    token: null,
    busy: false,
    error: '',
    restored: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    setDisplayName: vi.fn(),
    totpPending: null,
    completeTotp: vi.fn(),
    socialProviders: [],
    startSocialSignIn: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

declare global {
  var __authMock: unknown;
}

describe('SignInPanel social sign-in button', () => {
  afterEach(() => cleanup());

  it('renders a Google button only when the provider is configured, and starts the flow on click', async () => {
    const startSocialSignIn = vi.fn().mockResolvedValue(undefined);
    globalThis.__authMock = auth({ socialProviders: ['google'], startSocialSignIn });
    render(
      <I18nProvider>
        <SignInPanel actor="investor" />
      </I18nProvider>,
    );
    const btn = await screen.findByRole('button', { name: 'Continue with Google' });
    fireEvent.click(btn);
    expect(startSocialSignIn).toHaveBeenCalledWith('google');

    cleanup();
    globalThis.__authMock = auth({ socialProviders: [] });
    render(
      <I18nProvider>
        <SignInPanel actor="investor" />
      </I18nProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
  });

  it('keeps Telegram email registration primary and exposes phone only as an explicit alternative', async () => {
    const startSocialSignIn = vi.fn().mockResolvedValue(undefined);
    globalThis.__authMock = auth({ socialProviders: ['telegram'], startSocialSignIn });
    render(
      <I18nProvider>
        <SignInPanel actor="investor" />
      </I18nProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Continue with Telegram' }));
    expect(startSocialSignIn).toHaveBeenLastCalledWith('telegram');
    fireEvent.click(screen.getByRole('button', { name: 'Alternative: Telegram phone' }));
    expect(startSocialSignIn).toHaveBeenLastCalledWith('telegram', 'phone');
    cleanup();
    globalThis.__authMock = auth({ socialProviders: [] });
    render(
      <I18nProvider>
        <SignInPanel actor="investor" />
      </I18nProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Alternative: Telegram phone' })).toBeNull();
  });

  it('a social account without a display name is labeled by its email, not the raw identity key', async () => {
    globalThis.__authMock = auth({
      account: {
        id: 'a2',
        publicKey: 'GAPRF4EXAMPLEPUBLICKEYM4V5',
        displayName: null,
        createdAt: 1,
        totpEnabled: false,
        authMethod: 'social',
        email: 'nuno@example.com',
      },
      token: 'bls_tok',
    });
    render(
      <I18nProvider>
        <SignInPanel actor="investor" />
      </I18nProvider>,
    );
    const strong = await screen.findByText((_, el) => el?.tagName === 'STRONG' && (el.textContent ?? '').includes('nuno@example.com'));
    expect(strong.textContent).toBe('nuno@example.com (GAPRF4...M4V5)');
  });
});
