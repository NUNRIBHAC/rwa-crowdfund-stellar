import type { Route } from './router';

/** Explicit URL choices keep their existing meaning. No stored user setting. */
export function fixturePreference(search: string): boolean | null {
  const value = new URLSearchParams(search).get('fixtures');
  return value === '1' ? true : value === '0' ? false : null;
}

/** The presentation catalog is the default, not the user's account or real offers. */
export function sampleModeFor(route: Route, preference: boolean | null): boolean {
  if (preference !== null) return preference;
  return route.name === 'home' || route.name === 'investments' || (route.name === 'campaign' && !!route.campaignId?.startsWith('fixture-'));
}
