// FAQ content types. The localized questions and answers live in the i18n
// locale dictionaries (src/i18n/locales/*).
export type FaqState = 'live' | 'planned' | 'info';

export type FaqEntry = { q: string; a: string; state: string };

export type FaqCategory = { id: string; title: string; entries: FaqEntry[] };
