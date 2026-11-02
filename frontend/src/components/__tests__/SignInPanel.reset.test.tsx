// Forgot-password flow: the email sign-in panel offers a reset request, walks
// to the token + new-password form, and returns to login after a successful
// reset. All server calls go through the mocked community auth context.
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
    emailSignUp: vi.fn(),
    emailSignIn: vi.fn(),
    emailCompleteVerification: vi.fn(),
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

describe('SignInPanel forgot-password flow', () => {
  afterEach(() => cleanup());

  it('login mode offers reset: request stage posts the email, confirm stage posts token + new password', async () => {
    const mock = auth({});
    renderPanel(mock);

    fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
    fireEvent.click(screen.getByRole('button', { name: 'I already have an account' }));

    const forgot = await screen.findByRole('button', { name: 'Forgot password?' });
    fireEvent.click(forgot);

    // Request stage: explainer + email field, submit calls emailRequestReset.
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'qa@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset token' }));
    expect((mock as any).emailRequestReset).toHaveBeenCalledWith('qa@example.com');

    // Confirm stage appears (mock resolves): token + new password.
    const tokenField = await screen.findByLabelText('Reset token');
    fireEvent.change(tokenField, { target: { value: 'blr_'.concat('a'.repeat(48)) } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'brand new password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set new password' }));
    expect((mock as any).emailConfirmReset).toHaveBeenCalledWith('qa@example.com', 'blr_'.concat('a'.repeat(48)), 'brand new password');

    // Success returns to the login form with the done note.
    expect(await screen.findByText('Password updated. Sign in with the new password.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeTruthy();
  });

  it('back buttons leave the reset flow without calling the API', async () => {
    const mock = auth({});
    renderPanel(mock);
    fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
    fireEvent.click(screen.getByRole('button', { name: 'I already have an account' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Forgot password?' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to sign in' }));
    expect((mock as any).emailRequestReset).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Forgot password?' })).toBeTruthy();
  });

  it('register mode never shows the forgot-password entry', async () => {
    renderPanel(auth({}));
    fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
    expect(screen.queryByRole('button', { name: 'Forgot password?' })).toBeNull();
  });
});
