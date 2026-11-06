// Small in-process sliding-window rate limiter. Per-process state: acceptable
// for the single-instance demo; a multi-instance deployment must move this to
// shared storage (the journal's soroban_rate_hits pattern) or a proxy limit.
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private nowFn: () => number = () => Date.now()) {}
  // Returns true and records a hit when under `limit` hits in `windowMs`.
  allow(key: string, limit: number, windowMs: number): boolean {
    const now = this.nowFn();
    const cutoff = now - windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (list.length >= limit) {
      this.hits.set(key, list);
      return false;
    }
    list.push(now);
    this.hits.set(key, list);
    return true;
  }
  // Non-mutating existence check (for the caller's cardinality bound).
  has(key: string): boolean {
    return this.hits.has(key);
  }
  // Number of currently tracked keys (for the caller's cardinality bound).
  trackedCount(): number {
    return this.hits.size;
  }
  // Bound memory: drop idle keys lazily on a coarse sweep.
  sweep(windowMs: number): void {
    const cutoff = this.nowFn() - windowMs;
    for (const [key, list] of this.hits) {
      const kept = list.filter((t) => t > cutoff);
      if (kept.length === 0) this.hits.delete(key);
      else this.hits.set(key, kept);
    }
  }
}
