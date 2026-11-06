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

export class CampaignListCache<T> {
  private readonly entries = new Map<string, { at: number; data: T }>();
  private readonly inflight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number = CAMPAIGN_LIST_CACHE_TTL_MS,
    private readonly now: () => number = Date.now,
  ) {}

  async read(fetcher: ListFetcher<T>, actor?: string): Promise<T> {
    const key = actor ?? '';
    const hit = this.entries.get(key);
    if (hit && this.now() - hit.at < this.ttlMs) return hit.data;
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const p: Promise<T> = fetcher(actor)
      .then((data) => {
        this.entries.set(key, { at: this.now(), data });
        return data;
      })
      .finally(() => {
        if (this.inflight.get(key) === p) this.inflight.delete(key);
      });
    this.inflight.set(key, p);
    return p;
  }
}
