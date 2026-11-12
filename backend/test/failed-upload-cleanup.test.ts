import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { FileCommunityStore, type CommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import type { PrivateTextObjects } from '../src/private-application-upload-workflow.js';
const owner = { publicKey: 'owner', displayName: null, createdAt: 1 };
const operationId = '00000000-0000-4000-8000-000000000001';
const body = { operationId, filename: 'x.txt', content: 'synthetic' };
async function fixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'failed-upload-cleanup-'));
  const file = path.join(dir, 'state.json');
  const store = new FileCommunityStore(file);
  const calls: string[] = [];
  const objects: PrivateTextObjects = {
    plan: (s) => ({
      storageId: 'synthetic',
      key: 'website uploads/unique.txt',
      sha256: createHash('sha256').update(s).digest('hex'),
      bytes: Buffer.byteLength(s),
    }),
    upload: async () => {
      calls.push('PUT');
    },
    read: async () => {
      calls.push('GET');
      return 'synthetic';
    },
    remove: async () => {
      calls.push('DELETE');
    },
  };
  const service = new CommunityService(store, { retentionDays: 90, privateApplicationObjects: objects });
  const app = await service.submitApplication(
    owner,
    { projectName: 'Synthetic', country: 'PT', instrumentType: 'Testnet', targetAmount: '2', description: 'synthetic' },
    true,
  );
  return { dir, file, store, calls, objects, service, app, clean: () => fs.rm(dir, { recursive: true, force: true }) };
}
test('known completed PUT with generic commit failure queues owned durable cleanup after restart, never retries PUT', async () => {
  const f = await fixture();
  try {
    let changes = 0;
    const wrapper: CommunityStore = {
      read: () => f.store.read(),
      change: async (fn) => {
        if (++changes === 2) throw new Error('synthetic commit refused');
        return f.store.change(fn);
      },
    };
    const service = new CommunityService(wrapper, { retentionDays: 90, privateApplicationObjects: f.objects });
    await assert.rejects(service.addApplicationDocument(owner, f.app.id, body), /reconciliation/);
    assert.equal((await f.store.read()).privateApplicationUploads!.intents[operationId].status, 'cleanup');
    const reopened = new CommunityService(new FileCommunityStore(f.file), { retentionDays: 90, privateApplicationObjects: f.objects });
    assert.equal(await reopened.queueFailedApplicationUploadCleanup(operationId), 'pending');
    assert.equal(await reopened.queueFailedApplicationUploadCleanup(operationId), 'pending');
    await assert.rejects(reopened.submitDraftApplication(owner, f.app.id), /reconciliation/);
    assert.equal(await reopened.reconcileApplicationDocumentDeletion(`appdoc_${operationId}`), 'deleted');
    assert.equal(await reopened.queueFailedApplicationUploadCleanup(operationId), 'deleted');
    await assert.rejects(reopened.addApplicationDocument(owner, f.app.id, body), /not found/);
    assert.equal((await reopened.submitDraftApplication(owner, f.app.id)).status, 'received');
    assert.deepEqual(f.calls, ['PUT', 'DELETE']);
  } finally {
    await f.clean();
  }
});
test('committed ACK loss and all unresolved writer states stay blocked without provider GET or DELETE', async () => {
  const f = await fixture();
  try {
    let changes = 0;
    const wrapper: CommunityStore = {
      read: () => f.store.read(),
      change: async (fn) => {
        const r = await f.store.change(fn);
        if (++changes === 2) throw new Error('lost committed ACK');
        return r;
      },
    };
    const service = new CommunityService(wrapper, { retentionDays: 90, privateApplicationObjects: f.objects });
    await assert.rejects(service.addApplicationDocument(owner, f.app.id, body), /reconciliation/);
    assert.equal(await service.queueFailedApplicationUploadCleanup(operationId), 'blocked');
    const replay = await service.addApplicationDocument(owner, f.app.id, body);
    assert.equal(replay.id, `appdoc_${operationId}`);
    assert.equal('object' in replay, false);
    await f.store.change((s) => {
      s.applications[f.app.id].documents = [];
    });
    for (const status of ['uploading', 'uncertain'] as const) {
      await f.store.change((s) => {
        s.privateApplicationUploads!.intents[operationId].status = status;
      });
      assert.equal(await service.queueFailedApplicationUploadCleanup(operationId), 'blocked');
    }
    assert.equal(await service.queueFailedApplicationUploadCleanup('missing'), 'blocked');
    assert.deepEqual(f.calls, ['PUT']);
  } finally {
    await f.clean();
  }
});
test('failed cleanup queue refuses linked refs, another intent key, and mismatched existing job', async () => {
  const f = await fixture();
  try {
    await f.service.addApplicationDocument(owner, f.app.id, body);
    await f.store.change((s) => {
      s.privateApplicationUploads!.intents[operationId].status = 'cleanup';
    });
    assert.equal(await f.service.queueFailedApplicationUploadCleanup(operationId), 'blocked');
    await f.store.change((s) => {
      s.applications[f.app.id].documents = [];
      const i = s.privateApplicationUploads!.intents[operationId];
      s.privateApplicationUploads!.intents['other'] = { ...i, id: 'other' };
    });
    assert.equal(await f.service.queueFailedApplicationUploadCleanup(operationId), 'blocked');
    await f.store.change((s) => {
      delete s.privateApplicationUploads!.intents.other;
    });
    assert.equal(await f.service.queueFailedApplicationUploadCleanup(operationId), 'pending');
    await f.store.change((s) => {
      s.privateApplicationDeletions![`appdoc_${operationId}`].owner = 'outsider';
    });
    assert.equal(await f.service.queueFailedApplicationUploadCleanup(operationId), 'blocked');
    assert.equal(await f.service.reconcileApplicationDocumentDeletion(`appdoc_${operationId}`), 'blocked');
    assert.deepEqual(f.calls, ['PUT']);
  } finally {
    await f.clean();
  }
});
