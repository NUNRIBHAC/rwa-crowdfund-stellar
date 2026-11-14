import fs from 'node:fs';
import { poolMaxFromEnv } from './db-pool.js';
import path from 'node:path';
import { Networks, StrKey, TransactionBuilder } from '@stellar/stellar-sdk';
import { assertExplicitFileStorePath, assertPooledDatabaseUrlTestSafe, assertTestSafeDatabaseUrl } from './test-storage-guard.js';

// Durable signed-intent journal. The journal is safety state: it records
// every prepared/signed envelope so broadcast ambiguity is never resolved by
// building a replacement. Two backends: atomic local file (default, single
// developer) and Postgres (hosted deployments where the filesystem is
// ephemeral). Backend selection is explicit; a configured Postgres backend
// that cannot be reached fails closed, never silently falls back to a file.
// All current production callers use 60 seconds. A fixed maximum lets global
// retention remove abandoned keys without using another caller's shorter window.
// Supporting windows beyond this bound requires raising retention first.
export const MAX_JOURNAL_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

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

// Envelope-free projection of an intent: every field except the Stellar
// envelopes (xdr/signedXdr), which are ~90% of the journal's wire bytes and
// unused by status/aggregation readers (account views, operator
// reconciliation, share register, the contributor reconcile loop).
export type IntentSummary = Omit<Intent, 'xdr' | 'signedXdr'>;
export type IntentSummaryStore = { intents: IntentSummary[]; quarantined?: QuarantinedIntent[] };

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
// The one Stellar-envelope parse used by every validation path (full read,
// summary-read targeted revalidation). Returns the failure reason or null.
function envelopeParseReason(envelope: string): string | null {
  try {
    TransactionBuilder.fromXDR(envelope, Networks.TESTNET);
    return null;
  } catch {
    return 'is not a parseable Stellar transaction envelope';
  }
}

