import fs from 'node:fs';
import { poolMaxFromEnv } from './db-pool.js';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Address, Networks } from '@stellar/stellar-sdk';
import { topicSymbol, topicAddress, type BackfillClient, type BackfillCheckpoint, type BackfillGap } from './contributor-backfill.js';
import { assertExplicitFileStorePath, assertPooledDatabaseUrlTestSafe, assertTestSafeDatabaseUrl } from './test-storage-guard.js';

// Prospective durable chain-event archive. The RPC only retains a moving
// window of ledgers (stock default ~7 days) and testnet resets wipe history,
// so every campaign contract event is copied VERBATIM (topics + value XDR)
// into our own store as it becomes visible. This is the platform's own
// historical record: restores, audits and any future analytics derive from
// it, not from the hope that a third party kept the data.
//
// Honesty rules carried from the backfill proof chain:
//  - the archive is PROSPECTIVE: it cannot recover events from before its
//    first cursor that the RPC no longer serves; such windows are flagged as
//    gaps on the checkpoint, never presented as complete;
//  - verbatim XDR is the archive; parsed fields are best-effort derivatives
//    that can always be re-derived from the verbatim copy;
//  - archive rows are NEVER pruned (unlike the intent journal);
//  - backend selection is explicit; a configured Postgres backend that
//    cannot be reached fails closed, never silently falls back to a file.
export type ArchivedChainEvent = {
  // RPC event id - unique per event, the dedup key (RPC docs recommend
  // deduplicating on it).
  eventId: string;
  // Absent on preserved v1 rows: never infer their chain identity.
  identity?: ArchiveIdentity;
  campaignId: string;
  contractId: string;
  ledger: number;
  ledgerClosedAt: string | null;
  pagingToken: string | null;
  // Verbatim topic ScVals and event value, base64 XDR when the client
  // supplies parsed SDK objects, raw strings when it supplies raw JSON.
  topics: string[];
  value: string;
  // Best-effort derivatives; re-derivable from topics/value at any time.
  parsedKind: string | null;
  parsedContributor: string | null;
  archivedAt: string;
  archiveVersion: number;
};

export type ArchiveIdentity = { network: string; contract: string; epoch: string };
export function archiveIdentity(contractId: string, networkPassphrase?: string, epoch?: string): ArchiveIdentity {
  const configured = process.env.STELLAR_NETWORK ?? 'testnet';
  if (!networkPassphrase && !['testnet', 'public'].includes(configured)) throw new Error('unknown archive network');
  const network = networkPassphrase ?? (configured === 'public' ? Networks.PUBLIC : Networks.TESTNET);
  const generation = epoch ?? process.env.EVENT_ARCHIVE_EPOCH ?? 'initial';
  if (!network || !/^[a-zA-Z0-9_-]{1,64}$/.test(generation)) throw new Error('invalid archive network or epoch');
  return { network: createHash('sha256').update(network).digest('hex'), contract: contractId, epoch: generation };
}
export const archiveIdentityKey = (identity: ArchiveIdentity): string => JSON.stringify([identity.network, identity.contract, identity.epoch]);
export const archiveEventKey = (event: ArchivedChainEvent): string =>
  event.identity ? JSON.stringify([event.campaignId, archiveIdentityKey(event.identity), event.eventId]) : event.eventId;
const checkpointKey = (campaignId: string, identity?: ArchiveIdentity): string =>
  identity ? JSON.stringify([campaignId, archiveIdentityKey(identity)]) : campaignId;
