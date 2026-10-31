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

function skeleton(inlines: LegalInline[]): string {
  return inlines.map((x) => (typeof x === 'string' ? 's' : 'b' in x ? `b(${skeleton(x.b)})` : 'i' in x ? `i(${skeleton(x.i)})` : `v(${x.v})`)).join('|');
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
function markers(blocks: LegalBlock[]): string[] {
  const text = JSON.stringify(blocks);
  return text.match(/\[[^\]\n]{1,120}\]/g) ?? [];
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
        expect(r.renderedLocale).toBe(LEGAL_REGISTRY[doc][locale] ? locale : 'en');
      }
    }
  });
});

describe('legal structural parity', () => {
  it('every translated file matches the English skeleton and markers', () => {
    for (const doc of DOC_IDS) {
      const per = LEGAL_REGISTRY[doc];
      const enSkeleton = blockSkeleton(per.en);
      const enMarkers = markers(per.en);
      for (const locale of LOCALES) {
        const translated = per[locale];
        if (!translated || locale === 'en') continue;
        expect(blockSkeleton(translated), `${doc}.${locale} skeleton`).toBe(enSkeleton);
        expect(markers(translated), `${doc}.${locale} [DEMO]/placeholder markers`).toEqual(enMarkers);
      }
    }
  });
});
