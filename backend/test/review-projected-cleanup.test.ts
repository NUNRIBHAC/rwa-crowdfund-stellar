import test from 'node:test';
import assert from 'node:assert/strict';
import { CommunityService } from '../src/community.js';
import { PostgresCommunityStore } from '../src/community-store.js';
test('owner application projection carries cleanup boolean from the same snapshot without private job fields', async () => {
  const header = { version: 1, accounts: true, challenges: true, sessions: true, comments: true, news: true, tickets: true, applications: true };
  const application = { id: 'app', publicKey: 'owner', createdAt: 1, status: 'draft' };
  let pending: unknown = ['app'];
  const queries: { text: string; params?: unknown[] }[] = [];
  const pool: any = {
    query: async (text: string, params?: unknown[]) => {
      queries.push({ text, params });
      return text.startsWith('CREATE TABLE')
        ? { rows: [] }
        : { rows: [{ validation_header: header, selected: { app: application }, has_null: false, pending_cleanup_applications: pending }] };
    },
  };
  const store = new PostgresCommunityStore(pool);
  const service = new CommunityService(store, { retentionDays: 90 });
  const owner = { publicKey: 'owner', displayName: null, createdAt: 1 };
  const list = await service.listOwnApplications(owner);
  assert.equal((list[0] as any).documentCleanupPending, true);
  assert.deepEqual(Object.keys(list[0]).sort(), [...Object.keys(application), 'documentCleanupPending'].sort());
  const query = queries.filter((q) => !q.text.startsWith('CREATE'))[0];
  assert.deepEqual(query.params, ['main', 'owner']);
  assert.match(query.text, /"privateApplicationDeletions" jsonb/);
  assert.match(query.text, /pending_cleanup_applications/);
  assert.match(query.text, /value->>'owner'=\$2/);
  assert.match(query.text, /value->>'status' IS DISTINCT FROM 'deleted'/);
  pending = [];
  assert.equal(((await service.listOwnApplications(owner))[0] as any).documentCleanupPending, false);
  assert.equal((application as any).documentCleanupPending, undefined);
  for (const malformed of [undefined, null, {}, [null], [42]]) {
    pending = malformed;
    await assert.rejects(service.listOwnApplications(owner), /invalid application cleanup projection/);
  }
});
