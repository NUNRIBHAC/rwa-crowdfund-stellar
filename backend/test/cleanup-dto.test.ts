import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { CommunityService } from '../src/community.js';
import { FileCommunityStore } from '../src/community-store.js';
test('owner metadata exposes only authoritative pending boolean across reopen and worker completion', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-dto-'));
  try {
    const file = path.join(dir, 'state.json');
    const owner = { publicKey: 'owner', displayName: null, createdAt: 1 };
    const objects = {
      plan: (s: string) => ({
        storageId: 'synthetic',
        key: 'website uploads/synthetic.txt',
        sha256: createHash('sha256').update(s).digest('hex'),
        bytes: Buffer.byteLength(s),
      }),
      upload: async () => {},
      read: async () => '',
      remove: async () => {},
    };
    const service = new CommunityService(new FileCommunityStore(file), { retentionDays: 90, privateApplicationObjects: objects });
    const a = await service.submitApplication(
      owner,
      { projectName: 'Synthetic', country: 'PT', instrumentType: 'Testnet', targetAmount: '2', description: 'synthetic' },
      true,
    );
    const d = await service.addApplicationDocument(owner, a.id, {
      operationId: '00000000-0000-4000-8000-000000000001',
      filename: 'x.txt',
      content: 'synthetic',
    });
    await service.deleteApplicationDocument(owner, a.id, d.id);
    const reopened = new CommunityService(new FileCommunityStore(file), { retentionDays: 90, privateApplicationObjects: objects });
    let list = await reopened.listOwnApplications(owner);
    assert.equal((list[0] as (typeof list)[0] & { documentCleanupPending: boolean }).documentCleanupPending, true);
    assert.equal((await reopened.listOwnApplications({ ...owner, publicKey: 'other' })).length, 0);
    assert.equal(await reopened.reconcileApplicationDocumentDeletion(d.id), 'deleted');
    list = await reopened.listOwnApplications(owner);
    assert.equal((list[0] as (typeof list)[0] & { documentCleanupPending: boolean }).documentCleanupPending, false);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
