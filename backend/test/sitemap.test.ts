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

test('sitemap.xml lists every public page path plus live campaign URLs', async () => {
  const app = express();
  registerDiscoveryEndpoints(app, { listCampaignIds: async () => ['demo-solar'] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/sitemap.xml`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /xml/);
    const body = await res.text();
    assert.match(body, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(body, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    const origin = `http://127.0.0.1:${new URL(base).port}`;
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.deepEqual(locs, [
      `${origin}/`,
      `${origin}/investments`,
      `${origin}/how-it-works`,
      `${origin}/learn`,
      `${origin}/glossary`,
      `${origin}/risk-warnings`,
      `${origin}/faq`,
      `${origin}/financing`,
      `${origin}/about`,
      `${origin}/terms-of-service`,
      `${origin}/privacy-policy`,
      `${origin}/risk-disclosure`,
      `${origin}/legal-notice`,
      `${origin}/conflicts-of-interest`,
      `${origin}/complaints-management`,
      `${origin}/business-continuity`,
      `${origin}/events`,
      `${origin}/blog`,
      `${origin}/press`,
      `${origin}/jobs`,
      `${origin}/podcast`,
      `${origin}/campaigns/demo-solar`,
    ]);
    // Private areas and API paths are never sitemap entries.
    assert.ok(!locs.some((l) => l.includes('/account')), 'no /account');
    assert.ok(!locs.some((l) => l.includes('/api')), 'no /api');
    assert.ok(!body.includes('#'), 'no hash-fragment URLs');
    assert.match(body, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
});

test('a campaign-registry failure still serves the static page list', async () => {
  const app = express();
  registerDiscoveryEndpoints(app, {
    listCampaignIds: async () => {
      throw new Error('registry down');
    },
  });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/sitemap.xml`);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /<loc>[^<]+\/investments<\/loc>/);
    assert.ok(!body.includes('/campaigns/'), 'no campaign URLs without a registry');
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

test('production without a configured origin fails closed (503), never reflects Host', async () => {
  const saved = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const app = express();
    registerDiscoveryEndpoints(app);
    await withServer(app, async (base) => {
      const res = await fetch(`${base}/sitemap.xml`, { headers: { host: 'evil.example.com' } });
      assert.equal(res.status, 503);
      const body = await res.text();
      assert.ok(!body.includes('evil.example.com'), 'request Host never reflected');
    });
  } finally {
    process.env.NODE_ENV = saved;
  }
});
