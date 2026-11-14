import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
const { Request } = globalThis;
const url = 'https://country.unit.invalid/country';
test('only Cloudflare country metadata, never client spoofed country/IP', async () => {
  const r = new Request(url, { headers: { 'CF-IPCountry': 'PT', 'CF-Connecting-IP': '192.0.2.4' } });
  assert.deepEqual(await (await worker.fetch(r)).json(), { country: null });
  Object.defineProperty(r, 'cf', { value: { country: 'KR' } });
  const reply = await worker.fetch(r);
  assert.deepEqual(await reply.json(), { country: 'KR' });
  assert.equal(reply.headers.get('cache-control'), 'no-store');
  assert.equal(reply.headers.get('set-cookie'), null);
});
test('exact scoped CORS, no wildcard/reflection or shared country cache', async () => {
  for (const origin of ['https://staging.92-5-187-71.sslip.io', 'https://demo.92-5-187-71.sslip.io', 'https://evil.unit.invalid']) {
    const reply = await worker.fetch(new Request(url, { headers: { Origin: origin } }));
    assert.equal(reply.headers.get('access-control-allow-origin'), origin.includes('evil') ? null : origin);
    assert.equal(reply.headers.get('vary'), 'Origin');
  }
});
test('GET/HEAD/OPTIONS only, exact path, malformed country fails to null', async () => {
  assert.equal((await worker.fetch(new Request(url, { method: 'POST' }))).status, 405);
  assert.equal((await worker.fetch(new Request(url + '/other'))).status, 404);
  assert.equal(await (await worker.fetch(new Request(url, { method: 'HEAD' }))).text(), '');
  assert.equal((await worker.fetch(new Request(url, { method: 'OPTIONS', headers: { Origin: 'https://evil.unit.invalid' } }))).status, 403);
  assert.equal((await worker.fetch(new Request(url, { method: 'OPTIONS', headers: { Origin: 'https://staging.92-5-187-71.sslip.io' } }))).status, 204);
  for (const country of ['<script>', '', 'pt', null, 5]) {
    const r = new Request(url);
    Object.defineProperty(r, 'cf', { value: { country } });
    assert.deepEqual(await (await worker.fetch(r)).json(), { country: null });
  }
});
