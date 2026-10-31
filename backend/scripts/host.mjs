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
app.use(express.static(dist));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) return res.sendFile(path.join(dist, 'index.html'));
  next();
});
const port = Number(process.env.PORT ?? 4000);
app.listen(port, process.env.HOST ?? '0.0.0.0', () => console.log(`host on ${port}`));
