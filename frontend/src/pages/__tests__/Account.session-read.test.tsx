import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import Account from '../Account';
import type { Campaign } from '../../types';
import type { CommunityAccount } from '../../community/api';
import type { Market } from '../../market';

// Isolation contract for session-proven read actors on /account:
// - a wallet-auth session (authMethod 'wallet') drives read-only
//   portfolio/positions/news even with no extension connected;
// - an email/social session's internal publicKey NEVER counts as a wallet;
// - a connected extension always wins over a session wallet, and switching
//   or signing out clears the previous actor's data.

const W1 = 'GDJF4GJDFTO3XA562HC4NRMLRAGJ6HQOJFG7US3LBIN5K44GEF2FNKCT';
const W2 = 'GCQTDAQ36DKGQAN7T3HFKOGL63SZ25M4S6KXHHLWNXKT2HK2QNDTY7IY';
const EXT = 'GAGOC4XXT2I7BYMJPEU3VDCIAE2K6A7T6CV4U4XSX6D3SRD6MMXLXEJK';
const EMAIL_KEY = 'GINTERNALEMAILIDENTITYKEYNOTAWALLET0000000000000000000000';

let mockAccount: CommunityAccount | null = null;
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => ({ account: mockAccount, restored: true }) }));

function campaign(id: string, name: string, balance: string | null): Campaign {
  return {
    id,
    name,
    contractId: 'C' + id,
    raised: '5',
    balance,
    withdrawn: false,
    config: { creator: W1, token: 'T' + id, goal: '100', deadline: '9999999999' },
  };
}

const C1 = campaign('c1', 'Session Wallet Solar', '7000000');
const C2 = campaign('c2', 'Second Wallet Wind', '3000000');
const CX = campaign('cx', 'Extension Wallet Hydro', '9000000');

