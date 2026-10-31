import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { registerDiscoveryEndpoints } from '../src/sitemap.js';

function withServer(app: express.Express, fn: (base: string) => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    const srv = app.listen(0, '127.0.0.1', async () => {
      const addr = srv.address();
      const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
      try {
        await fn(base);
        srv.close(() => resolve());
      } catch (err) {
        srv.close(() => reject(err));
      }
    });
  });
}

test('sitemap.xml is valid XML containing only the canonical root URL', async () => {
  const app = express();
  registerDiscoveryEndpoints(app);
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/sitemap.xml`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /xml/);
    const body = await res.text();
    assert.match(body, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(body, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    // Hash-routed SPA: fragments are not indexable, so only the root is listed.
    assert.deepEqual(locs, [`http://127.0.0.1:${new URL(base).port}/`]);
    assert.ok(!body.includes('#'), 'no hash-fragment URLs');
    assert.match(body, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
});

test('PUBLIC_ORIGIN env overrides request-derived origin', async () => {
  process.env.PUBLIC_ORIGIN = 'https://blockallisto-demo.onrender.com/';
  try {
    const app = express();
    registerDiscoveryEndpoints(app);
    await withServer(app, async (base) => {
      const res = await fetch(`${base}/sitemap.xml`);
      const body = await res.text();
      assert.match(body, /<loc>https:\/\/blockallisto-demo\.onrender\.com\/<\/loc>/);
    });
  } finally {
    delete process.env.PUBLIC_ORIGIN;
  }
});

test('robots.txt allows the site, excludes /api, references the sitemap', async () => {
  process.env.RENDER_EXTERNAL_URL = 'https://rwa-crowdfund-staging.onrender.com';
  try {
    const app = express();
    registerDiscoveryEndpoints(app);
    await withServer(app, async (base) => {
      const res = await fetch(`${base}/robots.txt`);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') ?? '', /text\/plain/);
      const body = await res.text();
      assert.match(body, /User-agent: \*/);
      assert.match(body, /Disallow: \/api\//);
      assert.match(body, /Sitemap: https:\/\/rwa-crowdfund-staging\.onrender\.com\/sitemap\.xml/);
    });
  } finally {
    delete process.env.RENDER_EXTERNAL_URL;
  }
});
