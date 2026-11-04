import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import Account from './Account';
import type { Market } from '../market';
const auth = vi.hoisted(() => ({ account: { publicKey: 'wallet-session', authMethod: 'wallet' } as any }));
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
const market = { campaigns: [], actor: '', fixtureMode: false, loaded: true } as unknown as Market;
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('account restored wallet records', () => {
  it('reads wallet-session records without connecting or preparing a transaction', async () => {
    auth.account = { publicKey: 'wallet-session', authMethod: 'wallet' };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ activity: [], payouts: [], holdings: [], unavailable: [] })));
    vi.stubGlobal('fetch', fetcher);
    render(
      <I18nProvider>
        <Account market={market} />
      </I18nProvider>,
    );
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/account/holdings?actor=wallet-session'));
    expect(fetcher).toHaveBeenCalledWith('/api/account/activity?actor=wallet-session');
    expect(fetcher.mock.calls.every(([url]) => String(url).startsWith('/api/account/'))).toBe(true);
    expect(market.actor).toBe('');
  });
  it('does not fetch wallet records for an email identity with no connected wallet', () => {
    auth.account = { publicKey: 'internal-email-key', authMethod: 'email' };
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    render(
      <I18nProvider>
        <Account market={market} />
      </I18nProvider>,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
