import test from 'node:test';
import assert from 'node:assert/strict';
import { privateApplicationOptionsFromEnv, runPrivateApplicationCleanup, startPrivateApplicationCleanup } from '../src/private-application-runtime.js';
import { CommunityService } from '../src/community.js';
import { FileCommunityStore } from '../src/community-store.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const enabled = {
  COMMUNITY_APPLICATION_UPLOAD_MODE: 'oracle-private',
  COMMUNITY_PRIVATE_UPLOAD_ENABLED: '1',
  COMMUNITY_PRIVATE_CLEANUP_ENABLED: '1',
  COMMUNITY_PRIVATE_OCI_NAMESPACE: 'synthetic',
  COMMUNITY_PRIVATE_OCI_REGION: 'eu-frankfurt-1',
  COMMUNITY_PRIVATE_OCI_BUCKET: 'synthetic-private',
  COMMUNITY_PRIVATE_OCI_PREFIX: 'website uploads',
  COMMUNITY_PRIVATE_OCI_ACCESS_KEY: 'SYNTHETIC',
  COMMUNITY_PRIVATE_OCI_SECRET_KEY: 'synthetic-only-not-a-secret',
};

test('private factory is dormant by default and fails closed for each missing activation gate/config value', () => {
  let calls = 0;
  const transport: typeof fetch = async () => {
    calls++;
    throw new Error('no network permitted');
  };
  assert.deepEqual(privateApplicationOptionsFromEnv({}, transport), { applicationUploadMode: 'legacy-inline' });
  assert.deepEqual(privateApplicationOptionsFromEnv({ ...enabled, COMMUNITY_APPLICATION_UPLOAD_MODE: 'legacy-inline' }, transport), {
    applicationUploadMode: 'legacy-inline',
  });
  for (const name of Object.keys(enabled)) {
    if (name === 'COMMUNITY_APPLICATION_UPLOAD_MODE') continue;
    assert.throws(() => privateApplicationOptionsFromEnv({ ...enabled, [name]: '' }, transport));
  }
  assert.throws(() => privateApplicationOptionsFromEnv({ ...enabled, COMMUNITY_APPLICATION_UPLOAD_MODE: 'other' }, transport));
  assert.equal(privateApplicationOptionsFromEnv(enabled, transport).applicationUploadMode, 'oracle-private');
  assert.equal(calls, 0);
});

test('finite cleanup pass completes durable cleanup after restart, skips uncertain writes and rotates blocked work', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'private-runtime-'));
  const file = path.join(dir, 'store.json');
  const store = new FileCommunityStore(file);
  const calls: string[] = [];
  const options = privateApplicationOptionsFromEnv(enabled, async (_url, init) => {
    calls.push(init?.method ?? 'GET');
    return new Response('', { status: 200 });
  });
  const service = new CommunityService(store, { retentionDays: 90, ...options });
  const owner = { publicKey: 'synthetic-owner', displayName: null, createdAt: Date.now() };
  const app = await service.submitApplication(
    owner,
    { projectName: 'Synthetic', country: 'PT', instrumentType: 'Test', targetAmount: '1', description: 'Synthetic' },
    true,
  );
  try {
    const document = await service.addApplicationDocument(owner, app.id, {
      filename: 'one.txt',
      content: 'synthetic',
      operationId: '00000000-0000-4000-8000-000000000001',
    });
    await service.deleteApplicationDocument(owner, app.id, document.id);
    // Fresh Store + Service is the restart boundary, not a cloned fake state.
    const restarted = new CommunityService(new FileCommunityStore(file), { retentionDays: 90, ...options });
    const done = await runPrivateApplicationCleanup(restarted, '', 1);
    assert.equal(done.deleted, 1);
    assert.deepEqual(calls, ['PUT', 'DELETE']);
    assert.equal((await store.read()).privateApplicationDeletions![document.id].status, 'deleted');
    assert.equal((await runPrivateApplicationCleanup(restarted)).processed, 0);
    const ref = options.privateApplicationObjects!.plan('synthetic');
    await store.change((s) => {
      s.privateApplicationUploads!.intents.unknown = {
        id: 'unknown',
        owner: owner.publicKey,
        applicationId: app.id,
        filename: 'one.txt',
        object: ref,
        status: 'uncertain',
      };
      s.privateApplicationUploads!.intents.first = {
        id: 'first',
        owner: owner.publicKey,
        applicationId: app.id,
        filename: 'one.txt',
        object: ref,
        status: 'cleanup',
      };
      s.privateApplicationUploads!.intents.second = {
        id: 'second',
        owner: owner.publicKey,
        applicationId: app.id,
        filename: 'one.txt',
        object: ref,
        status: 'cleanup',
      };
    });
    const first = await runPrivateApplicationCleanup(restarted, '', 1);
    const second = await runPrivateApplicationCleanup(restarted, first.cursor, 1);
    assert.equal(first.blocked, 1);
    assert.equal(second.blocked, 1);
    assert.notEqual(first.cursor, second.cursor);
    assert.equal((await store.read()).privateApplicationUploads!.intents.unknown.status, 'uncertain');
    assert.deepEqual(calls, ['PUT', 'DELETE']);
    await assert.rejects(runPrivateApplicationCleanup(restarted, '', 101));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('runtime cleanup schedules one non-overlapping finite worker per process', async () => {
  const original = globalThis.setInterval;
  let callback: (() => Promise<void>) | undefined;
  let schedules = 0;
  let reads = 0;
  globalThis.setInterval = ((fn: () => Promise<void>, ms: number) => {
    schedules++;
    assert.equal(ms, 60000);
    callback = fn;
    return { unref: () => {} };
  }) as unknown as typeof setInterval;
  const service = {
    store: {
      read: async () => {
        reads++;
        return {};
      },
    },
  } as unknown as CommunityService;
  try {
    startPrivateApplicationCleanup(service);
    startPrivateApplicationCleanup(service);
    assert.equal(schedules, 1);
    await callback!();
    assert.equal(reads, 1);
  } finally {
    globalThis.setInterval = original;
  }
});
