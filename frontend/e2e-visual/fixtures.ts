import { test as base, expect } from '@playwright/test';
import { staticAsset } from '../../infra/media-static/export.mjs';

const types: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
  woff: 'font/woff',
  css: 'text/css',
};
// Never hit the public Worker/Pages in a screenshot matrix. Serve the actual
// hash-verified public bytes locally, including CSS's font dependencies. A
// missing fixture fails the test instead of silently making a network request.
export const test = base.extend({
  page: async ({ page }, run) => {
    const missing: string[] = [];
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      const external = url.hostname === 'blockallisto-media.nunrib-df6.workers.dev' || url.hostname.endsWith('.pages.dev');
      if (!external && !url.pathname.startsWith('/media/')) return route.continue();
      const key = decodeURIComponent(url.pathname.replace(/^\/media\//, '').replace(/^\//, ''));
      try {
        const data = staticAsset(key);
        await route.fulfill({
          status: 200,
          body: data,
          contentType: types[key.split('.').pop()!] || 'application/octet-stream',
          headers: { 'access-control-allow-origin': '*' },
        });
      } catch (error) {
        missing.push(key + ': ' + String(error));
        await route.abort('failed');
      }
    });
    await run(page);
    expect(missing, 'Every media request must have a verified local fixture').toEqual([]);
  },
});
export { expect };
