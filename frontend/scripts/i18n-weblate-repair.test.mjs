// Behavioral guardrails for the Weblate return-flow repair tool.
// 1. Dropped empty containers (arrays and objects) are restored at their
//    base paths, including inside parallel array elements.
// 2. Missing non-empty subtrees or scalars are never restored - that is a
//    different failure class and must stay visible in the diff.
// 3. Keys come back in base order so the repaired diff shows only real
//    translation edits; target-only keys keep their order at the end.
// 4. A complete file is a no-op (Weblate's array pretty-expansion is a
//    formatting concern the import -> export round trip already absorbs).
import { describe, expect, it } from 'vitest';
import { isEmptyContainer, repairTree } from './i18n-weblate-repair.mjs';

describe('isEmptyContainer', () => {
  it('recognizes empty arrays and objects only', () => {
    expect(isEmptyContainer([])).toBe(true);
    expect(isEmptyContainer({})).toBe(true);
    expect(isEmptyContainer(['a'])).toBe(false);
    expect(isEmptyContainer({ a: 1 })).toBe(false);
    expect(isEmptyContainer('')).toBe(false);
    expect(isEmptyContainer(null)).toBe(false);
    expect(isEmptyContainer(0)).toBe(false);
  });
});

describe('repairTree', () => {
  it('restores a dropped empty array, in base key order', () => {
    const base = { title: 'T', news: [], action: 'A' };
    const target = { action: 'A translated', title: 'T translated' };
    const { fixed, repairs } = repairTree(base, target);
    expect(repairs).toEqual(['news']);
    expect(fixed.news).toEqual([]);
    expect(Object.keys(fixed)).toEqual(['title', 'news', 'action']);
    expect(fixed.title).toBe('T translated');
  });

  it('restores empty containers nested inside parallel array elements', () => {
    const base = {
      campaigns: [
        { label: 'a', news: [] },
        { label: 'b', news: [], links: {} },
      ],
    };
    const target = {
      campaigns: [{ label: 'a t', news: [] }, { label: 'b t' }],
    };
    const { fixed, repairs } = repairTree(base, target);
    expect(repairs.sort()).toEqual(['campaigns[1].links', 'campaigns[1].news']);
    expect(fixed.campaigns[1]).toEqual({ label: 'b t', news: [], links: {} });
  });

  it('never restores missing non-empty subtrees or scalars', () => {
    const base = { section: { a: 'x' }, note: 'n', empty: [] };
    const target = {};
    const { fixed, repairs } = repairTree(base, target);
    expect(repairs).toEqual(['empty']);
    expect(fixed).toEqual({ empty: [] });
  });

  it('treats null placeholders in arrays as stable positions', () => {
    const base = { list: [{ id: 'x', tags: [] }] };
    const target = { list: [null] };
    const { fixed, repairs } = repairTree(base, target);
    expect(repairs).toEqual([]);
    expect(fixed.list).toEqual([null]);
  });

  it('is a no-op on a complete file, regardless of array formatting', () => {
    const base = { steps: ['a', 'b'], news: [] };
    // Same content as Weblate would emit after pretty-expanding the array:
    // JSON.parse collapses the formatting difference before repair runs.
    const target = JSON.parse('{ "steps": [\n "a",\n "b"\n ], "news": [] }');
    const { fixed, repairs } = repairTree(base, target);
    expect(repairs).toEqual([]);
    expect(fixed).toEqual(base);
  });

  it('keeps target-only keys at the end in their own order', () => {
    const base = { a: '1', b: [] };
    const target = { b: [], extra2: 'y', a: '1', extra1: 'z' };
    const { fixed } = repairTree(base, target);
    expect(Object.keys(fixed)).toEqual(['a', 'b', 'extra2', 'extra1']);
  });

  it('does not touch a base scalar path that Weblate translated', () => {
    const base = { title: 'Hello' };
    const target = { title: 'Bonjour' };
    const { fixed, repairs } = repairTree(base, target);
    expect(repairs).toEqual([]);
    expect(fixed.title).toBe('Bonjour');
  });
});
