import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { trustEvidenceRouter } from '../src/trust-evidence-routes.js';
import { TRUST_CRITERIA } from '../src/trust-evidence.js';

test('public evidence endpoint is complete in structure, missing in evidence, read-only and input independent', async () => {
  const app = express();
  app.use(trustEvidenceRouter(() => new Date('2026-11-27T19:00:00Z')));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((ok) => server.once('listening', ok));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/transparency/evidence`;
  try {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('set-cookie'), null);
    const body = await response.json();
    assert.equal(body.schemaVersion, 1);
    assert.equal(body.asOf, '2026-11-27');
    assert.equal(body.evidenceComplete, false);
    assert.equal(body.productionEligible, false);
    assert.equal(body.criteria.length, 16);
    assert.deepEqual(
      body.criteria.map((r: { criterion: string }) => r.criterion),
      [...TRUST_CRITERIA],
    );
    for (const row of body.criteria) {
      assert.equal(row.state, 'not_provided');
      assert.equal(row.scope, 'platform');
      assert.deepEqual(row.sourceUrls, []);
      assert.equal(row.asOf, null);
      assert.equal(row.period, null);
      assert.equal(row.population, null);
      assert.equal(row.methodology, null);
      assert.equal(row.reason, null);
    }
    const untrusted = await fetch(base + '?state=documented&scope=licensed&sourceUrls=https://example.org');
    assert.deepEqual(await untrusted.json(), body);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) assert.equal((await fetch(base, { method })).status, 404);
    assert.deepEqual(await (await fetch(base)).json(), body);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((ok) => server.close(() => ok()));
  }
});

test('invalid generation time fails closed without raw diagnostics', async () => {
  const app = express();
  app.use(trustEvidenceRouter(() => new Date('invalid')));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((ok) => server.once('listening', ok));
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/transparency/evidence`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { code: 'API_UNAVAILABLE' });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((ok) => server.close(() => ok()));
  }
});
