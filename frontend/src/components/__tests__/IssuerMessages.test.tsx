// Investor-issuer messaging thread (campaign detail): status-state coverage.
// The backend entitlement gate is fail-closed (503 when the on-chain check
// is unavailable, 403 investor_only without a position); each state must
// render its own explicit UI and never fall through to the empty state,
// which is reserved for a verified 200 with an empty thread. Operators see
// nothing here - their surface is the operator dashboard messaging tab, and
// a GET under an operator session returns every thread of the campaign.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import IssuerMessages from '../IssuerMessages';
import { CommunityAuthProvider } from '../../community/CommunityAuth';

function resp(status: number, v: unknown) {
  return new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
}

const ME = { account: { publicKey: 'G' + 'A'.repeat(55), displayName: null, createdAt: 1 }, isOperator: false };
const ME_OPERATOR = { account: { publicKey: 'G' + 'B'.repeat(55), displayName: null, createdAt: 1 }, isOperator: true };

// The auth provider calls /api/auth/abuse-config and /api/auth/me on mount;
// every scenario stubs fetch per-URL and returns a FRESH Response per call
// (a consumed body would poison the second reader).
function stubFetch(handler: (url: string, init?: RequestInit) => Response) {
  const f = vi.fn().mockImplementation((url: string, init?: RequestInit) => Promise.resolve(handler(String(url), init)));
  vi.stubGlobal('fetch', f);
  return f;
}

function withSession(getResp: Response, postImpl?: (init?: RequestInit) => Response, me: unknown = ME) {
  return stubFetch((url, init) => {
    if (url.includes('/api/auth/abuse-config')) return resp(200, {});
    if (url.includes('/api/auth/me')) return resp(200, me);
    if (url.includes('/api/campaigns/demo-solar/messages')) {
      if (init?.method === 'POST') return postImpl ? postImpl(init) : resp(500, {});
      return getResp;
    }
    return resp(404, {});
  });
}

function renderPanel() {
  return render(
    <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
      <IssuerMessages campaignId="demo-solar" />
    </CommunityAuthProvider>,
  );
}

const WIRE_THREAD = {
  messages: [
    {
      id: 'msg_1',
      campaignId: 'demo-solar',
      investorKey: 'G' + 'A'.repeat(55),
      authorKey: 'G' + 'A'.repeat(55),
      authorRole: 'investor',
      body: 'Question about the distribution schedule.',
      createdAt: 1730000000000,
    },
    {
      id: 'msg_2',
      campaignId: 'demo-solar',
      investorKey: 'G' + 'A'.repeat(55),
      authorKey: 'G' + 'B'.repeat(55),
      authorRole: 'operator',
      body: 'Scheduled for Q3 - see the latest report.',
      createdAt: 1730000100000,
    },
  ],
};

describe('IssuerMessages', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('no session renders the sign-in hint without any data request', async () => {
    const f = stubFetch((url) => (url.includes('/api/auth/abuse-config') ? resp(200, {}) : resp(401, {})));
    renderPanel();
    expect(await screen.findByText('Sign in to read and send private messages about this campaign.')).toBeTruthy();
    // The public abuse-config read is not session data and is allowed.
    expect(f.mock.calls.filter((c: unknown[]) => !String(c[0]).includes('/api/auth/abuse-config'))).toHaveLength(0);
    expect(screen.queryByText('No messages yet. Start the conversation below.')).toBeNull();
  });

  it('403 investor_only renders the localized investors-only error, never the empty state', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    withSession(resp(403, { error: 'issuer messages are available to investors in this campaign', code: 'investor_only' }));
    renderPanel();
    expect(await screen.findByText('Available to investors in this campaign only.')).toBeTruthy();
    expect(screen.queryByText('No messages yet. Start the conversation below.')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('503 verification_unavailable renders the localized temporary-unavailable error', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    withSession(resp(503, { error: 'could not verify on-chain investor entitlement', code: 'verification_unavailable' }));
    renderPanel();
    expect(await screen.findByText('The on-chain check could not be completed right now. Please try again later.')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('verified 200 with an empty thread is the only path to the empty state, with the composer', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    withSession(resp(200, { messages: [] }));
    renderPanel();
    expect(await screen.findByText('No messages yet. Start the conversation below.')).toBeTruthy();
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('renders the real wire shape with honest author labels and dir=auto bodies', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    withSession(resp(200, WIRE_THREAD));
    renderPanel();
    expect(await screen.findByText('Question about the distribution schedule.')).toBeTruthy();
    expect(screen.getByText('Scheduled for Q3 - see the latest report.')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('Platform operator')).toBeTruthy();
    for (const body of ['Question about the distribution schedule.', 'Scheduled for Q3 - see the latest report.']) {
      expect(screen.getByText(body).getAttribute('dir')).toBe('auto');
    }
    // No edit/delete affordances: the backend has no such endpoints.
    expect(screen.queryByRole('button', { name: /edit|delete/i })).toBeNull();
  });

  it('posts through the investor route with the bearer token and appends the bare 201 message', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    const created = {
      id: 'msg_3',
      campaignId: 'demo-solar',
      investorKey: 'G' + 'A'.repeat(55),
      authorKey: 'G' + 'A'.repeat(55),
      authorRole: 'investor',
      body: 'When does the next report land?',
      createdAt: 1730000200000,
    };
    const f = withSession(resp(200, { messages: [] }), (init) => {
      const parsed = JSON.parse(String(init?.body));
      expect(parsed).toEqual({ body: 'When does the next report land?' });
      return resp(201, created);
    });
    renderPanel();
    const box = await screen.findByRole('textbox');
    fireEvent.change(box, { target: { value: '  When does the next report land?  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('When does the next report land?')).toBeTruthy();
    const post = f.mock.calls.find((c: unknown[]) => (c[1] as RequestInit | undefined)?.method === 'POST');
    expect(String(post?.[0])).toContain('/api/campaigns/demo-solar/messages');
    expect((post?.[1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok' });
    await waitFor(() => expect((box as HTMLTextAreaElement).value).toBe(''));
  });

  it('an operator session renders nothing (operator surface is the dashboard tab)', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    withSession(resp(200, WIRE_THREAD), undefined, ME_OPERATOR);
    const { container } = renderPanel();
    await waitFor(() => expect(container.firstChild).toBeNull());
  });
});
