import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { en, type Messages } from './locales/en';
import { pt } from './locales/pt';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';

export type Locale = 'en' | 'pt' | 'es' | 'fr' | 'de';

// Selector labels stay in each language's own words (native labels).
export const LOCALES: { id: Locale; label: string; accessibleLabel: string }[] = [
  { id: 'en', label: 'English', accessibleLabel: 'English' },
  { id: 'pt', label: 'Português (Portugal)', accessibleLabel: 'Português (Portugal) - European Portuguese' },
  { id: 'es', label: 'Español', accessibleLabel: 'Español' },
  { id: 'fr', label: 'Français', accessibleLabel: 'Français' },
  { id: 'de', label: 'Deutsch', accessibleLabel: 'Deutsch' },
];

// BCP 47 values for <html lang>; pt is European Portuguese.
const LANG_TAGS: Record<Locale, string> = { en: 'en', pt: 'pt-PT', es: 'es-ES', fr: 'fr', de: 'de' };

const MESSAGES: Record<Locale, Messages> = { en, pt, es, fr, de };

const STORAGE_KEY = 'blockallisto-language';

function isLocale(v: string | null): v is Locale {
  return v === 'en' || v === 'pt' || v === 'es' || v === 'fr' || v === 'de';
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
