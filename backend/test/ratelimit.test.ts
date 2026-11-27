import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RateLimiter } from '../src/ratelimit.js';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';

test('cardinality bound: new keys are rejected when the table is full, existing keys keep their budget', () => {
  const limiter = new RateLimiter(() => 1_000, 2);
  assert.equal(limiter.allow('a', 5, 60_000), true);
  assert.equal(limiter.allow('b', 5, 60_000), true);
  // A flood of fresh keys stops here: rejected WITHOUT being recorded.
  assert.equal(limiter.allow('c', 5, 60_000), false);
  assert.equal(limiter.trackedCount(), 2);
  // Existing keys are unaffected by the flood.
  assert.equal(limiter.allow('a', 5, 60_000), true);
  assert.equal(limiter.allow('b', 5, 60_000), true);
});

test('a rejected new key is not recorded, so it cannot evict or age out others', () => {
  const now = 1_000;
  const limiter = new RateLimiter(() => now, 1);
  assert.equal(limiter.allow('victim', 5, 60_000), true);
  for (let i = 0; i < 100; i++) assert.equal(limiter.allow(`flood-${i}`, 5, 60_000), false);
  assert.equal(limiter.trackedCount(), 1);
  assert.equal(limiter.has('victim'), true);
  assert.equal(limiter.has('flood-0'), false);
});

test('sweep frees capacity once keys go idle', () => {
  let now = 1_000;
  const limiter = new RateLimiter(() => now, 1);
  assert.equal(limiter.allow('old', 5, 60_000), true);
  now += 120_000;
  limiter.sweep(60_000);
  assert.equal(limiter.trackedCount(), 0);
  assert.equal(limiter.allow('new', 5, 60_000), true);
});

test('without a bound the limiter behaves as before (no cap)', () => {
  const limiter = new RateLimiter(() => 1_000);
  for (let i = 0; i < 100; i++) assert.equal(limiter.allow(`k${i}`, 5, 60_000), true);
  assert.equal(limiter.trackedCount(), 100);
});

test('CommunityService rate checks reject new keys beyond COMMUNITY_RATE_MAX_KEYS', async () => {
  process.env.COMMUNITY_RATE_MAX_KEYS = '1';
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ratelimit-test-'));
    const service = new CommunityService(new FileCommunityStore(path.join(dir, 'store.json')));
    service.checkRate('first', 5, 60_000);
    assert.throws(
      () => service.checkRate('second', 5, 60_000),
      (err: unknown) => {
        assert.equal((err as { status?: number }).status, 429);
        return true;
      },
    );
    // The known key is still served.
    service.checkRate('first', 5, 60_000);
  } finally {
    delete process.env.COMMUNITY_RATE_MAX_KEYS;
  }
});