export type EventArchiveCheckpoint = BackfillCheckpoint & { identity?: ArchiveIdentity; anchor?: { ledger: number; hash: string } };
export type ArchiveClient = Omit<BackfillClient, 'getLatestLedger'> & {
  getNetwork?(): Promise<{ passphrase: string }>;
  getLatestLedger(): Promise<{ sequence: number; id?: string }>;
  getLedgers?(params: { startLedger: number; pagination: { limit: number } }): Promise<{ ledgers: { sequence: number; hash: string }[] }>;
};
export async function verifyArchiveNetwork(client: Pick<ArchiveClient, 'getNetwork'>, identity: ArchiveIdentity): Promise<void> {
  if (!client.getNetwork) throw new Error('archive RPC network verification unavailable');
  const network = await client.getNetwork();
  if (typeof network.passphrase !== 'string' || createHash('sha256').update(network.passphrase).digest('hex') !== identity.network)
    throw new Error('archive RPC network does not match configured network');
}
export async function verifyArchiveAnchor(
  client: Pick<ArchiveClient, 'getLatestLedger' | 'getLedgers' | 'getNetwork'>,
  anchor: { ledger: number; hash: string },
  identity?: ArchiveIdentity,
): Promise<void> {
  if (identity) await verifyArchiveNetwork(client, identity);
  if (!Number.isSafeInteger(anchor.ledger) || anchor.ledger < 1 || !/^[a-f0-9]{64}$/.test(anchor.hash)) throw new Error('invalid archive chain anchor');
  const head = await client.getLatestLedger();
  if (head.sequence < anchor.ledger) throw new Error('archive chain ledger regression; choose a new epoch only after reset review');
  let hash = head.sequence === anchor.ledger ? head.id : undefined;
  if (head.sequence !== anchor.ledger) {
    if (!client.getLedgers) throw new Error('archive chain anchor lookup unavailable');
    const result = await client.getLedgers({ startLedger: anchor.ledger, pagination: { limit: 1 } });
    const exact = result.ledgers.filter((row) => row.sequence === anchor.ledger);
    if (exact.length !== 1) throw new Error('archive chain anchor outside available history');
    hash = exact[0].hash;
  }
  if (hash !== anchor.hash) throw new Error('archive chain anchor mismatch; possible reset or wrong RPC, holding cursor');
}
export type { BackfillGap };

export const ARCHIVE_VERSION = 2;

export type EventArchiveStore = {
  put(events: ArchivedChainEvent[]): Promise<number>;
  list(campaignId?: string): Promise<ArchivedChainEvent[]>;
  count(campaignId?: string): Promise<number>;
  // Distinct campaign ids present in the archive. Completeness checks use
  // this to catch contracts the registry cannot explain; a listing failure
  // must propagate (fail closed), never return a partial list as complete.
  campaigns(): Promise<string[]>;
  readCheckpoint(campaignId: string, identity?: ArchiveIdentity): Promise<EventArchiveCheckpoint | undefined>;
  writeCheckpoint(campaignId: string, cp: EventArchiveCheckpoint, identity?: ArchiveIdentity): Promise<void>;
};

// --- Verbatim serialization -------------------------------------------------
// The SDK's rpc.Server delivers parsed ScVal objects (toXDR available);
// plain JSON-RPC clients deliver base64 strings. Both are stored verbatim;
// anything else is JSON-encoded with its shape preserved so re-derivation
// stays possible.
const serializeScVal = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v && typeof (v as { toXDR?: unknown }).toXDR === 'function') return (v as { toXDR: (enc: string) => string }).toXDR('base64');
  return JSON.stringify(v);
};

const RANGE_ERROR = /ledger range:\s*(\d+)\s*-\s*(\d+)/;
const DEFAULT_WINDOW_LEDGERS = 5000;
const DEFAULT_EVENT_LIMIT = 1000;

