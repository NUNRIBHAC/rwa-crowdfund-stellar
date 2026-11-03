// Codec guardrails for the Weblate-facing legal JSON encoding.
// 1. Roundtrip: every legal TS module survives blocks -> JSON -> blocks exactly.
// 2. Translator-facing shape: split fragments and type discriminators never
//    become units; one unit carries the full sentence with markup preserved.
// 3. Fail-closed: malformed markup, unknown variables/types, gapped indices
//    and reserved tokens in source strings all throw.
// 4. Base validation: markup/variable multiset drift is caught; legitimate
//    CJK reordering (bolded term moved to the front) is accepted.
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { blocksToJson, jsonToBlocks, parseInline, serializeInline, unitSkeleton, validateLegalAgainstBase } from './i18n-legal-codec.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = ['termsOfService', 'privacyPolicy', 'riskDisclosure', 'legalNotice', 'conflictsOfInterest', 'complaintsManagement', 'businessContinuity'];
const LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi'];

function toJs(source) {
  let s = source;
  s = s.replace(/^import type[^\n]*\n/gm, '');
  s = s.replace(/^export type[^\n]*\n/gm, '');
  s = s.replace(/export const (\w+)(: [A-Za-z[\]{}'; |]+)? = /, 'export default ');
  s = s.replace(/ as Record<string, string>/g, '');
  s = s.replace(/ as \{[^}]*\}\[\]/g, '');
  s = s.replace(/ as string\[\]/g, '');
  return s;
}
async function loadDoc(doc, locale) {
  const js = toJs(readFileSync(join(ROOT, 'src/i18n/legal', `${doc}.${locale}.ts`), 'utf8'));
  const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
  return mod.default;
}

// The serialized unit string has no representation for inert empty-string
// fragments (two CJK locales carry a leading "" from translator reordering).
// They render nothing and carry no markup, so the exact roundtrip contract is
// against blocks with empty strings removed; everything else is preserved.
function normalizeInline(inline) {
  return inline
    .filter((x) => x !== '')
    .map((x) => (typeof x === 'string' ? x : 'b' in x ? { b: normalizeInline(x.b) } : 'i' in x ? { i: normalizeInline(x.i) } : x));
}
function normalizeBlocks(blocks) {
  return blocks.map((b) => {
    if (b.t === 'table') return { ...b, head: b.head.map((r) => r.map(normalizeInline)), rows: b.rows.map((r) => r.map(normalizeInline)) };
    if (b.t === 'ul') return { ...b, items: b.items.map(normalizeInline) };
    return { ...b, text: normalizeInline(b.text) };
  });
}

describe('legal codec roundtrip', () => {
  for (const doc of DOCS) {
    for (const locale of LOCALES) {
      // A doc may be intentionally untranslated (no per-locale TS file): the
      // resolver serves English, so there is nothing to roundtrip.
      if (!existsSync(join(ROOT, 'src/i18n/legal', `${doc}.${locale}.ts`))) continue;
      it(`${doc}.${locale} survives blocks -> JSON -> blocks (modulo inert empty strings)`, async () => {
        const blocks = await loadDoc(doc, locale);
        expect(jsonToBlocks(blocksToJson(blocks))).toEqual(normalizeBlocks(blocks));
      });
    }
  }
});

describe('translator-facing unit shape', () => {
  it('folds bold label + space + variable into one unit', () => {
    const unit = serializeInline([{ b: ['Last updated:'] }, ' ', { v: 'lastUpdated' }], 't');
    expect(unit).toBe('<b>Last updated:</b> {v:lastUpdated}');
    expect(parseInline(unit, 't')).toEqual([{ b: ['Last updated:'] }, ' ', { v: 'lastUpdated' }]);
  });
  it('keeps block types in keys, never in values', async () => {
    const json = blocksToJson(await loadDoc('termsOfService', 'en'));
    const leaves = [];
    const walk = (v) => (typeof v === 'string' ? leaves.push(v) : Object.values(v).forEach(walk));
    walk(json);
    expect(leaves.some((u) => /^(notice|p|h2|ul|table)$/.test(u))).toBe(false);
    expect(leaves.some((u) => /^\s*$/.test(u))).toBe(false);
    expect(leaves.some((u) => u.length <= 2)).toBe(false);
  });
});

describe('fail-closed parsing', () => {
  it('rejects unbalanced markup', () => {
    expect(() => parseInline('<b>open only', 't')).toThrow(/unclosed/);
    expect(() => parseInline('text</b>', 't')).toThrow(/unmatched/);
    expect(() => parseInline('<b>x</i>', 't')).toThrow(/unmatched/);
  });
  it('rejects unknown variables', () => {
    expect(() => parseInline('{v:adminEmail}', 't')).toThrow(/unknown legal variable/);
  });
  it('rejects reserved tokens in source strings', () => {
    expect(() => serializeInline(['literal <b> in source'], 't')).toThrow(/reserved token/);
    expect(() => serializeInline(['literal {v:x} in source'], 't')).toThrow(/reserved token/);
  });
  it('rejects unknown block types and gapped indices', () => {
    expect(() => jsonToBlocks({ b00: { section: 'x' } })).toThrow(/unknown block type/);
    expect(() => jsonToBlocks({ b01: { p: 'x' } })).toThrow(/sequential/);
    expect(() => jsonToBlocks({ b00: { ul: { i01: 'x' } } })).toThrow(/sequential/);
    expect(() => jsonToBlocks({ b00: { table: { head: {}, foot: {} } } })).toThrow(/head and rows/);
  });
});

describe('base validation', () => {
  const diffs = (base, value) => {
    const d = [];
    validateLegalAgainstBase(base, value, 't', d);
    return d;
  };
  it('accepts CJK reordering of markup across words', () => {
    const base = { b00: { p: 'Connect a <b>Freighter</b> wallet' } };
    const value = { b00: { p: '<b>Freighter</b> ウォレットを接続' } };
    expect(diffs(base, value)).toEqual([]);
  });
  it('catches a dropped bold span', () => {
    const base = { b00: { p: 'Connect a <b>Freighter</b> wallet' } };
    expect(diffs(base, { b00: { p: 'Connect a Freighter wallet' } })).toHaveLength(1);
  });
  it('catches a swapped or dropped variable', () => {
    const base = { b00: { p: '<b>Last updated:</b> {v:lastUpdated}' } };
    expect(diffs(base, { b00: { p: '<b>Last updated:</b> {v:contactEmail}' } })).toHaveLength(1);
    expect(diffs(base, { b00: { p: '<b>Last updated:</b>' } })).toHaveLength(1);
  });
  it('catches malformed markup and structural key drift', () => {
    const base = { b00: { p: '<b>x</b>' } };
    expect(diffs(base, { b00: { p: '<b>x' } })).toHaveLength(1); // parse error surfaces
    expect(diffs(base, { b00: { p: '<b>x</b>' }, b01: { p: 'extra' } })).toHaveLength(1);
    expect(diffs(base, {})).toHaveLength(1);
  });
  it('skeleton ignores text but records tags and variables', () => {
    expect(unitSkeleton('a <b>b</b> {v:lastUpdated} <i>c</i>', 't')).toBe('b+|b-|i+|i-|v:lastUpdated');
  });
});
