import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  PrivateApplicationUploadWorkflow,
  documentMetadata,
  type UploadState,
  type UploadRepository,
  type PrivateTextObjects,
} from '../src/private-application-upload-workflow.js';
const operation = (n = 1) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
function fixture() {
  let state: UploadState = {
    applications: {
      app: { id: 'app', publicKey: 'owner', status: 'draft', documents: [] },
    },
    intents: {},
  };
  let changes = 0;
  let commitFailure = false;
  let closeDuringPut = false;
  let uncertain = false;
  const calls: string[] = [];
  const repo: UploadRepository = {
    read: async () => structuredClone(state),
    change: async (fn) => {
      changes++;
      const copy = structuredClone(state);
      const result = fn(copy);
      if (commitFailure && changes === 2) throw new Error('DB sensitive commit detail');
      state = copy;
      return result;
    },
  };
  let serial = 0;
  const objects: PrivateTextObjects = {
    plan: (content) => {
      if (Buffer.byteLength(content) > 16000 || !content) throw new Error('invalid private text document');
      return {
        storageId: 'synthetic-storage-identity',
        key: `applications/${operation(++serial)}.txt`,
        sha256: sha(content),
        bytes: Buffer.byteLength(content),
      };
    },
    upload: async (ref) => {
      calls.push(`PUT:${ref.key}`);
      if (closeDuringPut) state.applications.app.status = 'rejected';
      if (uncertain) throw new Error('provider sensitive timeout');
    },
    read: async (ref) => {
      calls.push(`GET:${ref.key}`);
      return 'synthetic';
    },
  };
  return {
    service: new PrivateApplicationUploadWorkflow(repo, objects, () => 123),
    repo,
    objects,
    calls,
    state: () => state,
    commitFailure: () => {
      commitFailure = true;
    },
    closeDuringPut: () => {
      closeDuringPut = true;
    },
    uncertain: () => {
      uncertain = true;
    },
  };
}
test('success stores only private ref and metadata; browser DTO explicitly excludes content and private fields', async () => {
  const f = fixture();
  const result = await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
  assert.deepEqual(Object.keys(result).sort(), ['filename', 'id', 'sha256', 'uploadedAt']);
  const doc = f.state().applications.app.documents![0];
  assert.ok(doc.object);
  assert.equal(doc.content, undefined);
  assert.deepEqual(documentMetadata({ ...doc, content: 'private' }), result);
  assert.equal(f.calls.length, 1);
  assert.equal(await f.service.read('owner', 'app', result.id), 'synthetic');
});
test('wrong owner, closed review or sixth slot makes no PUT', async () => {
  for (const mode of ['owner', 'closed', 'sixth']) {
    const f = fixture();
    if (mode === 'closed') f.state().applications.app.status = 'rejected';
    if (mode === 'sixth')
      f.state().applications.app.documents = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        filename: 'x.txt',
        sha256: sha('x'),
        content: 'x',
        uploadedAt: 0,
      }));
    await assert.rejects(f.service.upload(mode === 'owner' ? 'other' : 'owner', 'app', operation(), 'demo.txt', 'synthetic'));
    assert.equal(f.calls.length, 0);
  }
});
test('pending and uncertain reservations count toward five and remain invisible documents', async () => {
  const f = fixture();
  f.uncertain();
  for (let n = 1; n <= 5; n++) await assert.rejects(f.service.upload('owner', 'app', operation(n), 'demo.txt', 'synthetic'), /reconciliation required/);
  await assert.rejects(f.service.upload('owner', 'app', operation(6), 'demo.txt', 'synthetic'), /document limit/);
  assert.equal(f.calls.length, 5);
  assert.equal(f.state().applications.app.documents?.length, 0);
  assert.equal(Object.values(f.state().intents).filter((i) => i.status === 'uncertain').length, 5);
});
test('ambiguous write retains original key and repeated operation does not retry or allocate provider object', async () => {
  const f = fixture();
  f.uncertain();
  await assert.rejects(f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /^Error: upload reconciliation required$/);
  const key = f.state().intents[operation()].object.key;
  await assert.rejects(f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /reconciliation required/);
  assert.equal(f.calls.length, 1);
  assert.equal(f.state().intents[operation()].object.key, key);
});
test('confirmed PUT then DB failure retains owned cleanup intent; no eager DELETE or hidden retry', async () => {
  const f = fixture();
  f.commitFailure();
  await assert.rejects(f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /^Error: upload reconciliation required$/);
  assert.equal(f.state().intents[operation()].status, 'cleanup');
  assert.equal(f.state().applications.app.documents?.length, 0);
  assert.equal(f.calls.length, 1);
  assert.match(f.calls[0], /^PUT:/);
});
test('review-state race is rechecked after PUT and does not publish a document', async () => {
  const f = fixture();
  f.closeDuringPut();
  await assert.rejects(f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /reconciliation required/);
  assert.equal(f.state().applications.app.documents?.length, 0);
  assert.equal(f.state().intents[operation()].status, 'cleanup');
});
test('committed idempotent replay returns same metadata with no PUT; changed content conflicts', async () => {
  const f = fixture();
  const first = await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
  assert.deepEqual(await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), first);
  assert.equal(f.calls.length, 1);
  await assert.rejects(f.service.upload('owner', 'app', operation(), 'demo.txt', 'different'), /operation conflict/);
  assert.equal(f.calls.length, 1);
});
test('unauthorized read makes no provider GET; legacy inline reads without provider or rewriting', async () => {
  const f = fixture();
  const doc = await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
  f.calls.length = 0;
  await assert.rejects(f.service.read('other', 'app', doc.id), /not found/);
  assert.equal(f.calls.length, 0);
  const legacy = 'legacy\ud800text';
  f.state().applications.app.documents!.push({
    id: 'old',
    filename: 'old.txt',
    content: legacy,
    sha256: sha(legacy),
    uploadedAt: 0,
  });
  assert.equal(await f.service.read('owner', 'app', 'old'), legacy);
  assert.equal(f.calls.length, 0);
});
test('absent config refuses new upload and object read, but existing legacy reads work', async () => {
  const f = fixture();
  const doc = await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
  const disabled = new PrivateApplicationUploadWorkflow(f.repo, undefined);
  await assert.rejects(disabled.upload('owner', 'app', operation(2), 'demo.txt', 'synthetic'), /storage unavailable/);
  await assert.rejects(disabled.read('owner', 'app', doc.id), /storage unavailable/);
});
test('six concurrent reservations allow exactly five PUTs and five committed documents', async () => {
  const f = fixture();
  const results = await Promise.allSettled(Array.from({ length: 6 }, (_, n) => f.service.upload('owner', 'app', operation(n + 1), 'demo.txt', 'synthetic')));
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 5);
  assert.equal(f.calls.length, 5);
  assert.equal(f.state().applications.app.documents?.length, 5);
});
test('ambiguous DB commit acknowledgement never marks committed object for cleanup or deletes it', async () => {
  const f = fixture();
  let count = 0;
  const ambiguous: UploadRepository = {
    read: () => f.repo.read(),
    change: async (fn) => {
      const value = await f.repo.change(fn);
      count++;
      if (count === 2) throw new Error('DB acknowledgement lost after commit');
      return value;
    },
  };
  const service = new PrivateApplicationUploadWorkflow(ambiguous, f.objects, () => 123);
  await assert.rejects(service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /reconciliation required/);
  assert.equal(f.state().intents[operation()].status, 'committed');
  const replay = await service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
  assert.equal(replay.id, f.state().applications.app.documents![0].id);
  assert.equal(f.calls.length, 1);
});
test('identical committed replay survives closed review, linked campaign and disabled provider without planning or PUT', async () => {
  for (const mode of ['closed', 'linked', 'disabled']) {
    const f = fixture();
    const first = await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
    if (mode === 'closed') f.state().applications.app.status = 'approved';
    if (mode === 'linked') f.state().applications.app.campaign = { id: 'campaign' };
    const provider =
      mode === 'disabled'
        ? undefined
        : {
            ...f.objects,
            plan: () => {
              throw new Error('must not plan replay');
            },
          };
    const replayService = new PrivateApplicationUploadWorkflow(f.repo, provider);
    assert.deepEqual(await replayService.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), first);
    await assert.rejects(replayService.upload('other', 'app', operation(), 'demo.txt', 'synthetic'), /not found/);
    await assert.rejects(replayService.upload('owner', 'app', operation(), 'demo.txt', 'changed'), /operation conflict/);
    assert.equal(f.calls.length, 1);
  }
});
test('committed replay requires matching committed document and durable storage identity', async () => {
  const f = fixture();
  await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
  f.state().applications.app.documents![0].object!.storageId = 'changed-store';
  await assert.rejects(f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /reconciliation required/);
  assert.equal(f.calls.length, 1);
});

