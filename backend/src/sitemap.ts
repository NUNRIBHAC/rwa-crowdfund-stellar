import type { Express, Request } from 'express';

// Machine-readable sitemap + robots endpoints.
//
// The SPA uses hash routing (frontend/src/router.tsx): every page lives under
// the root URL with a #/fragment. URL fragments are never sent to servers and
// are not separately indexable, so an honest sitemap lists exactly the canonical
// root URL. Listing #/ routes would produce invalid/unindexable sitemap entries
// and claim pages search engines cannot see. If the frontend later moves to
// path routing with server rewrites, extend the URL list here (backend owns
// this endpoint so it stays correct on every deploy without touching dist).
//
// Origin resolution order: PUBLIC_ORIGIN env (set in production), then Render's
// injected RENDER_EXTERNAL_URL, then the request Host header. This keeps the
// same build correct on demo, staging and any future domain with zero config.

function publicOrigin(req: Request): string {
  const configured = process.env.PUBLIC_ORIGIN ?? process.env.RENDER_EXTERNAL_URL;
  if (configured) return configured.replace(/\/+$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() || req.protocol;
  return `${proto}://${req.get('host')}`;
}

function sitemapXml(origin: string): string {
  const lastmod = new Date().toISOString().slice(0, 10);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url>\n' +
    `    <loc>${origin}/</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    '  </url>\n' +
    '</urlset>\n'
  );
}

export function registerDiscoveryEndpoints(app: Express): void {
  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml').send(sitemapXml(publicOrigin(req)));
  });
  app.get('/robots.txt', (req, res) => {
    const origin = publicOrigin(req);
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`);
  });
}
