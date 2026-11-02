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
