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
import { preferredLocale } from './locale-negotiation';

export type Locale = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'zh-TW' | 'zh-CN' | 'ja' | 'ko' | 'ar' | 'hi';

// Selector labels stay in each language's own words (native labels).
export const LOCALES: { id: Locale; label: string; accessibleLabel: string }[] = [
  { id: 'en', label: 'English', accessibleLabel: 'English' },
  {
    id: 'pt',
    label: 'Português (Portuguese - Portugal)',
    accessibleLabel: 'Português (Portugal) - European Portuguese',
  },
  { id: 'es', label: 'Español (Spanish)', accessibleLabel: 'Español' },
  { id: 'fr', label: 'Français (French)', accessibleLabel: 'Français' },
  { id: 'de', label: 'Deutsch (German)', accessibleLabel: 'Deutsch' },
  {
    id: 'zh-TW',
    label: '繁體中文 (Traditional Chinese)',
    accessibleLabel: '繁體中文 - Traditional Chinese',
  },
  {
    id: 'zh-CN',
    label: '简体中文 (Simplified Chinese)',
    accessibleLabel: '简体中文 - Simplified Chinese',
  },
  {
    id: 'ja',
    label: '日本語 (Japanese)',
    accessibleLabel: '日本語 - Japanese',
  },
  { id: 'ko', label: '한국어 (Korean)', accessibleLabel: '한국어 - Korean' },
  {
    id: 'ar',
    label: 'العربية (Arabic)',
    accessibleLabel: 'العربية - Arabic',
  },
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

// Arabic text reads right-to-left; the rest are left-to-right. Layout
// geometry stays identical across locales: <html> keeps dir="ltr" and only
// text-level blocks flip direction via the rtl-text class in styles.css.
const RTL_TEXT_LOCALES: ReadonlySet<Locale> = new Set(['ar']);

const MESSAGES: Record<Locale, Messages> = {
  en,
  pt,
  es,
  fr,
  de,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  ja,
  ko,
  ar,
  hi,
};

const STORAGE_KEY = 'blockallisto-language';
let activeLocale: Locale | undefined;

/** Effective in-memory UI locale, including a country fallback. Never persisted. */
export function currentLocale(): Locale {
  return storedLocale() ?? activeLocale ?? detectLocale();
}

function isLocale(v: string | null): v is Locale {
  return ['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi'].includes(v ?? '');
}

/** Locale for non-React callers (API layer): the same key the provider persists. */
export function storedLocale(): Locale | undefined {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLocale(saved) ? saved : undefined;
  } catch {
    return undefined;
  }
}

export const API_ERROR_MESSAGE_KEYS: Record<string, keyof Messages['community']> = {
  email_provider_unconfigured: 'errorEmailProviderUnavailable',
  rate_limited: 'errorRateLimited',
  email_invalid: 'errorEmailInvalid',
  password_short: 'errorPasswordShort',
  password_long: 'errorPasswordLong',
  token_invalid: 'errorTokenInvalid',
  token_expired: 'errorTokenExpired',
  credentials_invalid: 'errorCredentialsInvalid',
  email_unverified: 'errorEmailUnverified',
  login_throttled: 'errorLoginThrottled',
  invalid_input: 'errorInvalidInput',
  email_recipient_restricted: 'errorEmailRecipientRestricted',
  email_budget_exceeded: 'errorEmailBudgetExceeded',
  email_provider_throttled: 'errorEmailProviderThrottled',
  totp_unconfigured: 'errorTotpUnconfigured',
  totp_already_enabled: 'errorTotpAlreadyEnabled',
  totp_no_enrollment: 'errorTotpNoEnrollment',
  totp_code_invalid: 'errorTotpCodeInvalid',
  totp_login_invalid: 'errorTotpLoginInvalid',
  totp_not_enabled: 'errorTotpNotEnabled',
  social_provider_denied: 'errorSocialProviderDenied',
  social_flow_expired: 'errorSocialFlowExpired',
  social_pending_expired: 'errorSocialPendingExpired',
  social_code_invalid: 'errorSocialCodeInvalid',
  social_email_in_use: 'errorSocialEmailInUse',
  social_exchange_failed: 'errorSocialExchangeFailed',
  social_registration_restricted: 'errorSocialRegistrationRestricted',
  social_identity_taken: 'errorSocialIdentityTaken',
  social_stepup_required: 'errorSocialStepupRequired',
  social_stepup_failed: 'errorSocialStepupFailed',
  social_link_requires_verified_email: 'errorSocialLinkRequiresVerifiedEmail',
  turnstile_script_failed: 'errorTurnstileLoadFailed',
  turnstile_unavailable: 'errorTurnstileUnavailable',
  turnstile_failed: 'errorTurnstileFailed',
  not_found: 'errorNotFound',
  campaign_not_found: 'errorCampaignNotFound',
  invalid_campaign_id: 'errorInvalidCampaignId',
  internal_error: 'errorInternal',
  feature_unavailable: 'errorFeatureUnavailable',
  feature_restricted: 'errorFeatureRestricted',
  operator_required: 'errorOperatorRequired',
  investor_only: 'errorInvestorOnly',
  operator_reply_route: 'errorOperatorReplyRoute',
  verification_unavailable: 'errorVerificationUnavailable',
  invalid_status: 'errorInvalidStatus',
  note_required: 'errorNoteRequired',
  assessment_required: 'errorAssessmentRequired',
  assessment_missing: 'errorAssessmentMissing',
  warning_not_pending: 'errorWarningNotPending',
  warning_already_acknowledged: 'errorWarningAcknowledged',
  capacity_mismatch: 'errorCapacityMismatch',
  answers_count: 'errorAnswersCount',
  report_not_publishable: 'errorReportNotPublishable',
};

/** Only allowlisted localized text is shown. Unknown codes never expose server diagnostics. */
export function localizedApiError(code: string | undefined): string {
  if (code === 'API_UNCONFIRMED') return MESSAGES[currentLocale()].errors.apiFailed;
  if (code === 'API_UNAVAILABLE') return MESSAGES[currentLocale()].errors.apiUnavailable;
  const key = code ? API_ERROR_MESSAGE_KEYS[code] : undefined;
  const v = key ? MESSAGES[currentLocale()].community[key] : undefined;
  return typeof v === 'string' && v.trim() ? v : MESSAGES[currentLocale()].errors.apiFailed;
}

/** Localized fallback for an HTTP failure that carried no server error text. */
export function requestFailedMessage(status: number): string {
  return MESSAGES[currentLocale()].community.requestFailed.replace('{status}', String(status));
}

export function browserPreferences(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

function detectLocale(): Locale {
  return preferredLocale(storedLocale(), browserPreferences());
}

export type I18n = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  m: Messages;
};

// Default English context lets unit tests render components without a provider.
const defaultContext: I18n = { locale: 'en', setLocale: () => {}, m: en };
const I18nContext = createContext<I18n>(defaultContext);

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const value = storedLocale() ?? initialLocale ?? detectLocale();
    activeLocale = value;
    return value;
  });
  const m = MESSAGES[locale];

  useEffect(() => {
    document.documentElement.lang = LANG_TAGS[locale];
    document.documentElement.dir = 'ltr';
    document.documentElement.classList.toggle('rtl-text', RTL_TEXT_LOCALES.has(locale));
    document.title = m.meta.title;
  }, [locale, m]);

  useEffect(() => {
    activeLocale = locale;
    return () => {
      if (activeLocale === locale) activeLocale = undefined;
    };
  }, [locale]);

  const setLocale = (l: Locale) => {
    activeLocale = l;
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
