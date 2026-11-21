import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import Learn from '../pages/Learn';
import { holdingStructureLabel } from '../data/holdingStructures';
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
const HOLDING_IDS = ['direct', 'depositary-receipt', 'llc', 'series-llc', 'llp', 'scp', 'lda-quotas', 'anonymous-partnership'];

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test('every locale carries the same eight holding structures with labels and summaries', () => {
  expect(en.instruments.holding.items.map((h) => h.id)).toEqual(HOLDING_IDS);
  for (const [name, m] of Object.entries(locales)) {
    expect(
      m.instruments.holding.items.map((h) => h.id),
      name,
    ).toEqual(HOLDING_IDS);
    for (const item of m.instruments.holding.items) {
      expect(item.label.trim().length, `${name}:${item.id}`).toBeGreaterThan(0);
      expect(item.summary.trim().length, `${name}:${item.id}`).toBeGreaterThan(0);
    }
    expect(m.instruments.holding.notSpecified.trim().length).toBeGreaterThan(0);
    expect(m.community.applicationFields.holdingStructure.trim().length).toBeGreaterThan(0);
    expect(m.campaign.holdingStructureLabel.trim().length).toBeGreaterThan(0);
  }
});

test('holding structure labels resolve per locale and fall back honestly', () => {
  expect(holdingStructureLabel(en, 'depositary-receipt')).toBe('Depositary receipt (share certificate)');
  expect(holdingStructureLabel(pt, 'depositary-receipt')).toBe('Certificado representativo de ações');
  expect(holdingStructureLabel(en, null)).toBe(en.instruments.holding.notSpecified);
  expect(holdingStructureLabel(en, undefined)).toBe(en.instruments.holding.notSpecified);
  expect(holdingStructureLabel(en, 'unknown-thing')).toBe('unknown-thing');
});

test('no locale claims issuance, custody service or ECSPR eligibility', () => {
  for (const [name, m] of Object.entries(locales)) {
    const blob = JSON.stringify(m.instruments.holding).toLowerCase();
    expect(blob, name).not.toContain('we issue');
    expect(blob, name).not.toContain('ecspr-eligible');
    expect(blob, name).not.toContain('ecspr eligible');
    expect(blob, name).not.toContain('ecsper');
    // The shared disclaimer must state the absence of a company and licence.
    expect(m.instruments.holding.disclaimer.length, name).toBeGreaterThan(80);
  }
  expect(en.instruments.holding.disclaimer).toContain('does not issue certificates');
  expect(en.instruments.holding.disclaimer).toContain('no ECSPR licence');
});

test('Learn renders the holding structures section with the disclaimer', () => {
  localStorage.clear();
  render(
    <I18nProvider initialLocale="en">
      <Learn />
    </I18nProvider>,
  );
  expect(screen.getByRole('heading', { name: en.instruments.holding.title })).toBeTruthy();
  expect(screen.getByText(en.instruments.holding.disclaimer)).toBeTruthy();
  for (const item of en.instruments.holding.items) {
    expect(screen.getByRole('heading', { name: item.label })).toBeTruthy();
  }
});

test('Learn renders the holding structures section in Portuguese and Arabic', () => {
  localStorage.clear();
  const { unmount } = render(
    <I18nProvider initialLocale="pt">
      <Learn />
    </I18nProvider>,
  );
  expect(screen.getByRole('heading', { name: pt.instruments.holding.title })).toBeTruthy();
  expect(screen.getByText(pt.instruments.holding.disclaimer)).toBeTruthy();
  unmount();
  render(
    <I18nProvider initialLocale="ar">
      <Learn />
    </I18nProvider>,
  );
  expect(screen.getByRole('heading', { name: ar.instruments.holding.title })).toBeTruthy();
});
