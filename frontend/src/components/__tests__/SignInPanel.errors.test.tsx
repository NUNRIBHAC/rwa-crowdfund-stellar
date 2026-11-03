// Localized API error mapping: known backend error codes render in the
// active catalog language (never raw English server text), while unknown
// failures pass through verbatim - honest, never masked.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { pt } from '../../i18n/locales/pt';
import { CommunityAuthProvider } from '../../community/CommunityAuth';
import SignInPanel from '../SignInPanel';

function fail(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function renderAndSubmitEmail(body: unknown, status: number) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/api/auth/email/register')) return Promise.resolve(fail(status, body));
      return Promise.resolve(fail(404, { error: 'not found' }));
    }),
  );
  render(
    <I18nProvider>
      <CommunityAuthProvider messages={{ freighterMissing: pt.errors.freighterMissing, walletNoSign: pt.errors.walletNoSign, community: pt.community }}>
        <SignInPanel actor="investor" />
      </CommunityAuthProvider>
    </I18nProvider>,
  );
  fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'qa@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'long-enough-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('SignInPanel error lifecycle', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('localizes Turnstile API codes and clears the error when switching method', async () => {
    await renderAndSubmitEmail({ error: 'bot check failed; reload the page and retry', code: 'turnstile_failed' }, 403);
    const alert = await screen.findByRole('alert');
    // Localized PT catalog string, never the raw English server text.
    expect(alert.textContent).toContain('verificação anti-bot');
    expect(alert.textContent).not.toContain('bot check failed');
    // The stale-error regression: switching to wallet must clear it - wallet
    // sign-in never uses the bot check.
    fireEvent.click(screen.getByRole('tab', { name: /Carteira|Wallet/ }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});

describe('SignInPanel API error mapping', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('maps the unconfigured-mailer code to the active catalog language', async () => {
    await renderAndSubmitEmail({ error: 'email provider not configured on this deployment', code: 'email_provider_unconfigured' }, 503);
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('O registo e o início de sessão por email não estão disponíveis');
    });
    expect(screen.getByRole('alert').textContent).not.toContain('email provider not configured');
  });

  it('unknown failures pass through verbatim (honest fallback)', async () => {
    await renderAndSubmitEmail({ error: 'weird upstream condition 7' }, 500);
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('weird upstream condition 7');
    });
  });
});

async function renderAndSubmitTotpCode(completeBody: unknown, completeStatus: number) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes('/api/auth/email/login'))
        return Promise.resolve(
          new Response(JSON.stringify({ requiresTotp: true, ticket: 't1', expiresAt: Date.now() + 60000 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      if (u.includes('/api/auth/totp/complete')) return Promise.resolve(fail(completeStatus, completeBody));
      return Promise.resolve(fail(404, { error: 'not found' }));
    }),
  );
  render(
    <I18nProvider>
      <CommunityAuthProvider messages={{ freighterMissing: pt.errors.freighterMissing, walletNoSign: pt.errors.walletNoSign, community: pt.community }}>
        <SignInPanel actor="investor" />
      </CommunityAuthProvider>
    </I18nProvider>,
  );
  fireEvent.click(await screen.findByRole('tab', { name: 'Email' }));
  fireEvent.click(screen.getByRole('button', { name: 'I already have an account' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'qa@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'long-enough-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in with email' }));
  fireEvent.change(await screen.findByLabelText('Authenticator code'), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Verify and sign in' }));
}

describe('SignInPanel TOTP error mapping', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('maps the wrong-code/expired-ticket code to the active catalog language', async () => {
    await renderAndSubmitTotpCode({ error: 'invalid or expired ticket or wrong code; sign in again', code: 'totp_login_invalid' }, 401);
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('O código estava errado ou o início de sessão expirou');
    });
    expect(screen.getByRole('alert').textContent).not.toContain('invalid or expired ticket');
  });

  it('code-less TOTP failures pass through verbatim (honest fallback)', async () => {
    await renderAndSubmitTotpCode({ error: 'unexpected totp backend state 3' }, 500);
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('unexpected totp backend state 3');
    });
  });
});
