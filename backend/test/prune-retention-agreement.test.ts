// Golden-agreement tests for the prune fast path.
//
// The invariant guarded here: the read-only probe used to skip the locked
// change() path must report work exactly when the change() body would delete
// something. If they drift, a collection silently stops being pruned and
// expired or personal content is retained indefinitely.
//
// Every case is run twice on identical state:
//   1. a store without view(), so prune() always walks the change() body -> ground truth
//   2. a store with view(), so prune() takes the fast path first
// and the two results must agree, including whether change() ran at all.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyCommunityState, type CommunityState } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1);
const OLD = NOW - 91 * DAY; // outside the 90-day retention window
const FRESH = NOW - 1 * DAY;

class MemoryStore {
  state: CommunityState;
  changeCalls = 0;
  constructor(initial: CommunityState) {
    this.state = structuredClone(initial);
  }
  async read(): Promise<CommunityState> {
    return structuredClone(this.state);
  }
  async change<T>(fn: (state: CommunityState) => T | Promise<T>): Promise<T> {
    this.changeCalls++;
    const result = await fn(this.state);
    this.state = structuredClone(this.state);
    return result;
  }
}

class ViewMemoryStore extends MemoryStore {
  viewCalls = 0;
  async view<T>(fn: (state: CommunityState) => T): Promise<T> {
    this.viewCalls++;
    return fn(structuredClone(this.state));
  }
}

function service(store: MemoryStore | ViewMemoryStore) {
  return new CommunityService(store as any, { retentionDays: 90, now: () => NOW });
}

const ticket = (id: string, createdAt: number) =>
  ({
    id,
    kind: 'feedback',
    publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    subject: 's',
    body: 'b',
    status: 'open',
    createdAt,
    closedAt: null,
  }) as any;

const application = (id: string, createdAt: number, extra: Record<string, unknown> = {}) =>
  ({
    id,
    publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    projectName: 'p',
    country: 'PT',
    instrumentType: 'bond',
    targetAmount: '100',
    description: 'd',
    contactEmail: null,
    status: 'received',
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt,
    ...extra,
  }) as any;

type Case = { name: string; build: (state: CommunityState) => void };

const cases: Case[] = [
  { name: 'empty state', build: () => {} },
  { name: 'fresh ticket', build: (s) => void (s.tickets.fresh = ticket('fresh', FRESH)) },
  { name: 'expired ticket', build: (s) => void (s.tickets.old = ticket('old', OLD)) },
  {
    name: 'expired application with no retained objects',
    build: (s) => void (s.applications.a = application('a', OLD)),
  },
  {
    name: 'expired application with an inline document',
    build: (s) => void (s.applications.a = application('a', OLD, { documents: [{ id: 'd', filename: 'f', content: 'c', sha256: 'x', uploadedAt: OLD }] })),
  },
  {
    name: 'expired application with a retained private object',
    build: (s) =>
      void (s.applications.a = application('a', OLD, {
        documents: [{ id: 'd', filename: 'f', object: { key: 'k' }, sha256: 'x', uploadedAt: OLD }],
      })),
  },
  {
    name: 'expired application with a live upload intent',
    build: (s) => {
      s.applications.a = application('a', OLD);
      s.privateApplicationUploads = { version: 1, intents: { i: { applicationId: 'a', status: 'pending' } as any } };
    },
  },
  {
    name: 'expired application with only a deleted upload intent',
    build: (s) => {
      s.applications.a = application('a', OLD);
      s.privateApplicationUploads = { version: 1, intents: { i: { applicationId: 'a', status: 'deleted' } as any } };
    },
  },
  {
    name: 'expired application with a live deletion intent',
    build: (s) => {
      s.applications.a = application('a', OLD);
      s.privateApplicationDeletions = { d: { applicationId: 'a', status: 'pending' } as any };
    },
  },
  { name: 'expired notification', build: (s) => void (s.notifications.n = { id: 'n', kind: 'ticket_closed', createdAt: OLD } as any) },
  { name: 'fresh notification', build: (s) => void (s.notifications.n = { id: 'n', kind: 'ticket_closed', createdAt: FRESH } as any) },
  { name: 'hidden comment older than 30 days', build: (s) => void (s.comments.c = { id: 'c', hiddenAt: NOW - 31 * DAY } as any) },
  { name: 'hidden comment inside 30 days', build: (s) => void (s.comments.c = { id: 'c', hiddenAt: NOW - 10 * DAY } as any) },
  { name: 'visible comment', build: (s) => void (s.comments.c = { id: 'c', hiddenAt: null } as any) },
  { name: 'expired challenge', build: (s) => void (s.challenges.h = { id: 'h', expiresAt: NOW - 1 } as any) },
  { name: 'live challenge', build: (s) => void (s.challenges.h = { id: 'h', expiresAt: NOW + DAY } as any) },
  { name: 'expired session', build: (s) => void (s.sessions.s = { id: 's', expiresAt: NOW - 1 } as any) },
  { name: 'live session', build: (s) => void (s.sessions.s = { id: 's', expiresAt: NOW + DAY } as any) },
  {
    name: 'one prunable record in every collection',
    build: (s) => {
      s.tickets.old = ticket('old', OLD);
      s.applications.a = application('a', OLD);
      s.notifications.n = { id: 'n', kind: 'ticket_closed', createdAt: OLD } as any;
      s.comments.c = { id: 'c', hiddenAt: NOW - 31 * DAY } as any;
      s.challenges.h = { id: 'h', expiresAt: NOW - 1 } as any;
      s.sessions.s = { id: 's', expiresAt: NOW - 1 } as any;
    },
  },
];

