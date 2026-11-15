// Production-style host: API + built frontend from one origin. Used by the
// hosted demo (Render). Unlike backend/e2e/host.mjs this does NOT enable
// test mode; it marks the server as embedded so importing it does not bind
// its own port.
process.env.EMBEDDED_HOST = '1';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createMediaGateway } from './media-gateway.mjs';
const { app } = await import('../dist/server.js');
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
// SEP-1: stellar.toml must be fetchable cross-origin as text/plain.
app.get('/.well-known/stellar.toml', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.type('text/plain');
  res.sendFile(path.join(dist, '.well-known', 'stellar.toml'), { dotfiles: 'allow' });
});
// Metadata only. /media is a bounded public gateway, never a filesystem mount.
// The final direct-B2 leg stays disabled unless all three secret/accounting
// file paths are explicitly supplied by a separately approved release.
const mediaIndex = JSON.parse(await readFile(new URL('../dist/public-media-index.json', import.meta.url), 'utf8'));
const directPaths = [process.env.MEDIA_B2_KEY_ID_FILE, process.env.MEDIA_B2_KEY_FILE, process.env.MEDIA_B2_BUDGET_FILE];
if (directPaths.some(Boolean) && (!directPaths.every(Boolean) || directPaths.some((p) => !path.isAbsolute(p))))
  throw Error('Incomplete media gateway configuration');
app.use(
  '/media',
  createMediaGateway({ index: mediaIndex, keyFiles: directPaths.every(Boolean) ? directPaths.slice(0, 2) : undefined, budgetFile: directPaths[2] }),
);

app.use(
  express.static(dist, {
    setHeaders: (res, file) => {
      // Only content-fingerprinted public JS/CSS get a long-lived cache.
      // HTML, manifests and personal/API responses remain no-store.
      if (/[/\\]assets[/\\][^/\\]+-[A-Za-z0-9_-]{8,}\.(?:js|css)$/.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }),
);
// SPA fallback for path routing: only extension-less GET page paths get
// index.html (deep links like /campaigns/demo-solar). Asset-like paths
// (/assets/x.js, /og-image.png) 404 honestly instead of serving HTML with the
// wrong MIME; /api and the discovery endpoints are handled above.
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !path.extname(req.path)) return res.sendFile(path.join(dist, 'index.html'));
  next();
});
const port = Number(process.env.PORT ?? 4000);
app.listen(port, process.env.HOST ?? '0.0.0.0', () => console.log(`host on ${port}`));
