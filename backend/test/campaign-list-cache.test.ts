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

test('map stays bounded: oldest key evicted at maxEntries', async () => {
  let t = 1_000_000;
  const cache = new CampaignListCache<string>(TTL, () => t, 3);
  const fetcher = async (a?: string) => `data-${a}`;
  await cache.read(fetcher, 'A');
  t += 1;
  await cache.read(fetcher, 'B');
  t += 1;
  await cache.read(fetcher, 'C');
  t += 1;
  await cache.read(fetcher, 'D');
  // A (oldest) evicted; B/C/D cached: only A needs a refetch
  let calls = 0;
  const counter = async (a?: string) => { calls += 1; return `data-${a}`; };
  await cache.read(counter, 'B');
  await cache.read(counter, 'C');
  await cache.read(counter, 'D');
  assert.equal(calls, 0, 'B/C/D served from cache');
  await cache.read(counter, 'A');
  assert.equal(calls, 1, 'A was evicted and refetched');
});

test('expired entries are swept before any live eviction', async () => {
  let t = 1_000_000;
  const cache = new CampaignListCache<string>(TTL, () => t, 2);
  const fetcher = async (a?: string) => `data-${a}`;
  await cache.read(fetcher, 'OLD1');
  await cache.read(fetcher, 'OLD2');
  t += TTL * 2; // both expire
  await cache.read(fetcher, 'LIVE');
  t += 1;
  await cache.read(fetcher, 'NEW');
  // map held OLD1/OLD2 (expired) + LIVE; sweep removed the expired two, so
  // NEW fits without evicting LIVE
  let calls = 0;
  const counter = async (a?: string) => { calls += 1; return `data-${a}`; };
  await cache.read(counter, 'LIVE');
  await cache.read(counter, 'NEW');
  assert.equal(calls, 0, 'live entries survived the sweep');
});

test('maxEntries bound holds under many distinct actors', async () => {
  let t = 1_000_000;
  const cache = new CampaignListCache<number>(TTL, () => t, 16);
  let calls = 0;
  const fetcher = async () => { calls += 1; return calls; };
  for (let i = 0; i < 200; i += 1) {
    t += 1;
    await cache.read(fetcher, `G${i.toString().padStart(55, 'A')}`);
  }
  // every read after the 16th was a miss-evict-refetch: no unbounded growth,
  // and the last key is present
  assert.equal(calls, 200);
  let extra = 0;
  const counter = async () => { extra += 1; return 0; };
  await cache.read(counter, `G${(199).toString().padStart(55, 'A')}`);
  assert.equal(extra, 0, 'most recent key still cached');
});
