// Sign-out hygiene: credentials and tokens typed into the email sign-in form
// must not survive a logout - the next person on the same browser sees a
// clean form, never the previous session's password or verify token.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import SignInPanel from '../SignInPanel';

const ACCOUNT = { id: 'a1', publicKey: 'GABCQAEXAMPLEPUBLICKEY', displayName: 'QA', createdAt: 1, totpEnabled: false };

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
    clearError: vi.fn(),
    setDisplayName: vi.fn(),
    totpPending: null,
    completeTotp: vi.fn(),
    emailLogin: vi.fn(),
    emailRegister: vi.fn(),
    emailVerify: vi.fn(),
    emailResendToken: vi.fn(),
    ...over,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __authMock: unknown;
}

describe('SignInPanel sign-out form hygiene', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('clears email/password/verify-token fields when the account goes away', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
    globalThis.__authMock = auth({});
    const { rerender } = render(
      <I18nProvider>
        <SignInPanel actor="investor" />
      </I18nProvider>,
    );
    fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'qa@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'long-enough-password' } });
    expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe('long-enough-password');

    // Login, then logout: the form comes back with no retained credentials.
    globalThis.__authMock = auth({ account: ACCOUNT, token: 'tok' });
    rerender(
      <I18nProvider>
        <SignInPanel actor="investor" />
      </I18nProvider>,
    );
    globalThis.__authMock = auth({});
    rerender(
      <I18nProvider>
        <SignInPanel actor="investor" />
      </I18nProvider>,
    );
    fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe('');
  });
});
