import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { en, type Messages } from './locales/en';
import { pt } from './locales/pt';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { zhTW } from './locales/zh-TW';
import { zhCN } from './locales/zh-CN';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { ar } from './locales/ar';
import { hi } from './locales/hi';

export type Locale = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'zh-TW' | 'zh-CN' | 'ja' | 'ko' | 'ar' | 'hi';

// Selector labels stay in each language's own words (native labels).
export const LOCALES: { id: Locale; label: string; accessibleLabel: string }[] = [
  { id: 'en', label: 'English', accessibleLabel: 'English' },
  { id: 'pt', label: 'Português (Portuguese - Portugal)', accessibleLabel: 'Português (Portugal) - European Portuguese' },
  { id: 'es', label: 'Español (Spanish)', accessibleLabel: 'Español' },
  { id: 'fr', label: 'Français (French)', accessibleLabel: 'Français' },
  { id: 'de', label: 'Deutsch (German)', accessibleLabel: 'Deutsch' },
  { id: 'zh-TW', label: '繁體中文 (Traditional Chinese)', accessibleLabel: '繁體中文 - Traditional Chinese' },
  { id: 'zh-CN', label: '简体中文 (Simplified Chinese)', accessibleLabel: '简体中文 - Simplified Chinese' },
  { id: 'ja', label: '日本語 (Japanese)', accessibleLabel: '日本語 - Japanese' },
  { id: 'ko', label: '한국어 (Korean)', accessibleLabel: '한국어 - Korean' },
  { id: 'ar', label: 'العربية (Arabic)', accessibleLabel: 'العربية - Arabic' },
  { id: 'hi', label: 'हिन्दी (Hindi)', accessibleLabel: 'हिन्दी - Hindi' },
];

// BCP 47 values for <html lang>; pt is European Portuguese.
const LANG_TAGS: Record<Locale, string> = {
  en: 'en',
  pt: 'pt-PT',
  es: 'es-ES',
  fr: 'fr',
  de: 'de',
  'zh-TW': 'zh-TW',
  'zh-CN': 'zh-CN',
  ja: 'ja',
  ko: 'ko',
  ar: 'ar',
  hi: 'hi',
};

// Arabic renders right-to-left; the rest are left-to-right.
const RTL_LOCALES: ReadonlySet<Locale> = new Set(['ar']);

const MESSAGES: Record<Locale, Messages> = { en, pt, es, fr, de, 'zh-TW': zhTW, 'zh-CN': zhCN, ja, ko, ar, hi };

const STORAGE_KEY = 'blockallisto-language';

function isLocale(v: string | null): v is Locale {
  return ['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi'].includes(v ?? '');
}

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // localStorage unavailable; fall through to browser language
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
  if (nav.startsWith('pt')) return 'pt';
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('fr')) return 'fr';
  if (nav.startsWith('de')) return 'de';
  if (nav.startsWith('zh')) return nav.includes('tw') || nav.includes('hk') || nav.includes('hant') ? 'zh-TW' : 'zh-CN';
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('ko')) return 'ko';
  if (nav.startsWith('ar')) return 'ar';
  if (nav.startsWith('hi')) return 'hi';
  return 'en';
}

export type I18n = { locale: Locale; setLocale: (l: Locale) => void; m: Messages };

// Default English context lets unit tests render components without a provider.
const defaultContext: I18n = { locale: 'en', setLocale: () => {}, m: en };
const I18nContext = createContext<I18n>(defaultContext);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const m = MESSAGES[locale];

  useEffect(() => {
    document.documentElement.lang = LANG_TAGS[locale];
    document.documentElement.dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
    document.title = m.meta.title;
  }, [locale, m]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // persistence is best-effort
    }
  };

  return <I18nContext.Provider value={{ locale, setLocale, m }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}
