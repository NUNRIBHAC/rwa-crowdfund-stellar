// TOTP 2FA UI: the Security section enrolls an authenticator (shows the
// otpauth URI + manual key exactly once, then the 8 recovery codes exactly
// once) and disables with a code; the sign-in panel renders the second-step
// code form when the wallet signature left a pending TOTP challenge.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import SecuritySection from '../SecuritySection';
import SignInPanel from '../SignInPanel';

function ok(v: unknown) {
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

const ACCOUNT = { id: 'a1', wallet: 'GABC', displayName: 'QA', createdAt: 1, totpEnabled: false };

function fetchRouter(map: Record<string, () => Response>) {
  return vi.fn().mockImplementation((url: string) => {
    for (const [k, fn] of Object.entries(map)) if (String(url).includes(k)) return Promise.resolve(fn());
    return Promise.resolve(ok({}));
  });
}

vi.mock('../../community/CommunityAuth', () => ({
  useCommunityAuth: () => globalThis.__authMock,
}));

function auth(over: Record<string, unknown>) {
  return {
    account: ACCOUNT,
    token: 'tok',
    busy: false,
    error: '',
    restored: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    setDisplayName: vi.fn(),
    totpPending: null,
    completeTotp: vi.fn(),
    ...over,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __authMock: unknown;
}

describe('SecuritySection TOTP', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('enroll -> enable shows URI/key once, then recovery codes once', async () => {
    vi.stubGlobal(
      'fetch',
      fetchRouter({
        '/api/auth/sessions': () => ok({ sessions: [] }),
        '/api/auth/totp/enroll': () => ok({ otpauthUrl: 'otpauth://totp/Blockallisto:QA?secret=JBSWY3DPEHPK3PXP', manualKey: 'JBSWY3DPEHPK3PXP' }),
        '/api/auth/totp/enable': () => ok({ recoveryCodes: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'] }),
      }),
    );
    globalThis.__authMock = auth({});
    render(
      <I18nProvider>
        <SecuritySection />
      </I18nProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Enable two-factor' }));
    expect(await screen.findByText('otpauth://totp/Blockallisto:QA?secret=JBSWY3DPEHPK3PXP')).toBeTruthy();
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Code from the app'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm and enable' }));
    expect(await screen.findByText('c1')).toBeTruthy();
    expect(screen.getByText('c8')).toBeTruthy();
    expect(screen.getByText('Two-factor authentication is now enabled.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    // After completion the secret material is gone and disable is offered.
    expect(screen.queryByText('otpauth://totp/Blockallisto:QA?secret=JBSWY3DPEHPK3PXP')).toBeNull();
    expect(screen.queryByText('c1')).toBeNull();
    expect(await screen.findByRole('button', { name: 'Disable two-factor' })).toBeTruthy();
  });

  it('disable requires a code and calls the disable endpoint', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, init?: { body?: string }) => {
        calls.push(String(url));
        if (String(url).includes('/api/auth/sessions')) return Promise.resolve(ok({ sessions: [] }));
        if (String(url).includes('/api/auth/totp/disable')) {
          expect(JSON.parse(init?.body ?? '{}')).toEqual({ code: '654321' });
          return Promise.resolve(ok({ ok: true }));
        }
        return Promise.resolve(ok({}));
      }),
    );
    globalThis.__authMock = auth({ account: { ...ACCOUNT, totpEnabled: true } });
    render(
      <I18nProvider>
        <SecuritySection />
      </I18nProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Disable two-factor' }));
    fireEvent.change(screen.getByLabelText('Authenticator or recovery code'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Disable two-factor' }));
    await waitFor(() => expect(screen.getByText('Two-factor authentication disabled.')).toBeTruthy());
    expect(calls.some((u) => u.includes('/api/auth/totp/disable'))).toBe(true);
    // Back to the disabled posture: enable offered again.
    expect(await screen.findByRole('button', { name: 'Enable two-factor' })).toBeTruthy();
  });
});

describe('SignInPanel TOTP step', () => {
  afterEach(() => cleanup());

  it('renders the code form when a TOTP challenge is pending and submits it', () => {
    const completeTotp = vi.fn();
    globalThis.__authMock = auth({ account: null, totpPending: { ticket: 't1' }, completeTotp });
    render(
      <I18nProvider>
        <SignInPanel actor="GABC" />
      </I18nProvider>,
    );
    expect(screen.getByText('Two-factor authentication')).toBeTruthy();
    expect(screen.getByText('Lost access to your authenticator? Enter one of your recovery codes instead.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Authenticator code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and sign in' }));
    expect(completeTotp).toHaveBeenCalledWith('123456');
  });

  it('ordinary sign-in form when no challenge is pending', () => {
    globalThis.__authMock = auth({ account: null });
    render(
      <I18nProvider>
        <SignInPanel actor="GABC" />
      </I18nProvider>,
    );
    expect(screen.queryByLabelText('Authenticator code')).toBeNull();
  });
});
