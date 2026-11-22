import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import Learn from '../pages/Learn';
import { I18nProvider } from '../i18n';
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
import { SAMPLE_CONCEPTS } from '../data/sampleConcepts';
import { SAMPLE_CATALOG } from '../data/sampleCatalog';
const locales = { en, pt, es, fr, de, ar, hi, ja, ko, 'zh-CN': zhCN, 'zh-TW': zhTW };
afterEach(() => {
  cleanup();
  localStorage.clear();
});
for (const [locale, m] of Object.entries(locales)) {
  test(`${locale}: national framing appears on three Learn cards and three existing concepts`, () => {
    localStorage.setItem('blockallisto-language', locale);
    const { container } = render(
      <I18nProvider>
        <Learn />
      </I18nProvider>,
    );
    expect(container.querySelectorAll('[data-national-funding]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-ecspr-note]')).toHaveLength(2);
    for (const item of m.nationalFunding.items) expect(screen.getByRole('heading', { name: item.title })).toBeTruthy();
    expect(screen.getAllByText(m.nationalFunding.caveat)).toHaveLength(3);
    expect(m.nationalFunding.caveat).toContain('DGE');
    expect(m.nationalFunding.caveat).toContain('EIRL');
    expect(m.nationalFunding.caveat).toContain('30');
    expect(m.nationalFunding.caveat).toContain('ECSPR');
    expect(m.nationalFunding.ecsprNote).toContain('CMVM');
    expect(m.nationalFunding.sampleNote).toContain('DGE');
    expect(m.nationalFunding.sampleNote).toContain('EIRL');
    expect(m.nationalFunding.sampleNote).toContain('30');
    expect(m.nationalFunding.sampleNote).toContain('ECSPR');
    expect(m.nationalFunding.sampleNote).not.toContain('3/2018');
    expect(m.nationalFunding.sampleNote).not.toContain('DG Consumidor');
    expect(m.nationalFunding.caveat).not.toContain('3/2018');
    expect(m.nationalFunding.caveat).not.toContain('DG Consumidor');
  });
}
test('the national formats moved to the sample catalog without changing instrument classes', () => {
  expect(SAMPLE_CATALOG).toHaveLength(19);
  expect(SAMPLE_CONCEPTS).toHaveLength(7);
  expect(SAMPLE_CATALOG.filter((c) => ['donation', 'reward', 'pre-sale'].includes(String(c.instrument))).map((c) => c.id)).toEqual([
    'fixture-library-donation',
    'fixture-makers-reward',
    'fixture-lamp-pre-sale',
  ]);
  expect(en.instruments.classes).toHaveLength(11);
  expect(en.nationalFunding.caveat).toContain('outside ECSPR');
  expect(en.nationalFunding.caveat).toContain('no money is collected');
  expect(en.nationalFunding.caveat).toContain('no tax deduction is promised');
  expect(en.nationalFunding.items[2].summary).toContain('reward crowdfunding');
});
