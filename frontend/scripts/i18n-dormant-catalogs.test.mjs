// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { splitCatalog, preserveDormant } from './i18n-dormant-catalogs.mjs';
import { readFileSync } from 'node:fs';
const names = ['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi'];
const load = (l) => JSON.parse(readFileSync(`${process.cwd()}/i18n-json/ui/${l}.json`, 'utf8'));
const base = load('en');
base.automaticRefund ??= Object.fromEntries(
  ['title', 'testnetOnly', 'pending', 'submitted', 'paid', 'blocked', 'manualFallback', 'unavailable'].map((key) => [key, `SYNTHETIC dormant ${key}`]),
);
const runtime = Object.fromEntries(Object.entries(base).filter(([k]) => k !== 'automaticRefund'));
describe('explicit dormant catalog boundary', () => {
  for (const locale of names) {
    it(`${locale}: lossless roundtrip, dormant text excluded from runtime`, () => {
      const catalog = load(locale);
      catalog.automaticRefund ??= structuredClone(base.automaticRefund);
      const { active, dormant } = splitCatalog(catalog, base, runtime, `ui.${locale}`);
      expect(active).not.toHaveProperty('automaticRefund');
      expect(dormant.automaticRefund).toEqual(catalog.automaticRefund);
      expect(JSON.stringify(preserveDormant(active, catalog, base, `ui.${locale}`))).toBe(JSON.stringify(catalog));
    });
  }
  it('preserves explicitly integrated runtime namespace and validates its shape', () => {
    expect(splitCatalog(base, base, base, 'ui.en')).toEqual({ active: base, dormant: {} });
    expect(preserveDormant(base, base, base, 'ui.en')).toEqual(base);
    expect(() => splitCatalog(base, base, { ...base, automaticRefund: {} }, 'ui.en')).toThrow('shape rejected');
  });
  it('does not classify unknown namespaces as dormant', () => {
    const catalog = { ...base, unapprovedFeature: { title: 'No' } };
    expect(splitCatalog(catalog, base, runtime, 'ui.en').active).toHaveProperty('unapprovedFeature');
    expect(() => preserveDormant(runtime, catalog, base, 'ui.en')).toThrow('unknown catalog namespace');
  });
  it('rejects missing dormant namespace', () => {
    expect(() => splitCatalog(runtime, base, runtime, 'ui.pt')).toThrow('presence differs');
  });
  it('rejects extra dormant keys', () => {
    const catalog = structuredClone(base);
    catalog.automaticRefund.extra = 'No';
    expect(() => splitCatalog(catalog, base, runtime, 'ui.en')).toThrow('shape rejected');
  });
  it('rejects missing dormant keys', () => {
    const catalog = structuredClone(base);
    delete catalog.automaticRefund.title;
    expect(() => splitCatalog(catalog, base, runtime, 'ui.en')).toThrow('shape rejected');
  });
  it('rejects non-string and empty dormant leaves', () => {
    for (const value of [null, {}, [], 1, '', ' ']) {
      const catalog = structuredClone(base);
      catalog.automaticRefund.title = value;
      expect(() => splitCatalog(catalog, base, runtime, 'ui.en')).toThrow('nonempty string');
    }
  });
  it('rejects changed placeholder contract', () => {
    const catalog = structuredClone(base);
    catalog.automaticRefund.title += '{notApproved}';
    expect(() => splitCatalog(catalog, base, runtime, 'ui.pt')).toThrow('placeholders differ');
  });
  it('supports an absent dormant namespace on both sides', () => {
    expect(splitCatalog(runtime, runtime, runtime, 'ui.en')).toEqual({ active: runtime, dormant: {} });
  });
});