for (const testCase of cases) {
  test(`prune fast path agrees with the locked path: ${testCase.name}`, async () => {
    const initial = emptyCommunityState();
    testCase.build(initial);

    const groundStore = new MemoryStore(initial);
    const ground = await service(groundStore).prune();

    const viewStore = new ViewMemoryStore(initial);
    const fast = await service(viewStore).prune();

    assert.deepEqual(fast, ground, 'fast path and locked path must remove the same records');
    if (ground.removed > 0) {
      assert.equal(groundStore.changeCalls, 1, 'ground truth deletes inside change()');
      assert.equal(viewStore.changeCalls, 1, 'fast path must not skip a prune that has work');
    } else {
      assert.equal(groundStore.changeCalls, 1, 'path without view() always walks change()');
      assert.equal(viewStore.changeCalls, 0, 'fast path must skip change() when nothing is prunable');
    }
  });
}

test('prune defers safely when view() reads a stale snapshot, then prunes on the next run', async () => {
  const initial = emptyCommunityState();
  initial.tickets.old = ticket('old', OLD);
  const store = new ViewMemoryStore(initial);
  // Simulate view() racing a concurrent change(): it observes the previous
  // committed state, so the just-written record looks absent.
  const staleView = {
    read: () => store.read(),
    change: (fn: any) => store.change(fn),
    view: async (fn: any) => fn(emptyCommunityState()),
  };
  assert.deepEqual(await service(staleView as any).prune(), { removed: 0 });
  assert.equal(store.changeCalls, 0, 'a stale view defers without taking the lock');
  assert.ok((await store.read()).tickets.old, 'the deferred record is never dropped by the fast path');
  assert.deepEqual(await service(store).prune(), { removed: 1 }, 'the next run with a fresh view prunes it');
});

test('prune fails loud when view() rejects instead of silently skipping retention', async () => {
  const state = emptyCommunityState();
  state.tickets.old = ticket('old', OLD);
  const store = new MemoryStore(state);
  const rejecting = {
    read: () => store.read(),
    change: (fn: any) => store.change(fn),
    view: async () => {
      throw new Error('read view unavailable');
    },
  };
  await assert.rejects(() => service(rejecting as any).prune(), /read view unavailable/);
  assert.equal(store.changeCalls, 0, 'a failed view must not run change()');
});