test('new uploads are draft-only; every legacy review state and submitted draft refuses PUT without migration', async () => {
  for (const status of ['received', 'under_review', 'approved', 'rejected', 'closed']) {
    const f = fixture();
    f.state().applications.app.status = status;
    const before = structuredClone(f.state());
    await assert.rejects(f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /review is closed/);
    assert.deepEqual(f.state(), before);
    assert.equal(f.calls.length, 0);
  }
  for (const boundary of ['submitted', 'linked']) {
    const f = fixture();
    if (boundary === 'submitted') f.state().applications.app.submittedAt = 0;
    else f.state().applications.app.campaign = { id: 'campaign' };
    await assert.rejects(f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /review is closed/);
    assert.equal(f.calls.length, 0);
    assert.deepEqual(f.state().intents, {});
  }
});

test('Submit racing a PUT prevents publication and preserves the cleanup intent', async () => {
  const f = fixture();
  const objects: PrivateTextObjects = {
    ...f.objects,
    upload: async (ref, content) => {
      await f.objects.upload(ref, content);
      f.state().applications.app.submittedAt = 123;
    },
  };
  const service = new PrivateApplicationUploadWorkflow(f.repo, objects);
  await assert.rejects(service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /reconciliation required/);
  assert.equal(f.state().applications.app.documents?.length, 0);
  assert.equal(f.state().intents[operation()].status, 'cleanup');
  assert.equal(f.calls.length, 1);
});

