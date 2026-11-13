import countries from './country-locales.json';
import type { Locale } from './index';

const supported = new Set(['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi']);
export function validLocale(value: unknown): value is Locale {
  return typeof value === 'string' && supported.has(value);
}

/** Product aliases first, then BCP47 lookup. No related-language guesses. */
export function browserLocale(tags: readonly string[]): Locale | undefined {
  for (const tag of tags) {
    let canonical: string;
    try {
      canonical = Intl.getCanonicalLocales(tag)[0];
    } catch {
      continue;
    }
    if (!canonical) continue;
    const parts = canonical.split('-');
    if (parts[0] === 'zh') {
      const locale = new Intl.Locale(canonical);
      if (locale.script === 'Hant') return 'zh-TW';
      if (locale.script === 'Hans') return 'zh-CN';
      return ['TW', 'HK', 'MO'].includes(locale.region ?? '') ? 'zh-TW' : 'zh-CN';
    }
    while (parts.length) {
      const value = parts.join('-');
      if (validLocale(value)) return value;
      parts.pop();
    }
  }
  return undefined;
}

export function countryLocale(country: unknown): Locale | undefined {
  if (typeof country !== 'string' || !/^[A-Z]{2}$/.test(country)) return undefined;
  const value = Object.prototype.hasOwnProperty.call(countries, country) ? countries[country as keyof typeof countries] : undefined;
  return validLocale(value) ? value : undefined;
}

export function preferredLocale(saved: unknown, tags: readonly string[], country?: unknown): Locale {
  return (validLocale(saved) ? saved : undefined) ?? browserLocale(tags) ?? countryLocale(country) ?? 'en';
}
