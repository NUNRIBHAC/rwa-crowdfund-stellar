// Production-style host: API + built frontend from one origin. Used by the
// hosted demo (Render). Unlike backend/e2e/host.mjs this does NOT enable
// test mode; it marks the server as embedded so importing it does not bind
// its own port.
process.env.EMBEDDED_HOST = '1';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { app } = await import('../dist/server.js');
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
// SEP-1: stellar.toml must be fetchable cross-origin as text/plain.
app.get('/.well-known/stellar.toml', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.type('text/plain');
  res.sendFile(path.join(dist, '.well-known', 'stellar.toml'), { dotfiles: 'allow' });
});
// Public-only static mirror, bind-mounted read-only from /var/oled. Never
// point this at a bucket export containing private uploads or credentials.
const mediaRoot = process.env.PUBLIC_MEDIA_DIR;
if (mediaRoot) {
  if (!path.isAbsolute(mediaRoot)) throw new Error('PUBLIC_MEDIA_DIR must be absolute');
  app.use(
    '/media',
    express.static(mediaRoot, {
      dotfiles: 'deny',
      index: false,
      fallthrough: false,
      maxAge: '1d',
      redirect: false,
      setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=86400'),
    }),
  );
} else {
  app.use('/media', (_req, res) => res.sendStatus(404));
}
app.use(express.static(dist));
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
