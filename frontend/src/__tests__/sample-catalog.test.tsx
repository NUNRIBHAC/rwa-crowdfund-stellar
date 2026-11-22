import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FIXTURE_CAMPAIGNS } from '../fixtures';
import { SAMPLE_CATALOG, sampleIndustry } from '../data/sampleCatalog';
import { campaignStatus } from '../components/CampaignCard';
import CampaignCard from '../components/CampaignCard';
import CampaignDetail from '../pages/CampaignDetail';
import Investments from '../pages/Investments';
import { campaignPhoto } from '../data/campaignPhotos';
import { SAMPLE_CAMPAIGN_PHOTO_BASES } from '../data/sampleCampaignPhotos';
import { MEDIA_ORIGIN } from '../media-fallback';
import { profileFor } from '../data/profiles';
import { composeInstrumentLabel } from '../data/instruments';
import { I18nProvider } from '../i18n';
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
const locales = { en, pt, es, fr, de, ar, hi, ja, ko, zhCN, zhTW };
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

test('twenty unique client-only fixtures cover all instrument families without treating structures as instruments', () => {
  expect(FIXTURE_CAMPAIGNS).toHaveLength(20);
  expect(new Set(FIXTURE_CAMPAIGNS.map((c) => c.id)).size).toBe(20);
  expect(FIXTURE_CAMPAIGNS.map((c) => c.id)).toEqual(SAMPLE_CATALOG.map((c) => c.id));
  expect(new Set(SAMPLE_CATALOG.map((c) => c.instrument))).toEqual(
    new Set([
      'bond',
      'loan',
      'share',
      'participation-certificate',
      'substanzgenussrecht',
      'limited-partnership',
      'donation',
      'reward',
      'pre-sale',
      'warrant',
      'share-depositary-receipt',
      'commercial-paper',
      'revenue-linked-loan',
      'debt-depositary-receipt',
    ]),
  );
  expect(SAMPLE_CATALOG.find((c) => c.indirect)?.instrument).toBe('share');
  for (const instrument of ['loan', 'bond']) {
    expect(new Set(SAMPLE_CATALOG.filter((c) => c.instrument === instrument).map((c) => c.seniority))).toEqual(
      new Set(['senior', 'subordinated', 'unspecified']),
    );
  }
  expect(SAMPLE_CATALOG.some((c) => c.overlays.includes('zero-coupon' as never) && c.instrument === 'bond')).toBe(true);
  expect(SAMPLE_CATALOG.some((c) => c.overlays.includes('convertible' as never) && c.instrument === 'bond')).toBe(true);
});

for (const [locale, messages] of Object.entries(locales)) {
  test(`${locale}: every fixture has a complete matching profile, localized labels and sector`, () => {
    expect(messages.profiles.list.map((p) => p.campaignId)).toEqual(FIXTURE_CAMPAIGNS.map((c) => c.id));
    for (const sample of SAMPLE_CATALOG) {
      const campaign = FIXTURE_CAMPAIGNS.find((c) => c.id === sample.id)!;
      const profile = profileFor(campaign, true, messages.profiles.list)!;
      expect(profile.instrumentClass).toBe(sample.instrument);
      expect(profile.instrumentSeniority).toBe(sample.seniority);
      expect(profile.instrumentOverlays).toEqual(sample.overlays);
      expect(profile.teaser.trim().length).toBeGreaterThan(20);
      expect(profile.overview.length).toBeGreaterThan(0);
      expect(composeInstrumentLabel(messages, sample.instrument, sample.seniority, [...sample.overlays])).not.toBe(sample.instrument);
      expect(sampleIndustry(sample.id)).toBe(sample.industry);
      expect(messages.invest.industryLabels[sample.industry]).toBeTruthy();
      expect(campaignPhoto(sample.id)).toBe(MEDIA_ORIGIN + SAMPLE_CAMPAIGN_PHOTO_BASES[sample.id] + '.jpg');
      expect(SAMPLE_CAMPAIGN_PHOTO_BASES[sample.id]).toMatch(new RegExp('/' + sample.id + '-[a-f0-9]{12}$'));
      expect(profileFor(campaign, false, messages.profiles.list)).toBeUndefined();
    }
    for (const text of Object.values(messages.sampleLifecycle)) expect(text.trim()).not.toBe('');
  });
}

