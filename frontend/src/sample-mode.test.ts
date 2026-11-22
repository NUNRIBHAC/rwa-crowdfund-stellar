import { expect, test } from 'vitest';
import { fixturePreference, sampleModeFor } from './sample-mode';
import type { Route } from './router';

for (const [search, expected] of [
  ['', null],
  ['?fixtures=1', true],
  ['?fixtures=0', false],
  ['?fixtures=other', null],
] as const) {
  test(`URL preference ${search || '(none)'}`, () => expect(fixturePreference(search)).toBe(expected));
}

const routes: [Route, boolean][] = [
  [{ name: 'home' }, true],
  [{ name: 'investments' }, true],
  [{ name: 'campaign', campaignId: 'fixture-raiz-vertical' }, true],
  [{ name: 'campaign', campaignId: 'staging-load' }, false],
  [{ name: 'campaign' }, false],
  [{ name: 'account' }, false],
  [{ name: 'financing' }, false],
  [{ name: 'campaign-builder' }, false],
  [{ name: 'how-it-works' }, false],
  [{ name: 'not-found' }, false],
];
for (const [route, expected] of routes) {
  test(`${route.name}/${route.campaignId || ''}: default presentation scope`, () => expect(sampleModeFor(route, null)).toBe(expected));
  test(`${route.name}/${route.campaignId || ''}: explicit sample remains sample`, () => expect(sampleModeFor(route, true)).toBe(true));
  test(`${route.name}/${route.campaignId || ''}: explicit live remains live`, () => expect(sampleModeFor(route, false)).toBe(false));
}
