import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostgresCommunityStore, emptyCommunityState } from '../src/community-store.js';
import { listSessions } from '../src/accounts.js';
import { CommunityService } from '../src/community.js';
test('current singleton owner projection adapter and caller boundaries', async () => {
  const checks = [];
  const now = 1000;
  const base = emptyCommunityState();
  const header = { version: 1, accounts: true, challenges: true, sessions: true, comments: true, news: true, tickets: true, applications: true };
  let response: any = { rows: [{ validation_header: header, selected: {}, has_null: false }] };
  const calls: any[] = [];
  const pool: any = {
    async query(q: any, params: any) {
      calls.push({ q, params });
      return q.startsWith('CREATE TABLE') ? { rows: [] } : response;
    },
  };
  const pg = new PostgresCommunityStore(pool);
  await pg.readOwnSessions('owner');
  const session = (extra: any) => ({ publicKey: 'owner', tokenHash: 'a'.repeat(64), createdAt: 1, expiresAt: 2000, ...extra });
  const cases = [
    session({}),
    session({ expiresAt: 1000 }),
    session({ expiresAt: 999 }),
    session({ expiresAt: '1001' }),
    session({ expiresAt: null }),
    session({ expiresAt: Infinity }),
    session({ expiresAt: 0 }),
    session({ createdAt: '2' }),
    session({ createdAt: null }),
    session({ publicKey: 'other' }),
    session({ tokenHash: null }),
    session({ tokenHash: 42 }),
  ];
  for (const item of cases) {
    response = { rows: [{ validation_header: { ...header }, selected: { item }, has_null: false }] };
    const state = { ...base, sessions: { item } };
    const old: any = { read: async () => state };
    const results = await Promise.allSettled([listSessions(old, 'owner', undefined, now), listSessions(pg, 'owner', undefined, now)]);
    assert.equal(results[0].status, results[1].status);
    if (results[0].status === 'fulfilled' && results[1].status === 'fulfilled') assert.deepEqual(results[0].value, results[1].value);
    checks.push('session-' + checks.length);
  }
  response = { rows: [{ validation_header: header, selected: {}, has_null: true }] };
  await assert.rejects(pg.readOwnApplications('owner'));
  await assert.rejects(pg.readOwnSessions('owner'));
  checks.push('global null rejection');
  for (const version of [0, -0, 1 + Number.EPSILON, 2, null, false]) {
    response = { rows: [{ validation_header: { ...header, version }, selected: {}, has_null: false }] };
    await assert.rejects(pg.readOwnApplications('owner'));
    checks.push('invalid header version');
  }
  const account: any = { publicKey: 'owner' };
  for (const bad of [null, {}, [null], [42], [[]]]) {
    const store: any = { readOwnApplications: async () => bad };
    await assert.rejects(new CommunityService(store, { retentionDays: 90 }).listOwnApplications(account));
    checks.push('application hook guard');
  }
  const other: any = { readOwnApplications: async () => [{ publicKey: 'other', createdAt: 1 }] };
  assert.deepEqual(await new CommunityService(other, { retentionDays: 90 }).listOwnApplications(account), []);
  checks.push('application crossowner guard');
  assert.ok(calls.filter((c) => !c.q.startsWith('CREATE')).every((c) => c.params[0] === 'main' && c.q.includes('WITH roots AS MATERIALIZED')));
  checks.push('parameterized singleton projection dispatch');
  assert.equal(checks.length, 26);
});
