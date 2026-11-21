import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Investments from '../pages/Investments';
import CampaignDetail from '../pages/CampaignDetail';
import { FIXTURE_CAMPAIGNS } from '../fixtures';
import { SAMPLE_CATALOG, isNationalRegimeSample } from '../data/sampleCatalog';
import { SAMPLE_CONCEPTS } from '../data/sampleConcepts';
import { I18nProvider } from '../i18n';
import type { Market } from '../market';
import { en } from '../i18n/locales/en';

vi.mock('../components/Comments', () => ({ default: () => null }));
vi.mock('../components/IssuerMessages', () => ({ default: () => null }));
vi.mock('../components/CampaignTour', () => ({ default: () => null }));
vi.mock('../components/NewsList', () => ({ default: () => null }));
vi.mock('../components/PodcastList', () => ({ default: () => null }));
vi.mock('../components/ReportsList', () => ({ default: () => null }));
vi.mock('../components/DocumentsList', () => ({ default: () => null }));
vi.mock('../components/RewardsList', () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const market: Market = {
  campaigns: FIXTURE_CAMPAIGNS,
  loaded: true,
  fixtureMode: true,
  actor: 'SAMPLE-NOT-A-WALLET',
  busy: false,
  amounts: {},
  amountErrors: {},
  prepareErrors: {},
  onAmount: vi.fn(),
  onPrepare: vi.fn(),
  onRefresh: vi.fn(),
  onToggleFixtures: vi.fn(),
};

test('type filter lists every sample instrument and concept format with exact counts', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  const select = screen.getByRole('combobox', { name: en.invest.filterTypeAria });
  const values = [...select.querySelectorAll('option')].map((o) => o.getAttribute('value'));
  const instruments = [...new Set(SAMPLE_CATALOG.map((c) => String(c.instrument)))];
  const subtypes = [...new Set(SAMPLE_CONCEPTS.map((c) => c.subtype))];
  expect(values).toEqual(['all', ...instruments, ...subtypes]);
  expect(values).toHaveLength(17);

  const shown = () => container.querySelectorAll('.card h3 a').length + container.querySelectorAll('[data-concept]').length;
  fireEvent.change(select, { target: { value: 'bond' } });
  expect(shown()).toBe(5);
  fireEvent.change(select, { target: { value: 'loan' } });
  expect(shown()).toBe(3);
  for (const type of ['share', 'participation-certificate', 'substanzgenussrecht', 'limited-partnership', 'donation', 'reward', 'pre-sale', ...subtypes]) {
    fireEvent.change(select, { target: { value: type } });
    expect(shown()).toBe(1);
  }
  fireEvent.change(select, { target: { value: 'all' } });
  expect(shown()).toBe(22);
});

test('type filter composes with the status filter and uses localized labels', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  const select = screen.getByRole('combobox', { name: en.invest.filterTypeAria });
  expect([...select.querySelectorAll('option')].some((o) => o.textContent === en.nationalFunding.items[0].title)).toBe(true);
  fireEvent.change(select, { target: { value: 'donation' } });
  fireEvent.click(screen.getByRole('button', { name: en.sampleConcepts.filterRefund }));
  expect(screen.getByRole('status').textContent).toBe('1 campaign shown');
  expect(container.querySelector('.card h3 a')?.textContent).toBe('Neighbourhood Library Donation');
  fireEvent.change(select, { target: { value: 'lda-quotas' } });
  expect(screen.getByRole('status').textContent).toBe(en.invest.noMatches);
});

test('live mode hides the type filter and national samples carry the regime note read-only', () => {
  render(
    <I18nProvider>
      <Investments market={{ ...market, fixtureMode: false, campaigns: [FIXTURE_CAMPAIGNS[0]] }} />
    </I18nProvider>,
  );
  expect(screen.queryByRole('combobox', { name: en.invest.filterTypeAria })).toBeNull();
  cleanup();
  for (const id of ['fixture-library-donation', 'fixture-makers-reward', 'fixture-lamp-pre-sale']) {
    expect(isNationalRegimeSample(id)).toBe(true);
    render(
      <I18nProvider>
        <CampaignDetail market={market} campaignId={id} />
      </I18nProvider>,
    );
    expect(screen.getByText(en.nationalFunding.sampleNote)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Contribute' })).toBeNull();
    cleanup();
  }
});
