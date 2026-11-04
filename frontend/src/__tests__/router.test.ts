import { describe, test, expect } from 'vitest';
import { routeFromPath, routePath, routeFromHash, routeHash } from '../router';

describe('routeFromPath', () => {
  test('root is home', () => {
    expect(routeFromPath('/')).toEqual({ name: 'home' });
  });
  test.each([
    ['/investments', 'investments'],
    ['/how-it-works', 'how-it-works'],
    ['/learn', 'learn'],
    ['/glossary', 'glossary'],
    ['/risk-warnings', 'risk-warnings'],
    ['/faq', 'faq'],
    ['/financing', 'financing'],
    ['/for-businesses', 'financing'],
    ['/about', 'about'],
    ['/account', 'account'],
    ['/terms-of-service', 'terms-of-service'],
    ['/privacy-policy', 'privacy-policy'],
    ['/risk-disclosure', 'risk-disclosure'],
  ] as const)('%s parses', (path, name) => {
    expect(routeFromPath(path)).toEqual({ name });
  });
  test('campaign id round-trips with encoding', () => {
    expect(routeFromPath('/campaigns/demo-solar')).toEqual({ name: 'campaign', campaignId: 'demo-solar' });
    expect(routeFromPath('/campaigns/a%20b')).toEqual({ name: 'campaign', campaignId: 'a b' });
  });
  test('/campaigns without id falls back to investments', () => {
    expect(routeFromPath('/campaigns')).toEqual({ name: 'investments' });
    expect(routeFromPath('/campaigns/')).toEqual({ name: 'investments' });
  });
  test('unknown segments keep the home fallback', () => {
    expect(routeFromPath('/no-such-page')).toEqual({ name: 'home' });
  });
});

describe('routePath', () => {
  test('serializes every static route', () => {
    expect(routePath({ name: 'home' })).toBe('/');
    expect(routePath({ name: 'risk-warnings' })).toBe('/risk-warnings');
    expect(routePath({ name: 'account' })).toBe('/account');
  });
  test('listing links use the canonical campaigns path', () => {
    expect(routePath({ name: 'investments' })).toBe('/campaigns');
    expect(routeFromPath('/investments')).toEqual(routeFromPath('/campaigns'));
  });
  test('business page links use the canonical for-businesses path', () => {
    expect(routePath({ name: 'financing' })).toBe('/for-businesses');
    expect(routeFromPath('/financing')).toEqual(routeFromPath('/for-businesses'));
  });
  test('campaign ids are encoded', () => {
    expect(routePath({ name: 'campaign', campaignId: 'a b' })).toBe('/campaigns/a%20b');
  });
  test('round-trips through routeFromPath', () => {
    const names = [
      'home',
      'investments',
      'how-it-works',
      'learn',
      'glossary',
      'risk-warnings',
      'faq',
      'financing',
      'about',
      'account',
      'terms-of-service',
      'privacy-policy',
      'risk-disclosure',
    ] as const;
    for (const name of names) {
      expect(routeFromPath(routePath({ name }))).toEqual({ name });
    }
    expect(routeFromPath(routePath({ name: 'campaign', campaignId: 'x' }))).toEqual({ name: 'campaign', campaignId: 'x' });
  });
});

describe('legacy hash compatibility', () => {
  test('routeFromHash parses #/ links', () => {
    expect(routeFromHash('#/')).toEqual({ name: 'home' });
    expect(routeFromHash('#/investments')).toEqual({ name: 'investments' });
    expect(routeFromHash('#/campaigns/demo-solar')).toEqual({ name: 'campaign', campaignId: 'demo-solar' });
  });
  test('routeHash keeps its name and emits path URLs', () => {
    expect(routeHash({ name: 'investments' })).toBe('/campaigns');
    expect(routeHash({ name: 'campaign', campaignId: 'demo-solar' })).toBe('/campaigns/demo-solar');
    // A legacy hash link and its path upgrade resolve to the same route.
    expect(routeFromHash('#/campaigns/demo-solar')).toEqual(routeFromPath(routeHash({ name: 'campaign', campaignId: 'demo-solar' })));
  });
});
