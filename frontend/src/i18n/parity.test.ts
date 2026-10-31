// Structural parity across locales: same sections, same array lengths, same
// item ids, same state enums. tsc enforces object keys; this covers the array
// content the compiler cannot see. Function values are checked for arity.
import { test, expect } from 'vitest';
import { en } from './locales/en';
import { pt } from './locales/pt';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';

const LOCALES = { pt, es, fr, de } as const;

function walk(a: unknown, b: unknown, path: string, errors: string[]) {
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      errors.push(`${path}: array length ${Array.isArray(b) ? (b as unknown[]).length : 'missing'} != en ${a.length}`);
      return;
    }
    a.forEach((item, i) => walk(item, (b as unknown[])[i], `${path}[${i}]`, errors));
    return;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') {
      errors.push(`${path}: not an object`);
      return;
    }
    for (const k of Object.keys(a as Record<string, unknown>)) {
      walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], path ? `${path}.${k}` : k, errors);
    }
    return;
  }
  if (typeof a === 'function') {
    if (typeof b !== 'function') errors.push(`${path}: expected function`);
    return;
  }
  if (typeof a !== typeof b) errors.push(`${path}: type ${typeof b} != en ${typeof a}`);
}

for (const [name, messages] of Object.entries(LOCALES)) {
  test(`${name} matches the English structure exactly`, () => {
    const errors: string[] = [];
    walk(en, messages, '', errors);
    expect(errors).toEqual([]);
  });

  test(`${name} keeps stable ids and state enums`, () => {
    expect(messages.faq.categories.map((c) => c.id)).toEqual(en.faq.categories.map((c) => c.id));
    for (let i = 0; i < en.faq.categories.length; i++) {
      expect(messages.faq.categories[i].entries.map((e) => e.state)).toEqual(en.faq.categories[i].entries.map((e) => e.state));
    }
    expect(messages.instruments.classes.map((c) => c.id)).toEqual(en.instruments.classes.map((c) => c.id));
    expect(messages.instruments.groups.map((g) => g.id)).toEqual(en.instruments.groups.map((g) => g.id));
    expect(messages.profiles.list.map((p) => p.campaignId)).toEqual(en.profiles.list.map((p) => p.campaignId));
    for (let i = 0; i < en.profiles.list.length; i++) {
      expect(messages.profiles.list[i].instrumentClass).toBe(en.profiles.list[i].instrumentClass);
      expect(messages.profiles.list[i].instrumentSeniority).toBe(en.profiles.list[i].instrumentSeniority);
      expect(messages.profiles.list[i].instrumentOverlays).toEqual(en.profiles.list[i].instrumentOverlays);
      expect(messages.profiles.list[i].country).toBe(en.profiles.list[i].country);
    }
    expect(Object.keys(messages.intent.statusLabels)).toEqual(Object.keys(en.intent.statusLabels));
    expect(Object.keys(messages.intent.actionLabels)).toEqual(Object.keys(en.intent.actionLabels));
  });
}
