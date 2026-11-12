import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { apiNotFound, jsonErrors } from '../src/json-errors.js';

test('JSON failures: malformed, oversized and unknown method/path always have stable codes', async () => {
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  app.post('/api/echo', (_req, res) => {
    res.json({ ok: true });
  });
  app.use(apiNotFound);
  app.use(jsonErrors);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const [method, path, body, status, code] of [
      ['POST', '/api/echo', '{', 400, 'invalid_input'],
      ['POST', '/api/echo', JSON.stringify({ text: 'x'.repeat(70000) }), 413, 'body_too_large'],
      ['GET', '/api/missing', undefined, 404, 'not_found'],
      ['PUT', '/api/missing', undefined, 404, 'not_found'],
    ] as const) {
      const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body });
      assert.equal(response.status, status);
      assert.match(response.headers.get('content-type') ?? '', /application\/json/);
      const payload = await response.json();
      assert.equal(payload.code, code);
      assert.equal(typeof payload.error, 'string');
      assert.ok(payload.error.length);
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('API not-found leaves host page and asset paths to later middleware', async () => {
  const app = express();
  app.use(apiNotFound);
  app.use((_req, res) => {
    res.status(200).send('later host route');
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const path of ['/', '/account', '/assets/main.js', '/apiary']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      assert.equal(await response.text(), 'later host route');
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
