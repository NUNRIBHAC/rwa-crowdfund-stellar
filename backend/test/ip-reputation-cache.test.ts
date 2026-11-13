import test from 'node:test';
import assert from 'node:assert/strict';
import { createIpReputation, IP_REPUTATION_CACHE_LIMIT } from '../src/ip-reputation.js';
const clean = async () => new Response('{}');
test('disabled and exhausted provider checks do not retain distinct IPs', async () => {
  const disabled = createIpReputation({ enforce: false });
  for (let i = 0; i < 3000; i++) await disabled.check('ip-' + i);
  assert.equal(disabled.stats().cacheEntries, 0);
  const exhausted = createIpReputation({ apiKey: 'test', enforce: false, dailyBudget: 1, fetchImpl: clean });
  await exhausted.check('first');
  for (let i = 0; i < 3000; i++) await exhausted.check('ip-' + i);
  assert.equal(exhausted.stats().cacheEntries, 1);
  assert.equal(exhausted.stats().lookups, 1);
});
test('cache has a hard LRU bound without extending TTL on hits', async () => {
  let time = 0,
    calls = 0;
  const rep = createIpReputation({
    apiKey: 'test',
    enforce: false,
    dailyBudget: 3000,
    now: () => time,
    fetchImpl: async () => {
      calls++;
      return clean();
    },
  });
  for (let i = 0; i < IP_REPUTATION_CACHE_LIMIT; i++) await rep.check('ip-' + i);
  await rep.check('ip-0');
  await rep.check('new');
  assert.equal(rep.stats().cacheEntries, IP_REPUTATION_CACHE_LIMIT);
  await rep.check('ip-0');
  assert.equal(calls, IP_REPUTATION_CACHE_LIMIT + 1, 'recently used entry kept');
  await rep.check('ip-1');
  assert.equal(calls, IP_REPUTATION_CACHE_LIMIT + 2, 'least recently used entry evicted');
  time = 30 * 60 * 1000;
  await rep.check('after-expiry');
  assert.equal(rep.stats().cacheEntries, 1);
});
test('expired error verdicts are removed and cache diagnostics contain no IPs', async () => {
  let time = 0;
  const rep = createIpReputation({
    apiKey: 'test',
    enforce: false,
    now: () => time,
    fetchImpl: async () => {
      throw new Error('offline');
    },
  });
  await rep.check('203.0.113.9');
  assert.equal(rep.stats().cacheEntries, 1);
  time = 60000;
  assert.equal(rep.stats().cacheEntries, 0);
  assert.ok(!JSON.stringify(rep.stats()).includes('203.0.113.9'));
});
