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
      if (sql === 'BEGIN') { assert.equal(inTx, false, 'nested transaction'); inTx = true; return { rows: [] }; }
      if (sql === 'COMMIT') { inTx = false; return { rows: [] }; }
      if (sql === 'ROLLBACK') { inTx = false; return { rows: [] }; }
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
