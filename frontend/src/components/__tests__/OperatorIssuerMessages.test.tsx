// Operator dashboard messaging tab: the server returns every thread of the
// campaign as one flat list (b3a79ee), so grouping by investorKey is a
// client-side concern proven here. Replies must go through the operator
// route naming the thread; a 404 (thread gone) surfaces the localized error.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OperatorIssuerMessages from '../OperatorIssuerMessages';
import { CommunityAuthProvider } from '../../community/CommunityAuth';

function resp(status: number, v: unknown) {
  return new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
}

const INVESTOR_1 = 'G' + 'C'.repeat(55);
const INVESTOR_2 = 'G' + 'D'.repeat(55);
const ME_OPERATOR = { account: { publicKey: 'G' + 'B'.repeat(55), displayName: null, createdAt: 1 }, isOperator: true };

const FLAT = {
  messages: [
    {
      id: 'm1',
      campaignId: 'demo-solar',
      investorKey: INVESTOR_1,
      authorKey: INVESTOR_1,
      authorRole: 'investor',
      body: 'First question from investor one.',
      createdAt: 1730000000000,
    },
    {
      id: 'm2',
      campaignId: 'demo-solar',
      investorKey: INVESTOR_2,
      authorKey: INVESTOR_2,
      authorRole: 'investor',
      body: 'Other investor asking.',
      createdAt: 1730000050000,
    },
    {
      id: 'm3',
      campaignId: 'demo-solar',
      investorKey: INVESTOR_1,
      authorKey: 'G' + 'B'.repeat(55),
      authorRole: 'operator',
      body: 'Answer from the operator.',
      createdAt: 1730000100000,
    },
  ],
};

function stubFetch(handler: (url: string, init?: RequestInit) => Response) {
  const f = vi.fn().mockImplementation((url: string, init?: RequestInit) => Promise.resolve(handler(String(url), init)));
  vi.stubGlobal('fetch', f);
  return f;
}

function renderTab() {
  return render(
    <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
      <OperatorIssuerMessages campaigns={[{ id: 'demo-solar', name: 'Demo Solar' }]} />
    </CommunityAuthProvider>,
  );
}

async function openCampaign() {
  const select = await screen.findByRole('combobox');
  fireEvent.change(select, { target: { value: 'demo-solar' } });
}

describe('OperatorIssuerMessages', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('blockallisto-community-token', 'optok');
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('groups the flat list into one thread per investor, newest activity first', async () => {
    stubFetch((url) => {
      if (url.includes('/api/auth/abuse-config')) return resp(200, {});
      if (url.includes('/api/auth/me')) return resp(200, ME_OPERATOR);
      if (url.includes('/api/campaigns/demo-solar/messages')) return resp(200, FLAT);
      return resp(404, {});
    });
    renderTab();
    await openCampaign();
    // Two threads: investor one (latest activity m3) above investor two.
    const buttons = await screen.findAllByRole('button', { name: /Investor G/ });
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain('GCCCCC');
    expect(buttons[1].textContent).toContain('GDDDDD');
    expect(screen.getByText('Choose a conversation to read it.')).toBeTruthy();
  });

  it('opens one thread and replies through the operator route naming the thread', async () => {
    const f = stubFetch((url, init) => {
      if (url.includes('/api/auth/abuse-config')) return resp(200, {});
      if (url.includes('/api/auth/me')) return resp(200, ME_OPERATOR);
      if (url.includes('/api/operator/campaigns/demo-solar/messages')) {
        const parsed = JSON.parse(String(init?.body));
        expect(parsed).toEqual({ investorKey: INVESTOR_1, body: 'Follow-up answer.' });
        return resp(201, {
          id: 'm4',
          campaignId: 'demo-solar',
          investorKey: INVESTOR_1,
          authorKey: 'G' + 'B'.repeat(55),
          authorRole: 'operator',
          body: 'Follow-up answer.',
          createdAt: 1730000200000,
        });
      }
      if (url.includes('/api/campaigns/demo-solar/messages')) return resp(200, FLAT);
      return resp(404, {});
    });
    renderTab();
    await openCampaign();
    const threadBtn = (await screen.findAllByRole('button', { name: /Investor G/ }))[0];
    fireEvent.click(threadBtn);
    // The open thread shows its own messages only, operator side labeled.
    // (The last message also appears as the thread-row preview: 2 matches.)
    expect(await screen.findByText('First question from investor one.')).toBeTruthy();
    expect(screen.getAllByText('Answer from the operator.')).toHaveLength(2);
    const messageList = screen.getByRole('list', { name: /Investor GCCCCC/ });
    expect(within(messageList).getByText('First question from investor one.')).toBeTruthy();
    expect(within(messageList).queryByText('Other investor asking.')).toBeNull();
    expect(screen.getByText('Platform operator')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Follow-up answer.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reply' }));
    expect(await screen.findByText('Follow-up answer.')).toBeTruthy();
    const post = f.mock.calls.find((c: unknown[]) => (c[1] as RequestInit | undefined)?.method === 'POST');
    expect(String(post?.[0])).toContain('/api/operator/campaigns/demo-solar/messages');
    expect((post?.[1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer optok' });
  });

  it('verified 200 with no messages renders the no-threads state', async () => {
    stubFetch((url) => {
      if (url.includes('/api/auth/abuse-config')) return resp(200, {});
      if (url.includes('/api/auth/me')) return resp(200, ME_OPERATOR);
      if (url.includes('/api/campaigns/demo-solar/messages')) return resp(200, { messages: [] });
      return resp(404, {});
    });
    renderTab();
    await openCampaign();
    expect(await screen.findByText('No investor conversations for this campaign yet.')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('a 404 reply (thread gone) surfaces the localized not-found error', async () => {
    stubFetch((url, _init) => {
      if (url.includes('/api/auth/abuse-config')) return resp(200, {});
      if (url.includes('/api/auth/me')) return resp(200, ME_OPERATOR);
      if (url.includes('/api/operator/campaigns/demo-solar/messages')) {
        return resp(404, { error: 'message thread not found', code: 'not_found' });
      }
      if (url.includes('/api/campaigns/demo-solar/messages')) return resp(200, FLAT);
      return resp(404, {});
    });
    renderTab();
    await openCampaign();
    const threadBtn = (await screen.findAllByRole('button', { name: /Investor G/ }))[0];
    fireEvent.click(threadBtn);
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'late reply' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reply' }));
    expect(await screen.findByText('Not found.')).toBeTruthy();
  });
});
