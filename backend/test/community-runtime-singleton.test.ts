import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunityServiceFactory } from '../src/community-routes.js';
import { FileCommunityStore, type CommunityStore } from '../src/community-store.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('concurrent and later callers share one store, service and prune timer', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'community-singleton-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const store = new FileCommunityStore(path.join(dir, 'community.json'));
  let creates = 0;
  let timers = 0;
  t.mock.method(globalThis, 'setInterval', () => {
    timers++;
    return { unref() {} } as ReturnType<typeof setInterval>;
  });
  const factory = createCommunityServiceFactory(async () => {
    creates++;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return store;
  });
  const calls = await Promise.all(Array.from({ length: 20 }, () => factory()));
  assert.ok(calls.every((service) => service === calls[0]));
  assert.equal(await factory(), calls[0]);
  assert.equal(creates, 1);
  assert.equal(timers, 1);
});

test('failed initialization closes its owned store and can retry without caching failure', async () => {
  let creates = 0;
  let closes = 0;
  const broken = {
    change: async () => {
      throw new Error('synthetic initialization failure');
    },
    close: async () => {
      closes++;
    },
  } as unknown as CommunityStore;
  const factory = createCommunityServiceFactory(async () => {
    creates++;
    return broken;
  });
  await assert.rejects(factory(), /synthetic initialization failure/);
  await assert.rejects(factory(), /synthetic initialization failure/);
  assert.equal(creates, 2);
  assert.equal(closes, 2);
});

test('explicit injected stores stay isolated and retain caller-owned lifecycle', async () => {
  let closes = 0;
  const store = {
    change: async () => {
      throw new Error('synthetic failure');
    },
    close: async () => {
      closes++;
    },
  } as unknown as CommunityStore;
  const { communityServiceFromEnv } = await import('../src/community-routes.js');
  await assert.rejects(communityServiceFromEnv({ store, startTimers: false }), /synthetic failure/);
  assert.equal(closes, 0);
});

test('Postgres store disposal releases its own pool', async () => {
  const { PostgresCommunityStore } = await import('../src/community-store.js');
  let ends = 0;
  const store = new PostgresCommunityStore({
    query: async () => ({ rows: [] }),
    end: async () => {
      ends++;
    },
  });
  await store.read();
  await store.close();
  assert.equal(ends, 1);
});
