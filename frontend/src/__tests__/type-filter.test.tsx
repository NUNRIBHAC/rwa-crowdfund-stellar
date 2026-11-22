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

test('types cover all 44 businesses and exclude every Learn-only concept', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  const select = screen.getByRole('combobox', { name: en.invest.filterTypeAria });
  const values = [...select.querySelectorAll('option')].map((o) => o.value);
  const instruments = [...new Set(SAMPLE_CATALOG.map((c) => String(c.instrument)))];
  expect(values).toEqual(['all', ...instruments]);
  expect(values).toHaveLength(15);
  for (const concept of SAMPLE_CONCEPTS) expect(values).not.toContain(concept.subtype);
  const expected: Record<string, number> = { bond: 8, loan: 20, share: 5 };
  for (const instrument of instruments) {
    fireEvent.change(select, { target: { value: instrument } });
    expect(container.querySelectorAll('.card h3 a')).toHaveLength(expected[instrument] ?? 1);
    expect(container.querySelectorAll('[data-concept]')).toHaveLength(0);
  }
  fireEvent.change(select, { target: { value: 'all' } });
  expect(container.querySelectorAll('.card h3 a')).toHaveLength(44);
  expect(screen.getByRole('status').textContent).toBe('44 results shown');
});

test('types compose with sample status filters and use localized labels', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  const select = screen.getByRole('combobox', { name: en.invest.filterTypeAria });
  expect([...select.querySelectorAll('option')].some((o) => o.textContent === en.nationalFunding.items[0].title)).toBe(true);
  fireEvent.change(select, { target: { value: 'donation' } });
  fireEvent.click(screen.getByRole('button', { name: en.sampleConcepts.filterRefund }));
  expect(screen.getByRole('status').textContent).toBe('1 result shown');
  expect(container.querySelector('.card h3 a')?.textContent).toBe('Livros à Esquina');
  fireEvent.change(select, { target: { value: 'share' } });
  expect(screen.getByRole('status').textContent).toBe(en.invest.noMatches);
});

test('live mode hides educational types and national preview examples stay read-only', () => {
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

test('filter controls are in a separate sidebar before the results, with an accessible mobile toggle', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  const layout = container.querySelector('.registry-content-layout')!;
  const sidebar = layout.querySelector('aside.registry-filter-panel')!;
  const main = layout.querySelector('.registry-main-content')!;
  expect(sidebar.parentElement).toBe(layout);
  expect(main.parentElement).toBe(layout);
  expect(Boolean(sidebar.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  const toggle = sidebar.querySelector('button[aria-controls="registry-filter-controls"]')!;
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(container.querySelector('.filters-open')).toBeTruthy();
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});
