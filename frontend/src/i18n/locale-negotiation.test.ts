import { describe, expect, it } from 'vitest';
import countries from './country-locales.json';
import { browserLocale, countryLocale, preferredLocale } from './locale-negotiation';

describe('approved v4 locale precedence', () => {
  it.each([
    [['tr-TR', 'pt-BR', 'en'], 'pt'],
    [['it-IT', 'de-CH'], 'de'],
    [['*', 'bad_tag', 'yue', 'ur', 'bn', 'nl', 'es-MX'], 'es'],
    [['zh-Hant-CN'], 'zh-TW'],
    [['zh-Hans-HK'], 'zh-CN'],
    [['ZH-hk-u-nu-hanidec'], 'zh-TW'],
    [['zh-MO'], 'zh-TW'],
    [['zh-SG'], 'zh-CN'],
    [['zh'], 'zh-CN'],
    [['ko-KR'], 'ko'],
    [['en-US', 'pt-PT'], 'en'],
  ])('ordered browser tags %j -> %s', (tags, locale) => {
    expect(browserLocale(tags)).toBe(locale);
  });
  it('manual always wins, including across countries', () => {
    expect(preferredLocale('ja', ['pt-PT'], 'DE')).toBe('ja');
  });
  it('any supported browser preference wins over country', () => {
    expect(preferredLocale(null, ['ko-KR'], 'KP')).toBe('ko');
    expect(preferredLocale(null, ['pt-PT'], 'DE')).toBe('pt');
  });
  it('country is only the fallback, with KP en and KR ko', () => {
    expect(preferredLocale(null, ['tr-TR'], 'KP')).toBe('en');
    expect(preferredLocale(null, ['tr-TR'], 'KR')).toBe('ko');
    expect(preferredLocale(null, ['it-IT'], 'PT')).toBe('pt');
  });
  it('unknown, invalid or missing country falls back to English', () => {
    for (const c of [null, undefined, 'XX', 'T1', '__proto__', 'pt', '']) expect(preferredLocale('invalid', ['*'], c)).toBe('en');
  });
  it('all249 approved ISO defaults are usable with no extras', () => {
    expect(Object.keys(countries)).toHaveLength(249);
    for (const [country, locale] of Object.entries(countries)) expect(countryLocale(country)).toBe(locale);
  });
});
