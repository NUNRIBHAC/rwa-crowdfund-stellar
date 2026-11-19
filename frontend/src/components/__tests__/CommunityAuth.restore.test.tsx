// Stored-session restore on mount: only a definitive 401 may drop the stored
// credential. A transient network failure must preserve it (the session is
// still valid) and surface an availability error instead.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommunityAuthProvider, useCommunityAuth } from '../../community/CommunityAuth';

const TOKEN_KEY = 'blockallisto-community-token';

function Probe() {
  const auth = useCommunityAuth();
  return (
    <div>
      <span data-testid="restored">{String(auth.restored)}</span>
      <span data-testid="account">{auth.account ? 'signed-in' : 'signed-out'}</span>
      <span data-testid="error">{auth.error}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
      <Probe />
    </CommunityAuthProvider>,
  );
}

describe('CommunityAuth stored-session restore', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('a 401 from /api/auth/me drops the invalid stored session', async () => {
    localStorage.setItem(TOKEN_KEY, 'legacy-bearer');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: RequestInfo | URL) => {
        const u = String(url);
        if (u.includes('/api/auth/abuse-config')) return new Response('{}', { status: 200 });
        if (u.includes('/api/auth/me')) return new Response(JSON.stringify({ error: 'invalid', code: 'session_invalid' }), { status: 401 });
        throw new Error(`unexpected fetch ${u}`);
      }),
    );
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('restored').textContent).toBe('true'));
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.getByTestId('account').textContent).toBe('signed-out');
  });

  it('a network failure preserves the stored session and reports unavailability', async () => {
    localStorage.setItem(TOKEN_KEY, 'legacy-bearer');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: RequestInfo | URL) => {
        const u = String(url);
        if (u.includes('/api/auth/abuse-config')) return new Response('{}', { status: 200 });
        if (u.includes('/api/auth/me')) throw new TypeError('fetch failed');
        throw new Error(`unexpected fetch ${u}`);
      }),
    );
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('restored').textContent).toBe('true'));
    // The credential survives the transient failure: the next load can restore it.
    expect(localStorage.getItem(TOKEN_KEY)).toBe('legacy-bearer');
    expect(screen.getByTestId('account').textContent).toBe('signed-out');
    expect(screen.getByTestId('error').textContent.length).toBeGreaterThan(0);
  });
});
