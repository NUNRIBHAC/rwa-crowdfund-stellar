// Social callback fragment handling: the backend 302s to /account with the
// outcome in the URL fragment (#social-token / #social-totp / #social-error).
// The provider consumes the fragment, strips it from the URL immediately
// (tokens never linger in history) and applies the outcome.
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommunityAuthProvider, useCommunityAuth } from '../CommunityAuth';

const ACCOUNT = { id: 'a1', publicKey: 'GABCQAEXAMPLEPUBLICKEY', displayName: 'QA', createdAt: 1, totpEnabled: false };
const MESSAGES = { freighterMissing: 'x', walletNoSign: 'y' };

function stubFetch(handler: (url: string, init?: RequestInit) => Response | undefined) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: unknown, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      const res = handler(url, init);
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

  it('#social-email parks the ticket, strips the fragment and confirms with a code', async () => {
    window.history.replaceState(null, '', '/account#social-email=bsp_ticket');
    const calls: string[] = [];
    stubFetch((url, init) => {
      if (url === '/api/auth/abuse-config') return Response.json({ socialProviders: [] });
      if (url === '/api/auth/social/email/confirm') {
        calls.push(String(init?.body));
        return Response.json({ token: 'bls_x', expiresAt: 1, account: { publicKey: 'GA', displayName: null, createdAt: 1, authMethod: 'social' } });
      }
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
    await waitFor(() => expect(seen.current?.restored).toBe(true));
    expect(seen.current?.socialEmailPending).toEqual({ ticket: 'bsp_ticket' });
    expect(window.location.hash).toBe('');
    await act(async () => {
      await seen.current?.socialEmailConfirm?.('123456');
    });
    expect(calls[0]).toBe(JSON.stringify({ ticket: 'bsp_ticket', code: '123456' }));
    expect(seen.current?.account).not.toBeNull();
    expect(seen.current?.socialEmailPending).toBeNull();
  });

  it('farcaster: nonce, relay channel, poll, backend verify; ticket goes to the email step', async () => {
    window.history.replaceState(null, '', '/account');
    const verifyBodies: string[] = [];
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubFetch((url, init) => {
      if (url === '/api/auth/abuse-config') return Response.json({ socialProviders: ['farcaster'] });
      if (url === '/api/auth/farcaster/nonce') return Response.json({ nonce: 'a'.repeat(32), domain: 'app.test', siweUri: 'https://app.test/account' });
      if (url === 'https://relay.farcaster.xyz/v1/channel') return Response.json({ channelToken: 'ct', url: 'https://farcaster.xyz/~/siwf?x=1' });
      if (url === 'https://relay.farcaster.xyz/v1/channel/status') return Response.json({ state: 'completed', message: 'msg', signature: '0xabcd' });
      if (url === '/api/auth/farcaster/verify') {
        verifyBodies.push(String(init?.body));
        return Response.json({ socialEmailTicket: 'bsp_t', expiresAt: 1 });
      }
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
    await waitFor(() => expect(seen.current?.restored).toBe(true));
    await act(async () => {
      void seen.current?.startSocialSignIn('farcaster');
      await vi.advanceTimersByTimeAsync(2500);
    });
    await waitFor(() => expect(seen.current?.socialEmailPending).toEqual({ ticket: 'bsp_t' }));
    expect(verifyBodies[0]).toBe(JSON.stringify({ nonce: 'a'.repeat(32), message: 'msg', signature: '0xabcd' }));
    expect(seen.current?.account).toBeNull();
    vi.useRealTimers();
  });
});
