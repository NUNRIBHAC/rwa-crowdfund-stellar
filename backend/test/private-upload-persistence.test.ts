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
const outsider = { ...owner, publicKey: 'outsider' };
const input = {
  projectName: 'Synthetic only',
  country: 'PT',
  instrumentType: 'Testnet escrow',
  targetAmount: '2',
  description: 'Synthetic content',
};
const op = '00000000-0000-4000-8000-000000000001';
async function fixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'upload-persistent-'));
  const filename = path.join(dir, 'state.json');
  const store = new FileCommunityStore(filename);
  const calls: string[] = [];
  const objects: PrivateTextObjects = {
    plan: (content) => ({
      storageId: 'synthetic',
      key: `website uploads/${op}.txt`,
      sha256: createHash('sha256').update(content).digest('hex'),
      bytes: Buffer.byteLength(content),
    }),
    upload: async () => {
      calls.push('PUT');
    },
    read: async () => {
      calls.push('GET');
      return 'synthetic';
    },
  };
  const service = new CommunityService(store, {
    retentionDays: 90,
    privateApplicationObjects: objects,
  });
  return {
    dir,
    filename,
    store,
    calls,
    objects,
    service,
    clean: () => fs.rm(dir, { recursive: true, force: true }),
  };
}
test('new explicit draft has separate submit boundary; old statuses never become deletable and no replacement needed', async () => {
  const f = await fixture();
  try {
    const draft = await f.service.submitApplication(owner, input, true);
    assert.equal(draft.status, 'draft');
    const doc = await f.service.addApplicationDocument(owner, draft.id, {
      operationId: op,
      filename: 'original.txt',
      content: 'synthetic',
    });
    await assert.rejects(f.service.deleteApplicationDocument(outsider, draft.id, doc.id), /not found/);
    assert.deepEqual(await f.service.deleteApplicationDocument(owner, draft.id, doc.id), { pending: true });
    await assert.rejects(f.service.readApplicationDocument(draft.id, doc.id, owner.publicKey), /not found/);
    const reloaded = await new FileCommunityStore(f.filename).read();
    assert.equal(reloaded.applications[draft.id].documents?.length, 0);
    assert.equal(reloaded.privateApplicationDeletions![doc.id].object.key, `website uploads/${op}.txt`);
    assert.equal(reloaded.privateApplicationUploads!.intents[op].status, 'cleanup');
    await assert.rejects(f.service.submitDraftApplication(owner, draft.id), /reconciliation/);
    assert.equal(f.calls.filter((x) => x === 'PUT').length, 1); // no replacement or eager DELETE
    for (const status of ['received', 'under_review', 'approved', 'rejected', 'closed'] as const) {
      await f.store.change((s) => {
        s.applications[draft.id].status = status;
        s.applications[draft.id].documents = [
          {
            id: 'legacy',
            filename: 'x.txt',
            content: 'keep',
            sha256: '0'.repeat(64),
            uploadedAt: 1,
          },
        ];
      });
      await assert.rejects(f.service.deleteApplicationDocument(owner, draft.id, 'legacy'), /cannot be deleted/);
      assert.equal((await f.store.read()).applications[draft.id].documents![0].content, 'keep');
    }
  } finally {
    await f.clean();
  }
});
test('draft final submit atomically freezes deletion; in-flight reservations block Submit', async () => {
  const f = await fixture();
  try {
    const draft = await f.service.submitApplication(owner, input, true);
    await f.store.change((s) => {
      s.applications[draft.id].documents = [
        {
          id: 'legacy',
          filename: 'x.txt',
          content: 'keep',
          sha256: '0'.repeat(64),
          uploadedAt: 1,
        },
      ];
    });
    await assert.rejects(f.service.submitDraftApplication(outsider, draft.id), /not found/);
    const submitted = await f.service.submitDraftApplication(owner, draft.id);
    assert.equal(submitted.status, 'received');
    assert.ok(submitted.submittedAt);
    await assert.rejects(f.service.deleteApplicationDocument(owner, draft.id, 'legacy'), /cannot be deleted/);
    await assert.rejects(f.service.submitDraftApplication(owner, draft.id), /already submitted/);
    const second = await f.service.submitApplication(owner, input, true);
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    let started!: () => void;
    const observed = new Promise<void>((r) => {
      started = r;
    });
    const slow = {
      ...f.objects,
      upload: async () => {
        started();
        await gate;
      },
    };
    const service = new CommunityService(f.store, {
      retentionDays: 90,
      privateApplicationObjects: slow,
    });
    const upload = service.addApplicationDocument(owner, second.id, {
      operationId: op,
      filename: 'x.txt',
      content: 'synthetic',
    });
    await observed;
    await assert.rejects(service.submitDraftApplication(owner, second.id), /reconciliation/);
    release();
    await upload;
    assert.equal((await service.submitDraftApplication(owner, second.id)).status, 'received');
  } finally {
    await f.clean();
  }
});
test('real persisted reservation ACK loss survives restart without provider PUT or hidden retry', async () => {
  const f = await fixture();
  try {
    const app = await f.service.submitApplication(owner, input, true);
    let lost = false;
    const wrapper: CommunityStore = {
      read: () => f.store.read(),
      change: async (fn) => {
        const result = await f.store.change(fn);
        if (!lost) {
          lost = true;
          throw new Error('lost ACK after durable reserve');
        }
        return result;
      },
    };
    const service = new CommunityService(wrapper, {
      retentionDays: 90,
      privateApplicationObjects: f.objects,
    });
    await assert.rejects(
      service.addApplicationDocument(owner, app.id, {
        operationId: op,
        filename: 'x.txt',
        content: 'synthetic',
      }),
    );
    const restarted = new CommunityService(new FileCommunityStore(f.filename), {
      retentionDays: 90,
      privateApplicationObjects: f.objects,
    });
    await assert.rejects(
      restarted.addApplicationDocument(owner, app.id, {
        operationId: op,
        filename: 'x.txt',
        content: 'synthetic',
      }),
      /reconciliation/,
    );
    assert.equal(f.calls.length, 0);
    const state = await f.store.read();
    assert.equal(state.privateApplicationUploads!.intents[op].status, 'uploading');
    assert.ok(state.privateApplicationUploads!.intents[op].object.key);
  } finally {
    await f.clean();
  }
});
test('actual service committed replay with provider disabled succeeds, new upload in oracle mode fails closed without inline fallback', async () => {
  const f = await fixture();
  try {
    const app = await f.service.submitApplication(owner, input, true);
    const body = { operationId: op, filename: 'x.txt', content: 'synthetic' };
    const first = await f.service.addApplicationDocument(owner, app.id, body);
    const disabled = new CommunityService(new FileCommunityStore(f.filename), {
      retentionDays: 90,
      applicationUploadMode: 'oracle-private',
    });
    assert.deepEqual(await disabled.addApplicationDocument(owner, app.id, body), first);
    await assert.rejects(
      disabled.addApplicationDocument(owner, app.id, {
        ...body,
        operationId: '00000000-0000-4000-8000-000000000002',
      }),
      /storage unavailable/,
    );
    await assert.rejects(
      disabled.addApplicationDocument(owner, app.id, {
        filename: 'x.txt',
        content: 'must not embed',
      }),
    );
    const state = await f.store.read();
    assert.equal(state.applications[app.id].documents?.length, 1);
    assert.equal(state.audit.filter((a) => a.action === 'application.document').length, 1);
  } finally {
    await f.clean();
  }
});
test('draft privacy stays owner-only until explicit submission; retention never silently drops object refs', async () => {
  const f = await fixture();
  try {
    const app = await f.service.submitApplication(owner, input, true);
    const doc = await f.service.addApplicationDocument(owner, app.id, {
      operationId: op,
      filename: 'x.txt',
      content: 'synthetic',
    });
    await assert.rejects(f.service.readApplicationDocument(app.id, doc.id), /not found/);
    assert.equal(f.calls.filter((x) => x === 'GET').length, 0);
    assert.equal((await f.service.adminListApplications()).length, 0);
    await assert.rejects(f.service.adminSetApplicationStatus(app.id, 'approved'), /not found/);
    const late = new CommunityService(f.store, {
      retentionDays: 1,
      now: () => Date.now() + 10 * 24 * 60 * 60 * 1000,
      privateApplicationObjects: f.objects,
    });
    await late.prune();
    assert.ok((await f.store.read()).applications[app.id]);
  } finally {
    await f.clean();
  }
});
test('owned physical cleanup persists deleted tombstone, frees Submit and never resurrects old upload operation', async () => {
  const f = await fixture();
  try {
    const objects = {
      ...f.objects,
      remove: async (ref: { key: string }) => {
        f.calls.push(`DELETE:${ref.key}`);
      },
    };
    const service = new CommunityService(f.store, { retentionDays: 90, privateApplicationObjects: objects });
    const app = await service.submitApplication(owner, input, true);
    const body = { operationId: op, filename: 'x.txt', content: 'synthetic' };
    const doc = await service.addApplicationDocument(owner, app.id, body);
    await service.deleteApplicationDocument(owner, app.id, doc.id);
    assert.equal(await service.reconcileApplicationDocumentDeletion(doc.id), 'deleted');
    const state = await new FileCommunityStore(f.filename).read();
    assert.equal(state.privateApplicationDeletions![doc.id].status, 'deleted');
    assert.equal(state.privateApplicationUploads!.intents[op].status, 'deleted');
    assert.equal((await service.submitDraftApplication(owner, app.id)).status, 'received');
    await assert.rejects(service.addApplicationDocument(owner, app.id, body), /not found/);
    assert.equal(await service.reconcileApplicationDocumentDeletion(doc.id), 'deleted');
    assert.equal(f.calls.filter((x) => x.startsWith('DELETE')).length, 1);
  } finally {
    await f.clean();
  }
});
test('concurrent cleanup workers share durable claim; no second DELETE while claim live', async () => {
  const f = await fixture();
  try {
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const observed = new Promise<void>((r) => (started = r));
    const objects = {
      ...f.objects,
      remove: async () => {
        f.calls.push('DELETE');
        started();
        await gate;
      },
    };
    const service = new CommunityService(f.store, { retentionDays: 90, privateApplicationObjects: objects });
    const app = await service.submitApplication(owner, input, true);
    const doc = await service.addApplicationDocument(owner, app.id, { operationId: op, filename: 'x.txt', content: 'synthetic' });
    await service.deleteApplicationDocument(owner, app.id, doc.id);
    const first = service.reconcileApplicationDocumentDeletion(doc.id);
    await observed;
    assert.equal(await service.reconcileApplicationDocumentDeletion(doc.id), 'pending');
    release();
    assert.equal(await first, 'deleted');
    assert.equal(f.calls.filter((x) => x === 'DELETE').length, 1);
  } finally {
    await f.clean();
  }
});
test('lost DELETE reply retains original key; expired claim restart retries only same owned object', async () => {
  const f = await fixture();
  try {
    let clock = 100_000;
    const deleted: string[] = [];
    let fail = true;
    const objects = {
      ...f.objects,
      remove: async (ref: { key: string }) => {
        deleted.push(ref.key);
        if (fail) {
          fail = false;
          throw new Error('reply lost after physical delete');
        }
      },
    };
    const service = new CommunityService(f.store, { retentionDays: 90, now: () => clock, privateApplicationObjects: objects });
    const app = await service.submitApplication(owner, input, true);
    const doc = await service.addApplicationDocument(owner, app.id, { operationId: op, filename: 'x.txt', content: 'synthetic' });
    await service.deleteApplicationDocument(owner, app.id, doc.id);
    assert.equal(await service.reconcileApplicationDocumentDeletion(doc.id), 'pending');
    clock += 60_001;
    const restarted = new CommunityService(new FileCommunityStore(f.filename), { retentionDays: 90, now: () => clock, privateApplicationObjects: objects });
    assert.equal(await restarted.reconcileApplicationDocumentDeletion(doc.id), 'deleted');
    assert.equal(deleted.length, 2);
    assert.equal(deleted[0], deleted[1]);
  } finally {
    await f.clean();
  }
});
test('cleanup refuses a ref still referenced by any other document or mismatched intent', async () => {
  const f = await fixture();
  try {
    const objects = {
      ...f.objects,
      remove: async () => {
        f.calls.push('DELETE');
      },
    };
    const service = new CommunityService(f.store, { retentionDays: 90, privateApplicationObjects: objects });
    const app = await service.submitApplication(owner, input, true);
    const doc = await service.addApplicationDocument(owner, app.id, { operationId: op, filename: 'x.txt', content: 'synthetic' });
    const saved = (await f.store.read()).applications[app.id].documents![0];
    await service.deleteApplicationDocument(owner, app.id, doc.id);
    await f.store.change((s) => {
      s.applications.other = { ...s.applications[app.id], id: 'other', publicKey: 'other', documents: [saved] };
    });
    assert.equal(await service.reconcileApplicationDocumentDeletion(doc.id), 'blocked');
    assert.equal(f.calls.includes('DELETE'), false);
    await f.store.change((s) => {
      delete s.applications.other;
      s.privateApplicationDeletions![doc.id].object.sha256 = '0'.repeat(64);
    });
    assert.equal(await service.reconcileApplicationDocumentDeletion(doc.id), 'blocked');
    assert.equal(f.calls.includes('DELETE'), false);
  } finally {
    await f.clean();
  }
});
test('planned object key collision with live or deleted intent never overwrites or reuses the key', async () => {
  const f = await fixture();
  try {
    const objects = { ...f.objects, remove: async () => {} };
    const service = new CommunityService(f.store, { retentionDays: 90, privateApplicationObjects: objects });
    const app = await service.submitApplication(owner, input, true);
    const body = { operationId: op, filename: 'x.txt', content: 'synthetic' };
    const doc = await service.addApplicationDocument(owner, app.id, body);
    const other = { ...body, operationId: '00000000-0000-4000-8000-000000000002' };
    await assert.rejects(service.addApplicationDocument(owner, app.id, other), /operation conflict/);
    await service.deleteApplicationDocument(owner, app.id, doc.id);
    await service.reconcileApplicationDocumentDeletion(doc.id);
    await assert.rejects(service.addApplicationDocument(owner, app.id, other), /operation conflict/);
    assert.equal(f.calls.filter((x) => x === 'PUT').length, 1);
  } finally {
    await f.clean();
  }
});
test('lost final cleanup commit ACK reopens as deleted without another provider DELETE', async () => {
  const f = await fixture();
  try {
    const objects = {
      ...f.objects,
      remove: async () => {
        f.calls.push('DELETE');
      },
    };
    const service = new CommunityService(f.store, { retentionDays: 90, privateApplicationObjects: objects });
    const app = await service.submitApplication(owner, input, true);
    const doc = await service.addApplicationDocument(owner, app.id, { operationId: op, filename: 'x.txt', content: 'synthetic' });
    await service.deleteApplicationDocument(owner, app.id, doc.id);
    let count = 0;
    const wrapper: CommunityStore = {
      read: () => f.store.read(),
      change: async (fn) => {
        const result = await f.store.change(fn);
        if (++count === 2) throw new Error('final commit reply lost');
        return result;
      },
    };
    const ambiguous = new CommunityService(wrapper, { retentionDays: 90, privateApplicationObjects: objects });
    assert.equal(await ambiguous.reconcileApplicationDocumentDeletion(doc.id), 'pending');
    const restarted = new CommunityService(new FileCommunityStore(f.filename), { retentionDays: 90, privateApplicationObjects: objects });
    assert.equal(await restarted.reconcileApplicationDocumentDeletion(doc.id), 'deleted');
    assert.equal(f.calls.filter((x) => x === 'DELETE').length, 1);
  } finally {
    await f.clean();
  }
});

test('after Submit every submitted status rejects private and legacy additions before provider; existing content unchanged', async () => {
  const f = await fixture();
  try {
    const draft = await f.service.submitApplication(owner, input, true);
    const doc = await f.service.addApplicationDocument(owner, draft.id, { operationId: op, filename: 'x.txt', content: 'synthetic' });
    await f.service.submitDraftApplication(owner, draft.id);
    for (const status of ['received', 'under_review', 'approved', 'rejected', 'closed'] as const) {
      await f.store.change((s) => {
        s.applications[draft.id].status = status;
      });
      const before = f.calls.length;
      await assert.rejects(
        f.service.addApplicationDocument(owner, draft.id, { operationId: '00000000-0000-4000-8000-000000000002', filename: 'new.txt', content: 'new' }),
        /closed/,
      );
      const legacy = new CommunityService(f.store);
      await assert.rejects(legacy.addApplicationDocument(owner, draft.id, { filename: 'legacy.txt', content: 'new' }), /closed/);
      assert.equal(f.calls.length, before);
      assert.equal((await f.store.read()).applications[draft.id].documents![0].id, doc.id);
    }
  } finally {
    await f.clean();
  }
});