// One archival pass over one campaign contract. Mirrors the contributor
// backfill's windowing, truncation guard, floor-clamping and gap honesty,
// but stores every contract event verbatim instead of only recording
// contributors. Durable checkpoint advances only after a fully processed
// window. Idempotent: re-presented events dedup by event id.
export async function archiveCampaignEvents(opts: {
  client: ArchiveClient;
  networkPassphrase?: string;
  epoch?: string;
  campaignId: string;
  contractId: string;
  store: EventArchiveStore;
  windowLedgers?: number;
  eventLimit?: number;
  now?: () => number;
}): Promise<{ scanned: number; archived: number; duplicates: number; gap?: BackfillGap }> {
  const { client, campaignId, store } = opts;
  const windowLedgers = opts.windowLedgers ?? DEFAULT_WINDOW_LEDGERS;
  const eventLimit = opts.eventLimit ?? DEFAULT_EVENT_LIMIT;
  const now = opts.now ?? (() => Date.now());
  if (!Address.fromString(opts.contractId).toString().startsWith('C')) throw new Error('invalid contract id');

  const identity = archiveIdentity(opts.contractId, opts.networkPassphrase, opts.epoch);
  await verifyArchiveNetwork(client, identity);
  const head = await client.getLatestLedger();
  const latest = head.sequence;
  if (!Number.isSafeInteger(latest) || latest < 1 || !head.id || !/^[a-f0-9]{64}$/.test(head.id)) throw new Error('invalid archive chain head');
  const anchor = { ledger: latest, hash: head.id };
  const stored = await store.readCheckpoint(campaignId, identity);
  if (stored && typeof stored.version === 'number' && stored.version > ARCHIVE_VERSION) throw new Error('newer archive checkpoint version; refusing downgrade');
  // A checkpoint written by an older archive version cannot be trusted to
  // have captured every event: discard it and re-scan (floor-clamped,
  // idempotent writes, gap re-derived honestly).
  const prior =
    stored && stored.version === ARCHIVE_VERSION && stored.identity && archiveIdentityKey(stored.identity) === archiveIdentityKey(identity)
      ? stored
      : undefined;
  if (stored && (!stored.identity || archiveIdentityKey(stored.identity) !== archiveIdentityKey(identity)))
    throw new Error('archive checkpoint identity mismatch; holding cursor');
  if (prior) {
    if (!prior.anchor) throw new Error('archive checkpoint has no chain anchor; holding cursor');
    await verifyArchiveAnchor(client, prior.anchor);
  }

  let gap: BackfillGap | undefined = prior?.gap;
  let floorLedger: number | undefined;
  let floorObservedAt: number | undefined;
  let start: number;
  if (prior) {
    start = prior.processedThroughLedger + 1;
    if (start > latest) return { scanned: 0, archived: 0, duplicates: 0, gap };
  } else {
    start = 1;
  }

  // No topic filter: archive every event the contract emits, present and
  // future kinds alike.
  const filters = [{ type: 'contract', contractIds: [opts.contractId] }];

  const probe = await client.getEvents({ startLedger: start, filters, limit: 1 }).catch((err: unknown) => {
    const message = typeof (err as { message?: unknown } | null)?.message === 'string' ? (err as { message: string }).message : String(err);
    const m = RANGE_ERROR.exec(message);
    if (!m) throw err; // generic RPC/network/config failure: move nothing
    return { rangeError: { floor: Number(m[1]), latest: Number(m[2]) } };
  });
  if ('rangeError' in probe) {
    floorLedger = probe.rangeError.floor;
    floorObservedAt = now();
    gap = prior ? 'cursor-behind-floor' : 'start-before-floor';
    start = floorLedger;
  }
  if (start > latest) return { scanned: 0, archived: 0, duplicates: 0, gap };

  let scanned = 0;
  let archived = 0;
  let duplicates = 0;
  let cursor = start;
  while (cursor <= latest) {
    const windowEnd = Math.min(cursor + windowLedgers - 1, latest);
    const page = await client.getEvents({ startLedger: cursor, filters, limit: eventLimit });
    if (!Array.isArray(page.events)) throw new Error('event response has no event array; refusing to advance checkpoint');
    const events = page.events;
    // A window returning exactly the limit may be truncated; advancing past
    // it could silently drop events, so fail the run and keep the checkpoint
    // at the last fully processed window.
    if (events.length >= eventLimit) {
      throw new Error(`event window ${cursor}-${windowEnd} may be truncated at limit ${eventLimit}; refusing to advance checkpoint`);
    }
    const batch: ArchivedChainEvent[] = [];
    for (const ev of events as any[]) {
      const ledger = Number(ev?.ledger);
      if (!Number.isSafeInteger(ledger) || ledger < 1) throw new Error('event has an invalid ledger; refusing to advance checkpoint');
      if (ledger > windowEnd) continue;
      const eventId = typeof ev?.id === 'string' ? ev.id : typeof ev?.pagingToken === 'string' ? ev.pagingToken : null;
      if (!eventId) throw new Error(`event in window ${cursor}-${windowEnd} has no stable id; refusing to advance checkpoint`);
      scanned += 1;
      const topics: any[] = Array.isArray(ev?.topic) ? ev.topic : Array.isArray(ev?.topics) ? ev.topics : [];
      const contributor = topicAddress(topics[1]);
      batch.push({
        eventId,
        identity,
        campaignId,
        contractId: opts.contractId,
        ledger,
        ledgerClosedAt: typeof ev?.ledgerClosedAt === 'string' ? ev.ledgerClosedAt : null,
        pagingToken: typeof ev?.pagingToken === 'string' ? ev.pagingToken : null,
        topics: topics.map(serializeScVal),
        value: serializeScVal(ev?.value),
        parsedKind: topicSymbol(topics[0]) ?? null,
        parsedContributor: contributor && /^G[A-Z2-7]{55}$/.test(contributor) ? contributor : null,
        archivedAt: new Date(now()).toISOString(),
        archiveVersion: ARCHIVE_VERSION,
      });
    }
    await verifyArchiveAnchor(client, anchor);
    const inserted = await store.put(batch);
    archived += inserted;
    duplicates += batch.length - inserted;
    await store.writeCheckpoint(
      campaignId,
      {
        version: ARCHIVE_VERSION,
        identity,
        anchor,
        processedThroughLedger: windowEnd,
        ...(gap ? { gap } : {}),
        ...(floorLedger !== undefined
          ? { floorLedger, floorObservedAt }
          : prior?.floorLedger !== undefined
            ? { floorLedger: prior.floorLedger, ...(prior.floorObservedAt !== undefined ? { floorObservedAt: prior.floorObservedAt } : {}) }
            : {}),
        latestLedger: latest,
        updatedAt: now(),
      },
      identity,
    );
    cursor = windowEnd + 1;
  }
  return { scanned, archived, duplicates, gap };
}

