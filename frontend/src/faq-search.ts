// FAQ keyword search: every typed word must appear somewhere in the question
// or answer, in any order, ignoring case and accents (so "comissao" finds
// "comissão"). Words are split on whitespace and punctuation; CJK text has no
// spaces, so a run of such characters is matched as one substring.
const strip = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase();

export function faqSearchWords(query: string): string[] {
  return strip(query)
    .split(/[\s,.;:!?()"'/\\-]+/u)
    .filter(Boolean);
}

export function faqMatches(text: string, words: string[]): boolean {
  const haystack = strip(text);
  return words.every((w) => haystack.includes(w));
}
