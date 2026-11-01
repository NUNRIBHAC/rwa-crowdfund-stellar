// Chain-history contributor backfill. The durable contributor registry
// (community.ts recordContributor) is written by the app's own submit/status
// path and its pending-proof queue; contributions that bypassed that path
// (direct contract calls) or predate the registry are recovered here from
// the contract's on-chain Contributed events.
//
// Hard bound: the configured RPC only retains a limited ledger window of
// events. History older than the observed retention floor is NOT
// recoverable from this endpoint, and missing events never prove missing
// contributors - so any unverifiable window is surfaced as an honest
// per-campaign gap on the operator reconciliation surface, never filled by
// inference. The durable checkpoint advances only after a ledger window is
// fully processed, so a failure mid-scan never skips unprocessed history.
import { Address } from '@stellar/stellar-sdk';

export type BackfillGap = 'start-before-floor' | 'cursor-behind-floor';

export type BackfillCheckpoint = {
  // Last ledger fully processed. The next run resumes at +1.
  processedThroughLedger: number;
  // Set when a window of history could not be verified from this RPC:
  //  - start-before-floor: first run found the retention floor above ledger
  //    1; whether contributions exist below the floor is UNKNOWN.
  //  - cursor-behind-floor: downtime let the retention floor pass the stored
  //    cursor; the window between them is UNKNOWN.
  gap?: BackfillGap;
  // Actual retention floor observed from the RPC (not a guaranteed
  // constant), with the observation time.
  floorLedger?: number;
  floorObservedAt?: number;
  latestLedger?: number;
  updatedAt: number;
};

// Params/response intentionally loose: the SDK's branded request types are
// satisfied at the call site, and every response field is defensively
// narrowed where it is consumed.
export type BackfillClient = {
  getLatestLedger(): Promise<{ sequence: number }>;
  getEvents(params: Record<string, unknown>): Promise<{ events?: unknown[] }>;
};

const RANGE_ERROR = /ledger range:\s*(\d+)\s*-\s*(\d+)/;
const CONTRIBUTOR_KEY = /^G[A-Z2-7]{55}$/;

// Default scan window: small enough that a pathological event burst inside
// one window trips the truncation guard instead of silently dropping
// events, large enough that a quiet campaign finishes in one request.
const DEFAULT_WINDOW_LEDGERS = 5000;
const DEFAULT_EVENT_LIMIT = 1000;

const topicSymbol = (t: any): string | undefined => (t && typeof t.symbol === 'string' ? t.symbol : undefined);
const topicAddress = (t: any): string | undefined => (t && typeof t.address === 'string' ? t.address : undefined);

export async function backfillCampaignContributors(opts: {
  client: BackfillClient;
  campaignId: string;
  contractId: string;
  readCheckpoint(campaignId: string): Promise<BackfillCheckpoint | undefined>;
  record(campaignId: string, contributor: string): Promise<void>;
  checkpoint(campaignId: string, cp: BackfillCheckpoint): Promise<void>;
  windowLedgers?: number;
  eventLimit?: number;
  now?: () => number;
}): Promise<{ scanned: number; recorded: number; skipped: number; gap?: BackfillGap }> {
  const { client, campaignId } = opts;
  const windowLedgers = opts.windowLedgers ?? DEFAULT_WINDOW_LEDGERS;
  const eventLimit = opts.eventLimit ?? DEFAULT_EVENT_LIMIT;
  const now = opts.now ?? (() => Date.now());
  // Config/contract validation first: an invalid registry entry fails
  // before any network traffic and moves nothing.
  if (!Address.fromString(opts.contractId).toString().startsWith('C')) throw new Error('invalid contract id');

  const { sequence: latest } = await client.getLatestLedger();
  const prior = await opts.readCheckpoint(campaignId);

  let gap: BackfillGap | undefined = prior?.gap;
  let floorLedger: number | undefined;
  let floorObservedAt: number | undefined;
  let start: number;

  if (prior) {
    start = prior.processedThroughLedger + 1;
    if (start > latest) {
      return { scanned: 0, recorded: 0, skipped: 0, gap };
    }
  } else {
    start = 1;
  }

  const filters = [{ type: 'contract', contractIds: [opts.contractId], topics: [['contributed', '*']] }];

  const probe = await client.getEvents({ startLedger: start, filters, limit: 1 }).catch((err: unknown) => {
    const m = RANGE_ERROR.exec(err instanceof Error ? err.message : String(err));
    if (!m) throw err; // generic RPC/network/config failure: move nothing
    return { rangeError: { floor: Number(m[1]), latest: Number(m[2]) } };
  });

  if ('rangeError' in probe) {
    floorLedger = probe.rangeError.floor;
    floorObservedAt = now();
    gap = prior ? 'cursor-behind-floor' : 'start-before-floor';
    start = floorLedger;
  }
  if (start > latest) {
    return { scanned: 0, recorded: 0, skipped: 0, gap };
  }

  let recorded = 0;
  let skipped = 0;
  let scanned = 0;
  let cursor = start;
  while (cursor <= latest) {
    const windowEnd = Math.min(cursor + windowLedgers - 1, latest);
    const page = await client.getEvents({ startLedger: cursor, filters, limit: eventLimit });
    const events = Array.isArray(page.events) ? page.events : [];
    // A window that returns exactly the limit may be truncated; advancing
    // past it could silently drop contributions, so fail the run here and
    // keep the checkpoint at the last fully processed window.
    if (events.length >= eventLimit) {
      throw new Error(`event window ${cursor}-${windowEnd} may be truncated at limit ${eventLimit}; refusing to advance checkpoint`);
    }
    for (const ev of events as any[]) {
      // The RPC returns events from startLedger forward with no end bound;
      // record only this window's events so the checkpoint below always
      // means "every event at or before processedThroughLedger is handled".
      // Events beyond the window are re-presented (idempotently) when their
      // own window runs.
      const ledger = Number(ev?.ledger);
      if (Number.isSafeInteger(ledger) && ledger > windowEnd) continue;
      scanned += 1;
      const topics: any[] = Array.isArray(ev?.topic) ? ev.topic : Array.isArray(ev?.topics) ? ev.topics : [];
      if (topicSymbol(topics[0]) !== 'contributed') continue;
      const contributor = topicAddress(topics[1]);
      if (!contributor || !CONTRIBUTOR_KEY.test(contributor)) {
        skipped += 1;
        continue;
      }
      await opts.record(campaignId, contributor);
      recorded += 1;
    }
    // Durable checkpoint only after the window is fully processed.
    await opts.checkpoint(campaignId, {
      processedThroughLedger: windowEnd,
      ...(gap ? { gap } : {}),
      ...(floorLedger !== undefined
        ? { floorLedger, floorObservedAt }
        : prior?.floorLedger !== undefined
          ? { floorLedger: prior.floorLedger, ...(prior.floorObservedAt !== undefined ? { floorObservedAt: prior.floorObservedAt } : {}) }
          : {}),
      latestLedger: latest,
      updatedAt: now(),
    });
    cursor = windowEnd + 1;
  }
  return { scanned, recorded, skipped, gap };
}