// --- File backend (local dev / tests) ---------------------------------------
type FileDoc = { checkpoints: Record<string, EventArchiveCheckpoint>; events: Record<string, ArchivedChainEvent> };

export class FileEventArchiveStore implements EventArchiveStore {
  constructor(private filePath: string) {}
  private async readDoc(): Promise<FileDoc> {
    try {
      const doc = JSON.parse(await fs.promises.readFile(this.filePath, 'utf8')) as FileDoc;
      return { checkpoints: doc.checkpoints ?? {}, events: doc.events ?? {} };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { checkpoints: {}, events: {} };
      throw err;
    }
  }
  // Serialized read-modify-write: overlapping mutations (two archive scans
  // racing the cadence timer) must not lose each other's events or advance
  // a checkpoint past rows the other writer lost. The unique tmp name keeps
  // a stray external writer from clobbering the rename source.
  private writeQueue: Promise<void> = Promise.resolve();
  private tmpCounter = 0;
  private enqueue<T>(op: () => Promise<T>): Promise<T> {
    const run = this.writeQueue.then(op);
    this.writeQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
  private async writeDoc(doc: FileDoc): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${++this.tmpCounter}.tmp`;
    await fs.promises.writeFile(tmp, JSON.stringify(doc));
    await fs.promises.rename(tmp, this.filePath);
  }
  async put(events: ArchivedChainEvent[]): Promise<number> {
    if (events.length === 0) return 0;
    return this.enqueue(async () => {
      const doc = await this.readDoc();
      let inserted = 0;
      for (const ev of events) {
        const key = archiveEventKey(ev);
        if (doc.events[key]) continue;
        doc.events[key] = ev;
        inserted += 1;
      }
      if (inserted > 0) await this.writeDoc(doc);
      return inserted;
    });
  }
  async list(campaignId?: string): Promise<ArchivedChainEvent[]> {
    const doc = await this.readDoc();
    return Object.values(doc.events)
      .filter((e) => !campaignId || e.campaignId === campaignId)
      .sort((a, b) => a.ledger - b.ledger || archiveEventKey(a).localeCompare(archiveEventKey(b)));
  }
  async count(campaignId?: string): Promise<number> {
    const doc = await this.readDoc();
    return Object.values(doc.events).filter((e) => !campaignId || e.campaignId === campaignId).length;
  }
  async campaigns(): Promise<string[]> {
    const doc = await this.readDoc();
    return [...new Set(Object.values(doc.events).map((e) => e.campaignId))].sort();
  }
  async readCheckpoint(campaignId: string, identity?: ArchiveIdentity): Promise<EventArchiveCheckpoint | undefined> {
    return (await this.readDoc()).checkpoints[checkpointKey(campaignId, identity)];
  }
  async writeCheckpoint(campaignId: string, cp: EventArchiveCheckpoint, identity?: ArchiveIdentity): Promise<void> {
    return this.enqueue(async () => {
      const doc = await this.readDoc();
      doc.checkpoints[checkpointKey(campaignId, identity)] = cp;
      await this.writeDoc(doc);
    });
  }
}

// --- Postgres backend (hosted deployments; same database family as the
// community store, own tables so archive volume never bloats the community
// jsonb document) -------------------------------------------------------------
export class PostgresEventArchiveStore implements EventArchiveStore {
  // Lazy, retryable init: a constructor-time IIFE can reject before any
  // caller awaits it (an unhandled rejection at process level), and caching
  // the rejected promise would kill archiving until the process restarts.
  // Init runs on first use; a failed init clears itself so the next
  // operation retries instead of reusing a permanently failed store.
  private ready: Promise<void> | null = null;
  constructor(private pool: import('pg').Pool) {
    assertPooledDatabaseUrlTestSafe(pool);
  }
  private ensureReady(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      await this.pool.query(`CREATE TABLE IF NOT EXISTS event_archive (
        event_id text PRIMARY KEY,
        campaign_id text NOT NULL,
        contract_id text NOT NULL,
        ledger bigint NOT NULL,
        doc jsonb NOT NULL,
        archived_at timestamptz NOT NULL DEFAULT now()
      )`);
      await this.pool.query('CREATE INDEX IF NOT EXISTS event_archive_campaign_ledger ON event_archive (campaign_id, ledger)');
      await this.pool.query(`CREATE TABLE IF NOT EXISTS event_archive_checkpoints (
        campaign_id text PRIMARY KEY,
        doc jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`);
    })();
    this.ready.catch(() => {
      // Marks the rejection handled (no unhandled rejection) and clears it
      // so the next operation retries the init.
      this.ready = null;
    });
    return this.ready;
  }
  async put(events: ArchivedChainEvent[]): Promise<number> {
    await this.ensureReady();
    let inserted = 0;
    for (const ev of events) {
      const r = await this.pool.query(
        'INSERT INTO event_archive (event_id, campaign_id, contract_id, ledger, doc) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (event_id) DO NOTHING',
        [archiveEventKey(ev), ev.campaignId, ev.contractId, ev.ledger, JSON.stringify(ev)],
      );
      inserted += r.rowCount ?? 0;
    }
    return inserted;
  }
  async list(campaignId?: string): Promise<ArchivedChainEvent[]> {
    await this.ensureReady();
    const r = campaignId
      ? await this.pool.query('SELECT doc FROM event_archive WHERE campaign_id = $1 ORDER BY ledger, event_id', [campaignId])
      : await this.pool.query('SELECT doc FROM event_archive ORDER BY ledger, event_id');
    return r.rows.map((row: { doc: ArchivedChainEvent }) => row.doc);
  }
  async count(campaignId?: string): Promise<number> {
    await this.ensureReady();
    const r = campaignId
      ? await this.pool.query('SELECT count(*)::int AS n FROM event_archive WHERE campaign_id = $1', [campaignId])
      : await this.pool.query('SELECT count(*)::int AS n FROM event_archive');
    return r.rows[0].n as number;
  }
  async campaigns(): Promise<string[]> {
    await this.ensureReady();
    const r = await this.pool.query('SELECT DISTINCT campaign_id FROM event_archive ORDER BY campaign_id');
    return r.rows.map((row: { campaign_id: string }) => row.campaign_id);
  }
  async readCheckpoint(campaignId: string, identity?: ArchiveIdentity): Promise<EventArchiveCheckpoint | undefined> {
    await this.ensureReady();
    const r = await this.pool.query('SELECT doc FROM event_archive_checkpoints WHERE campaign_id = $1', [checkpointKey(campaignId, identity)]);
    return r.rows[0]?.doc;
  }
  async writeCheckpoint(campaignId: string, cp: EventArchiveCheckpoint, identity?: ArchiveIdentity): Promise<void> {
    await this.ensureReady();
    await this.pool.query(
      'INSERT INTO event_archive_checkpoints (campaign_id, doc, updated_at) VALUES ($1, $2, now()) ON CONFLICT (campaign_id) DO UPDATE SET doc = $2, updated_at = now()',
      [checkpointKey(campaignId, identity), JSON.stringify(cp)],
    );
  }
}

// Backend selection is explicit and fails closed: when the deployment
// requires Postgres (Render's filesystem is ephemeral), a missing database
// URL refuses rather than silently archiving to a volatile file.
let cached: EventArchiveStore | null = null;
export async function eventArchiveBackend(): Promise<EventArchiveStore> {
  if (cached) return cached;
  const requirePostgres =
    process.env.EVENT_ARCHIVE_BACKEND === 'postgres' || process.env.SOROBAN_JOURNAL_BACKEND === 'postgres' || process.env.COMMUNITY_REQUIRE_POSTGRES === '1';
  const url = process.env.EVENT_ARCHIVE_DATABASE_URL ?? process.env.COMMUNITY_DATABASE_URL ?? process.env.SOROBAN_JOURNAL_DATABASE_URL;
  if (requirePostgres || url) {
    if (!url)
      throw new Error(
        'event archive requires EVENT_ARCHIVE_DATABASE_URL, COMMUNITY_DATABASE_URL or SOROBAN_JOURNAL_DATABASE_URL; refusing to fall back to a volatile file archive',
      );
    assertTestSafeDatabaseUrl(url, 'EVENT_ARCHIVE_DATABASE_URL/COMMUNITY_DATABASE_URL/SOROBAN_JOURNAL_DATABASE_URL');
    const { Pool } = await import('pg');
    // Default 10 preserves the pg driver default; override with EVENT_ARCHIVE_POOL_MAX for tighter budgets.
    cached = new PostgresEventArchiveStore(
      new Pool({ connectionString: url, max: poolMaxFromEnv(process.env.EVENT_ARCHIVE_POOL_MAX, 'EVENT_ARCHIVE_POOL_MAX', 10) }),
    );
    return cached;
  }
  assertExplicitFileStorePath(process.env.EVENT_ARCHIVE_PATH, 'EVENT_ARCHIVE_PATH');
  cached = new FileEventArchiveStore(process.env.EVENT_ARCHIVE_PATH ?? './data/event-archive.json');
  return cached;
}

// --- Independent backup: snapshot + restore verification ----------------------
// The snapshot is the archive's off-database copy (an operator cron fetches
// it and stores it outside the database host). Each event line carries its
// own sha256 so restore verification detects corruption row-by-row, and the
// header carries totals so truncation is detected. Verification compares a
// snapshot against the live store; mismatch detail is reported, never
// collapsed into a boolean that hides WHICH rows differ.
export type ArchiveSnapshotLine = { sha256: string; event: ArchivedChainEvent };

const canonical = (ev: ArchivedChainEvent): string =>
  JSON.stringify([
    ev.eventId,
    ev.campaignId,
    ev.contractId,
    ev.ledger,
    ev.ledgerClosedAt,
    ev.pagingToken,
    ev.topics,
    ev.value,
    ev.parsedKind,
    ev.parsedContributor,
    ...(ev.identity ? [[ev.identity.network, ev.identity.contract, ev.identity.epoch]] : []),
  ]);

export function archiveEventHash(ev: ArchivedChainEvent): string {
  return createHash('sha256').update(canonical(ev)).digest('hex');
}

export function archiveSnapshotJsonl(events: ArchivedChainEvent[]): string {
  const sorted = [...events].sort((a, b) => a.ledger - b.ledger || archiveEventKey(a).localeCompare(archiveEventKey(b)));
  const header = JSON.stringify({
    type: 'event-archive-snapshot',
    version: ARCHIVE_VERSION,
    generatedAt: new Date().toISOString(),
    events: sorted.length,
    sha256: createHash('sha256').update(sorted.map(archiveEventHash).join('\n')).digest('hex'),
  });
  const lines = sorted.map((ev) => JSON.stringify({ sha256: archiveEventHash(ev), event: ev } satisfies ArchiveSnapshotLine));
  return [header, ...lines].join('\n') + '\n';
}

// Isolated restore: rebuild a store from a saved snapshot. Every row's
// hash is validated BEFORE writing; corrupt rows are refused and listed,
// valid rows still restore (partial restore with full visibility beats an
// all-or-nothing failure that leaves the operator with nothing). Restores
// events only - checkpoints are operator state tied to the RPC window, not
// archive content. Targets a fresh/isolated store (never overwrite a live
// one); afterwards run verifyArchiveSnapshot(snapshot, store.list()) as the
// restore proof.
type ArchiveSnapshotHeader = { type: string; version: number; events: number; sha256: string };

// The header is the snapshot's only integrity anchor (type, version, row
// count, aggregate hash). Every consumer must validate it before trusting
// any row: skipping line one without validation would silently drop a
// headerless file's first event, and verification could still pass on the
// smaller set.
function parseSnapshotHeader(lines: string[]): { header?: ArchiveSnapshotHeader; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(lines[0] ?? '');
  } catch {
    return { error: 'snapshot header is not parseable JSON' };
  }
  const h = parsed as Partial<ArchiveSnapshotHeader> | null;
  if (
    !h ||
    h.type !== 'event-archive-snapshot' ||
    ![1, ARCHIVE_VERSION].includes(h.version as number) ||
    !Number.isSafeInteger(h.events) ||
    (h.events as number) < 0 ||
    typeof h.sha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(h.sha256)
  )
    return { error: 'snapshot integrity header missing or invalid (expected type event-archive-snapshot with version, events and sha256)' };
  return { header: h as ArchiveSnapshotHeader };
}

// Validate the complete snapshot envelope BEFORE any target writes. The
// aggregate uses the ordered row-hash declarations written by snapshotJsonl;
// row content is checked separately, preserving explicit partial recovery.
function snapshotIntegrityErrors(lines: string[], header: ArchiveSnapshotHeader): string[] {
  const rows = lines.slice(1);
  const errors: string[] = [];
  if (header.events !== rows.length) errors.push(`header claims ${header.events} events but ${rows.length} lines are present`);
  const hashes: string[] = [];
  const ids = new Set<string>();
  for (const line of rows) {
    try {
      const row: unknown = JSON.parse(line);
      const hash = (row as Partial<ArchiveSnapshotLine> | null)?.sha256;
      if (typeof hash !== 'string' || !/^[0-9a-f]{64}$/.test(hash)) throw new Error('invalid row hash');
      const event = (row as Partial<ArchiveSnapshotLine>)?.event;
      const id = event && typeof event.eventId === 'string' && event.eventId ? archiveEventKey(event) : undefined;
      if (typeof id !== 'string' || !id || ids.has(id)) {
        errors.push('snapshot has missing or duplicate event ids');
      } else ids.add(id);
      hashes.push(hash);
    } catch {
      errors.push('snapshot aggregate cannot be validated: invalid row hash declaration');
      return errors;
    }
  }
  const aggregate = createHash('sha256').update(hashes.join('\n')).digest('hex');
  if (aggregate !== header.sha256) errors.push('snapshot aggregate hash does not match integrity header');
  return errors;
}

export async function restoreArchiveSnapshot(
  snapshotJsonl: string,
  store: EventArchiveStore,
): Promise<{ restored: number; refused: number; errors: string[] }> {
  const lines = snapshotJsonl.trim().split('\n');
  const headerCheck = parseSnapshotHeader(lines);
  if (!headerCheck.header) return { restored: 0, refused: 0, errors: [headerCheck.error!] };
  const integrityErrors = snapshotIntegrityErrors(lines, headerCheck.header);
  if (integrityErrors.length) return { restored: 0, refused: 0, errors: integrityErrors };
  const errors: string[] = [];
  const batch: ArchivedChainEvent[] = [];
  let refused = 0;
  for (const [n, line] of lines.slice(1).entries()) {
    try {
      const parsed = JSON.parse(line) as ArchiveSnapshotLine;
      if (parsed.sha256 !== archiveEventHash(parsed.event)) {
        refused += 1;
        errors.push(`line ${n + 2}: row hash does not match its content; refused`);
        continue;
      }
      batch.push(parsed.event);
    } catch {
      refused += 1;
      errors.push(`line ${n + 2}: not parseable JSON; refused`);
    }
  }
  const restored = batch.length > 0 ? await store.put(batch) : 0;
  return { restored, refused, errors };
}

export type SnapshotVerification = { ok: boolean; events: number; mismatches: string[]; errors: string[] };

export function verifyArchiveSnapshot(snapshotJsonl: string, live: ArchivedChainEvent[]): SnapshotVerification {
  const lines = snapshotJsonl.trim().split('\n');
  const errors: string[] = [];
  const mismatches: string[] = [];
  const headerCheck = parseSnapshotHeader(lines);
  if (headerCheck.error) errors.push(headerCheck.error);
  const header = headerCheck.header;
  if (header) errors.push(...snapshotIntegrityErrors(lines, header));
  const snap = new Map<string, ArchiveSnapshotLine>();
  for (const line of lines.slice(1)) {
    try {
      const parsed = JSON.parse(line) as ArchiveSnapshotLine;
      // Per-row integrity: the stored hash must match the row content,
      // otherwise the snapshot itself is corrupt at this row.
      if (parsed.sha256 !== archiveEventHash(parsed.event)) {
        mismatches.push(`${parsed.event?.eventId ?? 'unknown'}: snapshot row hash does not match its content`);
        continue;
      }
      snap.set(archiveEventKey(parsed.event), parsed);
    } catch {
      errors.push('a snapshot line is not parseable JSON');
    }
  }
  if (header && header.events !== snap.size + mismatches.length) errors.push('snapshot has duplicate or invalid event rows');
  const liveById = new Map(live.map((e) => [archiveEventKey(e), e]));
  for (const [id, line] of snap) {
    const liveEv = liveById.get(id);
    if (!liveEv) {
      mismatches.push(`${id}: in snapshot but missing from the live archive`);
      continue;
    }
    if (archiveEventHash(liveEv) !== line.sha256) mismatches.push(`${id}: live content differs from snapshot`);
  }
  for (const id of liveById.keys()) if (!snap.has(id)) mismatches.push(`${id}: in the live archive but missing from the snapshot`);
  return { ok: mismatches.length === 0 && errors.length === 0, events: snap.size, mismatches, errors };
}
