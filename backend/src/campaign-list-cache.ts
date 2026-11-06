// Display cache for the /api/campaigns LIST route ONLY (server.ts).
//
// Scope and invariants:
// - Only the public list route reads through this cache. Every decision or
//   operator path - reconciliationPayload, sorobanInvestorEntitlement,
//   invest/refund XDR build+submit, discovery, community lookups - calls
//   sorobanCampaigns directly and keeps reading live chain state.
// - Within the TTL a hit is served from memory. Once the TTL expires the
//   next read does a FRESH chain read and, on failure, fails exactly like
//   the uncached route (503 API_UNAVAILABLE): no stale data is ever served
//   past the TTL.
// - Concurrent reads share one in-flight fetch (single-flight), so a burst
//   of page loads costs one upstream RPC call instead of N.
export type ListFetcher<T> = (actor?: string) => Promise<T>;

export const CAMPAIGN_LIST_CACHE_TTL_MS = 30_000;

export const CAMPAIGN_LIST_CACHE_MAX_ENTRIES = 128;

export class CampaignListCache<T> {
  private readonly entries = new Map<string, { at: number; data: T }>();
  private readonly inflight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number = CAMPAIGN_LIST_CACHE_TTL_MS,
    private readonly now: () => number = Date.now,
    private readonly maxEntries: number = CAMPAIGN_LIST_CACHE_MAX_ENTRIES,
  ) {}

  // Public query input keys this map, so it must stay bounded on a small
  // host: expired entries are swept on every write, and a full map evicts
  // its oldest entry before admitting a new key.
  private store(key: string, data: T): void {
    const now = this.now();
    for (const [k, v] of this.entries) {
      if (now - v.at >= this.ttlMs) this.entries.delete(k);
    }
    if (!this.entries.has(key) && this.entries.size >= this.maxEntries) {
      let oldestKey: string | undefined;
      let oldestAt = Infinity;
      for (const [k, v] of this.entries) {
        if (v.at < oldestAt) {
          oldestAt = v.at;
          oldestKey = k;
        }
      }
      if (oldestKey !== undefined) this.entries.delete(oldestKey);
    }
    this.entries.set(key, { at: now, data });
  }

  async read(fetcher: ListFetcher<T>, actor?: string): Promise<T> {
    const key = actor ?? '';
    const hit = this.entries.get(key);
    if (hit && this.now() - hit.at < this.ttlMs) return hit.data;
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const p: Promise<T> = fetcher(actor)
      .then((data) => {
        this.store(key, data);
        return data;
      })
      .finally(() => {
        if (this.inflight.get(key) === p) this.inflight.delete(key);
      });
    this.inflight.set(key, p);
    return p;
  }
}
