import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { journalBackend, resetJournalBackendForTests, PostgresJournal } from '../src/journal.js';
import type { Intent, IntentStore } from '../src/journal.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'journal-test-'));
const sample: Intent = { hash: 'a'.repeat(64), campaign: 'demo-solar', actor: 'G' + 'A'.repeat(55), action: 'contribute', amount: '7.00', xdr: 'AAAAunsigned', status: 'BUILT' };
const signed: Intent = { ...sample, signedXdr: 'AAAAsigned', status: 'SIGNED' };

test('file backend round-trips intents and is the default', async () => {
  delete process.env.SOROBAN_JOURNAL_BACKEND;
  process.env.SOROBAN_INTENTS_PATH = path.join(tmp, 'file-journal.json');
  resetJournalBackendForTests();
  const j = await journalBackend();
  assert.deepEqual(await j.read(), { intents: [] });
  await j.save({ intents: [sample] });
  resetJournalBackendForTests(); // re-read from disk, not memory
  const again = await journalBackend();
  assert.deepEqual(await again.read(), { intents: [sample] });
});

test('unknown backend fails closed', async () => {
  process.env.SOROBAN_JOURNAL_BACKEND = 'sqlite';
  resetJournalBackendForTests();
  assert.throws(() => { void journalBackend(); }, /unknown SOROBAN_JOURNAL_BACKEND/);
  delete process.env.SOROBAN_JOURNAL_BACKEND;
});

test('postgres backend without a database URL fails closed, never falls back', async () => {
  process.env.SOROBAN_JOURNAL_BACKEND = 'postgres';
  delete process.env.SOROBAN_JOURNAL_DATABASE_URL;
  resetJournalBackendForTests();
  await assert.rejects(journalBackend(), /requires SOROBAN_JOURNAL_DATABASE_URL/);
  delete process.env.SOROBAN_JOURNAL_BACKEND;
});

// In-memory fake of the pg pool surface: records statements and emulates the
// upsert so the row-mapping and transaction discipline are tested without a
// live database.
function fakePool() {
  const rows = new Map<string, any>();
  let seq = 0;
  const calls: string[] = [];
  let inTx = false;
  return {
    calls,
    async query(text: string, params?: unknown[]) {
      const sql = text.replace(/\s+/g, ' ').trim();
      calls.push(sql.split(' ')[0].toUpperCase());
      if (/^CREATE TABLE/.test(sql)) return { rows: [] };
      if (/^ALTER TABLE/.test(sql)) return { rows: [] };
      if (/^DELETE FROM soroban_intents/.test(sql)) {
        assert.ok(inTx, 'retention delete outside transaction');
        return { rows: [], rowCount: 0 };
      }
      if (sql === 'BEGIN') { assert.equal(inTx, false, 'nested transaction'); inTx = true; return { rows: [] }; }
      if (sql === 'COMMIT') { inTx = false; return { rows: [] }; }
      if (sql === 'ROLLBACK') { inTx = false; return { rows: [] }; }
      if (/^SELECT signed_xdr FROM soroban_intents/.test(sql)) {
        assert.ok(inTx, 'conflict check outside transaction');
        const row = rows.get((params as any[])[0]);
        return { rows: row ? [{ signed_xdr: row.signed_xdr ?? null }] : [] };
      }
      if (/^INSERT INTO soroban_intents/.test(sql)) {
        assert.ok(inTx, 'upsert outside transaction');
        const [hash, campaign, actor, action, amount, xdr, signed_xdr, status] = params as any[];
        rows.set(hash, { seq: rows.get(hash)?.seq ?? ++seq, hash, campaign, actor, action, amount, xdr, signed_xdr, status });
        return { rows: [] };
      }
      if (/^SELECT .* FROM soroban_intents ORDER BY seq$/.test(sql)) {
        return { rows: [...rows.values()].sort((a, b) => a.seq - b.seq) };
      }
      throw new Error('unexpected SQL: ' + sql);
    },
    async end() {},
  };
}

