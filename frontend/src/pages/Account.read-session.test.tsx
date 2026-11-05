import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
    // Read-only scope for a proven wallet session: account-record endpoints,
    // the session-token news feed, plus the same public campaign-catalog
    // balance read the connected-wallet path uses - always for the session's
    // own proven key, never a transaction/prepare call.
    expect(
      fetcher.mock.calls.every(
        ([url]) =>
          String(url).startsWith('/api/account/') ||
          String(url) === '/api/news' ||
          String(url) === `/api/campaigns?actor=${encodeURIComponent('wallet-session')}`,
      ),
    ).toBe(true);
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

it('keeps activity pending and failure distinct from a successful empty response', async () => {
  auth.account = { publicKey: 'wallet-session', authMethod: 'wallet' };
  let rejectRead: (error: Error) => void = () => {};
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      url.includes('/activity')
        ? new Promise((_, reject) => {
            rejectRead = reject;
          })
        : Promise.resolve(new Response(JSON.stringify({ holdings: [], payouts: [] }))),
    ),
  );
  render(
    <I18nProvider>
      <Account market={market} />
    </I18nProvider>,
  );
  const activity = screen.getByRole('region', { name: 'Recent activity' });
  expect(activity.textContent).toContain('Loading');
  expect(activity.textContent).not.toContain('No activity');
  rejectRead(new Error('synthetic offline'));
  await waitFor(() => expect(activity.textContent).toContain('temporarily unavailable'));
  expect(activity.textContent).not.toContain('No activity');
});

it('does not retain an old actor activity row while the next actor read is pending', async () => {
  auth.account = { publicKey: 'wallet-one', authMethod: 'wallet' };
  let finishOld: (v: Response) => void = () => {};
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      url.includes('/activity')
        ? new Promise<Response>((resolve) => {
            if (url.includes('wallet-one')) finishOld = resolve;
          })
        : Promise.resolve(new Response(JSON.stringify({ holdings: [], payouts: [] }))),
    ),
  );
  const view = render(
    <I18nProvider>
      <Account market={market} />
    </I18nProvider>,
  );
  auth.account = { publicKey: 'wallet-two', authMethod: 'wallet' };
  view.rerender(
    <I18nProvider>
      <Account market={market} />
    </I18nProvider>,
  );
  finishOld(
    new Response(
      JSON.stringify({ activity: [{ hash: 'old', campaign: 'OLD-ACTOR-ROW', action: 'contribute', status: 'SUCCESS', amount: '1', createdAt: null }] }),
    ),
  );
  await waitFor(() => expect(screen.getByRole('region', { name: 'Recent activity' }).textContent).toContain('Loading'));
  expect(screen.queryByText('OLD-ACTOR-ROW')).toBeNull();
});
