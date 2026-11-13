import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresJournal } from '../src/journal.js';
const DAY = 86400000;
function database() {
  let now = 3 * DAY;
  let seq = 0;
  const rows: Array<{ seq: number; key: string; at: number }> = [];
  const queries: string[] = [];
  const pool: any = {
    end: async () => {},
    connect: async () => pool,
    release() {},
    query: async (text: string, params: any[] = []) => {
      const sql = text.replace(/\s+/g, ' ').trim();
      queries.push(sql);
      if (/^(CREATE|ALTER)/.test(sql) || /pg_advisory_(un)?lock/.test(sql)) return { rows: [] };
      if (/pg_backend_pid/.test(sql)) return { rows: [{ pid: 1 }] };
      if (/^DELETE FROM soroban_rate_hits/.test(sql)) {
        let deleted = 0;
        for (let i = rows.length - 1; i >= 0; i--) {
          const old = sql.includes('WHERE key = $1') ? rows[i].key === params[0] && rows[i].at < now - params[1] : rows[i].at < now - DAY && deleted < 1000;
          if (old) {
            rows.splice(i, 1);
            deleted++;
          }
        }
        return { rows: [], rowCount: deleted };
      }
      if (/^SELECT count/.test(sql)) return { rows: [{ n: rows.filter((r) => r.key === params[0]).length }] };
      if (/^INSERT INTO soroban_rate_hits/.test(sql)) {
        rows.push({ seq: ++seq, key: params[0], at: now });
        return { rows: [] };
      }
      throw new Error('unexpected SQL: ' + sql);
    },
  };
  return {
    pool,
    rows,
    queries,
    seed: (key: string, age: number) => rows.push({ seq: ++seq, key, at: now - age }),
    advance: (ms: number) => {
      now += ms;
    },
  };
}
test('global expiry removes abandoned keys, preserves every supported live window, and is indexed/bounded', async () => {
  const db = database();
  db.seed('abandoned', DAY + 1);
  db.seed('long-live', DAY - 1);
  db.seed('short-live', 1000);
  const j = new PostgresJournal(db.pool);
  await j.rateLimit('new-wallet', 2, 60000);
  assert.equal(
    db.rows.some((r) => r.key === 'abandoned'),
    false,
  );
  assert.equal(
    db.rows.some((r) => r.key === 'long-live'),
    true,
  );
  assert.equal(
    db.rows.some((r) => r.key === 'short-live'),
    true,
  );
  assert.ok(db.queries.some((s) => s.includes('CREATE INDEX') && /\(at\)/.test(s)));
  assert.ok(db.queries.some((s) => s.startsWith('DELETE FROM soroban_rate_hits') && s.includes('LIMIT 1000') && s.includes('SKIP LOCKED')));
});
test('one sweep deletes at most1000 old hits and admission still enforces per-key counts', async () => {
  const db = database();
  for (let i = 0; i < 1100; i++) db.seed('old' + i, DAY + 100);
  const j = new PostgresJournal(db.pool);
  await j.rateLimit('active', 1, 60000);
  assert.equal(db.rows.filter((r) => r.key.startsWith('old')).length, 100);
  await assert.rejects(j.rateLimit('active', 1, 60000), /rate limit exceeded/);
});
test('unsupported or invalid windows and limits fail before database effects', async () => {
  const db = database();
  const j = new PostgresJournal(db.pool);
  await j.rateLimit('warmup', 1, 60000);
  const before = db.queries.length;
  for (const window of [0, -1, NaN, Infinity, DAY + 1, 1.5]) await assert.rejects(j.rateLimit('actor', 1, window), /invalid rate limit/);
  for (const limit of [0, -1, NaN, Infinity, 1.5]) await assert.rejects(j.rateLimit('actor', limit, 60000), /invalid rate limit/);
  assert.equal(db.queries.length, before);
});