test('postgres journal persists, updates and re-reads intents in order', async () => {
  const pool = fakePool();
  const j = new PostgresJournal(pool);
  assert.deepEqual(await j.read(), { intents: [] });
  const second: Intent = { ...sample, hash: 'b'.repeat(64), campaign: 'other' };
  await j.save({ intents: [sample, second] });
  await j.save({ intents: [signed, second] }); // status/signedXdr update, no duplicate
  const store = await j.read();
  assert.equal(store.intents.length, 2);
  assert.deepEqual(store.intents[0], signed);
  assert.deepEqual(store.intents[1], second);
  assert.ok(pool.calls.includes('BEGIN') && pool.calls.includes('COMMIT'), 'transactional save');
});

test('postgres journal rolls back when an upsert fails', async () => {
  const pool = fakePool();
  const original = pool.query.bind(pool);
  let failed = false;
  pool.query = async (text: string, params?: unknown[]) => {
    if (!failed && /^INSERT/.test(text.replace(/\s+/g, ' ').trim())) { failed = true; throw new Error('db write lost'); }
    return original(text, params);
  };
  const j = new PostgresJournal(pool);
  await assert.rejects(j.save({ intents: [sample] }), /db write lost/);
  assert.ok(pool.calls.includes('ROLLBACK'), 'rollback attempted');
  assert.deepEqual(await j.read(), { intents: [] }, 'nothing committed');
});

test('file journal has no cross-process guard; postgres runExclusive holds and releases an advisory lock', async () => {
  // The file backend intentionally omits runExclusive: single instance only.
  const queries: string[] = [];
  const client = { query: async (text: string) => { queries.push(text.replace(/\s+/g, ' ').trim()); return { rows: [] }; }, release: () => { queries.push('RELEASE'); } };
  const pool = { query: async () => ({ rows: [] }), end: async () => {}, connect: async () => client };
  const j = new PostgresJournal(pool as any);
  const order: string[] = [];
  await j.runExclusive!('soroban-journal-ops', async () => { order.push('critical'); });
  assert.ok(queries.some(q => q.includes('pg_advisory_lock')), 'advisory lock taken');
  assert.ok(queries.some(q => q.includes('pg_advisory_unlock')), 'advisory lock released');
  assert.ok(queries.includes('RELEASE'), 'client released');
  assert.deepEqual(order, ['critical']);
});

test('postgres save never regresses a signed envelope or terminal status in its upsert', async () => {
  const pool = fakePool();
  const raw: string[] = [];
  const original = pool.query.bind(pool);
  pool.query = async (text: string, params?: unknown[]) => { raw.push(text.replace(/\s+/g, ' ')); return original(text, params); };
  const j = new PostgresJournal(pool);
  await j.save({ intents: [signed] });
  const upsert = raw.find(c => c.includes('ON CONFLICT'))!;
  assert.match(upsert, /signed_xdr = CASE WHEN EXCLUDED\.status IN \('SUCCESS','FAILED'\) THEN NULL ELSE COALESCE\(soroban_intents\.signed_xdr, EXCLUDED\.signed_xdr\) END/, 'signed envelope never erased before terminal, scrubbed at terminal');
  assert.match(upsert, /CASE WHEN soroban_intents\.status IN \('SUCCESS','FAILED'\)/, 'terminal status never overwritten');
});

test('conflicting signed envelope for the same hash is rejected and the original is preserved', async () => {
  const pool = fakePool();
  const j = new PostgresJournal(pool);
  await j.save({ intents: [signed] });
  await assert.rejects(
    j.save({ intents: [{ ...signed, signedXdr: 'AAAAdifferent' }] }),
    /conflicting signed envelope/);
  assert.equal((await j.read()).intents[0].signedXdr, signed.signedXdr, 'original envelope intact');
  await j.save({ intents: [signed] }); // identical re-save is idempotent, not a conflict
  assert.equal((await j.read()).intents.length, 1);
});

