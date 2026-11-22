import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StrKey } from '@stellar/stellar-sdk';
import SampleContractLink from '../components/SampleContractLink';
import { I18nProvider } from '../i18n';
import { SAMPLE_CATALOG } from '../data/sampleCatalog';
import { testnetContractFor } from '../data/testnetCatalog';
import bindings from '../data/testnetCatalog.json';
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
afterEach(() => {
  cleanup();
  localStorage.clear();
});

test('all 44 fictional businesses have unique, valid created contract identities', () => {
  expect(bindings).toHaveLength(44);
  expect(bindings.map((b) => b.id)).toEqual(SAMPLE_CATALOG.map((c) => c.id));
  expect(new Set(bindings.map((b) => b.contractId)).size).toBe(44);
  for (const entry of bindings) {
    expect(StrKey.isValidContract(entry.contractId)).toBe(true);
    expect(testnetContractFor(entry.id)).toBe(entry.contractId);
    expect(entry).not.toHaveProperty('raised');
    expect(entry).not.toHaveProperty('deadline');
    expect(entry).not.toHaveProperty('state');
  }
  expect(testnetContractFor('staging-load')).toBeUndefined();
  expect(testnetContractFor('concept-safe')).toBeUndefined();
  expect(testnetContractFor('unrelated')).toBeUndefined();
});

for (const [locale, messages] of Object.entries(locales)) {
  test(`${locale}: each business opens its own real testnet data separately from the preview`, () => {
    localStorage.setItem('blockallisto-language', locale);
    const { container } = render(
      <I18nProvider>
        {bindings.map((entry) => (
          <SampleContractLink key={entry.id} campaignId={entry.id} />
        ))}
      </I18nProvider>,
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(44);
    for (const [i, entry] of bindings.entries()) {
      expect(links[i].getAttribute('href')).toBe(`/campaigns/${entry.id}?fixtures=0`);
      expect(links[i].getAttribute('target')).toBe('_blank');
      expect(links[i].getAttribute('rel')).toBe('noopener noreferrer');
      expect(links[i].getAttribute('data-testnet-contract')).toBe(entry.contractId);
      expect(links[i].textContent).toContain(messages.card.contractData);
    }
    expect(container.querySelector('button,input,progress,.funding-grid')).toBeNull();
  });
}

test('unknown identities cannot acquire a contract link by a plausible name or prefix', () => {
  const { container } = render(
    <I18nProvider>
      <SampleContractLink campaignId="fixture-made-up" />
      <SampleContractLink campaignId="Raiz Vertical" />
      <SampleContractLink campaignId="concept-safe" />
    </I18nProvider>,
  );
  expect(container.querySelector('a')).toBeNull();
});
