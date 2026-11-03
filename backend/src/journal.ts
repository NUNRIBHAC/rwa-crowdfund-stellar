import fs from 'node:fs';
import path from 'node:path';
import { Networks, StrKey, TransactionBuilder } from '@stellar/stellar-sdk';

// Durable signed-intent journal. The journal is safety state: it records
// every prepared/signed envelope so broadcast ambiguity is never resolved by
// building a replacement. Two backends: atomic local file (default, single
// developer) and Postgres (hosted deployments where the filesystem is
// ephemeral). Backend selection is explicit; a configured Postgres backend
// that cannot be reached fails closed, never silently falls back to a file.
export type Intent = {
  hash: string;
  campaign: string;
  actor: string;
  action: string;
  xdr: string;
  signedXdr?: string;
  status: string;
  amount?: string;
  // Amount read from the CONFIRMED token transfer event of the SUCCESS
  // transaction (decimal, 7 places max). Kept apart from `amount`, which is
  // the build-time/intended value. Absent means not captured (UNKNOWN), never
  // zero; rows confirmed before this field existed are not backfilled.
  confirmedAmount?: string;
  createdAt?: string;
  updatedAt?: string;
  // Created contract id, recorded by the server only after a SUCCESSFUL
  // deploy-create transaction whose deployed code matched its pinned Wasm
  // hash (soroban.ts v2 deployment chain). Never operator-supplied.
  contractId?: string;
};
// A row that failed validation: excluded from every lookup and update, logged
// and preserved verbatim in the backend (never silently deleted), and surfaced
// here so callers can fail closed instead of treating safety state as absent.
// possiblySigned means the row could be an unresolved signed intent, so new
// builds/recoveries must refuse until an operator reconciles the raw record.
export type QuarantinedIntent = { hash?: string; reason: string; possiblySigned: boolean };
export type IntentStore = { intents: Intent[]; quarantined?: QuarantinedIntent[] };