test('all actual campaign states and settlement flags have coherent examples without inventing refund states', () => {
  const now = Date.now() / 1000;
  expect(new Set(FIXTURE_CAMPAIGNS.map(campaignStatus))).toEqual(new Set(['open', 'funded', 'ended']));
  expect(FIXTURE_CAMPAIGNS.some((c) => campaignStatus(c) === 'funded' && Number(c.config.deadline) > now && !c.withdrawn)).toBe(true);
  expect(FIXTURE_CAMPAIGNS.some((c) => campaignStatus(c) === 'funded' && Number(c.config.deadline) < now && !c.withdrawn)).toBe(true);
  expect(FIXTURE_CAMPAIGNS.some((c) => campaignStatus(c) === 'funded' && c.withdrawn && Number(c.config.deadline) < now)).toBe(true);
  expect(SAMPLE_CATALOG.filter((s) => String(s.state) === 'refunded').map((s) => s.id)).toEqual([
    'fixture-meadow-partnership',
    'fixture-library-donation',
    'fixture-lamp-pre-sale',
  ]);
  expect(en.sampleLifecycle.refunded).toBe('Unsuccessful - investor refund completed');
  expect(campaignStatus(FIXTURE_CAMPAIGNS.find((c) => c.id === 'fixture-meadow-partnership')!)).toBe('ended');
  expect(FIXTURE_CAMPAIGNS.every((c) => c.balance === null)).toBe(true); // No invented investor or zero-balance inference.
});

test('sample card deep links retain fixture mode and offer no transaction actions', () => {
  render(
    <I18nProvider>
      {FIXTURE_CAMPAIGNS.map((c) => (
        <CampaignCard
          key={c.id}
          campaign={c}
          profile={profileFor(c, true, en.profiles.list)}
          demo
          readOnly
          actor=""
          busy={false}
          amount=""
          onAmount={() => {}}
          onPrepare={prepare}
          discoveryOnly
        />
      ))}
    </I18nProvider>,
  );
  for (const c of FIXTURE_CAMPAIGNS) {
    expect(screen.getByRole('link', { name: c.name }).getAttribute('href')).toBe(`/campaigns/${c.id}?fixtures=1`);
  }
  expect(screen.queryByRole('button', { name: 'Contribute' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Refund me' })).toBeNull();
  expect(prepare).not.toHaveBeenCalled();
});

for (const campaign of FIXTURE_CAMPAIGNS) {
  test(`${campaign.id}: detail stays read-only with the common sample disclaimer`, () => {
    render(
      <I18nProvider>
        <CampaignDetail market={market} campaignId={campaign.id} />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: campaign.name })).toBeTruthy();
    expect(screen.getByText(en.sampleLifecycle.notice)).toBeTruthy();
    expect(screen.getByRole('link', { name: en.campaign.backToAll }).getAttribute('href')).toBe('/campaigns?fixtures=1');
    for (const name of ['Contribute', 'Refund me', 'Creator withdraw']) expect(screen.queryByRole('button', { name })).toBeNull();
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(prepare).not.toHaveBeenCalled();
  });
}

test('sector filter uses explicit sample IDs for the expanded catalog', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={market} />
    </I18nProvider>,
  );
  for (const industry of ['industrial-manufacturing', 'energy-utilities', 'real-estate']) {
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by industry' }), { target: { value: industry } });
    const ids = [...container.querySelectorAll('.card h3 a')].map((a) => a.getAttribute('href')?.split('/').pop()?.split('?')[0]);
    expect(new Set(ids)).toEqual(new Set(SAMPLE_CATALOG.filter((c) => c.industry === industry).map((c) => c.id)));
  }
});
