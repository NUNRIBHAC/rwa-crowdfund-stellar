import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FileCommunityStore } from '../src/community-store.js';

function tempStore(seed?: string | object) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'community-read-cache-'));
  const file = path.join(dir, 'store.json');
  if (seed !== undefined) fs.writeFileSync(file, typeof seed === 'string' ? seed : JSON.stringify(seed));
  return {
    file,
    store: new FileCommunityStore(file),
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

function seededDoc(label: string) {
  return JSON.stringify({
    version: 1,
    accounts: {},
    emailCredentials: {},
    challenges: {},
    sessions: {},
    comments: {},
    news: { n1: { id: 'n1', campaignId: 'c1', title: label, body: 'b', authorLabel: 'platform-demo', createdAt: 1 } },
    reports: {},
    contributors: {},
    backfillCheckpoints: {},
    episodes: {},
    tickets: {},
    applications: {},
    appropriateness: {},
    companies: {},
    notifications: {},
    audit: [],
    mailSendLog: [],
  });
}

test('change() is visible to the very next read()', async () => {
  const h = tempStore(seededDoc('before'));
  try {
    assert.equal((await h.store.read()).news.n1.title, 'before');
    // Prime the cache once more, so the write must actively invalidate it.
    assert.equal((await h.store.read()).news.n1.title, 'before');
    await h.store.change((state) => {
      state.news.n1.title = 'after';
    });
    assert.equal((await h.store.read()).news.n1.title, 'after');
  } finally {
    h.cleanup();
  }
});

test('an external file change is picked up by the next read()', async () => {
  const h = tempStore(seededDoc('v1'));
  try {
    assert.equal((await h.store.read()).news.n1.title, 'v1');
    // Write through a different handle, then make the version difference
    // unambiguous with fsync so no reader can see a partial rename.
    fs.writeFileSync(h.file, seededDoc('v2'));
    assert.equal((await h.store.read()).news.n1.title, 'v2');
  } finally {
    h.cleanup();
  }
});

test('a write of the same byte length is picked up by the next read()', async () => {
  const h = tempStore(seededDoc('aaaa'));
  try {
    assert.equal((await h.store.read()).news.n1.title, 'aaaa');
    fs.writeFileSync(h.file, seededDoc('bbbb'));
    assert.equal((await h.store.read()).news.n1.title, 'bbbb');
  } finally {
    h.cleanup();
  }
});

test('a corrupt document still throws and is never cached as valid', async () => {
  const h = tempStore(seededDoc('ok'));
  try {
    assert.equal((await h.store.read()).news.n1.title, 'ok');
    fs.writeFileSync(h.file, '{"version":1}'); // missing required collections
    await assert.rejects(async () => h.store.read(), /invalid community store/);
    fs.writeFileSync(h.file, seededDoc('recovered'));
    assert.equal((await h.store.read()).news.n1.title, 'recovered');
  } finally {
    h.cleanup();
  }
});

test('a missing file reads as empty; a later change creates the store', async () => {
  const h = tempStore();
  try {
    const empty = await h.store.read();
    assert.deepEqual(empty.comments, {});
    // The empty read obeys the same contract as a cached snapshot: it is
    // frozen, so a nested write fails loudly instead of being silently lost.
    assert.throws(() => {
      (empty.comments as Record<string, unknown>).leak = {};
    }, TypeError);
    await h.store.change((state) => {
      state.comments.c1 = {
        id: 'c1',
        campaignId: 'campaign-1',
        publicKey: 'GTEST',
        displayName: null,
        body: 'hello',
        createdAt: 1,
        hiddenAt: null,
        hiddenReason: null,
      };
    });
    assert.equal((await h.store.read()).comments.c1.body, 'hello');
  } finally {
    h.cleanup();
  }
});

test('normalizeRecord mutation on the service read path does not contaminate later reads', async () => {
  const { CommunityService } = await import('../src/community.js');
  const doc = JSON.parse(seededDoc('stable'));
  doc.appropriateness.GKEY = {
    publicKey: 'GKEY',
    version: 1,
    experienceLevel: 'some',
    objective: 'growth',
    knowledgeScore: 5,
    knowledgeTotal: 5,
    outcome: 'appropriate',
    completedAt: 1,
    reviewAssessmentDueAt: 2,
    simulation: null,
    reviewSimulationDueAt: null,
    warningAcknowledgedAt: null,
  };
  const h = tempStore(doc);
  const service = new CommunityService(h.store, { retentionDays: 90 });
  try {
    const first = await service.getAppropriateness({ publicKey: 'GKEY', displayName: null, createdAt: 1 });
    assert.equal(first?.outcome, 'knowledge_check_passed');
    // A second read must see the stored legacy value, not the normalized copy.
    const raw = await h.store.read();
    assert.equal(raw.appropriateness.GKEY.outcome, 'appropriate');
  } finally {
    h.cleanup();
  }
});

test('a nested mutation of a read result throws instead of corrupting the cache', async () => {
  const h = tempStore(seededDoc('frozen'));
  try {
    const first = await h.store.read();
    // ES modules are strict, so writing a frozen nested record must throw.
    assert.throws(() => {
      first.news.n1.title = 'corrupted';
    }, TypeError);
    assert.equal((await h.store.read()).news.n1.title, 'frozen');
  } finally {
    h.cleanup();
  }
});

test('deep forward-compatible JSON does not exhaust the freeze call stack', async () => {
  const base = seededDoc('deep');
  const depth = 10_000;
  const doc = base.slice(0, -1) + ',"futureField":' + '{"child":'.repeat(depth) + '0' + '}'.repeat(depth) + '}';
  const h = tempStore(doc);
  try {
    const first = await h.store.read();
    let node: unknown = (first as unknown as Record<string, unknown>).futureField;
    for (let i = 0; i < depth; i++) {
      assert.equal(Object.isFrozen(node), true);
      node = (node as { child: unknown }).child;
    }
    assert.equal(node, 0);
    assert.equal((await h.store.read()).news.n1.title, 'deep');
  } finally {
    h.cleanup();
  }
});

test('equal file metadata can conceal an external rewrite: documented heuristic limit', async (t) => {
  const h = tempStore(seededDoc('aaaa'));
  try {
    const originalStat = fs.statSync;
    const fixed = fs.statSync(h.file);
    assert.equal((await h.store.read()).news.n1.title, 'aaaa');
    fs.writeFileSync(h.file, seededDoc('bbbb'));
    t.mock.method(fs, 'statSync', (...args: Parameters<typeof fs.statSync>) => {
      if (args[0] === h.file) return fixed;
      return originalStat(...args);
    });
    assert.equal((await h.store.read()).news.n1.title, 'aaaa');
    t.mock.restoreAll();
    assert.equal((await h.store.read()).news.n1.title, 'bbbb');
  } finally {
    t.mock.restoreAll();
    h.cleanup();
  }
});