function json(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

let fetchCalls: string[] = [];
let campaignsByActor: Record<string, Campaign[]> = {};
let campaignsShouldFail = false;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('blockallisto-language', 'en');
  mockAccount = null;
  fetchCalls = [];
  campaignsByActor = {};
  campaignsShouldFail = false;
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const url = String(input);
    fetchCalls.push(url);
    if (url.startsWith('/api/campaigns')) {
      if (campaignsShouldFail) return Promise.reject(new Error('boom'));
      const actor = new URL(url, 'https://test').searchParams.get('actor') ?? '';
      return json({ campaigns: campaignsByActor[actor] ?? [] });
    }
    if (url.startsWith('/api/news')) return json({ news: [] });
    return json({
      campaigns: [],
      news: [],
      holdings: [],
      payouts: [],
      activities: [],
      events: [],
      notifications: [],
      documents: [],
      tickets: [],
      applications: [],
      items: [],
      intents: [],
    });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function market(actor: string, campaigns: Campaign[] = []): Market {
  return { campaigns, actor, fixtureMode: false } as unknown as Market;
}
function walletAccount(publicKey: string): CommunityAccount {
  return { publicKey, displayName: null, createdAt: 1, totpEnabled: false, authMethod: 'wallet' };
}
function show(mkt: Market) {
  return render(
    <I18nProvider>
      <Account market={mkt} />
    </I18nProvider>,
  );
}

test('wallet session without extension loads positions and news for the session wallet', async () => {
  mockAccount = walletAccount(W1);
  campaignsByActor[W1] = [C1];
  show(market(''));
  await waitFor(() => expect(screen.getAllByText('Session Wallet Solar').length).toBeGreaterThan(0));
  expect(fetchCalls.some((u) => u === `/api/campaigns?actor=${W1}`)).toBe(true);
  expect(screen.getByText('Campaign news')).toBeTruthy();
});

test('email-only session never drives on-chain reads', async () => {
  mockAccount = { publicKey: EMAIL_KEY, displayName: null, createdAt: 1, totpEnabled: false, authMethod: 'email' };
  campaignsByActor[EMAIL_KEY] = [C1];
  show(market(''));
  await waitFor(() => expect(screen.queryByText('Campaign news')).toBeNull());
  expect(fetchCalls.some((u) => u.includes(EMAIL_KEY))).toBe(false);
  expect(screen.queryByText('Session Wallet Solar')).toBeNull();
});

test('connected extension wins over a different session wallet, no cross-actor fetch', async () => {
  mockAccount = walletAccount(W1);
  campaignsByActor[W1] = [C1];
  campaignsByActor[EXT] = [CX];
  show(market(EXT, [CX]));
  await waitFor(() => expect(screen.getAllByText('Extension Wallet Hydro').length).toBeGreaterThan(0));
  expect(fetchCalls.some((u) => u.includes(W1))).toBe(false);
  expect(screen.queryByText('Session Wallet Solar')).toBeNull();
});

test('switching session wallet clears the previous wallet positions', async () => {
  mockAccount = walletAccount(W1);
  campaignsByActor[W1] = [C1];
  campaignsByActor[W2] = [C2];
  const mkt = market('');
  const { rerender } = show(mkt);
  await waitFor(() => expect(screen.getAllByText('Session Wallet Solar').length).toBeGreaterThan(0));
  mockAccount = walletAccount(W2);
  rerender(
    <I18nProvider>
      <Account market={mkt} />
    </I18nProvider>,
  );
  await waitFor(() => expect(screen.getAllByText('Second Wallet Wind').length).toBeGreaterThan(0));
  expect(screen.queryByText('Session Wallet Solar')).toBeNull();
  expect(fetchCalls.some((u) => u === `/api/campaigns?actor=${W2}`)).toBe(true);
});

test('signing out clears session positions and news', async () => {
  mockAccount = walletAccount(W1);
  campaignsByActor[W1] = [C1];
  const mkt = market('');
  const { rerender } = show(mkt);
  await waitFor(() => expect(screen.getAllByText('Session Wallet Solar').length).toBeGreaterThan(0));
  mockAccount = null;
  rerender(
    <I18nProvider>
      <Account market={mkt} />
    </I18nProvider>,
  );
  await waitFor(() => expect(screen.queryByText('Session Wallet Solar')).toBeNull());
  expect(screen.queryByText('Campaign news')).toBeNull();
});

test('positions read failure shows unavailable, not an empty success or zero balance', async () => {
  mockAccount = walletAccount(W1);
  campaignsShouldFail = true;
  show(market(''));
  await waitFor(() => expect(fetchCalls.some((u) => u.includes('/api/campaigns?actor='))).toBe(true));
  expect(screen.queryByText('Session Wallet Solar')).toBeNull();
  expect(screen.getByText('Total contributed')).toBeTruthy();
  await waitFor(() => expect(screen.getAllByText(/The service is temporarily unavailable/).length).toBeGreaterThan(0));
});

test('social internal identity also never selects wallet positions', () => {
  mockAccount = { publicKey: EMAIL_KEY, displayName: null, createdAt: 1, totpEnabled: false, authMethod: 'social' };
  show(market(''));
  expect(fetchCalls.some((url) => url.includes(EMAIL_KEY))).toBe(false);
  expect(screen.queryByText('Campaign news')).toBeNull();
});

test('pending positions show a pending status and no successful zero balance', async () => {
  mockAccount = walletAccount(W1);
  vi.stubGlobal('fetch', (input: RequestInfo | URL) =>
    String(input).startsWith('/api/campaigns') ? new Promise(() => {}) : json({ activity: [], payouts: [], holdings: [], unavailable: [] }),
  );
  const { container } = show(market(''));
  await waitFor(() => expect(screen.getAllByText(/Loading/).length).toBeGreaterThan(0));
  expect(container.querySelector('.account-stat-value')?.textContent).toBe('—');
  expect(screen.queryByText('No investments found.')).toBeNull();
});

test('late positions response after a wallet switch cannot restore the previous wallet', async () => {
  mockAccount = walletAccount(W1);
  let finishOld: (value: Response) => void = () => {};
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === `/api/campaigns?actor=${W1}`)
      return new Promise<Response>((resolve) => {
        finishOld = resolve;
      });
    if (url === `/api/campaigns?actor=${W2}`) return json({ campaigns: [C2] });
    return json({ activity: [], payouts: [], holdings: [], unavailable: [], news: [] });
  });
  const mkt = market('');
  const { rerender } = show(mkt);
  mockAccount = walletAccount(W2);
  rerender(
    <I18nProvider>
      <Account market={mkt} />
    </I18nProvider>,
  );
  await waitFor(() => expect(screen.getAllByText('Second Wallet Wind').length).toBeGreaterThan(0));
  finishOld(await json({ campaigns: [C1] }));
  await waitFor(() => expect(screen.queryByText('Session Wallet Solar')).toBeNull());
  expect(screen.getAllByText('Second Wallet Wind').length).toBeGreaterThan(0);
});
