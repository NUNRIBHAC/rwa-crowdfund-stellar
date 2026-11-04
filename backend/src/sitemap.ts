import type { Express, Request } from 'express';

// Public indexable pages (path routing since the hash-router migration).
// Deliberately excluded: /account (private area), /api/*, and any page that
// only exists as a plan - sitemap entries must be real, served pages.
const PUBLIC_PATHS = [
  '/',
  '/campaigns',
  '/how-it-works',
  '/learn',
  '/glossary',
  '/risk-warnings',
  '/faq',
  '/financing',
  '/about',
  '/terms-of-service',
  '/privacy-policy',
  '/risk-disclosure',
  '/legal-notice',
  '/conflicts-of-interest',
  '/complaints-management',
  '/business-continuity',
  '/events',
  '/blog',
  '/press',
  '/jobs',
  '/podcast',
];

// Machine-readable sitemap + robots endpoints.
//
// The SPA uses path routing (frontend/src/router.tsx) with a server-side
// extension-less-GET fallback, so every PUBLIC_PATHS entry is a real,
// independently indexable URL. Keep this list in sync with the router:
// every public page belongs here; /account and /api stay out.
//
// Origin resolution order: PUBLIC_ORIGIN env (set in production), then Render's
// injected RENDER_EXTERNAL_URL, then the request Host header. This keeps the
// same build correct on demo, staging and any future domain with zero config.

// Canonical origin must be source-backed: PUBLIC_ORIGIN, then Render's
// injected RENDER_EXTERNAL_URL. Never reflect an arbitrary Host header into
// sitemap/robots output on a public deployment - the Host fallback exists only
// for local development. In production with neither env set, fail closed (503).
function publicOrigin(req: Request): string | null {
  const configured = process.env.PUBLIC_ORIGIN ?? process.env.RENDER_EXTERNAL_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') return null;
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() || req.protocol;
  return `${proto}://${req.get('host')}`;
}

function sitemapXml(origin: string, campaignIds: string[]): string {
  const lastmod = new Date().toISOString().slice(0, 10);
  const paths = [...PUBLIC_PATHS, ...campaignIds.map((id) => `/campaigns/${encodeURIComponent(id)}`)];
  const urls = paths.map((p) => `  <url>\n    <loc>${origin}${p}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`).join('');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n';
}

export interface DiscoveryOptions {
  // Live campaign ids, so the sitemap tracks the actual campaign registry on
  // every request (auto-maintained as campaigns come and go).
  listCampaignIds?: () => Promise<string[]>;
}

export function registerDiscoveryEndpoints(app: Express, options: DiscoveryOptions = {}): void {
  // Permanent alias preserves existing bookmarks and their query parameters.
  app.get('/investments', (req, res) => {
    const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    res.redirect(308, `/campaigns${query}`);
  });
  app.get('/sitemap.xml', async (req, res) => {
    const origin = publicOrigin(req);
    if (!origin) return res.status(503).json({ error: 'public origin not configured' });
    let campaignIds: string[] = [];
    try {
      campaignIds = (await options.listCampaignIds?.()) ?? [];
    } catch {
      // A campaign-registry failure must not take down the sitemap.
    }
    res.type('application/xml').send(sitemapXml(origin, campaignIds));
  });
  app.get('/robots.txt', (req, res) => {
    const origin = publicOrigin(req);
    if (!origin) return res.status(503).json({ error: 'public origin not configured' });
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`);
  });
}
