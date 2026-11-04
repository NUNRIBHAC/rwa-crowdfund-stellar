import { test, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CampaignDetail from '../CampaignDetail';
import { I18nProvider } from '../../i18n';
import { CommunityAuthProvider } from '../../community/CommunityAuth';
import { FIXTURE_CAMPAIGNS } from '../../fixtures';
import type { Market } from '../../market';
import type { Campaign } from '../../types';

afterEach(cleanup);

// jsdom lacks scrollIntoView (used by the tour); community widgets fetch on mount.
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
vi.stubGlobal('fetch', async () => ({ ok: false, status: 404, json: async () => ({}) }));

const past = String(Math.floor(Date.now() / 1000) - 86400);
const future = String(Math.floor(Date.now() / 1000) + 86400);
const actor = 'G'.repeat(56);
const creator = 'H'.repeat(56);

function campaignWith(overrides: Partial<Campaign>): Campaign {
  const base = FIXTURE_CAMPAIGNS[0];
  return { ...base, config: { ...base.config, creator }, ...overrides };
}

function marketFor(campaign: Campaign): Market {
  return {
    campaigns: [campaign],
    loaded: true,
    fixtureMode: false,
    actor,
    busy: false,
    amounts: {},
    amountErrors: {},
    prepareErrors: {},
    onAmount: () => {},
    onPrepare: () => {},
    onRefresh: () => {},
    onToggleFixtures: () => {},
  };
}

function setup(campaign: Campaign) {
  render(
    <I18nProvider>
      <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
        <CampaignDetail market={marketFor(campaign)} campaignId={campaign.id} />
      </CommunityAuthProvider>
    </I18nProvider>,
  );
}

test('ended underfunded campaign offers the refund action and says so', () => {
  setup(campaignWith({ raised: '40000000', balance: '10000000', config: { ...FIXTURE_CAMPAIGNS[0].config, creator, deadline: past } }));
  expect(screen.getByText(/ended below its goal/i)).toBeTruthy();
  const refund = screen.getByRole('button', { name: /refund/i }) as HTMLButtonElement;
  expect(refund.disabled).toBe(false);
  expect(screen.queryByRole('button', { name: /contribute/i })).toBeNull();
  expect(screen.queryByRole('link', { name: /view contribution form/i })).toBeNull();
});

test('ended underfunded campaign with nothing to refund disables the refund button', () => {
  setup(campaignWith({ raised: '40000000', balance: '0', config: { ...FIXTURE_CAMPAIGNS[0].config, creator, deadline: past } }));
  const refund = screen.getByRole('button', { name: /refund/i }) as HTMLButtonElement;
  expect(refund.disabled).toBe(true);
});

test('ended funded campaign offers creator withdraw and no refund', () => {
  setup(campaignWith({ raised: '2500000000000', withdrawn: false, config: { ...FIXTURE_CAMPAIGNS[0].config, creator, deadline: past } }));
  expect(screen.getByText(/creator may now withdraw/i)).toBeTruthy();
  const withdraw = screen.getByRole('button', { name: /withdraw/i }) as HTMLButtonElement;
  expect(withdraw.disabled).toBe(true); // actor is not the creator
  expect(screen.queryByRole('button', { name: /refund/i })).toBeNull();
});

test('ended funded withdrawn campaign states the outcome with no actions', () => {
  setup(campaignWith({ raised: '2500000000000', withdrawn: true, config: { ...FIXTURE_CAMPAIGNS[0].config, creator, deadline: past } }));
  expect(screen.getByText(/has withdrawn/i)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /refund/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /withdraw/i })).toBeNull();
});

test('funded campaign still before its deadline is fully subscribed with no contribute action', () => {
  setup(campaignWith({ raised: '2500000000000', config: { ...FIXTURE_CAMPAIGNS[0].config, creator, deadline: future } }));
  expect(screen.getByText(/fully subscribed/i)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /contribute/i })).toBeNull();
  expect(screen.queryByRole('link', { name: /view contribution form/i })).toBeNull();
});

test('open unfunded campaign shows contribute only (no guaranteed-failure refund/withdraw)', () => {
  setup(campaignWith({ config: { ...FIXTURE_CAMPAIGNS[0].config, creator, deadline: future } }));
  expect(screen.getByRole('button', { name: /contribute/i })).toBeTruthy();
  expect(screen.getByRole('link', { name: /view contribution form/i }).getAttribute('href')).toBe('#campaign-contribution');
  expect(screen.queryByRole('button', { name: /refund/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /withdraw/i })).toBeNull();
});
