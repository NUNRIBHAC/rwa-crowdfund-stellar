process.env.NODE_ENV = 'test';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { app } = await import('../dist/server.js');
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
app.use(express.static(dist));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) return res.sendFile(path.join(dist, 'index.html'));
  next();
});
const port = Number(process.env.PORT ?? 4000);
app.listen(port, process.env.HOST ?? '127.0.0.1', () => console.log(`host on ${port}`));
