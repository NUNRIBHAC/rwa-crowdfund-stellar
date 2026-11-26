import { describe, expect, it } from 'vitest';
import { faqMatches, faqSearchWords } from './faq-search';

describe('FAQ keyword search', () => {
  it('splits a query into lowercase accent-free words', () => {
    expect(faqSearchWords('  Comissão,  RISCO? ')).toEqual(['comissao', 'risco']);
    expect(faqSearchWords('   ')).toEqual([]);
  });
  it('requires every word, in any order', () => {
    const text = 'How are fees charged? Fees are shown before you contribute.';
    expect(faqMatches(text, faqSearchWords('contribute fees'))).toBe(true);
    expect(faqMatches(text, faqSearchWords('fees refund'))).toBe(false);
  });
  it('ignores accents on both sides', () => {
    expect(faqMatches('A comissão é mostrada antes', faqSearchWords('comissao'))).toBe(true);
    expect(faqMatches('Commission is shown', faqSearchWords('comission'))).toBe(false);
  });
  it('matches CJK runs as substrings', () => {
    expect(faqMatches('投资风险和费用', faqSearchWords('风险'))).toBe(true);
  });
});
