// No-send verification entry: a visitor holding a token from an earlier
// registration or resend can open the token form from login mode without
// triggering any email send, and can back out to the sign-in form.
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
    clearError: vi.fn(),
    setDisplayName: vi.fn(),
    totpPending: null,
    completeTotp: vi.fn(),
    emailSignUp: vi.fn(),
    emailSignIn: vi.fn(),
    emailCompleteVerification: vi.fn().mockResolvedValue(undefined),
    emailResendToken: vi.fn(),
    emailRequestReset: vi.fn().mockResolvedValue(undefined),
    emailConfirmReset: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

declare global {
  var __authMock: unknown;
}

function renderPanel(mock: unknown) {
  globalThis.__authMock = mock;
  return render(
    <I18nProvider>
      <SignInPanel actor="" />
    </I18nProvider>,
  );
}

describe('SignInPanel no-send verification entry', () => {
  afterEach(() => cleanup());

  it('login mode opens the token form for the typed email without any send, and back returns', async () => {
    const mock = auth({});
    renderPanel(mock);

    fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
    fireEvent.click(screen.getByRole('button', { name: 'I already have an account' }));

    // The entry button stays disabled until an email is typed.
    const haveToken = await screen.findByRole('button', { name: 'I already have a token' });
    expect((haveToken as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  QA@Example.com ' } });
    expect((haveToken as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(haveToken);

    // Token form opens for the normalized address; nothing was sent or posted.
    expect(await screen.findByLabelText('Verification token')).toBeTruthy();
    expect(screen.getByText(/qa@example\.com/)).toBeTruthy();
    expect((mock as any).emailResendToken).not.toHaveBeenCalled();
    expect((mock as any).emailSignUp).not.toHaveBeenCalled();
    expect((mock as any).emailSignIn).not.toHaveBeenCalled();

    // Submitting the token goes through the ordinary verification call.
    fireEvent.change(screen.getByLabelText('Verification token'), { target: { value: 'blv_'.concat('b'.repeat(48)) } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and sign in' }));
    expect((mock as any).emailCompleteVerification).toHaveBeenCalledWith('qa@example.com', 'blv_'.concat('b'.repeat(48)));

    // Back returns to the sign-in form without any API call.
    cleanup();
    const mock2 = auth({});
    renderPanel(mock2);
    fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
    fireEvent.click(screen.getByRole('button', { name: 'I already have an account' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'qa@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'I already have a token' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Back to sign in' }));
    expect(await screen.findByRole('button', { name: 'Sign in with email' })).toBeTruthy();
    expect((mock2 as any).emailResendToken).not.toHaveBeenCalled();
  });

  it('register mode does not show the no-send entry button', async () => {
    const mock = auth({});
    renderPanel(mock);
    fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
    expect(screen.queryByRole('button', { name: 'I already have a token' })).toBeNull();
  });
});
