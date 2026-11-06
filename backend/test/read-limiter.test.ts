// read-limiter middleware contract tests. Isolated from server.ts on purpose:
// these pin the coverage set, rejection shape, and IP keying - not app boot.
// Each test gets a FRESH app+limiter so buckets never leak between tests.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { readLimiter } from '../src/read-limiter.js';

const ENV_KEYS = ['READ_LIMIT_PER_MIN', 'READ_LIMIT_WINDOW_MS', 'READ_LIMIT_MAX_KEYS', 'TRUST_PROXY_DEPTH', 'TRUST_PROXY', 'XFF_DEBUG'] as const;
const savedEnv: Record<string, string | undefined> = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));

after(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

interface App {
  base: string;
  hits: Record<string, number>;
  close: () => Promise<void>;
}

async function freshApp(env: Record<string, string> = { READ_LIMIT_PER_MIN: '2', READ_LIMIT_WINDOW_MS: '60000' }): Promise<App> {
  for (const k of ENV_KEYS) delete process.env[k];
  Object.assign(process.env, env);
  const hits: Record<string, number> = {};
  const app = express();
  app.use(readLimiter());
  const hit = (name: string) => (req: express.Request, res: express.Response) => {
    hits[name] = (hits[name] ?? 0) + 1;
    res.json({ ok: true });
  };
  app.get('/api/campaigns', hit('campaigns'));
  app.get('/api/campaigns/:id/comments', hit('comments'));
  app.get('/api/account/activity', hit('activity'));
  app.get('/api/news', hit('news'));
  app.get('/health', hit('health'));
  app.get('/api/auth/me', hit('authme'));
  app.options('/api/campaigns', hit('options'));
  app.post('/api/campaigns', hit('post'));
  const srv = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = srv.address();
  return {
    base: `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`,
    hits,
    close: () => new Promise((resolve) => srv.close(() => resolve())),
  };
}

test('under the limit, covered reads pass through to the handler', async () => {
  const app = await freshApp();
  try {
    assert.equal((await fetch(app.base + '/api/news')).status, 200);
    assert.equal((await fetch(app.base + '/api/news')).status, 200);
    assert.equal(app.hits.news, 2);
  } finally {
    await app.close();
  }
});

test('over the limit: 429 + Retry-After + code, and the handler is never touched', async () => {
  const app = await freshApp();
  try {
    assert.equal((await fetch(app.base + '/api/campaigns')).status, 200);
    assert.equal((await fetch(app.base + '/api/campaigns')).status, 200);
    const r3 = await fetch(app.base + '/api/campaigns');
    assert.equal(r3.status, 429);
    assert.equal(r3.headers.get('retry-after'), '60');
    const body = await r3.json();
    assert.equal(body.code, 'rate_limited');
    // the DB-backed handler was never reached by the rejected request
    assert.equal(app.hits.campaigns, 2);
  } finally {
    await app.close();
  }
});

test('exempt surfaces are never limited: /health, OPTIONS, /api/auth/*, non-GET', async () => {
  const app = await freshApp();
  try {
    for (let i = 0; i < 4; i++) {
      assert.equal((await fetch(app.base + '/health')).status, 200);
      assert.equal((await fetch(app.base + '/api/campaigns', { method: 'OPTIONS' })).status, 200);
      assert.equal((await fetch(app.base + '/api/auth/me')).status, 200);
      assert.equal((await fetch(app.base + '/api/campaigns', { method: 'POST' })).status, 200);
    }
    assert.deepEqual(app.hits, { health: 4, options: 4, authme: 4, post: 4 });
  } finally {
    await app.close();
  }
});

test('covered paths share one per-IP bucket (flood across paths is still capped)', async () => {
  const app = await freshApp();
  try {
    assert.equal((await fetch(app.base + '/api/campaigns/some-campaign/comments')).status, 200);
    assert.equal((await fetch(app.base + '/api/account/activity')).status, 200);
    assert.equal((await fetch(app.base + '/api/news')).status, 429);
  } finally {
    await app.close();
  }
});

test('without TRUST_PROXY_DEPTH a spoofed XFF is ignored (socket address keys the bucket)', async () => {
  const app = await freshApp();
  try {
    // exhaust the socket-address bucket
    assert.equal((await fetch(app.base + '/api/news')).status, 200);
    assert.equal((await fetch(app.base + '/api/news')).status, 200);
    // a spoofed XFF does NOT buy a fresh bucket
    assert.equal((await fetch(app.base + '/api/news', { headers: { 'x-forwarded-for': '203.0.113.99' } })).status, 429);
  } finally {
    await app.close();
  }
});

test('TRUST_PROXY_DEPTH=1 keys on the client entry; distinct clients get distinct buckets', async () => {
  const app = await freshApp({ READ_LIMIT_PER_MIN: '2', READ_LIMIT_WINDOW_MS: '60000', TRUST_PROXY_DEPTH: '1' });
  try {
    // deployed topology: https-portal appends exactly ONE entry (the client),
    // so with depth=1 the chain is a single entry and that entry is the key
    const a = { 'x-forwarded-for': '198.51.100.7' };
    assert.equal((await fetch(app.base + '/api/news', { headers: a })).status, 200);
    assert.equal((await fetch(app.base + '/api/news', { headers: a })).status, 200);
    assert.equal((await fetch(app.base + '/api/news', { headers: a })).status, 429);
    // a different client entry has its own fresh bucket
    assert.equal((await fetch(app.base + '/api/news', { headers: { 'x-forwarded-for': '192.0.2.44' } })).status, 200);
  } finally {
    await app.close();
  }
});

test('chain shorter than the trusted depth falls back to the (unspoofable) socket address', async () => {
  const app = await freshApp({ READ_LIMIT_PER_MIN: '2', READ_LIMIT_WINDOW_MS: '60000', TRUST_PROXY_DEPTH: '2' });
  try {
    // single-entry chain: depth guess is wrong, so the socket address keys the
    // bucket - an attacker cannot rotate XFF to escape it
    assert.equal((await fetch(app.base + '/api/news', { headers: { 'x-forwarded-for': '198.51.100.7' } })).status, 200);
    assert.equal((await fetch(app.base + '/api/news', { headers: { 'x-forwarded-for': '192.0.2.44' } })).status, 200);
    assert.equal((await fetch(app.base + '/api/news', { headers: { 'x-forwarded-for': '203.0.113.9' } })).status, 429);
  } finally {
    await app.close();
  }
});

test('cardinality bound: while the key table is full, NEW keys are 429 but existing keys keep their budget', async () => {
  const app = await freshApp({ READ_LIMIT_PER_MIN: '5', READ_LIMIT_WINDOW_MS: '60000', READ_LIMIT_MAX_KEYS: '2', TRUST_PROXY_DEPTH: '1' });
  try {
    const a = { 'x-forwarded-for': '198.51.100.7' };
    const b = { 'x-forwarded-for': '192.0.2.44' };
    assert.equal((await fetch(app.base + '/api/news', { headers: a })).status, 200);
    assert.equal((await fetch(app.base + '/api/news', { headers: b })).status, 200);
    // table full (2 keys): a brand-new client is rejected without being recorded
    assert.equal((await fetch(app.base + '/api/news', { headers: { 'x-forwarded-for': '203.0.113.9' } })).status, 429);
    // existing keys are unaffected by the overflow
    assert.equal((await fetch(app.base + '/api/news', { headers: a })).status, 200);
  } finally {
    await app.close();
  }
});

test("cardinality bound is not a bypass: flooding fresh keys never resets an existing key's budget", async () => {
  const app = await freshApp({ READ_LIMIT_PER_MIN: '2', READ_LIMIT_WINDOW_MS: '60000', READ_LIMIT_MAX_KEYS: '3', TRUST_PROXY_DEPTH: '1' });
  try {
    const a = { 'x-forwarded-for': '198.51.100.7' };
    // exhaust client A's budget
    assert.equal((await fetch(app.base + '/api/news', { headers: a })).status, 200);
    assert.equal((await fetch(app.base + '/api/news', { headers: a })).status, 200);
    assert.equal((await fetch(app.base + '/api/news', { headers: a })).status, 429);
    // attacker floods fresh keys; they are rejected once the table is full...
    for (let i = 0; i < 10; i++) {
      await fetch(app.base + '/api/news', { headers: { 'x-forwarded-for': `203.0.113.${i}` } });
    }
    // ...and A is STILL limited (no eviction reset A's counter)
    assert.equal((await fetch(app.base + '/api/news', { headers: a })).status, 429);
  } finally {
    await app.close();
  }
});

test('soroban transaction status GET is covered (manual invest status check)', async () => {
  const app = await freshApp();
  try {
    const hash = 'a'.repeat(64);
    // handler is not registered on this test app for the soroban path; the
    // limiter runs first, so over-limit requests 429 regardless (404/200 below limit)
    await fetch(app.base + `/api/soroban/transactions/${hash}`);
    await fetch(app.base + `/api/soroban/transactions/${hash}`);
    assert.equal((await fetch(app.base + `/api/soroban/transactions/${hash}`)).status, 429);
  } finally {
    await app.close();
  }
});

test('invalid limit env falls back to defaults (fail closed, no crash)', async () => {
  const app = await freshApp({ READ_LIMIT_PER_MIN: 'junk', READ_LIMIT_WINDOW_MS: '50' });
  try {
    // defaults are 240/60000: several reads pass
    for (let i = 0; i < 5; i++) assert.equal((await fetch(app.base + '/api/news')).status, 200);
  } finally {
    await app.close();
  }
});