export function validateIntentSemantics(i: IntentSummary & { xdr?: string; signedXdr?: string }): string | null {
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
    const reason = envelopeParseReason(envelope);
    if (reason != null) return `${field} ${reason}`;
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
  // Slim read for status/aggregation callers: same row mapping, semantic
  // validation and quarantine as read(), without transferring envelopes.
  // Corrupt-envelope detection stays with read(); writers, drains and
  // per-hash resolution must keep using read(). Optional so custom or older
  // backends stay valid; readJournalSummary falls back to read()+strip.
  readSummary?(): Promise<IntentSummaryStore>;
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
  async readSummary(): Promise<IntentSummaryStore> {
    const s = await this.read();
    const out: IntentSummaryStore = { intents: s.intents.map(({ xdr: _xdr, signedXdr: _sx, ...rest }) => rest) };
    if (s.quarantined) out.quarantined = s.quarantined;
    return out;
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
  private summaryQuarantinedCount = 0;
  // Envelope parse verdicts keyed by exact-content fingerprint: the columns
  // are text, fingerprinted as SHA-256 of convert_to(text,'UTF8') via built-in
  // sha256() - the exact bytes the parser decodes. Same text ->
  // same verdict, so cache hits are exactly read()'s validation without
  // re-fetching or re-parsing. Bounded: oldest entries evicted past the cap.
  private envelopeVerdicts = new Map<string, string | null>();
  private verdictCap: number;
  private shaChecked: boolean | null = null;
  private async builtinShaAvailable(): Promise<boolean> {
    if (this.shaChecked != null) return this.shaChecked;
    try {
      await this.pool.query("SELECT encode(sha256(convert_to('00', 'UTF8')), 'hex')");
      this.shaChecked = true;
    } catch (err: any) {
      // Only a known missing-function error (pre-PG18 servers) selects the
      // fallback; operational errors (connectivity, permissions) propagate.
      if (err?.code !== '42883') throw err;
      this.shaChecked = false;
      logEvent('journal.summary_fallback', { reason: 'built-in sha256() unavailable (pre-PG18 server); summary reads use read()+strip' });
    }
    return this.shaChecked;
  }
  private cacheVerdict(fp: string, verdict: string | null): void {
    if (this.envelopeVerdicts.has(fp)) this.envelopeVerdicts.delete(fp);
    this.envelopeVerdicts.set(fp, verdict);
    while (this.envelopeVerdicts.size > this.verdictCap) {
      const oldest = this.envelopeVerdicts.keys().next().value;
      if (oldest === undefined) break;
      this.envelopeVerdicts.delete(oldest);
    }
  }
  constructor(
    private pool: PgPoolLike,
    verdictCap = 10000,
  ) {
    assertPooledDatabaseUrlTestSafe(pool);
    this.verdictCap = verdictCap;
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
    const rateExpiryIndex = 'CREATE INDEX IF NOT EXISTS soroban_rate_hits_at ON soroban_rate_hits (at)';
    const init = async (db: PgPoolLike) => {
      await db.query(ddl);
      await db.query(migrate);
      await db.query(rateDdl);
      await db.query(rateIndex);
      await db.query(rateExpiryIndex);
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
    assertTestSafeDatabaseUrl(url, 'SOROBAN_JOURNAL_DATABASE_URL');
    const { Pool } = (await import('pg')).default;
    // Small pool: hosted providers cap direct connections per database and the demo is single-instance.
    // Override with SOROBAN_JOURNAL_POOL_MAX for tighter budgets (e.g. Prisma free: 5 usable direct).
    return new PostgresJournal(new Pool({ connectionString: url, max: poolMaxFromEnv(process.env.SOROBAN_JOURNAL_POOL_MAX, 'SOROBAN_JOURNAL_POOL_MAX', 5) }));
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
  async readSummary(): Promise<IntentSummaryStore> {
    await this.ready;
    // Full validation parity with read() at a fraction of the wire cost,
    // WITHOUT weakening anything: envelope bytes never cross the wire on the
    // steady path; instead each row carries a SHA-256 content fingerprint
    // (built-in sha256(convert_to(text,'UTF8')), PG18+) of its envelope text, and parse verdicts are
    // cached per fingerprint (this.envelopeVerdicts) using the SAME
    // TransactionBuilder.fromXDR parse as read(). Only rows with new or
    // changed envelope content are fetched (targeted, by hash) and really
    // parsed. Scan and fetch run in one REPEATABLE READ transaction, so all
    // fields and envelope bytes describe the same observed row version; a
    // residual fingerprint mismatch (or a serialization failure) fails
    // closed: the row (or the whole read) is retried on a later run.
    // Without a collision-resistant digest available in SQL (pre-PG18
    // servers lack built-in sha256) NO approximate check is substituted:
    // fall back to read()+strip (old cost, old semantics).
    if (!(await this.builtinShaAvailable())) {
      const full = await this.read();
      const out: IntentSummaryStore = { intents: full.intents.map(({ xdr: _xdr, signedXdr: _sx, ...rest }) => rest) };
      if (full.quarantined) out.quarantined = full.quarantined;
      return out;
    }
    const client = await (this.pool as any).connect();
    let inSummaryTx = false;
    const rollbackQuietly = async () => {
      if (inSummaryTx) await client.query('ROLLBACK').catch(() => {});
      inSummaryTx = false;
    };
    try {
      await client.query('BEGIN');
      inSummaryTx = true;
      await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      let r;
      try {
        r = await client.query(
          `SELECT hash, campaign, actor, action, amount, status, contract_id, confirmed_amount, created_at, updated_at,
                  encode(sha256(convert_to(xdr, 'UTF8')), 'hex') AS xdr_fp, encode(sha256(convert_to(signed_xdr, 'UTF8')), 'hex') AS signed_fp,
                  (xdr IS NULL) AS xdr_null, (signed_xdr IS NULL) AS signed_null
           FROM soroban_intents ORDER BY seq`,
        );
      } catch (err) {
        await rollbackQuietly();
        throw err;
      }
      // convert_to/sha256 are strict (NULL in, NULL out): a NULL fingerprint marks an
      // absent envelope, never a verdict-cache key.
      const rows = r.rows as any[];
      const needFetch = new Set<string>();
      for (const row of rows) {
        for (const fp of [row.xdr_fp, row.signed_fp]) if (fp != null && !this.envelopeVerdicts.has(fp)) needFetch.add(row.hash);
      }
      const fetched = new Map<string, { xdr_fp: string | null; signed_fp: string | null }>();
      if (needFetch.size > 0) {
        let targets;
        try {
          targets = await client.query(
            "SELECT hash, xdr, signed_xdr, encode(sha256(convert_to(xdr, 'UTF8')), 'hex') AS xdr_fp, encode(sha256(convert_to(signed_xdr, 'UTF8')), 'hex') AS signed_fp FROM soroban_intents WHERE hash = ANY($1)",
            [[...needFetch]],
          );
        } catch (err) {
          await rollbackQuietly();
          throw err;
        }
        for (const t of targets.rows as any[]) {
          if (t.xdr_fp != null) this.cacheVerdict(t.xdr_fp, t.xdr != null ? envelopeParseReason(t.xdr) : null);
          if (t.signed_fp != null) this.cacheVerdict(t.signed_fp, t.signed_xdr != null ? envelopeParseReason(t.signed_xdr) : null);
          fetched.set(t.hash, { xdr_fp: t.xdr_fp, signed_fp: t.signed_fp });
        }
      }
      await client.query('COMMIT');
      inSummaryTx = false;
      const intents: IntentSummary[] = [];
      const quarantined: QuarantinedIntent[] = [];
      for (const row of rows) {
        const intent: IntentSummary = {
          hash: row.hash,
          campaign: row.campaign,
          actor: row.actor,
          action: row.action,
          status: row.status,
          ...(row.amount != null ? { amount: row.amount } : {}),
          ...(row.created_at != null ? { createdAt: new Date(row.created_at).toISOString() } : {}),
          ...(row.updated_at != null ? { updatedAt: new Date(row.updated_at).toISOString() } : {}),
          ...(row.contract_id != null ? { contractId: row.contract_id } : {}),
          ...(row.confirmed_amount != null ? { confirmedAmount: row.confirmed_amount } : {}),
        };
        let reason: string | null = null;
        if (needFetch.has(row.hash)) {
          // Defense in depth: verdicts apply only to the exact fingerprinted
          // bytes seen in the scan. Under REPEATABLE READ this cannot
          // mismatch; if it ever does, quarantine for this run (fail closed)
          // and revalidate next run.
          const f = fetched.get(row.hash);
          if (!f || f.xdr_fp !== row.xdr_fp || f.signed_fp !== row.signed_fp) {
            reason = 'row changed during summary validation; revalidated next run';
          }
        }
        if (reason == null && row.xdr_fp != null) {
          const v = this.envelopeVerdicts.get(row.xdr_fp);
          // Fail closed: an evicted verdict is unknown, never "valid".
          if (v === undefined) reason = 'envelope verdict evicted; revalidated next run';
          else if (v) reason = `xdr ${v}`;
        }
        if (reason == null && row.signed_fp != null) {
          const v = this.envelopeVerdicts.get(row.signed_fp);
          if (v === undefined) reason = 'envelope verdict evicted; revalidated next run';
          else if (v) reason = `signed_xdr ${v}`;
        }
        if (reason == null) reason = validateIntentSemantics(intent);
        if (reason == null) {
          intents.push(intent);
          continue;
        }
        // possiblySigned mirrors read(): a signed envelope is present, or the
        // (untrustworthy) status is not terminal.
        quarantined.push({
          hash: typeof row.hash === 'string' ? row.hash : undefined,
          reason,
          possiblySigned: row.signed_null === false || !TERMINAL_STATUSES.includes(String(row.status)),
        });
      }
      if (quarantined.length !== this.summaryQuarantinedCount)
        logEvent('journal.malformed_rows', {
          backend: 'postgres-summary',
          quarantined: quarantined.length,
          possiblySigned: quarantined.filter((q) => q.possiblySigned).length,
        });
      this.summaryQuarantinedCount = quarantined.length;
      const store: IntentSummaryStore = { intents };
      if (quarantined.length) store.quarantined = quarantined;
      return store;
    } catch (err) {
      // Any failure after BEGIN (SET TRANSACTION, scan, fetch, COMMIT) rolls
      // the snapshot transaction back before the client returns to the pool.
      await rollbackQuietly();
      throw err;
    } finally {
      client.release();
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
  private lastRateSweepAt = -Infinity;
  async rateLimit(key: string, limit: number, windowMs: number): Promise<void> {
    if (!Number.isSafeInteger(windowMs) || windowMs <= 0 || windowMs > MAX_JOURNAL_RATE_WINDOW_MS || !Number.isSafeInteger(limit) || limit <= 0)
      throw new Error('invalid rate limit window or count');
    await this.ready;
    const connector = (this.pool as any).connect?.bind(this.pool);
    const db: PgPoolLike = connector ? await connector() : this.pool;
    try {
      // At most one bounded sweep per second per instance, serialized across
      // processes by a separate global lock. Cleanup never takes a per-key lock,
      // so lock order cannot invert. SKIP LOCKED avoids waiting on a busy row.
      // Idle databases need no timer: the next request resumes expiry. This
      // bounds history to a 24h horizon plus any backlog, not an absolute row cap.
      const now = Date.now();
      if (now < this.lastRateSweepAt || now - this.lastRateSweepAt >= 1000) {
        this.lastRateSweepAt = now;
        await this.withSessionLock(db as any, 'soroban-rate-retention', async () => {
          await db.query(
            `DELETE FROM soroban_rate_hits WHERE seq IN (
              SELECT seq FROM soroban_rate_hits
              WHERE at < now() - ($1 * interval '1 millisecond')
              ORDER BY at LIMIT 1000 FOR UPDATE SKIP LOCKED
            )`,
            [MAX_JOURNAL_RATE_WINDOW_MS],
          );
        });
      }
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
// Summary read with a built-in fallback: backends without a native slim
// read pay the full read and strip envelopes in memory (same semantics, no
// wire savings - exactly the old behavior).
export async function readJournalSummary(j: Journal): Promise<IntentSummaryStore> {
  if (j.readSummary) return j.readSummary();
  const s = await j.read();
  const out: IntentSummaryStore = { intents: s.intents.map(({ xdr: _xdr, signedXdr: _sx, ...rest }) => rest) };
  if (s.quarantined) out.quarantined = s.quarantined;
  return out;
}

export function journalBackend(): Promise<Journal> {
  if (!instance) {
    const backend = (process.env.SOROBAN_JOURNAL_BACKEND ?? 'file').toLowerCase();
    if (backend === 'file') {
      assertExplicitFileStorePath(process.env.SOROBAN_INTENTS_PATH, 'SOROBAN_INTENTS_PATH');
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
