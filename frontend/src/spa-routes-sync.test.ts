import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { routeFromPath } from './router';

// The production host answers unknown page paths with HTTP 404 using its own
// copy of the page list (backend/scripts/spa-routes.mjs). It must match the
// router, or a real page would be served as an error (or the reverse).
const source = readFileSync(join(__dirname, '..', '..', 'backend', 'scripts', 'spa-routes.mjs'), 'utf8');
const listed = [...source.slice(source.indexOf('SPA_SEGMENTS'), source.indexOf('];')).matchAll(/'([^']+)'/g)].map((m) => m[1]);

describe('server page list stays in sync with the router', () => {
  it('lists exactly the segments the router renders as pages', () => {
    expect(listed.length).toBeGreaterThan(20);
    for (const segment of listed) expect(routeFromPath('/' + segment).name, segment).not.toBe('not-found');
    expect(routeFromPath('/definitely-not-a-page').name).toBe('not-found');
    const router = readFileSync(join(__dirname, 'router.tsx'), 'utf8');
    const known = [...router.slice(router.indexOf('KNOWN_SEGMENTS = new Set(['), router.indexOf(']);')).matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect([...listed].sort()).toEqual([...known].sort());
  });
});
