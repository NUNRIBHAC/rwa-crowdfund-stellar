// The stored-session restore effect must run once on mount. The messages
// catalog object is recreated on every parent render; depending on it used
// to re-run the whole effect (re-fetching the abuse config and re-restoring
// the session) on every render.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommunityAuthProvider, useCommunityAuth } from '../../community/CommunityAuth';

const TOKEN_KEY = 'blockallisto-community-token';

function Probe() {
  const auth = useCommunityAuth();
  return <span data-testid="restored">{String(auth.restored)}</span>;
}

describe('CommunityAuth restore runs once on mount', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('re-rendering with a fresh messages object does not re-run the restore fetches', async () => {
    localStorage.setItem(TOKEN_KEY, 'legacy-bearer');
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const u = String(url);
      if (u.includes('/api/auth/abuse-config')) return new Response('{}', { status: 200 });
      if (u.includes('/api/auth/me')) {
        return new Response(JSON.stringify({ account: { publicKey: 'GABC' }, isOperator: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected fetch ${u}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const base = { freighterMissing: 'x', walletNoSign: 'y' };
    const tree = (m: typeof base) => (
      <CommunityAuthProvider messages={m}>
        <Probe />
      </CommunityAuthProvider>
    );
    const { rerender } = render(tree({ ...base }));
    await waitFor(() => expect(screen.getByTestId('restored').textContent).toBe('true'));
    const callsAfterMount = fetchMock.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThan(0);
    // Several re-renders with brand-new catalog objects: no new fetches.
    rerender(tree({ ...base }));
    rerender(tree({ ...base }));
    rerender(tree({ ...base }));
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock.mock.calls.length).toBe(callsAfterMount);
  });
});
