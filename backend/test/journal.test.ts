import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
  return {
    calls,
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
    rawRows() {
      return [...rows.values()];
    },
  };
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
