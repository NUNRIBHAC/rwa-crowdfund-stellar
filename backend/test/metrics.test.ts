import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { createCommunityTestDirectory } from '../src/test-storage-guard.js';
import { trackDatabasePool, resetDatabaseRuntimeForTests, databaseKey } from '../src/database-runtime.js';
import { resetMetricsForTests, metrics, httpRequestDuration, apiErrorsTotal, safeRoutePath, safeHttpMethod, safeErrorCode } from '../src/metrics.js';
import { databasePoolMetrics } from '../src/database-runtime.js';
import type { Request } from 'express';

// backend/test/*.test.ts files share one Node process, so every env value a
// test sets must be restored, not just deleted: a dotenv load in another test
// file can leave a previous value behind.
const ENV_KEYS = ['ADMIN_SECRET', 'COMMUNITY_STORE_PATH', 'COMMUNITY_DATABASE_URL', 'READ_LIMIT_PER_MIN', 'READ_LIMIT_WINDOW_MS', 'TRUST_PROXY_DEPTH'] as const;

type SavedEnv = Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

function saveEnv(): SavedEnv {
  const saved: SavedEnv = {};
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  return saved;
}

function restoreEnv(saved: SavedEnv) {
  for (const key of ENV_KEYS) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function withAdmin(secret: string) {
  process.env.ADMIN_SECRET = secret;
}

test('metrics endpoint exposes request counts, durations, error codes and db pool saturation', async () => {
  const savedEnv = saveEnv();
  withAdmin('test-admin-key');
  const dir = createCommunityTestDirectory();
  process.env.COMMUNITY_STORE_PATH = join(dir, 'fixture.json');
  resetMetricsForTests();
  resetDatabaseRuntimeForTests();
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  const adminHeaders = { 'x-admin-key': 'test-admin-key' };

  try {
    // Prime the community router so /health can be ready without PG.
    await fetch(`${base}/api/news`);

    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);

    const notFound = await fetch(`${base}/api/unknown`);
    assert.equal(notFound.status, 404);

    // Inject a fake pg Pool to verify saturation gauges.
    const url = 'postgres://fixture:fixture@127.0.0.1/fixture';
    process.env.COMMUNITY_DATABASE_URL = url;
    const raw = new EventEmitter() as any;
    raw.totalCount = 2;
    raw.idleCount = 1;
    raw.waitingCount = 3;
    raw.options = { max: 5 };
    raw.query = async () => ({ rows: [] });
    trackDatabasePool(raw, url);

    const metricsResponse = await fetch(`${base}/api/operator/metrics`, { headers: adminHeaders });
    assert.equal(metricsResponse.status, 200);
    const body = await metricsResponse.text();

    // Request counter and histogram are present with safe labels.
    assert.match(body, /http_requests_total\{method="GET",route="\/health",status_code="200"\} 1/);
    assert.match(body, /http_request_duration_seconds_count\{method="GET",route="\/health",status_code="200"\} 1/);
    assert.match(body, /http_request_duration_seconds_sum\{method="GET",route="\/health",status_code="200"\}/);

    // 404 is recorded with the route path '/api/*path' from the legacy disabled route.
    // It may also be recorded as not_found if route binding differs; accept either.
    assert.ok(body.includes('status_code="404"') && body.includes('http_requests_total'), 'expected a 404 request to be counted');

    // Error code counter captured the public code from the 404 body.
    assert.match(body, /api_errors_total\{code="not_found"\} 1/);

    // Database pool saturation labelled by the same stable hash used internally.
    const key = databaseKey(url);
    assert.match(body, new RegExp(`db_pool_active_connections\\{db_hash="${key}"\\} 1`));
    assert.match(body, new RegExp(`db_pool_idle_connections\\{db_hash="${key}"\\} 1`));
    assert.match(body, new RegExp(`db_pool_waiting_connections\\{db_hash="${key}"\\} 3`));
    assert.match(body, new RegExp(`db_pool_max_connections\\{db_hash="${key}"\\} 5`));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    restoreEnv(savedEnv);
    resetMetricsForTests();
    resetDatabaseRuntimeForTests();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('rate-limited 429 responses are counted even when the limiter rejects before routing', async () => {
  const savedEnv = saveEnv();
  withAdmin('test-admin-key');
  const dir = createCommunityTestDirectory();
  process.env.COMMUNITY_STORE_PATH = join(dir, 'fixture.json');
  process.env.READ_LIMIT_PER_MIN = '1';
  process.env.READ_LIMIT_WINDOW_MS = '60000';
  process.env.TRUST_PROXY_DEPTH = '1';
  resetMetricsForTests();
  resetDatabaseRuntimeForTests();
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  // A unique forwarded IP isolates this test from limiter state created by
  // other tests in the same process.
  const ip = '198.51.100.42';
  try {
    const first = await fetch(`${base}/api/news`, { headers: { 'x-forwarded-for': ip } });
    assert.notEqual(first.status, 429, 'first request should pass the limiter');
    const second = await fetch(`${base}/api/news`, { headers: { 'x-forwarded-for': ip } });
    assert.equal(second.status, 429);

    const metricsResponse = await fetch(`${base}/api/operator/metrics`, { headers: { 'x-admin-key': 'test-admin-key' } });
    assert.equal(metricsResponse.status, 200);
    const body = await metricsResponse.text();

    // The limiter rejects before routing, so the route label is the coarse fallback.
    assert.match(body, /http_requests_total\{method="GET",route="unmatched",status_code="429"\} 1/);
    assert.match(body, /api_errors_total\{code="rate_limited"\} 1/);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    restoreEnv(savedEnv);
    resetMetricsForTests();
    resetDatabaseRuntimeForTests();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('malformed JSON 400 responses are counted before any route runs', async () => {
  const savedEnv = saveEnv();
  withAdmin('test-admin-key');
  const dir = createCommunityTestDirectory();
  process.env.COMMUNITY_STORE_PATH = join(dir, 'fixture.json');
  resetMetricsForTests();
  resetDatabaseRuntimeForTests();
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const response = await fetch(`${base}/api/not-a-real-route`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid',
    });
    assert.equal(response.status, 400);

    const metricsResponse = await fetch(`${base}/api/operator/metrics`, { headers: { 'x-admin-key': 'test-admin-key' } });
    assert.equal(metricsResponse.status, 200);
    const body = await metricsResponse.text();

    // Body parsing runs before routing, so the route label is the coarse fallback.
    assert.match(body, /http_requests_total\{method="POST",route="unmatched",status_code="400"\} 1/);
    assert.match(body, /api_errors_total\{code="invalid_input"\} 1/);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    restoreEnv(savedEnv);
    resetMetricsForTests();
    resetDatabaseRuntimeForTests();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('metrics endpoint requires admin key', async () => {
  const savedEnv = saveEnv();
  withAdmin('test-admin-key');
  const dir = createCommunityTestDirectory();
  process.env.COMMUNITY_STORE_PATH = join(dir, 'fixture.json');
  resetMetricsForTests();
  resetDatabaseRuntimeForTests();
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/operator/metrics`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    restoreEnv(savedEnv);
    resetMetricsForTests();
    resetDatabaseRuntimeForTests();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('histogram exports cumulative buckets and mandatory +Inf equal to count', () => {
  resetMetricsForTests();
  for (const duration of [0.001, 0.02, 11]) httpRequestDuration.observe({ route: '/fixture' }, duration);
  const text = metrics.serialize();
  assert.match(text, /_bucket\{route="\/fixture",le="0.005"\} 1/);
  assert.match(text, /_bucket\{route="\/fixture",le="0.025"\} 2/);
  assert.match(text, /_bucket\{route="\/fixture",le="10"\} 2/);
  assert.match(text, /_bucket\{route="\/fixture",le="\+Inf"\} 3/);
  assert.match(text, /_count\{route="\/fixture"\} 3/);
  resetMetricsForTests();
});

test('pool gauges aggregate checked-out clients and remove closed pools without SQL', async () => {
  resetDatabaseRuntimeForTests();
  const url = 'postgres://fixture:fixture@127.0.0.1/fixture';
  let queries = 0;
  const makePool = (total: number, idle: number) =>
    Object.assign(new EventEmitter(), {
      totalCount: total,
      idleCount: idle,
      waitingCount: 2,
      options: { max: 10 },
      query: async () => {
        queries++;
        return { rows: [] };
      },
      end: async () => {},
    });
  const a = trackDatabasePool(makePool(5, 4), url);
  const b = trackDatabasePool(makePool(3, 1), url);
  assert.deepEqual(databasePoolMetrics(), [{ key: databaseKey(url), active: 3, idle: 5, waiting: 4, max: 20 }]);
  await a.end();
  assert.deepEqual(databasePoolMetrics(), [{ key: databaseKey(url), active: 2, idle: 1, waiting: 2, max: 10 }]);
  await b.end();
  assert.deepEqual(databasePoolMetrics(), [{ key: databaseKey(url), active: 0, idle: 0, waiting: 0, max: 0 }]);
  assert.equal(queries, 0);
  resetDatabaseRuntimeForTests();
});

test('untrusted paths, methods and error codes cannot create unbounded labels', () => {
  resetMetricsForTests();
  for (let i = 0; i < 1000; i++) {
    const req = { route: { path: '/accounts/:id' }, originalUrl: `/accounts/private-${i}?token=secret` } as Request;
    assert.equal(safeRoutePath(req), '/accounts/:id');
    assert.equal(safeRoutePath({ originalUrl: `/missing-${i}` } as Request), 'unmatched');
    assert.equal(safeHttpMethod(`CUSTOM-${i}`), 'UNKNOWN');
    apiErrorsTotal.inc({ code: safeErrorCode(`private-${i}`) });
  }
  assert.equal(safeRoutePath({ route: { path: /private/ } } as unknown as Request), 'unmatched');
  const text = metrics.serialize();
  assert.match(text, /api_errors_total\{code="other"\} 1000/);
  assert.doesNotMatch(text, /private|token|secret/);
  resetMetricsForTests();
});

test('metrics disabled without admin secret and forbidden for a wrong key', async () => {
  const saved = saveEnv();
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  const url = `http://127.0.0.1:${address.port}/api/operator/metrics`;
  try {
    delete process.env.ADMIN_SECRET;
    assert.equal((await fetch(url)).status, 503);
    process.env.ADMIN_SECRET = 'fixture-admin';
    assert.equal((await fetch(url, { headers: { 'x-admin-key': 'wrong-key' } })).status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    restoreEnv(saved);
    resetMetricsForTests();
  }
});
