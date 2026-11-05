// Regression: the My account campaign-news feed follows the connected wallet.
// Mixed site-wide news is filtered to the wallet's invested campaigns, and a
// wallet switch re-filters to the new wallet's campaigns - the previous
// wallet's news never leaks into the new view.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import Account from './Account';
import type { Market } from '../market';
const auth = vi.hoisted(() => ({ account: null as any }));
vi.mock('../community/CommunityAuth', () => ({ useCommunityAuth: () => auth }));
vi.mock('../components/DemoJourney', () => ({ default: () => null }));
vi.mock('../components/InvestorOnboarding', () => ({ default: () => null }));
vi.mock('../components/NotificationsSection', () => ({ default: () => null }));
vi.mock('../components/SecuritySection', () => ({ default: () => null }));
vi.mock('../components/CompanyAccountsSection', () => ({ default: () => null }));
vi.mock('../components/AppropriatenessSection', () => ({ default: () => null }));
vi.mock('../components/OperatorSection', () => ({ default: () => null }));
vi.mock('../components/MyCommunityActivity', () => ({ default: () => null }));
vi.mock('../components/SignInPanel', () => ({ default: () => null }));
vi.mock('../components/SupportCenter', () => ({ default: () => null }));
vi.mock('../components/IssuerApplicationForm', () => ({ default: () => null }));

const NEWS = {
  news: [
    { id: 'na', campaignId: 'camp-a', title: 'Alpha issuer update', body: 'a', createdAt: 1730000000000 },
    { id: 'nb', campaignId: 'camp-b', title: 'Beta issuer update', body: 'b', createdAt: 1730000100000 },
  ],
};

function ok(v: unknown) {
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

const invested = (id: string, name: string, balance: string) => ({
  id,
  name,
  balance,
  raised: '0',
  withdrawn: '0',
  config: { goal: '1000000000', deadline: Date.now() + 86400000 },
});

const marketFor = (actor: string, campaigns: unknown[]) => ({ campaigns, actor, fixtureMode: false, loaded: true }) as unknown as Market;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('account campaign-news wallet switch', () => {
  it('filters mixed news to the invested campaign, then re-filters on wallet switch', async () => {
    auth.account = null;
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          String(url).includes('/api/news')
            ? ok(NEWS)
            : String(url).includes('/api/campaigns?actor=wallet-a')
              ? ok({ campaigns: [invested('camp-a', 'Campaign Alpha', '1000000')] })
              : String(url).includes('/api/campaigns?actor=wallet-b')
                ? ok({ campaigns: [invested('camp-b', 'Campaign Beta', '2000000')] })
                : ok({ activity: [], payouts: [], holdings: [], unavailable: [] }),
        ),
      ),
    );
    const { rerender } = render(
      <I18nProvider>
        <Account market={marketFor('wallet-a', [invested('camp-a', 'Campaign Alpha', '1000000')])} />
      </I18nProvider>,
    );
    // Wallet A: its own campaign's news renders, the other campaign's is excluded.
    expect(await screen.findByText('Alpha issuer update')).toBeTruthy();
    expect(screen.queryByText('Beta issuer update')).toBeNull();

    rerender(
      <I18nProvider>
        <Account market={marketFor('wallet-b', [invested('camp-b', 'Campaign Beta', '2000000')])} />
      </I18nProvider>,
    );
    // Wallet B: the feed re-filters - Beta news appears, Alpha news is gone.
    expect(await screen.findByText('Beta issuer update')).toBeTruthy();
    expect(screen.queryByText('Alpha issuer update')).toBeNull();
  });
});
