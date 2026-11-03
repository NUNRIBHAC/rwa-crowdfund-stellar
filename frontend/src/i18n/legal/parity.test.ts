// Legal translation guardrails.
// 1. Render smoke: every document renders from its block data (EN today,
//    fallback keeps every UI locale working).
// 2. Structural parity: any non-English locale file must have the same block
//    sequence, the same {b}/{i}/{v} inline skeleton, and the same [DEMO] /
//    bracketed-placeholder counts as English - disclaimers cannot be dropped
//    or translated away, and constants never fork.
// 3. Fallback language honesty: a missing locale resolves to English and
//    reports renderedLocale 'en' so the wrapper labels it lang=en dir=ltr.
// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import LegalDoc from '../../components/LegalDoc';
import { LEGAL_REGISTRY, legalBlocks } from './index';
import type { LegalBlock, LegalDocId, LegalInline } from './types';

const DOC_IDS = Object.keys(LEGAL_REGISTRY) as LegalDocId[];
const LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi'] as const;

// Empty-string fragments are inert (no content, no markup) and the Weblate
// JSON projection drops them; they must not count as structure here. Text
// runs collapse to a single 's' and items are compared as a sorted multiset:
// translators legitimately move a bolded term across word-order boundaries
// (CJK), so the contract is that no markup node or bound constant is dropped,
// added or swapped - not that tokens keep English positions. Block sequence
// stays strictly ordered; only the inline level is order-free.
function skeleton(inlines: LegalInline[]): string {
  const parts = inlines.filter((x) => x !== '');
  const nodes = parts.filter((x) => typeof x !== 'string').map((x) => ('b' in x ? `b(${skeleton(x.b)})` : 'i' in x ? `i(${skeleton(x.i)})` : `v(${x.v})`));
  if (parts.some((x) => typeof x === 'string')) nodes.push('s');
  return nodes.sort().join('|');
}
function blockSkeleton(blocks: LegalBlock[]): string {
  return blocks
    .map((b) => {
      if (b.t === 'table') return `table[${[...b.head, ...b.rows].map((r) => r.map(skeleton).join(',')).join(';')}]`;
      if (b.t === 'ul') return `ul[${b.items.map(skeleton).join(';')}]`;
      return `${b.t}(${skeleton(b.text)})`;
    })
    .join('\n');
}
function leafStrings(inlines: LegalInline[]): string[] {
  return inlines.flatMap((x) => (typeof x === 'string' ? [x] : 'b' in x ? leafStrings(x.b) : 'i' in x ? leafStrings(x.i) : []));
}
function blockStrings(blocks: LegalBlock[]): string[] {
  return blocks.flatMap((b) => {
    if (b.t === 'table') return [...b.head, ...b.rows].flatMap((r) => r.flatMap(leafStrings));
    if (b.t === 'ul') return b.items.flatMap(leafStrings);
    return leafStrings(b.text);
  });
}
// Bracketed markers ([DEMO], template placeholders) live in the TEXT content
// only. Regexing the JSON serialization would capture its own array brackets
// and make every genuine translation "fail". Placeholder sentences can exceed
// 120 chars, especially translated, so the span cap stays generous.
function markers(blocks: LegalBlock[]): string[] {
  return blockStrings(blocks).flatMap((t) => t.match(/\[[^\]\n]{1,400}\]/g) ?? []);
}
// Contract: identical marker COUNT per document (no placeholder dropped or
// unbracketed) and every literal [DEMO] marker preserved verbatim. The text
// INSIDE other placeholders may be translated; the brackets mark it as
// unresolved either way.
function markerCounts(blocks: LegalBlock[]): { total: number; demo: number } {
  const m = markers(blocks);
  return { total: m.length, demo: m.filter((x) => x === '[DEMO]').length };
}

describe('legal render smoke', () => {
  it('renders every document from data with non-empty text', () => {
    for (const doc of DOC_IDS) {
      const { container, unmount } = render(createElement(LegalDoc, { doc }));
      const div = container.querySelector('div[lang]')!;
      expect(div.getAttribute('lang')).toBe('en');
      expect(div.getAttribute('dir')).toBe('ltr');
      expect((div.textContent ?? '').length).toBeGreaterThan(500);
      expect(container.querySelector('.legal-demo-notice')).toBeTruthy();
      unmount();
    }
  });
});

describe('legal fallback honesty', () => {
  it('falls back to English and reports the rendered language', () => {
    for (const doc of DOC_IDS) {
      for (const locale of LOCALES) {
        const r = legalBlocks(doc, locale);
        expect(r.blocks.length).toBeGreaterThan(0);
        expect(r.renderedLocale).toBe(doc === 'privacyPolicy' && locale !== 'pt' ? 'en' : LEGAL_REGISTRY[doc][locale] ? locale : 'en');
      }
    }
  });
});

describe('legal structural parity', () => {
  it('every translated file matches the English skeleton and markers', () => {
    for (const doc of DOC_IDS) {
      const per = LEGAL_REGISTRY[doc];
      const enSkeleton = blockSkeleton(per.en);
      const enMarkers = markerCounts(per.en);
      for (const locale of LOCALES) {
        const translated = per[locale];
        if (!translated || locale === 'en' || (doc === 'privacyPolicy' && locale !== 'pt')) continue;
        expect(blockSkeleton(translated), `${doc}.${locale} skeleton`).toBe(enSkeleton);
        expect(markerCounts(translated), `${doc}.${locale} [DEMO]/placeholder marker counts`).toEqual(enMarkers);
      }
    }
  });
});
