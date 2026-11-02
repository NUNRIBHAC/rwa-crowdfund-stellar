// Social callback fragment handling: the backend 302s to /account with the
// outcome in the URL fragment (#social-token / #social-totp / #social-error).
// The provider consumes the fragment, strips it from the URL immediately
// (tokens never linger in history) and applies the outcome.
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommunityAuthProvider, useCommunityAuth } from '../CommunityAuth';

const ACCOUNT = { id: 'a1', publicKey: 'GABCQAEXAMPLEPUBLICKEY', displayName: 'QA', createdAt: 1, totpEnabled: false };
const MESSAGES = { freighterMissing: 'x', walletNoSign: 'y' };

function stubFetch(handler: (url: string) => Response | undefined) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: unknown) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      const res = handler(url);
      return Promise.resolve(res ?? new Response('{}', { status: 404 }));
    }),
  );
}

describe('CommunityAuthProvider social fragment', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/account');
  });

  it('#social-token signs in with the token and strips it from the URL', async () => {
    window.history.replaceState(null, '', '/account#social-token=bls_fresh-token');
    const me = vi.fn();
    stubFetch((url) => {
      if (url === '/api/auth/me') {
        me();
        return Response.json({ account: ACCOUNT, isOperator: false });
      }
      if (url === '/api/auth/abuse-config') return Response.json({ turnstileSiteKey: null, socialProviders: ['google'] });
      return undefined;
    });
    const seen: { current: ReturnType<typeof useCommunityAuth> | null } = { current: null };
    function Grab() {
      seen.current = useCommunityAuth();
      return null;
    }
    render(
      <CommunityAuthProvider messages={MESSAGES}>
        <Grab />
      </CommunityAuthProvider>,
    );
    await waitFor(() => expect(seen.current?.account?.publicKey).toBe(ACCOUNT.publicKey));
    expect(me).toHaveBeenCalled();
    expect(window.location.hash).toBe('');
    expect(seen.current?.token).toBe('bls_fresh-token');
    await waitFor(() => expect(seen.current?.socialProviders).toEqual(['google']));
  });

  it('#social-error surfaces the coded error and still restores stored state', async () => {
    window.history.replaceState(null, '', '/account#social-error=social_flow_expired');
    stubFetch((url) => (url === '/api/auth/abuse-config' ? Response.json({ socialProviders: [] }) : undefined));
    const seen: { current: ReturnType<typeof useCommunityAuth> | null } = { current: null };
    function Grab() {
      seen.current = useCommunityAuth();
      return null;
    }
    render(
      <CommunityAuthProvider messages={MESSAGES}>
        <Grab />
      </CommunityAuthProvider>,
    );
    await waitFor(() => expect(seen.current?.restored).toBe(true));
    expect(seen.current?.error).toBe('social_flow_expired');
    expect(seen.current?.account).toBeNull();
    expect(window.location.hash).toBe('');
  });

  it('#social-totp parks the one-purpose ticket for the second factor', async () => {
    window.history.replaceState(null, '', '/account#social-totp=blt_ticket');
    stubFetch((url) => (url === '/api/auth/abuse-config' ? Response.json({ socialProviders: [] }) : undefined));
    const seen: { current: ReturnType<typeof useCommunityAuth> | null } = { current: null };
    function Grab() {
      seen.current = useCommunityAuth();
      return null;
    }
    render(
      <CommunityAuthProvider messages={MESSAGES}>
        <Grab />
      </CommunityAuthProvider>,
    );
    await waitFor(() => expect(seen.current?.restored).toBe(true));
    expect(seen.current?.totpPending).toEqual({ ticket: 'blt_ticket' });
    expect(seen.current?.account).toBeNull();
    expect(window.location.hash).toBe('');
  });
});