test('postgres save runs its whole transaction on one dedicated connection', async () => {
  // Regression test for the pool.query transaction bug: pg routes each
  // pool.query call to any idle client, so BEGIN, the FOR UPDATE check, the
  // upsert and COMMIT could land on different backends and silently lose the
  // transaction. save() must check out one client and use it for everything.
  const connections: string[][] = [];
  const makeClient = () => {
    const stmts: string[] = [];
    connections.push(stmts);
    return {
      query: async (text: string) => { stmts.push(text.replace(/\s+/g, ' ').trim().split(' ')[0].toUpperCase()); return { rows: [] }; },
      release: () => {},
    };
  };
  let poolQueries = 0;
  const pool = {
    query: async () => { poolQueries++; return { rows: [] }; },
    end: async () => {},
    connect: async () => makeClient(),
  };
  const j = new PostgresJournal(pool as any);
  await j.save({ intents: [sample] });
  // Connection 1 ran schema init (advisory lock + CREATE TABLE); the save
  // must take exactly one more connection and run its full transaction there.
  assert.equal(connections.length, 2, 'schema init plus one save connection');
  const saveConn = connections[1];
  assert.deepEqual(saveConn.filter(s => s === 'BEGIN' || s === 'COMMIT'), ['BEGIN', 'COMMIT'], 'single-connection transaction boundaries');
  assert.ok(saveConn.includes('SELECT') && saveConn.includes('INSERT'), 'conflict check and upsert on the same connection');
  assert.equal(poolQueries, 0, 'save must not route transaction statements through pool.query');
});

test('terminal intents have their signed envelope scrubbed and stale terminal rows are pruned', async () => {
  // File backend policy check: terminal status scrubs signedXdr (bearer
  // instrument no longer needed; the hash stays as proof), and retention
  // prunes only old terminal rows and expired unsigned builds - never signed
  // non-terminal or untimestamped legacy rows.
  const { pruneIntents, purgeTerminalEnvelopes } = await import('../src/journal.js');
  const now = Date.now();
  const old_iso = new Date(now - 40 * 24 * 3600 * 1000).toISOString();
  const recent_iso = new Date(now - 3600 * 1000).toISOString();
  const terminalOld: Intent = { ...signed, status: 'SUCCESS', createdAt: old_iso, updatedAt: old_iso };
  const terminalRecent: Intent = { ...signed, hash: 'b'.repeat(64), status: 'FAILED', createdAt: old_iso, updatedAt: recent_iso };
  const unsignedOld: Intent = { ...sample, hash: 'c'.repeat(64), createdAt: old_iso };
  const signedHeld: Intent = { ...sample, hash: 'd'.repeat(64), signedXdr: 'AAAAheld', status: 'NOT_FOUND', createdAt: old_iso };
  const legacyNoTs: Intent = { ...sample, hash: 'e'.repeat(64), status: 'SUCCESS' };
  const purged = purgeTerminalEnvelopes([terminalOld, terminalRecent, unsignedOld, signedHeld, legacyNoTs]);
  assert.equal(purged[0].signedXdr, undefined, 'terminal signed envelope scrubbed');
  assert.equal(purged[1].signedXdr, undefined);
  assert.equal(purged[3].signedXdr, 'AAAAheld', 'signed non-terminal kept');
  const pruned = pruneIntents(purged, now);
  assert.deepEqual(pruned.map(i => i.hash), [terminalRecent.hash, signedHeld.hash, legacyNoTs.hash],
    'old terminal and expired unsigned pruned; recent terminal, held signed and legacy kept');
});

test('postgres retention delete is issued inside the save transaction', async () => {
  const pool = fakePool();
  const j = new PostgresJournal(pool);
  await j.save({ intents: [sample] });
  assert.ok(pool.calls.includes('DELETE'), 'retention delete issued');
});

test('malformed journal rows never break lookups and are preserved verbatim on save', async () => {
  const file = path.join(tmp, 'file-journal-malformed.json');
  const malformed = [null, {}, 'garbage-row', 42];
  fs.writeFileSync(file, JSON.stringify({ intents: [sample, ...malformed] }));
  process.env.SOROBAN_JOURNAL_BACKEND = 'file';
  process.env.SOROBAN_INTENTS_PATH = file;
  resetJournalBackendForTests();
  const j = await journalBackend();
  // Only intact rows are visible; malformed rows cannot poison iteration.
  assert.deepEqual(await j.read(), { intents: [sample] });
  // A read-modify-write keeps malformed rows on disk, never silently deletes.
  await j.save({ intents: [sample, signed] });
  const onDisk = JSON.parse(fs.readFileSync(file, 'utf8')).intents;
  assert.equal(onDisk.length, 4 + 2);
  for (const m of malformed) assert.ok(onDisk.some((r: any) => JSON.stringify(r) === JSON.stringify(m)));
  delete process.env.SOROBAN_JOURNAL_BACKEND;
});
