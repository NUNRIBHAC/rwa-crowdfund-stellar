import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { SAMPLE_CONCEPTS } from '../data/sampleConcepts';
import { FIXTURE_CAMPAIGNS } from '../fixtures';
import { I18nProvider } from '../i18n';
import { SampleConceptsSection } from '../components/SampleConcepts';
import CampaignDetail from '../pages/CampaignDetail';
import Investments from '../pages/Investments';
import Learn from '../pages/Learn';
import { routeFromPath } from '../router';
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

test('seven educational concepts remain distinct from 44 campaign examples and executable instruments', () => {
  expect(SAMPLE_CONCEPTS).toHaveLength(7);
  expect(FIXTURE_CAMPAIGNS).toHaveLength(44);
  expect(new Set([...SAMPLE_CONCEPTS.map((c) => c.id), ...FIXTURE_CAMPAIGNS.map((c) => c.id)]).size).toBe(51);
  expect(en.profiles.list).toHaveLength(44);
  expect(en.instruments.classes).toHaveLength(12);
  for (const concept of SAMPLE_CONCEPTS) {
    for (const field of ['config', 'contractId', 'raised', 'balance', 'token', 'state']) expect(concept).not.toHaveProperty(field);
    expect(concept).toHaveProperty('sampleState');
    expect(['donation', 'reward', 'pre-sale']).not.toContain(concept.subtype);
  }
});

for (const [locale, messages] of Object.entries(locales)) {
  test(`${locale}: Learn contains all seven complete, non-executable concepts`, () => {
    expect(messages.sampleConcepts.list).toHaveLength(7);
    if (locale !== 'en') expect(messages.sampleConcepts.notice).not.toBe(en.sampleConcepts.notice);
    localStorage.setItem('blockallisto-language', locale);
    const { container } = render(
      <I18nProvider>
        <Learn />
      </I18nProvider>,
    );
    const concepts = screen.getByRole('region', { name: messages.sampleConcepts.title });
    expect(within(concepts).getAllByRole('article')).toHaveLength(7);
    expect(within(concepts).getAllByText(messages.sampleLifecycle.notice)).toHaveLength(7);
    for (const [i, concept] of SAMPLE_CONCEPTS.entries()) {
      const item = messages.sampleConcepts.list[i];
      expect(item.label.trim()).not.toBe('');
      expect(item.caveat.length).toBeGreaterThan(30);
      if (locale !== 'en') expect(item.caveat).not.toBe(en.sampleConcepts.list[i].caveat);
      expect(within(concepts).getByRole('heading', { name: concept.name })).toBeTruthy();
      expect(within(concepts).getByText(item.caveat)).toBeTruthy();
      expect(container.querySelector(`#learn-${concept.id}`)).toBeTruthy();
    }
    expect(concepts.querySelector('a[href*="/campaigns/"],button,input,.funding-grid,.invest-widget')).toBeNull();
    expect(prepare).not.toHaveBeenCalled();
  });
}

for (const concept of SAMPLE_CONCEPTS) {
  test(`${concept.id}: old campaign URL resolves to Learn, not a campaign`, () => {
    expect(routeFromPath(`/campaigns/${concept.id}`)).toEqual({ name: 'learn' });
    expect(routeFromPath(`/campaigns/${encodeURIComponent(concept.id)}`)).toEqual({ name: 'learn' });
  });
  for (const fixtureMode of [true, false])
    test(`${concept.id}: direct campaign rendering cannot expose a concept or finance controls (${fixtureMode})`, () => {
      const { container } = render(
        <I18nProvider>
          <CampaignDetail market={{ ...market, fixtureMode }} campaignId={concept.id} />
        </I18nProvider>,
      );
      expect(screen.getByText(en.campaign.notFound)).toBeTruthy();
      expect(container.querySelector('[data-concept],.invest-widget,.funding-grid,input,button')).toBeNull();
      expect(prepare).not.toHaveBeenCalled();
    });
}

