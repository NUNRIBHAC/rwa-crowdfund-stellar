import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { SAMPLE_CONCEPTS } from '../data/sampleConcepts';
import { FIXTURE_CAMPAIGNS } from '../fixtures';
import { I18nProvider } from '../i18n';
import { SampleConceptsSection } from '../components/SampleConcepts';
import CampaignDetail from '../pages/CampaignDetail';
import Investments from '../pages/Investments';
import type { Market } from '../market';
import { en } from '../i18n/locales/en';
import { pt } from '../i18n/locales/pt';
import { es } from '../i18n/locales/es';
import { fr } from '../i18n/locales/fr';
import { de } from '../i18n/locales/de';
import { ar } from '../i18n/locales/ar';
import { hi } from '../i18n/locales/hi';
import { ja } from '../i18n/locales/ja';
import { ko } from '../i18n/locales/ko';
import { zhCN } from '../i18n/locales/zh-CN';
import { zhTW } from '../i18n/locales/zh-TW';

const locales = { en, pt, es, fr, de, ar, hi, ja, ko, 'zh-CN': zhCN, 'zh-TW': zhTW };
const prepare = vi.fn();
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
  onPrepare: prepare,
  onRefresh: vi.fn(),
  onToggleFixtures: vi.fn(),
};
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

test('ten distinct concepts do not extend campaign fixtures, real profiles or executable instrument classes', () => {
  expect(SAMPLE_CONCEPTS).toHaveLength(10);
  expect(FIXTURE_CAMPAIGNS).toHaveLength(12);
  expect(new Set([...SAMPLE_CONCEPTS.map((c) => c.id), ...FIXTURE_CAMPAIGNS.map((c) => c.id)]).size).toBe(22);
  expect(en.profiles.list).toHaveLength(12);
  expect(en.instruments.classes).toHaveLength(7);
  expect(SAMPLE_CONCEPTS.filter((c) => c.nonFinancial).map((c) => c.subtype)).toEqual(['donation', 'reward', 'pre-sale']);
  for (const concept of SAMPLE_CONCEPTS) {
    expect(concept).not.toHaveProperty('config');
    expect(concept).not.toHaveProperty('contractId');
    expect(concept).not.toHaveProperty('state');
    expect(concept).toHaveProperty('sampleState');
    expect(concept).not.toHaveProperty('raised');
    expect(concept).not.toHaveProperty('balance');
    expect(concept).not.toHaveProperty('token');
  }
});

for (const [locale, messages] of Object.entries(locales)) {
  test(`${locale}: concepts have complete localized labels, caveats and the same sample disclaimer`, () => {
    expect(messages.sampleConcepts.list).toHaveLength(10);
    for (const item of messages.sampleConcepts.list) {
      expect(item.label.trim()).not.toBe('');
      expect(item.caveat.length).toBeGreaterThan(30);
    }
    if (locale !== 'en') {
      expect(messages.sampleConcepts.notice).not.toBe(en.sampleConcepts.notice);
      expect(messages.sampleConcepts.list.every((c, i) => c.caveat !== en.sampleConcepts.list[i].caveat)).toBe(true);
    }
    localStorage.setItem('blockallisto-language', locale);
    render(
      <I18nProvider>
        <SampleConceptsSection />
      </I18nProvider>,
    );
    expect(screen.getAllByText(messages.sampleLifecycle.notice)).toHaveLength(10);
    for (const concept of SAMPLE_CONCEPTS)
      expect(screen.getAllByText(messages.sampleConcepts.unavailable + ': ' + messages.sampleConcepts.states[concept.sampleState])).toHaveLength(2);
    expect(screen.getAllByText(messages.sampleConcepts.nonFinancialNotice)).toHaveLength(3);
    for (const concept of SAMPLE_CONCEPTS) {
      expect(screen.getByRole('link', { name: concept.name }).getAttribute('href')).toBe(`/campaigns/${concept.id}?fixtures=1`);
    }
  });
}

