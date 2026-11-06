import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CampaignListCache, CAMPAIGN_LIST_CACHE_TTL_MS } from '../src/campaign-list-cache.js';

const TTL = 30_000;

function harness(ttlMs = TTL) {
  let t = 1_000_000;
  let calls = 0;
  const fetcher = async (actor?: string) => {
    calls += 1;
    return { n: calls, actor: actor ?? null };
  };
  const cache = new CampaignListCache<{ n: number; actor: string | null }>(ttlMs, () => t);
  return { cache, fetcher, calls: () => calls, advance: (ms: number) => { t += ms; } };
}

test('production TTL is 30 seconds', () => {
  assert.equal(CAMPAIGN_LIST_CACHE_TTL_MS, 30_000);
});

test('first read fetches fresh and returns fetcher data', async () => {
  const h = harness();
  const r = await h.cache.read(h.fetcher);
  assert.deepEqual(r, { n: 1, actor: null });
  assert.equal(h.calls(), 1);
});

test('second read within TTL is served from cache (one upstream call)', async () => {
  const h = harness();
  const a = await h.cache.read(h.fetcher);
  h.advance(TTL - 1);
  const b = await h.cache.read(h.fetcher);
  assert.equal(h.calls(), 1);
  assert.deepEqual(b, a);
});

test('read exactly at TTL boundary fetches fresh', async () => {
  const h = harness();
  await h.cache.read(h.fetcher);
  h.advance(TTL);
  const b = await h.cache.read(h.fetcher);
  assert.equal(h.calls(), 2);
  assert.deepEqual(b, { n: 2, actor: null });
});

test('expired entry is refreshed, never served stale', async () => {
  const h = harness();
  await h.cache.read(h.fetcher);
  h.advance(TTL * 10);
  const b = await h.cache.read(h.fetcher);
  assert.equal(h.calls(), 2);
  assert.equal(b.n, 2);
});

test('concurrent reads share a single in-flight fetch', async () => {
  let calls = 0;
  let release!: (v: string) => void;
  const gate = new Promise<string>((resolve) => { release = resolve; });
  const fetcher = () => { calls += 1; return gate; };
  const cache = new CampaignListCache<string>(TTL);
  const p1 = cache.read(fetcher);
  const p2 = cache.read(fetcher);
  const p3 = cache.read(fetcher);
  release('fresh');
  assert.deepEqual(await Promise.all([p1, p2, p3]), ['fresh', 'fresh', 'fresh']);
  assert.equal(calls, 1);
});

test('fetcher failure propagates and the next read retries (no poisoned cache)', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    if (calls === 1) throw new Error('RPC degraded');
    return 'ok';
  };
  const cache = new CampaignListCache<string>(TTL);
  await assert.rejects(cache.read(fetcher), /RPC degraded/);
  const r = await cache.read(fetcher);
  assert.equal(r, 'ok');
  assert.equal(calls, 2);
});

test('in-flight failure does not block later single-flight retries', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    if (calls <= 2) throw new Error('still degraded');
    return 'recovered';
  };
  const cache = new CampaignListCache<string>(TTL);
  await assert.rejects(Promise.all([cache.read(fetcher), cache.read(fetcher)]));
  assert.equal(calls, 1, 'concurrent failures share one in-flight call');
  await assert.rejects(cache.read(fetcher));
  assert.equal(await cache.read(fetcher), 'recovered');
});

test('actor keys are cached independently, including anonymous', async () => {
  const h = harness();
  const anon = await h.cache.read(h.fetcher);
  const alice = await h.cache.read(h.fetcher, 'GALICE');
  const bob = await h.cache.read(h.fetcher, 'GBOB');
  assert.deepEqual([anon.n, alice.n, bob.n], [1, 2, 3]);
  h.advance(TTL - 1);
  const anon2 = await h.cache.read(h.fetcher);
  const alice2 = await h.cache.read(h.fetcher, 'GALICE');
  assert.equal(h.calls(), 3, 'both hits served from their own cache entries');
  assert.deepEqual([anon2.n, alice2.n], [1, 2]);
});

test('actor expiry is independent per key', async () => {
  const h = harness();
  await h.cache.read(h.fetcher, 'GALICE');
  h.advance(TTL);
  await h.cache.read(h.fetcher, 'GBOB');
  const again = await h.cache.read(h.fetcher, 'GALICE');
  assert.equal(again.n, 3, 'GALICE entry expired even though GBOB just fetched');
});