const TERMINAL_STATUSES = ['SUCCESS', 'FAILED'];
// Every status the app itself can persist (soroban.ts): local build/sign
// states, RPC submission states (ERROR is normalized to UNKNOWN), RPC
// terminal/lookup states. Anything else means the row was not written by
// this code and cannot be trusted to mean what it says.
const KNOWN_STATUSES = ['BUILT', 'SIGNED', 'PENDING', 'DUPLICATE', 'TRY_AGAIN_LATER', 'UNKNOWN', 'SUCCESS', 'FAILED', 'NOT_FOUND'];
// Semantic row validation (Postgres backend; the file backend only checks
// row identity). A row is usable only when every field means what the app
// would have written: known status, real transaction-hash shape, parseable
// envelopes, valid wallet address, well-formed amount/timestamps. Returns the
// rejection reason, or null when the row is semantically sound. A forged row
// that is well-formed in every field (e.g. a fabricated terminal status with
// valid envelopes) is NOT detectable offline; the controls for that are the
// UNIQUE hash constraint, conflict refusal and terminal non-regression in
// save(), plus quarantine fail-closed handling for everything detectable.
export function validateIntentSemantics(i: Intent): string | null {
  if (!/^[0-9a-f]{64}$/.test(i.hash)) return 'hash is not a 64-char lowercase hex transaction hash';
  if (!KNOWN_STATUSES.includes(i.status)) return `unknown status '${i.status}'`;
  if (typeof i.campaign !== 'string' || i.campaign.length === 0 || i.campaign.length > 120) return 'invalid campaign';
  if (typeof i.action !== 'string' || i.action.length === 0 || i.action.length > 48) return 'invalid action';
  if (!StrKey.isValidEd25519PublicKey(i.actor)) return 'actor is not a valid ed25519 public key';
  for (const [field, envelope] of [
    ['xdr', i.xdr],
    ['signedXdr', i.signedXdr],
  ] as const) {
    if (envelope == null) continue;
    try {
      TransactionBuilder.fromXDR(envelope, Networks.TESTNET);
    } catch {
      return `${field} is not a parseable Stellar transaction envelope`;
    }
  }
  if (i.amount != null && !/^\d+(\.\d{1,7})?$/.test(i.amount)) return 'amount is not a decimal string with at most 7 places';
  if (i.confirmedAmount != null && !/^\d+(\.\d{1,7})?$/.test(i.confirmedAmount)) return 'confirmedAmount is not a decimal string with at most 7 places';
  if (i.contractId != null && !StrKey.isValidContract(i.contractId)) return 'contractId is not a valid contract address';
  for (const ts of [i.createdAt, i.updatedAt]) if (ts != null && Number.isNaN(Date.parse(ts))) return 'timestamp does not parse';
  return null;
}
// Retention policy: terminal intents are pruned after JOURNAL_TERMINAL_RETENTION_MS
// (default 30 days) and unsigned, unbroadcastable build intents after
// JOURNAL_UNSIGNED_EXPIRY_MS (default 24h; prepared envelopes expire 15 minutes
// after build). Signed non-terminal intents are NEVER pruned: an ambiguous
// signed envelope is safety state, resolved by its exact hash, not by age.
// Rows without timestamps (written before this policy) are always kept.
export function pruneIntents(intents: Intent[], now = Date.now()): Intent[] {
  const terminalRetentionMs = Number(process.env.JOURNAL_TERMINAL_RETENTION_MS ?? 30 * 24 * 3600 * 1000);
  const unsignedExpiryMs = Number(process.env.JOURNAL_UNSIGNED_EXPIRY_MS ?? 24 * 3600 * 1000);
  return intents.filter((i) => {
    if (TERMINAL_STATUSES.includes(i.status)) return i.updatedAt ? now - Date.parse(i.updatedAt) < terminalRetentionMs : true;
    if (!i.signedXdr) return i.createdAt ? now - Date.parse(i.createdAt) < unsignedExpiryMs : true;
    return true;
  });
}
// A signed envelope is a bearer instrument until confirmed; once the intent is
// terminal it carries no remaining value, so it is scrubbed. The hash remains
// as the durable proof.
export function purgeTerminalEnvelopes(intents: Intent[]): Intent[] {
  return intents.map((i) => {
    if (!TERMINAL_STATUSES.includes(i.status) || !i.signedXdr) return i;
    const { signedXdr, ...rest } = i;
    return rest;
  });
}
// Wide-event log line for safety-state transitions: one JSON object per event.
export function logEvent(event: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

export interface Journal {
  read(): Promise<IntentStore>;
  save(store: IntentStore): Promise<void>;
  // Cross-process mutual exclusion for the read-check-save critical section,
  // when the backend supports it (Postgres advisory lock). The file backend
  // omits it: single-process deployments rely on the in-process queue only.
  runExclusive?<T>(key: string, fn: () => Promise<T>): Promise<T>;
  // Shared cross-process rate limit, when the backend supports it (Postgres).
  // Throws when the key has reached limit hits inside windowMs. The file
  // backend omits it and the caller falls back to an in-process window.
  rateLimit?(key: string, limit: number, windowMs: number): Promise<void>;
}

// A journal row is usable only when its identity fields are intact. Malformed
// rows (null, non-object, missing/empty hash) are excluded from every lookup
// and update, so one bad row can never break all status lookups; they are
// logged and preserved verbatim on save, never silently deleted. Because a
// corrupted row could have been a signed intent before corruption, skipped
// rows are also exposed as quarantined (possiblySigned) so safety holds fail
// closed instead of silently clearing.
function isIntentRow(r: unknown): r is Intent {
  return !!r && typeof r === 'object' && typeof (r as any).hash === 'string' && (r as any).hash.length > 0;
}

class FileJournal implements Journal {
  private skipped: unknown[] = [];
  constructor(private file: string) {}
  async read(): Promise<IntentStore> {
    if (!fs.existsSync(this.file)) return { intents: [] };
    const raw = JSON.parse(fs.readFileSync(this.file, 'utf8')) as IntentStore;
    const rows = Array.isArray(raw?.intents) ? raw.intents : [];
    const valid: Intent[] = [],
      skipped: unknown[] = [];
    for (const r of rows) (isIntentRow(r) ? valid : skipped).push(r as Intent);
    if (skipped.length !== this.skipped.length) logEvent('journal.malformed_rows', { backend: 'file', skipped: skipped.length });
    this.skipped = skipped;
    const store: IntentStore = { intents: valid };
    if (skipped.length)
      store.quarantined = skipped.map((r) => ({
        hash: isIntentRow(r) ? r.hash : undefined,
        reason: 'malformed row (missing identity fields)',
        possiblySigned: true,
      }));
    return store;
  }
  async save(store: IntentStore): Promise<void> {
    const before = store.intents.length;
    store = { intents: pruneIntents(purgeTerminalEnvelopes(store.intents)) };
    if (store.intents.length !== before) logEvent('journal.pruned', { backend: 'file', removed: before - store.intents.length });
    // Malformed rows are re-persisted untouched: pruning/scrubbing never
    // applies to them and they are never dropped by a read-modify-write.
    const out = { intents: [...store.intents, ...this.skipped] };
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    const fd = fs.openSync(tmp, 'w', 0o600);
    try {
      fs.writeFileSync(fd, JSON.stringify(out));
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, this.file);
    const dir = fs.openSync(path.dirname(this.file), 'r');
    try {
      fs.fsyncSync(dir);
    } finally {
      fs.closeSync(dir);
    }
  }
}

// Minimal pool surface so tests can inject a fake; the real implementation is
// a pg.Pool created from SOROBAN_JOURNAL_DATABASE_URL.
export interface PgPoolLike {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>;
  end(): Promise<void>;
}

export class PostgresJournal implements Journal {
  private ready: Promise<void>;
  private quarantinedCount = 0;
  constructor(private pool: PgPoolLike) {
    // Concurrent first-boot processes (rolling deploys) can race CREATE TABLE
    // IF NOT EXISTS into a catalog duplicate-key error. Serialize schema init
    // with an advisory lock when the pool exposes dedicated clients; fakes
    // without connect() fall back to a plain query.
    const ddl = `CREATE TABLE IF NOT EXISTS soroban_intents (
      seq bigserial PRIMARY KEY,
      hash text NOT NULL UNIQUE,
      campaign text NOT NULL,
      actor text NOT NULL,
      action text NOT NULL,
      amount text,
      xdr text NOT NULL,
      signed_xdr text,
      status text NOT NULL,
      contract_id text
    )`;
    // Idempotent column migration for tables created before timestamps existed.
    const migrate = `ALTER TABLE soroban_intents
      ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS contract_id text,
      ADD COLUMN IF NOT EXISTS confirmed_amount text`;
    // Shared cross-process rate-limit state (sliding window). Additive only;
    // older code ignores the table, so the migration is backward compatible.
    const rateDdl = `CREATE TABLE IF NOT EXISTS soroban_rate_hits (
      seq bigserial PRIMARY KEY,
      key text NOT NULL,
      at timestamptz NOT NULL DEFAULT now()
    )`;
    const rateIndex = 'CREATE INDEX IF NOT EXISTS soroban_rate_hits_key_at ON soroban_rate_hits (key, at)';
    const init = async (db: PgPoolLike) => {
      await db.query(ddl);
      await db.query(migrate);
      await db.query(rateDdl);
      await db.query(rateIndex);
    };
    const connector = (this.pool as any).connect?.bind(this.pool);
    this.ready = connector
      ? connector().then(async (client: any) => {
          try {
            await this.withSessionLock(client, 'soroban_intents_schema_init', async () => {
              await init(client);
            });
          } finally {
            client.release();
          }
        })
      : init(pool);
  }
  static async connect(url: string | undefined): Promise<PostgresJournal> {
    if (!url) throw new Error('SOROBAN_JOURNAL_BACKEND=postgres requires SOROBAN_JOURNAL_DATABASE_URL; refusing to fall back to a volatile file journal');
    const { Pool } = (await import('pg')).default;
    // Small pool: Neon direct connections are limited (104 on the free 0.25 CU) and the demo is single-instance.
    return new PostgresJournal(new Pool({ connectionString: url, max: 5 }));
  }
  // Session advisory lock with a backend-stability check. Session locks only
  // work when every query lands on the same Postgres backend; a transaction
  // pooler (e.g. PgBouncer transaction mode, Neon pooled endpoint) silently
  // rebinds queries to different backends and breaks lock semantics. The
  // backend pid is verified stable across the critical section and any drift
  // fails closed instead of pretending the lock held. This is defense in
  // depth, NOT proof of a safe URL: a pooler can reuse one backend and pass
  // the check. The primary control is the DIRECT (non-pooled) endpoint:
  // Neon documents PgBouncer transaction mode breaking session-level
  // advisory locks (neon.com/docs/connect/connection-pooling).
  private async withSessionLock<T>(client: any, key: string, fn: () => Promise<T>): Promise<T> {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [key]);
    try {
      const pidBefore = (await client.query('SELECT pg_backend_pid() AS pid')).rows[0]?.pid;
      const out = await fn();
      const pidAfter = (await client.query('SELECT pg_backend_pid() AS pid')).rows[0]?.pid;
      if (pidBefore !== pidAfter)
        throw new Error(
          'database backend changed mid-locked-section (transaction pooler?); refusing to trust the advisory lock - use a direct non-pooled connection',
        );
      return out;
    } finally {
      await client.query('SELECT pg_advisory_unlock(hashtext($1))', [key]).catch(() => {});
    }
  }
  async runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.ready;
    const client = await (this.pool as any).connect();
    try {
      return await this.withSessionLock(client, key, fn);
    } finally {
      client.release();
    }
  }
  // Shared sliding-window rate limit, serialized across every process on this
  // database by a per-key advisory lock: expired hits are pruned, the window
  // is counted, and the hit is recorded only when the limit has room. During
  // a rolling deploy an old process still applies its own in-process window;
  // limits are then enforced per backend generation, never weaker than the
  // old behavior for the old process.
  async rateLimit(key: string, limit: number, windowMs: number): Promise<void> {
    await this.ready;
    const connector = (this.pool as any).connect?.bind(this.pool);
    const db: PgPoolLike = connector ? await connector() : this.pool;
    try {
      await this.withSessionLock(db as any, `soroban-rate-limit:${key}`, async () => {
        await db.query("DELETE FROM soroban_rate_hits WHERE key = $1 AND at < now() - ($2 * interval '1 millisecond')", [key, windowMs]);
        const count = Number((await db.query('SELECT count(*) AS n FROM soroban_rate_hits WHERE key = $1', [key])).rows[0]?.n ?? 0);
        if (count >= limit) throw new Error('rate limit exceeded; wait and retry');
        await db.query('INSERT INTO soroban_rate_hits (key) VALUES ($1)', [key]);
      });
    } finally {
      (db as any).release?.();
    }
  }
  async read(): Promise<IntentStore> {
    await this.ready;
    const r = await this.pool.query(
      'SELECT hash, campaign, actor, action, amount, xdr, signed_xdr, status, contract_id, confirmed_amount, created_at, updated_at FROM soroban_intents ORDER BY seq',
    );
    const intents: Intent[] = [];
    const quarantined: QuarantinedIntent[] = [];
    for (const row of r.rows) {
      const intent: Intent = {
        hash: row.hash,
        campaign: row.campaign,
        actor: row.actor,
        action: row.action,
        xdr: row.xdr,
        status: row.status,
        ...(row.signed_xdr != null ? { signedXdr: row.signed_xdr } : {}),
        ...(row.amount != null ? { amount: row.amount } : {}),
        ...(row.created_at != null ? { createdAt: new Date(row.created_at).toISOString() } : {}),
        ...(row.updated_at != null ? { updatedAt: new Date(row.updated_at).toISOString() } : {}),
        ...(row.contract_id != null ? { contractId: row.contract_id } : {}),
        ...(row.confirmed_amount != null ? { confirmedAmount: row.confirmed_amount } : {}),
      };
      // Semantic validation: schema constraints prove columns are present and
      // non-null, not that their contents mean anything (corrupt writes,
      // manual edits, restored garbage). Invalid rows are quarantined:
      // excluded from every lookup, logged, and PRESERVED in the table
      // verbatim so an operator can reconcile or recover the raw record.
      const reason = validateIntentSemantics(intent);
      if (reason == null) {
        intents.push(intent);
        continue;
      }
      // A quarantined row might still be an unresolved signed intent: it
      // carries a signed envelope, or its (untrustworthy) status is not
      // terminal. Callers must fail closed on those; a corrupt terminal row
      // without an envelope cannot be live safety state and only logs.
      quarantined.push({
        hash: typeof row.hash === 'string' ? row.hash : undefined,
        reason,
        possiblySigned: row.signed_xdr != null || !TERMINAL_STATUSES.includes(String(row.status)),
      });
    }
    if (quarantined.length !== this.quarantinedCount)
      logEvent('journal.malformed_rows', {
        backend: 'postgres',
        quarantined: quarantined.length,
        possiblySigned: quarantined.filter((q) => q.possiblySigned).length,
      });
    this.quarantinedCount = quarantined.length;
    const store: IntentStore = { intents };
    if (quarantined.length) store.quarantined = quarantined;
    return store;
  }
  async save(store: IntentStore): Promise<void> {
    await this.ready;
    // A multi-statement transaction must run on ONE connection: pool.query
    // may route each call to a different pooled client, which would silently
    // split BEGIN/COMMIT and the FOR UPDATE lock across backends. Check out a
    // dedicated client, as runExclusive does. Fakes without connect() are
    // single-connection by construction and use the pool surface directly.
    // Quarantined rows are never in store.intents, so save() never touches
    // them: they stay in the table, byte-for-byte, for operator recovery.
    const connector = (this.pool as any).connect?.bind(this.pool);
    if (!connector) return this.saveOn(this.pool, store);
    const client = await connector();
    try {
      return await this.saveOn(client, store);
    } finally {
      client.release();
    }
  }
  private async saveOn(db: PgPoolLike, store: IntentStore): Promise<void> {
    await db.query('BEGIN');
    try {
      for (const i of store.intents) {
        // Refuse a DIFFERENT signed envelope for the same hash outright; the
        // COALESCE below only fills an unsigned slot, never swaps one.
        const cur = await db.query('SELECT signed_xdr FROM soroban_intents WHERE hash = $1 FOR UPDATE', [i.hash]);
        const existingXdr = cur.rows[0]?.signed_xdr ?? null;
        if (existingXdr != null && i.signedXdr != null && existingXdr !== i.signedXdr) {
          logEvent('journal.conflict', { hash: i.hash, actor: i.actor });
          throw new Error(`conflicting signed envelope for intent ${i.hash}; refusing to overwrite`);
        }
        await db.query(
          `INSERT INTO soroban_intents (hash, campaign, actor, action, amount, xdr, signed_xdr, status, contract_id, confirmed_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (hash) DO UPDATE SET campaign = EXCLUDED.campaign, actor = EXCLUDED.actor, action = EXCLUDED.action,
             amount = EXCLUDED.amount, xdr = EXCLUDED.xdr,
             -- A journaled contract id is deployment progress: a later save of
             -- the same row without the id must never erase it.
             contract_id = COALESCE(EXCLUDED.contract_id, soroban_intents.contract_id),
             -- A captured confirmed amount is never erased by a later save without it.
             confirmed_amount = COALESCE(soroban_intents.confirmed_amount, EXCLUDED.confirmed_amount),
             -- Never regress safety state on last-writer-wins: a stored signed
             -- envelope is never erased by an unsigned one, and a terminal
             -- (SUCCESS/FAILED) status is never overwritten by a stale save.
             signed_xdr = CASE WHEN EXCLUDED.status IN ('SUCCESS','FAILED') THEN NULL
               ELSE COALESCE(soroban_intents.signed_xdr, EXCLUDED.signed_xdr) END,
             status = CASE WHEN soroban_intents.status IN ('SUCCESS','FAILED') THEN soroban_intents.status ELSE EXCLUDED.status END,
             updated_at = now()`,
          [i.hash, i.campaign, i.actor, i.action, i.amount ?? null, i.xdr, i.signedXdr ?? null, i.status, i.contractId ?? null, i.confirmedAmount ?? null],
        );
      }
      // Retention: prune only terminal intents past their retention window and
      // unsigned expired build intents. Signed non-terminal intents are never
      // touched: an ambiguous signed envelope resolves by exact hash, not age.
      const pruned = await db.query(
        `DELETE FROM soroban_intents
         WHERE (status IN ('SUCCESS','FAILED') AND updated_at < now() - ($1 * interval '1 millisecond'))
            OR (signed_xdr IS NULL AND status NOT IN ('SUCCESS','FAILED') AND created_at < now() - ($2 * interval '1 millisecond'))`,
        [Number(process.env.JOURNAL_TERMINAL_RETENTION_MS ?? 30 * 24 * 3600 * 1000), Number(process.env.JOURNAL_UNSIGNED_EXPIRY_MS ?? 24 * 3600 * 1000)],
      );
      const removed = (pruned as any).rowCount ?? 0;
      if (removed > 0) logEvent('journal.pruned', { backend: 'postgres', removed });
      await db.query('COMMIT');
    } catch (err) {
      await db.query('ROLLBACK').catch(() => {});
      throw err;
    }
  }
}

let instance: Promise<Journal> | null = null;
export function journalBackend(): Promise<Journal> {
  if (!instance) {
    const backend = (process.env.SOROBAN_JOURNAL_BACKEND ?? 'file').toLowerCase();
    if (backend === 'file') {
      instance = Promise.resolve(new FileJournal(process.env.SOROBAN_INTENTS_PATH ?? path.resolve('data/soroban-intents.json')));
    } else if (backend === 'postgres') {
      instance = PostgresJournal.connect(process.env.SOROBAN_JOURNAL_DATABASE_URL);
    } else {
      throw new Error(`unknown SOROBAN_JOURNAL_BACKEND '${backend}' (expected file or postgres)`);
    }
    // A failed connect must not poison later attempts behind a rejected memo.
    instance.catch(() => {
      instance = null;
    });
  }
  return instance;
}
// Test hook: reset the memoized backend between scenarios.
export function resetJournalBackendForTests(): void {
  instance = null;
}
// Test hook: inject a prebuilt backend (e.g. a PostgresJournal over a fake
// pool) so API-level tests exercise Postgres-only behavior without a server.
export function injectJournalBackendForTests(j: Journal): void {
  instance = Promise.resolve(j);
}