for (const [index, concept] of SAMPLE_CONCEPTS.entries()) {
  test(`${concept.id}: direct sample detail has no finance, wallet, API-backed panels or action handlers`, () => {
    const { container } = render(
      <I18nProvider>
        <CampaignDetail market={market} campaignId={concept.id} />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: concept.name })).toBeTruthy();
    expect(screen.getByText(en.sampleConcepts.list[index].caveat)).toBeTruthy();
    expect(screen.getByText(en.sampleLifecycle.notice)).toBeTruthy();
    expect(screen.getByText(en.sampleConcepts.unavailable + ': ' + en.sampleConcepts.states[concept.sampleState])).toBeTruthy();
    expect(container.querySelector('.invest-widget,.funding-grid,[data-sample-lifecycle]')).toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(prepare).not.toHaveBeenCalled();
  });
  test(`${concept.id}: live mode cannot resolve the educational URL`, () => {
    render(
      <I18nProvider>
        <CampaignDetail market={{ ...market, fixtureMode: false }} campaignId={concept.id} />
      </I18nProvider>,
    );
    expect(screen.getByText(en.campaign.notFound)).toBeTruthy();
    expect(screen.queryByText(en.sampleConcepts.list[index].caveat)).toBeNull();
    expect(prepare).not.toHaveBeenCalled();
  });
}

test('sample-mode count includes concepts in a separate section, live data stays unchanged', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  const concepts = screen.getByRole('region', { name: en.sampleConcepts.title });
  expect(within(concepts).getAllByRole('article')).toHaveLength(10);
  expect(container.querySelectorAll('.card')).toHaveLength(12);
  expect(screen.getByRole('status').textContent).toBe('22 campaigns shown');
});

test('live registry never shows the concept section', () => {
  render(
    <I18nProvider>
      <Investments market={{ ...market, campaigns: [FIXTURE_CAMPAIGNS[0]], fixtureMode: false }} />
    </I18nProvider>,
  );
  expect(screen.queryByRole('region', { name: en.sampleConcepts.title })).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('1 campaign shown');
});

test('critical distinctions remain explicit and no positive financial guarantees are invented', () => {
  const text = en.sampleConcepts.list.map((c) => c.caveat);
  expect(text[0]).toContain('not automatically an issued share or a loan');
  expect(text[1]).toContain('token does not transfer title');
  expect(text[2]).toContain('not ownership');
  expect(text[3]).toContain('exact claim');
  expect(text[4]).toContain('jurisdiction');
  expect(text[5]).toContain('Revenue is not profit');
  expect(text[6]).toContain('Royalties are not profit');
  for (const i of [7, 8, 9]) expect(text[i]).toContain('financial return');
});

test('all five concept scenarios appear twice without giving SAFE a refund right', () => {
  for (const state of ['open', 'funded', 'unsuccessful', 'refunded', 'withdrawn'])
    expect(SAMPLE_CONCEPTS.filter((c) => c.sampleState === state)).toHaveLength(2);
  expect(SAMPLE_CONCEPTS.find((c) => c.subtype === 'safe')?.sampleState).toBe('open');
  expect(SAMPLE_CONCEPTS.filter((c) => c.sampleState === 'refunded').map((c) => c.subtype)).toEqual(['donation', 'pre-sale']);
});

test('sample status filters include concept scenarios but real mode excludes every concept', () => {
  render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: en.invest.open }));
  expect(document.querySelectorAll('[data-concept]')).toHaveLength(2);
  expect(screen.getByRole('status').textContent).toBe('8 campaigns shown');
  fireEvent.click(screen.getByRole('button', { name: en.invest.funded }));
  expect(document.querySelectorAll('[data-concept]')).toHaveLength(4);
  expect(screen.getByRole('status').textContent).toBe('7 campaigns shown');
  fireEvent.click(screen.getByRole('button', { name: en.invest.underfunded }));
  expect(document.querySelectorAll('[data-concept]')).toHaveLength(4);
  expect(screen.getByRole('status').textContent).toBe('7 campaigns shown');
});

test('sample concepts participate in text and industry filters only in sample mode', () => {
  render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  fireEvent.change(screen.getByRole('combobox', { name: en.invest.filterIndustryAria }), { target: { value: 'financial-services' } });
  expect(document.querySelectorAll('[data-concept]')).toHaveLength(2);
  expect(screen.getByRole('status').textContent).toBe('2 campaigns shown');
  fireEvent.change(screen.getByRole('textbox', { name: en.invest.searchAria }), { target: { value: 'Juniper' } });
  expect(document.querySelectorAll('[data-concept]')).toHaveLength(1);
});
