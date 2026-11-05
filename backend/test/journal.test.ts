import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { Account, Asset, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { journalBackend, resetJournalBackendForTests, PostgresJournal } from '../src/journal.js';
import type { Intent } from '../src/journal.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'journal-test-'));
const sample: Intent = {
  hash: 'a'.repeat(64),
  campaign: 'demo-solar',
  actor: 'G' + 'A'.repeat(55),
  action: 'contribute',
  amount: '7.00',
  xdr: 'AAAAunsigned',
  status: 'BUILT',
};
const signed: Intent = { ...sample, signedXdr: 'AAAAsigned', status: 'SIGNED' };
// Postgres rows pass semantic validation, so postgres tests need real
// envelopes and a real wallet address, unlike the file-only samples above.
const pgActor = Keypair.random();
const pgTx = (seq: string) =>
  new TransactionBuilder(new Account(pgActor.publicKey(), seq), { fee: '100', networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.payment({ destination: Keypair.random().publicKey(), asset: Asset.native(), amount: '1' }))
    .setTimeout(60)
    .build();
const pgUnsignedTx = pgTx('1');
const pgSignedTx = pgTx('2');
pgSignedTx.sign(pgActor);
const pgHash = (tx: { hash(): Uint8Array }) => Buffer.from(tx.hash()).toString('hex');
const pgSample: Intent = {
  hash: pgHash(pgUnsignedTx),
  campaign: 'demo-solar',
  actor: pgActor.publicKey(),
  action: 'contribute',
  amount: '7.00',
  xdr: pgUnsignedTx.toXDR(),
  status: 'BUILT',
};
const pgSigned: Intent = { ...pgSample, xdr: pgSignedTx.toXDR(), signedXdr: pgSignedTx.toXDR(), status: 'SIGNED' }; // same hash as pgSample: a signature UPDATE, not a new intent
// A raw row as the fake pool stores it (created_at/updated_at ride along).
const pgRow = (i: Intent, extra: Record<string, unknown> = {}) => ({
  hash: i.hash,
  campaign: i.campaign,
  actor: i.actor,
  action: i.action,
  amount: i.amount ?? null,
  xdr: i.xdr,
  signed_xdr: i.signedXdr ?? null,
  status: i.status,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...extra,
});

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
  assert.throws(() => {
    void journalBackend();
  }, /unknown SOROBAN_JOURNAL_BACKEND/);
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
  const pool: any = {
    builtinSha: true,
    calls,
    async connect() {
      return pool;
    },
    release() {},
    async query(text: string, params?: unknown[]) {
      const sql = text.replace(/\s+/g, ' ').trim();
      calls.push(sql.split(' ')[0].toUpperCase());
      if (/^CREATE TABLE/.test(sql)) return { rows: [] };
      if (/^CREATE INDEX/.test(sql)) return { rows: [] };
      if (/^ALTER TABLE/.test(sql)) return { rows: [] };
      if (/^DELETE FROM soroban_intents/.test(sql)) {
        assert.ok(inTx, 'retention delete outside transaction');
        return { rows: [], rowCount: 0 };
      }
      if (sql === 'BEGIN') {
        assert.equal(inTx, false, 'nested transaction');
        inTx = true;
        return { rows: [] };
      }
      if (sql === 'COMMIT') {
        inTx = false;
        return { rows: [] };
      }
      if (sql === 'ROLLBACK') {
        inTx = false;
        return { rows: [] };
      }
      if (/^SELECT signed_xdr FROM soroban_intents/.test(sql)) {
        assert.ok(inTx, 'conflict check outside transaction');
        const row = rows.get((params as any[])[0]);
        return { rows: row ? [{ signed_xdr: row.signed_xdr ?? null }] : [] };
      }
      if (/^INSERT INTO soroban_intents/.test(sql)) {
        assert.ok(inTx, 'upsert outside transaction');
        const [hash, campaign, actor, action, amount, xdr, signed_xdr, status, contract_id] = params as any[];
        rows.set(hash, {
          seq: rows.get(hash)?.seq ?? ++seq,
          hash,
          campaign,
          actor,
          action,
          amount,
          xdr,
          signed_xdr,
          status,
          contract_id: contract_id ?? rows.get(hash)?.contract_id ?? null,
        });
        return { rows: [] };
      }
      if (/^SET TRANSACTION /.test(sql)) return { rows: [] };
      if (/^SELECT pg_advisory_lock/.test(sql)) return { rows: [] };
      if (/^SELECT pg_advisory_unlock/.test(sql)) return { rows: [] };
      if (/^SELECT pg_backend_pid/.test(sql)) return { rows: [{ pid: 1 }] };
      if (/^SELECT encode\(sha256\(convert_to\('00', 'UTF8'\)\), 'hex'\)$/.test(sql)) {
        if (!pool.builtinSha) {
          const e: any = new Error('function sha256(bytea) does not exist');
          e.code = '42883';
          throw e;
        }
        return { rows: [{ encode: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae' }] };
      }
      if (
        /^SELECT hash, campaign, actor, action, amount, status, contract_id, confirmed_amount, created_at, updated_at,/.test(sql) &&
        /sha256\(convert_to\(xdr/.test(sql)
      ) {
        // Emulate the slim summary select: no envelope bytes, only fingerprints.
        // Emulates sha256(convert_to(text,'UTF8')): the text column's UTF-8 bytes.
        const sha = (v: any) =>
          v != null
            ? createHash('sha256')
                .update(Buffer.isBuffer(v) ? v.toString('utf8') : String(v), 'utf8')
                .digest('hex')
            : null;
        return {
          rows: [...rows.values()]
            .sort((a, b) => a.seq - b.seq)
            .map((r) => ({
              hash: r.hash,
              campaign: r.campaign,
              actor: r.actor,
              action: r.action,
              amount: r.amount ?? null,
              status: r.status,
              contract_id: r.contract_id ?? null,
              confirmed_amount: r.confirmed_amount ?? null,
              created_at: r.created_at ?? null,
              updated_at: r.updated_at ?? null,
              xdr_fp: sha(r.xdr),
              signed_fp: sha(r.signed_xdr),
              xdr_null: r.xdr == null,
              signed_null: r.signed_xdr == null,
            })),
        };
      }
      if (/^SELECT hash, xdr, signed_xdr, encode\(sha256\(convert_to/.test(sql)) {
        // Emulates sha256(convert_to(text,'UTF8')): the text column's UTF-8 bytes.
        const sha = (v: any) =>
          v != null
            ? createHash('sha256')
                .update(Buffer.isBuffer(v) ? v.toString('utf8') : String(v), 'utf8')
                .digest('hex')
            : null;
        const wanted = new Set((params as any[])[0] as string[]);
        return {
          rows: [...rows.values()]
            .filter((r) => wanted.has(r.hash))
            .map((r) => ({ hash: r.hash, xdr: r.xdr ?? null, signed_xdr: r.signed_xdr ?? null, xdr_fp: sha(r.xdr), signed_fp: sha(r.signed_xdr) })),
        };
      }
      if (/^SELECT .* FROM soroban_intents ORDER BY seq$/.test(sql)) {
        return { rows: [...rows.values()].sort((a, b) => a.seq - b.seq) };
      }
      throw new Error('unexpected SQL: ' + sql);
    },
    async end() {},
    // Test helper: insert a raw row directly (corruption scenarios), the way
    // the staging drill wrote schema-valid but semantically corrupt rows.
    seed(row: any) {
      rows.set(row.hash, { seq: ++seq, ...row });
    },
    drop(hash: string) {
      rows.delete(hash);
    },
    rawRows() {
      return [...rows.values()];
    },
    removeRow(hash: string) {
      rows.delete(hash);
    },
  };
  return pool;
}

test('postgres journal persists, updates and re-reads intents in order', async () => {
  const pool = fakePool();
  const j = new PostgresJournal(pool);
  assert.deepEqual(await j.read(), { intents: [] });
  const second: Intent = { ...pgSample, hash: 'b'.repeat(64), campaign: 'other' };
  await j.save({ intents: [pgSample, second] });
  await j.save({ intents: [pgSigned, second] }); // status/signedXdr update, no duplicate
  const store = await j.read();
  assert.equal(store.intents.length, 2);
  assert.deepEqual(store.intents[0], pgSigned);
  assert.deepEqual(store.intents[1], second);
  assert.ok(pool.calls.includes('BEGIN') && pool.calls.includes('COMMIT'), 'transactional save');
});

test('postgres journal persists contractId and never erases it on a later save', async () => {
  const pool = fakePool();
  const j = new PostgresJournal(pool);
  const confirmed: Intent = { ...pgSample, status: 'SUCCESS', contractId: 'CDHCVRCXKYAF4RO6RU3KI4VI2DNZMBI4TU5IVR43EVGBI756FQSOGXMM' };
  await j.save({ intents: [confirmed] });
  // A fresh read must return the journaled contract id: v2 deployment
  // progress is derived from these rows (regression: the column was never
  // selected or written, so every journaled id silently vanished).
  const first = await j.read();
  assert.equal(first.intents.length, 1);
  assert.equal(first.intents[0].contractId, confirmed.contractId);
  // A later save of the same hash without the id (e.g. a status re-record)
  // must not erase it.
  await j.save({ intents: [{ ...pgSample, status: 'SUCCESS' }] });
  const second = await j.read();
  assert.equal(second.intents[0].contractId, confirmed.contractId);
});

test('postgres journal rolls back when an upsert fails', async () => {
  const pool = fakePool();
  const original = pool.query.bind(pool);
  let failed = false;
  pool.query = async (text: string, params?: unknown[]) => {
    if (!failed && /^INSERT/.test(text.replace(/\s+/g, ' ').trim())) {
      failed = true;
      throw new Error('db write lost');
    }
    return original(text, params);
  };
  const j = new PostgresJournal(pool);
  await assert.rejects(j.save({ intents: [pgSample] }), /db write lost/);
  assert.ok(pool.calls.includes('ROLLBACK'), 'rollback attempted');
  assert.deepEqual(await j.read(), { intents: [] }, 'nothing committed');
});

test('file journal has no cross-process guard; postgres runExclusive holds and releases an advisory lock', async () => {
  // The file backend intentionally omits runExclusive: single instance only.
  const queries: string[] = [];
  const client = {
    query: async (text: string) => {
      queries.push(text.replace(/\s+/g, ' ').trim());
      return { rows: [] };
    },
    release: () => {
      queries.push('RELEASE');
    },
  };
  const pool = { query: async () => ({ rows: [] }), end: async () => {}, connect: async () => client };
  const j = new PostgresJournal(pool as any);
  const order: string[] = [];
  await j.runExclusive!('soroban-journal-ops', async () => {
    order.push('critical');
  });
  assert.ok(
    queries.some((q) => q.includes('pg_advisory_lock')),
    'advisory lock taken',
  );
  assert.ok(
    queries.some((q) => q.includes('pg_advisory_unlock')),
    'advisory lock released',
  );
  assert.ok(queries.includes('RELEASE'), 'client released');
  assert.deepEqual(order, ['critical']);
});

test('postgres save never regresses a signed envelope or terminal status in its upsert', async () => {
  const pool = fakePool();
  const raw: string[] = [];
  const original = pool.query.bind(pool);
  pool.query = async (text: string, params?: unknown[]) => {
    raw.push(text.replace(/\s+/g, ' '));
    return original(text, params);
  };
  const j = new PostgresJournal(pool);
  await j.save({ intents: [pgSigned] });
  const upsert = raw.find((c) => c.includes('ON CONFLICT'))!;
  assert.match(
    upsert,
    /signed_xdr = CASE WHEN EXCLUDED\.status IN \('SUCCESS','FAILED'\) THEN NULL ELSE COALESCE\(soroban_intents\.signed_xdr, EXCLUDED\.signed_xdr\) END/,
    'signed envelope never erased before terminal, scrubbed at terminal',
  );
  assert.match(upsert, /CASE WHEN soroban_intents\.status IN \('SUCCESS','FAILED'\)/, 'terminal status never overwritten');
});

test('conflicting signed envelope for the same hash is rejected and the original is preserved', async () => {
  const pool = fakePool();
  const j = new PostgresJournal(pool);
  await j.save({ intents: [pgSigned] });
  await assert.rejects(j.save({ intents: [{ ...pgSigned, signedXdr: 'AAAAdifferent' }] }), /conflicting signed envelope/);
  assert.equal((await j.read()).intents[0].signedXdr, pgSigned.signedXdr, 'original envelope intact');
  await j.save({ intents: [pgSigned] }); // identical re-save is idempotent, not a conflict
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
      query: async (text: string) => {
        stmts.push(text.replace(/\s+/g, ' ').trim().split(' ')[0].toUpperCase());
        return { rows: [] };
      },
      release: () => {},
    };
  };
  let poolQueries = 0;
  const pool = {
    query: async () => {
      poolQueries++;
      return { rows: [] };
    },
    end: async () => {},
    connect: async () => makeClient(),
  };
  const j = new PostgresJournal(pool as any);
  await j.save({ intents: [pgSample] });
  // Connection 1 ran schema init (advisory lock + CREATE TABLE); the save
  // must take exactly one more connection and run its full transaction there.
  assert.equal(connections.length, 2, 'schema init plus one save connection');
  const saveConn = connections[1];
  assert.deepEqual(
    saveConn.filter((s) => s === 'BEGIN' || s === 'COMMIT'),
    ['BEGIN', 'COMMIT'],
    'single-connection transaction boundaries',
  );
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
  assert.deepEqual(
    pruned.map((i) => i.hash),
    [terminalRecent.hash, signedHeld.hash, legacyNoTs.hash],
    'old terminal and expired unsigned pruned; recent terminal, held signed and legacy kept',
  );
});

test('postgres retention delete is issued inside the save transaction', async () => {
  const pool = fakePool();
  const j = new PostgresJournal(pool);
  await j.save({ intents: [pgSample] });
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
  // Only intact rows are visible; malformed rows cannot poison iteration and
  // are surfaced as quarantined (possibly signed) so API holds fail closed.
  const store = await j.read();
  assert.deepEqual(store.intents, [sample]);
  assert.equal(store.quarantined?.length, malformed.length);
  assert.ok(
    store.quarantined!.every((q) => q.possiblySigned),
    'a corrupted row could have been a signed intent',
  );
  // A read-modify-write keeps malformed rows on disk, never silently deletes.
  await j.save({ intents: [sample, signed] });
  const onDisk = JSON.parse(fs.readFileSync(file, 'utf8')).intents;
  assert.equal(onDisk.length, 4 + 2);
  for (const m of malformed) assert.ok(onDisk.some((r: any) => JSON.stringify(r) === JSON.stringify(m)));
  delete process.env.SOROBAN_JOURNAL_BACKEND;
});

test('postgres read quarantines semantically corrupt rows and preserves them verbatim', async () => {
  // Staging-drill scenarios: schema-valid but semantically corrupt rows must
  // never enter lookups, never be silently deleted, and must mark whether
  // they could be an unresolved signed intent so API holds fail closed.
  const pool = fakePool();
  const valid = pgRow(pgSample);
  const scrubbedTerminal = pgRow({ ...pgSample, hash: 'b'.repeat(64), status: 'SUCCESS' }, { signed_xdr: null });
  const garbageStatus = pgRow({ ...pgSample, hash: 'c'.repeat(64) }, { status: 'GARBAGE' });
  const nonXdr = pgRow({ ...pgSample, hash: 'd'.repeat(64) }, { xdr: 'not-xdr' });
  const corruptTerminal = pgRow({ ...pgSample, hash: 'e'.repeat(64) }, { status: 'SUCCESS', xdr: 'not-xdr', signed_xdr: null });
  const signedGarbageStatus = pgRow({ ...pgSample, hash: 'f'.repeat(64), signedXdr: pgSample.xdr }, { status: 'GARBAGE', signed_xdr: pgSample.xdr });
  for (const r of [valid, scrubbedTerminal, garbageStatus, nonXdr, corruptTerminal, signedGarbageStatus]) pool.seed(r);
  const j = new PostgresJournal(pool);
  const store = await j.read();
  assert.deepEqual(
    store.intents.map((i) => i.hash),
    [valid.hash, scrubbedTerminal.hash],
    'only semantically sound rows are visible; a well-formed scrubbed terminal row stays valid',
  );
  const q = new Map(store.quarantined!.map((x) => [x.hash, x]));
  assert.equal(store.quarantined!.length, 4);
  assert.equal(q.get(garbageStatus.hash)!.possiblySigned, true, 'unknown status could hide a signed intent');
  assert.equal(q.get(nonXdr.hash)!.possiblySigned, true);
  assert.equal(
    q.get(corruptTerminal.hash)!.possiblySigned,
    false,
    'corrupt terminal row without an envelope cannot be live safety state, but is still quarantined and logged',
  );
  assert.equal(q.get(signedGarbageStatus.hash)!.possiblySigned, true, 'carries a signed envelope');
  assert.match(q.get(garbageStatus.hash)!.reason, /unknown status/);
  assert.match(q.get(nonXdr.hash)!.reason, /not a parseable Stellar transaction envelope/);
  // A read-modify-write must leave the corrupt rows in the table untouched.
  await j.save({ intents: [pgSigned] });
  const kept = pool.rawRows().map((r) => r.hash);
  for (const r of [garbageStatus, nonXdr, corruptTerminal, signedGarbageStatus])
    assert.ok(kept.includes(r.hash), `quarantined row ${r.hash.slice(0, 8)} preserved`);
});

test('postgres rate limit is shared state serialized by an advisory lock', async () => {
  let hits = 0;
  const queries: string[] = [];
  const client = {
    query: async (text: string) => {
      const sql = text.replace(/\s+/g, ' ').trim();
      queries.push(sql);
      if (/^CREATE|^ALTER/.test(sql)) return { rows: [] };
      if (/pg_advisory_(un)?lock/.test(sql)) return { rows: [] };
      if (/pg_backend_pid/.test(sql)) return { rows: [{ pid: 1 }] };
      if (/^DELETE FROM soroban_rate_hits/.test(sql)) return { rows: [], rowCount: 0 };
      if (/^SELECT count\(\*\) AS n FROM soroban_rate_hits/.test(sql)) return { rows: [{ n: String(hits) }] };
      if (/^INSERT INTO soroban_rate_hits/.test(sql)) {
        hits++;
        return { rows: [] };
      }
      throw new Error('unexpected SQL: ' + sql);
    },
    release: () => {},
  };
  const pool = { query: client.query, end: async () => {}, connect: async () => client };
  const j = new PostgresJournal(pool as any);
  await j.rateLimit('build:GACTOR', 2, 60000);
  await j.rateLimit('build:GACTOR', 2, 60000);
  await assert.rejects(j.rateLimit('build:GACTOR', 2, 60000), /rate limit exceeded/);
  assert.equal(hits, 2, 'only admitted hits recorded');
  assert.ok(
    queries.some((q) => q.includes('soroban-rate-limit:build:GACTOR') || q.includes('pg_advisory_lock')),
    'window serialized across processes',
  );
});

const SUMMARY_SELECT = /^SELECT hash, campaign, actor, action, amount, status, contract_id, confirmed_amount, created_at, updated_at,/;
const TARGETED_FETCH =
  /^SELECT hash, xdr, signed_xdr, encode\(sha256\(convert_to\(xdr, 'UTF8'\)\), 'hex'\) AS xdr_fp, encode\(sha256\(convert_to\(signed_xdr, 'UTF8'\)\), 'hex'\) AS signed_fp FROM soroban_intents WHERE hash = ANY/;

test('postgres journal readSummary: slim rows, real envelope validation, fail-closed quarantine', async () => {
  const pool = fakePool();
  const queries: string[] = [];
  const qparams: unknown[][] = [];
  const orig = pool.query.bind(pool);
  (pool as any).query = async (text: string, params?: unknown[]) => {
    queries.push(text.replace(/\s+/g, ' ').trim());
    qparams.push(params ?? []);
    return orig(text, params);
  };
  const j = new PostgresJournal(pool);
  await j.save({ intents: [pgSigned] });
  // Well-formed base64 but NOT a parseable Stellar envelope: only a real
  // parse (targeted fetch) can quarantine this - a syntactic check cannot.
  pool.seed({ ...pgRow(pgSample, {}), hash: 'c'.repeat(64), xdr: Buffer.from('not a stellar envelope').toString('base64'), signed_xdr: null, status: 'BUILT' });
  // NULL xdr is not corruption (read() skips absent envelopes).
  pool.seed({ ...pgRow(pgSample, {}), hash: 'd'.repeat(64), xdr: null, signed_xdr: null, status: 'BUILT' });
  // Malformed core field: no hash.
  pool.seed({ seq: 999, campaign: 'c', actor: 'g', action: 'contribute', status: 'PENDING' });
  queries.length = 0;
  qparams.length = 0;
  const s = await j.readSummary();
  const select = queries.find((q) => SUMMARY_SELECT.test(q));
  assert.ok(select, 'summary select issued');
  const selectList = (select as string).slice('SELECT '.length, (select as string).indexOf(' FROM soroban_intents'));
  let depth = 0;
  const cols: string[] = [];
  let cur = '';
  for (const ch of selectList) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      cols.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  cols.push(cur.trim());
  for (const c of cols) assert.ok(!/^(xdr|signed_xdr)$/.test(c), 'raw envelope column selected: ' + c);
  const fetchIdx = queries.findIndex((q) => TARGETED_FETCH.test(q));
  assert.ok(fetchIdx >= 0, 'targeted fetch issued');
  assert.equal(queries.filter((q) => TARGETED_FETCH.test(q)).length, 1, 'exactly one targeted fetch batch');
  assert.deepEqual(
    (qparams[fetchIdx] as any[])[0],
    [pgSigned.hash, 'c'.repeat(64)],
    'first run fetches only rows with unseen envelope content (save does not seed the verdict cache)',
  );
  assert.deepEqual(
    s.intents.map((i) => i.hash).sort(),
    [pgSigned.hash, 'd'.repeat(64)].sort(),
    'valid rows listed, envelope-corrupt and core-corrupt rows excluded',
  );
  for (const i of s.intents) {
    assert.equal('xdr' in i, false);
    assert.equal('signedXdr' in i, false);
  }
  assert.equal(s.quarantined?.length, 2);
  const eq = s.quarantined?.find((q) => q.hash === 'c'.repeat(64));
  assert.match(eq?.reason ?? '', /xdr is not a parseable Stellar transaction envelope/);
  assert.equal(eq?.possiblySigned, true, 'non-terminal corrupt row fails closed');
  assert.equal(s.quarantined?.find((q) => q.hash === undefined)?.reason.includes('hash') ?? false, true, 'missing-hash row quarantined');

  // Second run: identical content => cached verdicts, no targeted fetch.
  queries.length = 0;
  const s2 = await j.readSummary();
  assert.equal(
    queries.some((q) => TARGETED_FETCH.test(q)),
    false,
    'unchanged envelopes are not refetched',
  );
  assert.deepEqual(s2.intents.map((i) => i.hash).sort(), s.intents.map((i) => i.hash).sort());
  assert.equal(s2.quarantined?.length, 2);

  // Changed envelope content on an existing row => exactly that row refetched and revalidated.
  const row = (pool as any).rawRows().find((r: any) => r.hash === 'c'.repeat(64));
  row.xdr = pgUnsignedTx.toXDR();
  queries.length = 0;
  const s3 = await j.readSummary();
  const fetches = queries.filter((q) => TARGETED_FETCH.test(q));
  assert.equal(fetches.length, 1, 'changed content refetched');
  assert.ok(
    s3.intents.some((i) => i.hash === 'c'.repeat(64)),
    'repaired row rejoins the valid set',
  );
  assert.equal(s3.quarantined?.length, 1);
});

test('postgres journal readSummary: row changed between scan and fetch is quarantined for the run', async () => {
  const pool = fakePool();
  // Seeded without save(): no cached verdict, so the row needs a targeted fetch.
  pool.seed(pgRow(pgSample, {}));
  const j = new PostgresJournal(pool);
  const orig = pool.query.bind(pool);
  let armed = true;
  (pool as any).query = async (text: string, params?: unknown[]) => {
    const sql = text.replace(/\s+/g, ' ').trim();
    if (armed && TARGETED_FETCH.test(sql)) {
      armed = false;
      // Another writer mutates the envelope between the fingerprint scan and the fetch.
      const row = (pool as any).rawRows().find((r: any) => r.hash === pgSample.hash);
      row.xdr = pgSignedTx.toXDR();
    }
    return orig(text, params);
  };
  const s = await j.readSummary();
  assert.equal(s.intents.length, 0, 'raced row excluded this run');
  assert.equal(s.quarantined?.length, 1);
  assert.match(s.quarantined?.[0].reason ?? '', /changed during summary validation/);
  const s2 = await j.readSummary();
  assert.equal(s2.intents.length, 1, 'next run revalidates and lists the row');
});

test('postgres journal readSummary: signed-only change, removal and reinsert are revalidated', async () => {
  const pool = fakePool();
  const j = new PostgresJournal(pool);
  pool.seed(pgRow(pgSample, {}));
  const s1 = await j.readSummary();
  assert.equal(s1.intents.length, 1);
  // Signing the envelope (xdr unchanged, signed_xdr added) changes the signed
  // fingerprint: exactly that content is fetched and revalidated.
  const row = (pool as any).rawRows().find((r: any) => r.hash === pgSample.hash);
  row.signed_xdr = pgSignedTx.toXDR();
  const queries: string[] = [];
  const orig = pool.query.bind(pool);
  (pool as any).query = async (text: string, params?: unknown[]) => {
    queries.push(text.replace(/\s+/g, ' ').trim());
    return orig(text, params);
  };
  const s2 = await j.readSummary();
  assert.equal(queries.filter((q) => TARGETED_FETCH.test(q)).length, 1, 'signed-only change refetched');
  assert.equal(s2.intents.length, 1, 'validly signed row stays listed');
  // Removal drops the row; reinsertion with changed content is revalidated.
  (pool as any).drop(pgSample.hash);
  queries.length = 0;
  const s3 = await j.readSummary();
  assert.equal(s3.intents.length, 0, 'removed row gone');
  pool.seed({ ...pgRow(pgSample, {}), xdr: Buffer.from('garbage envelope').toString('base64') });
  const s4 = await j.readSummary();
  assert.equal(s4.intents.length, 0, 'reinserted corrupt row not listed');
  assert.equal(s4.quarantined?.length, 1, 'reinserted corrupt row quarantined');
});

test('postgres journal readSummary: pre-PG18 (no built-in sha256) falls back to read()+strip with no digest queries', async () => {
  const pool = fakePool();
  pool.builtinSha = false;
  pool.seed(pgRow(pgSample, {}));
  const queries: string[] = [];
  const orig = pool.query.bind(pool);
  (pool as any).query = async (text: string, params?: unknown[]) => {
    queries.push(text.replace(/\s+/g, ' ').trim());
    return orig(text, params);
  };
  const j = new PostgresJournal(pool);
  const s = await j.readSummary();
  assert.equal(s.intents.length, 1);
  assert.equal('xdr' in s.intents[0], false, 'envelopes stripped');
  assert.equal(queries.filter((q) => /sha256\(/.test(q)).length, 1, 'only the one-time availability probe mentions sha256');
  assert.ok(
    queries.some((q) => /FROM soroban_intents ORDER BY seq$/.test(q)),
    'full read used',
  );
});

test('postgres journal readSummary: verdict cache is bounded and evicted entries are refetched', async () => {
  const pool = fakePool();
  const j = new PostgresJournal(pool, 1); // cap of 1 verdict
  pool.seed(pgRow(pgSample, {}));
  pool.seed({ ...pgRow(pgSigned, {}), hash: 'e'.repeat(64) });
  const s1 = await j.readSummary();
  // Cap 1 with three distinct envelope fingerprints: within-run eviction fails
  // closed (quarantined for the run), never silently dropped or assumed valid.
  assert.equal(s1.intents.length + (s1.quarantined?.length ?? 0), 2, 'no row silently dropped');
  for (const q of s1.quarantined ?? []) assert.match(q.reason, /revalidated next run/);
  const queries: string[] = [];
  const orig = pool.query.bind(pool);
  (pool as any).query = async (text: string, params?: unknown[]) => {
    queries.push(text.replace(/\s+/g, ' ').trim());
    return orig(text, params);
  };
  // Same content, but the cap-1 cache evicted earlier verdicts: refetch happens,
  // and anything whose verdict cannot be retained fails CLOSED (quarantined for
  // the run, revalidated next run) - an evicted verdict is never assumed valid.
  const s2 = await j.readSummary();
  assert.ok(
    queries.some((q) => TARGETED_FETCH.test(q)),
    'evicted verdicts are refetched, never assumed',
  );
  assert.equal(s2.intents.length + (s2.quarantined?.length ?? 0), 2, 'no row silently dropped');
  for (const q of s2.quarantined ?? []) assert.match(q.reason, /revalidated next run/);
});