test('catalog counts and status filters include only campaign examples', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  expect(container.querySelectorAll('.card')).toHaveLength(44);
  expect(screen.getByRole('status').textContent).toBe('44 results shown');
  expect(container.querySelector('[data-concept]')).toBeNull();
  for (const [label, count] of [
    [en.invest.open, 34],
    [en.invest.funded, 5],
    [en.invest.underfunded, 5],
  ] as const) {
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByRole('status').textContent).toBe(`${count} results shown`);
    expect(container.querySelector('[data-concept]')).toBeNull();
  }
});

test('concept searches and industry filters cannot add Learn concepts back into the catalog', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  fireEvent.change(screen.getByRole('combobox', { name: en.invest.filterIndustryAria }), { target: { value: 'financial-services' } });
  expect(screen.getByRole('status').textContent).toBe(en.invest.noMatches);
  fireEvent.change(screen.getByRole('textbox', { name: en.invest.searchAria }), { target: { value: 'Tagus' } });
  expect(screen.getByRole('status').textContent).toBe(en.invest.noMatches);
  expect(container.querySelector('[data-concept]')).toBeNull();
});

test('refund and withdrawal examples retain exact identities without concept scenarios', () => {
  const { container, rerender } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  expect(screen.getByRole('button', { name: en.sampleConcepts.filterRefund }).textContent).toBe('Refund (3)');
  expect(screen.getByRole('button', { name: en.sampleConcepts.filterWithdrawal }).textContent).toBe('Withdrawal (2)');
  fireEvent.click(screen.getByRole('button', { name: en.sampleConcepts.filterRefund }));
  expect(new Set([...container.querySelectorAll('.card h3 a')].map((a) => a.textContent))).toEqual(
    new Set(['Prado Vivo', 'Livros à Esquina', 'Luz de Oficina']),
  );
  fireEvent.click(screen.getByRole('button', { name: en.sampleConcepts.filterWithdrawal }));
  expect(screen.getByRole('status').textContent).toBe('2 results shown');
  expect(new Set([...container.querySelectorAll('.card h3 a')].map((a) => a.textContent))).toEqual(new Set(['Ciclo Mineral', 'Barro Vivo']));
  expect(container.querySelector('[data-concept]')).toBeNull();
  rerender(
    <I18nProvider>
      <Investments market={{ ...market, fixtureMode: false, campaigns: [FIXTURE_CAMPAIGNS[0]] }} />
    </I18nProvider>,
  );
  expect(screen.queryByRole('button', { name: en.sampleConcepts.filterRefund })).toBeNull();
  expect(screen.queryByRole('button', { name: en.sampleConcepts.filterWithdrawal })).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('1 result shown');
});

test('concept caveats retain their legal distinctions without positive guarantees', () => {
  const text = en.sampleConcepts.list.map((c) => c.caveat);
  expect(text[0]).toContain('not automatically an issued share or a loan');
  expect(text[1]).toContain('token does not transfer title');
  expect(text[2]).toContain('not ownership');
  expect(text[3]).toContain('Revenue is not profit');
  expect(text[4]).toContain('Royalties are not profit');
  expect(text[5]).toContain('not confirmed in Portugal');
  expect(text[6]).toContain('not confirmed in Portugal');
  expect(SAMPLE_CONCEPTS.map((c) => c.id)).not.toContain('concept-llc-holding');
  expect(en.ldaQuotas.caveat).toContain('if the CMVM authorizes');
});

test('standalone educational section has no campaign links or transaction handlers', () => {
  const { container } = render(
    <I18nProvider>
      <SampleConceptsSection />
    </I18nProvider>,
  );
  expect(container.querySelectorAll('[data-concept]')).toHaveLength(7);
  expect(container.querySelector('a[href*="/campaigns/"],button,input')).toBeNull();
});
