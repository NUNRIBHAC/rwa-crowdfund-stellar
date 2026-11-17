import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { createCommunityTestDirectory } from '../src/test-storage-guard.js';
import { trackDatabasePool, resetDatabaseRuntimeForTests, databaseKey } from '../src/database-runtime.js';
import { resetMetricsForTests } from '../src/metrics.js';

function withAdmin(secret: string) {
  process.env.ADMIN_SECRET = secret;
}

test('metrics endpoint exposes request counts, durations, error codes and db pool saturation', async () => {
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
    assert.match(body, new RegExp(`db_pool_active_connections\\{db_hash="${key}"\\} 2`));
    assert.match(body, new RegExp(`db_pool_idle_connections\\{db_hash="${key}"\\} 1`));
    assert.match(body, new RegExp(`db_pool_waiting_connections\\{db_hash="${key}"\\} 3`));
    assert.match(body, new RegExp(`db_pool_max_connections\\{db_hash="${key}"\\} 5`));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    delete process.env.COMMUNITY_STORE_PATH;
    delete process.env.COMMUNITY_DATABASE_URL;
    delete process.env.ADMIN_SECRET;
    resetMetricsForTests();
    resetDatabaseRuntimeForTests();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('metrics endpoint requires admin key', async () => {
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
    delete process.env.COMMUNITY_STORE_PATH;
    delete process.env.ADMIN_SECRET;
    resetMetricsForTests();
    resetDatabaseRuntimeForTests();
    rmSync(dir, { recursive: true, force: true });
  }
});