test('replay requires all document reference fields and a matching document', async () => {
  for (const field of ['key', 'sha256', 'storageId', 'bytes', 'filename', 'documentHash', 'missingObject', 'missingDocument']) {
    const f = fixture();
    await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
    const doc = f.state().applications.app.documents![0];
    if (field === 'key') doc.object!.key += '-changed';
    if (field === 'sha256') doc.object!.sha256 = sha('changed');
    if (field === 'storageId') doc.object!.storageId = 'changed';
    if (field === 'bytes') doc.object!.bytes++;
    if (field === 'filename') doc.filename = 'changed.txt';
    if (field === 'documentHash') doc.sha256 = sha('changed');
    if (field === 'missingObject') delete doc.object;
    if (field === 'missingDocument') f.state().applications.app.documents = [];
    await assert.rejects(f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic'), /reconciliation required/);
    assert.equal(f.calls.length, 1);
  }
});

test('planned object collision against a reservation or another application makes no second PUT', async () => {
  for (const mode of ['intent', 'document']) {
    const f = fixture();
    const first = await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
    const ref = structuredClone(f.state().applications.app.documents![0].object!);
    if (mode === 'document') {
      f.state().applications.other = { id: 'other', publicKey: 'other', status: 'draft', documents: f.state().applications.app.documents };
      f.state().applications.app.documents = [];
      f.state().intents = {};
    }
    const service = new PrivateApplicationUploadWorkflow(f.repo, { ...f.objects, plan: () => ref });
    await assert.rejects(service.upload('owner', 'app', operation(2), 'demo.txt', 'synthetic'), /operation conflict/);
    assert.equal(f.calls.length, 1);
    assert.equal(f.state().intents[operation(2)], undefined);
    assert.ok(first.id);
  }
});

test('invalid operation, filename and bounded UTF-8 text never reserve or PUT', async () => {
  for (const [op, filename, content] of [
    ['invalid', 'demo.txt', 'synthetic'],
    [operation(), '../demo.txt', 'synthetic'],
    [operation(), 'demo.html', 'synthetic'],
    [operation(), 'demo.txt', ''],
    [operation(), 'demo.txt', 'é'.repeat(8001)],
    [operation(), 'demo.txt', 'unsafe\u0000text'],
  ]) {
    const f = fixture();
    await assert.rejects(f.service.upload('owner', 'app', op, filename, content), /invalid/);
    assert.deepEqual(f.state().intents, {});
    assert.equal(f.calls.length, 0);
  }
});

test('server-authorized operator can read; disabled storage preserves exact legacy inline bytes', async () => {
  const f = fixture();
  const doc = await f.service.upload('owner', 'app', operation(), 'demo.txt', 'synthetic');
  assert.equal(await f.service.read('operator', 'app', doc.id, true), 'synthetic');
  const legacy = 'legacy\ud800text';
  f.state().applications.app.documents!.push({ id: 'legacy', filename: 'legacy.txt', content: legacy, sha256: sha(legacy), uploadedAt: 0 });
  const disabled = new PrivateApplicationUploadWorkflow(f.repo, undefined);
  const before = structuredClone(f.state());
  assert.equal(await disabled.read('owner', 'app', 'legacy'), legacy);
  assert.deepEqual(f.state(), before);
  assert.equal(f.calls.filter((x) => x.startsWith('GET:')).length, 1);
});
