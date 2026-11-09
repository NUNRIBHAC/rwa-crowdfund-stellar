import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { authenticateWithSession } from '../src/accounts.js';
import { PostgresCommunityStore, emptyCommunityState, type CommunityStore, type SessionAccountSnapshot } from '../src/community-store.js';

const token = `bls_${'3'.repeat(48)}`;
const hash = createHash('sha256').update(token).digest('hex');
const account = { publicKey: 'owner', displayName: null, createdAt: 1 };
const session = { tokenHash: hash, publicKey: 'owner', createdAt: 10, expiresAt: 100 };
function projectionStore() {
  let snapshot: SessionAccountSnapshot = { session: { ...session }, account: { ...account } };
  const hashes: string[] = [];
  let fullReads = 0;
  let writes = 0;
  const store: CommunityStore = {
    read: async () => {
      fullReads++;
      throw new Error('no full document read');
    },
    change: async () => {
      writes++;
      throw new Error('no write');
    },
    readSessionAccount: async (key) => {
      hashes.push(key);
      return structuredClone(snapshot);
    },
  };
  return {
    store,
    hashes,
    snapshot: (value: SessionAccountSnapshot) => {
      snapshot = value;
    },
    counts: () => ({ fullReads, writes }),
  };
}
test('auth projection receives only SHA256 and returns detached account without full read or write', async () => {
  const f = projectionStore();
  const found = await authenticateWithSession(f.store, `Bearer ${token}`, 99);
  assert.deepEqual(found, { account, sessionCreatedAt: 10 });
  found.account.displayName = 'changed';
  assert.equal((await authenticateWithSession(f.store, `Bearer ${token}`, 99)).account.displayName, null);
  assert.deepEqual(f.hashes, [hash, hash]);
  assert.deepEqual(f.counts(), { fullReads: 0, writes: 0 });
});
test('auth projection rechecks every call and denies exact expiry, missing/revoked/deleted records', async () => {
  const f = projectionStore();
  await authenticateWithSession(f.store, `Bearer ${token}`, 99);
  await assert.rejects(authenticateWithSession(f.store, `Bearer ${token}`, 100), /expired or unknown/);
  for (const snapshot of [{}, { session }, { account }]) {
    f.snapshot(snapshot);
    await assert.rejects(authenticateWithSession(f.store, `Bearer ${token}`, 99), /expired or unknown/);
  }
  assert.equal(f.hashes.length, 5);
  assert.deepEqual(f.counts(), { fullReads: 0, writes: 0 });
});
test('malformed bearer never calls projection; unknown well-formed token is freshly read', async () => {
  const f = projectionStore();
  for (const header of [undefined, '', token, 'Bearer malformed', `Bearer bls_${'a'.repeat(47)}`, `Bearer ${token}' OR 1=1`]) {
    await assert.rejects(authenticateWithSession(f.store, header, 99), /missing or malformed/);
  }
  assert.equal(f.hashes.length, 0);
  f.snapshot({});
  await assert.rejects(authenticateWithSession(f.store, `Bearer bls_${'4'.repeat(48)}`, 99), /expired or unknown/);
  assert.equal(f.hashes.length, 1);
  assert.notEqual(f.hashes[0], hash);
});
test('projection failure propagates without stale/full-document fallback', async () => {
  const f = projectionStore();
  f.store.readSessionAccount = async () => {
    throw new Error('database unavailable');
  };
  await assert.rejects(authenticateWithSession(f.store, `Bearer ${token}`, 99), /database unavailable/);
  assert.deepEqual(f.counts(), { fullReads: 0, writes: 0 });
});
function poolFixture() {
  const calls: { text: string; params?: unknown[] }[] = [];
  let rows: Record<string, unknown>[] = [];
  const pool = {
    query: async (text: string, params?: unknown[]) => {
      calls.push({ text, params });
      return { rows: text.startsWith('CREATE TABLE') ? [] : structuredClone(rows) };
    },
    end: async () => {},
  };
  return {
    pool,
    calls,
    rows: (value: Record<string, unknown>[]) => {
      rows = value;
    },
  };
}
test('PG projection uses one SELECT with fixed query and bound hash, no lock or mutation', async () => {
  const f = poolFixture();
  const store = new PostgresCommunityStore(f.pool);
  f.rows([{ validation_header: emptyCommunityState(), session, account }]);
  assert.deepEqual(await store.readSessionAccount(hash), { session, account });
  const queries = f.calls.filter((c) => !c.text.startsWith('CREATE TABLE'));
  assert.equal(queries.length, 1);
  assert.deepEqual(queries[0].params, ['main', hash]);
  assert.ok(queries[0].text.startsWith('WITH roots AS MATERIALIZED ('));
  assert.ok(!queries[0].text.includes(hash));
  assert.ok(!/SELECT doc FROM|advisory|UPDATE|INSERT|DELETE/.test(queries[0].text));
});
test('PG projection missing row denies; invalid root fails closed; NULL records stay absent', async () => {
  const f = poolFixture();
  const store = new PostgresCommunityStore(f.pool);
  assert.deepEqual(await store.readSessionAccount(hash), {});
  for (const validation_header of [false, null, undefined, 'true', 1, { version: 99 }]) {
    f.rows([{ validation_header, session, account }]);
    await assert.rejects(store.readSessionAccount(hash), /invalid community store/);
  }
  f.rows([{ validation_header: emptyCommunityState(), session: null, account: null }]);
  assert.deepEqual(await store.readSessionAccount(hash), {});
});
test('PG projection rejects raw bearer and malformed/injection hash before query', async () => {
  const f = poolFixture();
  const store = new PostgresCommunityStore(f.pool);
  await new Promise((resolve) => setImmediate(resolve));
  const before = f.calls.length;
  for (const key of [token, 'x', hash.toUpperCase(), `${hash}' OR 1=1`, 'f'.repeat(63), 'f'.repeat(65)]) {
    await assert.rejects(store.readSessionAccount(key), /invalid session hash/);
  }
  assert.equal(f.calls.length, before);
});

test('validation header preserves native JSON number semantics instead of exact SQL numeric truthiness', async () => {
  const f = poolFixture();
  const store = new PostgresCommunityStore(f.pool);
  for (const raw of ['1e-400', '-1e-400']) {
    const header = { ...emptyCommunityState(), comments: JSON.parse(raw) };
    f.rows([{ validation_header: header, session, account }]);
    await assert.rejects(store.readSessionAccount(hash), /invalid community store/);
  }
  for (const raw of ['1.00000000000000000000000000001', '0.99999999999999999999999999999']) {
    const header = { ...emptyCommunityState(), version: JSON.parse(raw) };
    f.rows([{ validation_header: header, session, account }]);
    assert.deepEqual(await store.readSessionAccount(hash), { session, account });
  }
});

test('PG projection explicitly refuses non-string stored publicKey rather than SQL/JS key coercion', async () => {
  const f = poolFixture();
  const store = new PostgresCommunityStore(f.pool);
  for (const publicKey of [null, undefined, 1, 9007199254740992, true, { x: 1 }, ['x']]) {
    f.rows([{ validation_header: emptyCommunityState(), session: { ...session, publicKey }, account }]);
    assert.deepEqual(await store.readSessionAccount(hash), {});
  }
});
