import source from './router.tsx?raw';
import { expect, test } from 'vitest';
import { PUBLIC_PAGES, VISUAL_LOCALES, VISUAL_WIDTHS } from '../e2e-visual/inventory';
import { routeFromPath, type RouteName } from './router';
import { LOCALES } from './i18n';

test('every current or future route must have a visual capture entry', () => {
  const declaration = source.split('export type RouteName =')[1].split(';')[0];
  const names = [...declaration.matchAll(/'([^']+)'/g)].map((match) => match[1]);
  const captured = PUBLIC_PAGES.map(({ path }) => routeFromPath(path).name);
  expect([...new Set(captured)].sort()).toEqual(names.sort());
  expect(captured.length).toBe(new Set(captured).size);
  expect(VISUAL_LOCALES.slice().sort()).toEqual(LOCALES.map(({ id }) => id).sort());
  expect(VISUAL_WIDTHS).toEqual([390, 820, 1440]);
  // Intentionally no exclusions. A new route fails until it has a capture;
  // protected states inside account need their own named synthetic state tests.
  expect(captured).toContain('account' satisfies RouteName);
});
