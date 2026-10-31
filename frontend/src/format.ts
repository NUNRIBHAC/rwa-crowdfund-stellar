// Display-only formatting. Amounts stay integer strings in 7-decimal units everywhere else.
import type { Locale } from './i18n';

const INTL_TAGS: Record<Locale, string> = {
  en: 'en-US',
  pt: 'pt-PT',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  'zh-TW': 'zh-TW',
  'zh-CN': 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ar: 'ar',
  hi: 'hi-IN',
};

export function units(v: string): string {
  const n = BigInt(v);
  return `${n / 10000000n}.${String(n % 10000000n).padStart(7, '0')}`;
}

function decimalSeparator(locale: Locale): string {
  return new Intl.NumberFormat(INTL_TAGS[locale]).formatToParts(1.1).find((p) => p.type === 'decimal')?.value ?? '.';
}

export function formatAmount(v: string, locale: Locale = 'en'): string {
  const n = BigInt(v);
  const whole = n / 10000000n;
  const frac = String(n % 10000000n)
    .padStart(7, '0')
    .replace(/0+$/, '');
  const grouped = new Intl.NumberFormat(INTL_TAGS[locale]).format(whole);
  return frac ? `${grouped}${decimalSeparator(locale)}${frac}` : grouped;
}

// Region display names follow the active locale; falls back to the raw code.
export function regionName(code: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([INTL_TAGS[locale]], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function percent(raised: string, goal: string): number {
  const g = BigInt(goal);
  if (g === 0n) return 0;
  const r = BigInt(raised);
  return Math.min(100, Number((r * 10000n) / g) / 100);
}

export type DeadlineLabels = {
  ended: string;
  underMinute: string;
  minutesLeft: (n: number) => string;
  hoursLeft: (n: number) => string;
  daysLeft: (n: number) => string;
};

// Locale-independent lifecycle state; the label is built separately with the
// active locale's wording.
export function deadlineState(seconds: string): 'open' | 'closing' | 'ended' {
  const rem = Number(seconds) * 1000 - Date.now();
  if (rem <= 0) return 'ended';
  return rem <= 3 * 86400000 ? 'closing' : 'open';
}

// Dates stay ISO 8601 (2026-11-05) in every locale: unambiguous and layout-stable.
export function deadlineInfo(seconds: string, l: DeadlineLabels): { date: string; label: string; state: 'open' | 'closing' | 'ended' } {
  const ms = Number(seconds) * 1000;
  const now = Date.now();
  const date = new Date(ms).toISOString().slice(0, 10);
  const rem = ms - now;
  if (rem <= 0) return { date, label: l.ended, state: 'ended' };
  const mins = Math.floor(rem / 60000);
  if (mins < 1) return { date, label: l.underMinute, state: 'closing' };
  if (mins < 60) return { date, label: l.minutesLeft(mins), state: 'closing' };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { date, label: l.hoursLeft(hours), state: 'closing' };
  const days = Math.ceil(rem / 86400000);
  if (days <= 3) return { date, label: l.daysLeft(days), state: 'closing' };
  return { date, label: l.daysLeft(days), state: 'open' };
}

export function shorten(id: string, head = 6, tail = 4): string {
  return id.length > head + tail + 3 ? `${id.slice(0, head)}...${id.slice(-tail)}` : id;
}
