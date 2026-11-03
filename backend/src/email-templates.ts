import { MAIL_COPY } from './email-copy.js';
// Localized transactional mail templates for the community email auth flow.
// Every locale keeps the honest demo/testnet wording: these mails must never
// read like a production launch. English is the fallback for unknown or
// missing locales. {email} is interpolated at send time; the token is placed
// on its own line.

export const MAIL_LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'ja', 'ko', 'zh-CN', 'zh-TW', 'ar', 'hi'] as const;
export type MailLocale = (typeof MAIL_LOCALES)[number];

// Accepts the UI locale string (e.g. "pt", "pt-PT", "zh-cn") and returns a
// supported mail locale, falling back to English.
export function normalizeMailLocale(input: unknown): MailLocale {
  if (typeof input !== 'string') return 'en';
  const trimmed = input.trim();
  if (!trimmed) return 'en';
  const exact = MAIL_LOCALES.find((l) => l.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  const base = trimmed.split(/[-_]/)[0].toLowerCase();
  return MAIL_LOCALES.find((l) => l.toLowerCase() === base) ?? 'en';
}

const COPY = MAIL_COPY;

function fill(template: string, email: string): string {
  return template.split('{email}').join(email);
}

export function verificationEmail(locale: MailLocale, email: string, token: string): { subject: string; text: string } {
  const c = COPY[locale];
  return {
    subject: c.verifySubject,
    text: [c.verifyWelcome, '', fill(c.verifyConfirm, email), '', token, '', c.verifyIgnore, c.demoLine].join('\n'),
  };
}

export function resetEmail(locale: MailLocale, email: string, token: string): { subject: string; text: string } {
  const c = COPY[locale];
  return {
    subject: c.resetSubject,
    text: [c.resetTitle, '', fill(c.resetRequested, email), '', token, '', c.resetIgnore, c.resetSignout, c.demoLine].join('\n'),
  };
}
