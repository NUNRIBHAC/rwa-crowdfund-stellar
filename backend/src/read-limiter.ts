// Per-IP read limiting for the unauthenticated, backend-backed GET routes.
//
// Threat: scripted floods of unique-key reads landing directly on Prisma
// Postgres reads/connections (journal, community store) or the Soroban RPC.
// Rejection happens here, BEFORE any database or RPC work; the limiter is an
// in-memory sliding window (fine for the single-instance deployment - see
// ratelimit.ts for the multi-instance caveat).
//
// Sizing: the SPA issues at most ~10 API reads per page view (campaigns
// list + detail + comments + news + the account trio). There is NO
// timer-based polling anywhere in the frontend; the only repeated read is
// the invest flow's MANUAL status check (App.tsx check(): one
// /api/soroban/transactions/:hash GET per user click), so the heaviest
// legitimate navigation stays well under ~50 reads/min per IP. The default
// of 240/min per IP leaves legitimate use ~5x headroom while capping a
// script at 4 reads/s. Overrides: READ_LIMIT_PER_MIN, READ_LIMIT_WINDOW_MS
// (both fail closed to the defaults on junk input).
//
// Memory is HARD-bounded two ways (not by the OOM ceiling): a sweep drops
// idle keys every window, and READ_LIMIT_MAX_KEYS (default 10000) caps
// tracked client keys. Overflow behavior: while the table is full, requests
// from NEW keys are rejected 429 and existing keys keep their normal budget
// - nothing is ever evicted, so a flood of fresh keys cannot reset anyone's
// counter (an LRU eviction would be a rate-limit bypass).
// Worst-case memory formula:
//   READ_LIMIT_MAX_KEYS * (keyBytes + READ_LIMIT_PER_MIN * 8 bytes)
// Defaults: 10000 * (~50 B + 240 * 8 B) ~= 25 MB, far under the 512 MB
// container limit. If these knobs are ever tuned, re-check that product
// against the container limit first - and never raise READ_LIMIT_PER_MIN so
// high (or READ_LIMIT_MAX_KEYS so low) that the limiter is effectively off.
//
// Scope is an explicit path list, deliberately NOT a universal /api prefix:
// /health, OPTIONS preflights, /api/auth/* (own gates: Turnstile, IP
// reputation, failure throttling, mail budgets) and the admin-keyed
// /api/admin + /api/operator routes are intentionally NOT covered.
import type express from 'express';
import { RateLimiter } from './ratelimit.js';
import { clientIp } from './client-ip.js';

const COVERED: RegExp[] = [
  // campaigns list + detail + the public per-campaign read subresources
  /^\/api\/campaigns(?:\/[a-z0-9][a-z0-9-]{0,63}(?:\/(?:comments|news|metadata|podcast))?)?$/,
  /^\/api\/news$/,
  /^\/api\/podcast\/episodes$/,
  // account reads: journal (Prisma) queries, holdings is the most expensive
  /^\/api\/account\/(?:payouts|holdings|activity)$/,
  // invest status check: Soroban RPC read + confirmed-contributor write,
  // called manually from the invest flow (one GET per click)
  /^\/api\/soroban\/transactions\/[A-Za-z0-9]{1,128}$/,
];

const limitPerWindow = (): number => {
  const raw = Number(process.env.READ_LIMIT_PER_MIN ?? '');
  return Number.isSafeInteger(raw) && raw >= 1 ? raw : 240;
};
const windowMs = (): number => {
  const raw = Number(process.env.READ_LIMIT_WINDOW_MS ?? '');
  return Number.isSafeInteger(raw) && raw >= 1000 ? raw : 60_000;
};
const maxKeys = (): number => {
  const raw = Number(process.env.READ_LIMIT_MAX_KEYS ?? '');
  return Number.isSafeInteger(raw) && raw >= 1 ? raw : 10_000;
};

export function readLimiter(): express.RequestHandler {
  const limiter = new RateLimiter();
  // Bound memory: sweep idle IP keys on the window cadence; unref'd so the
  // interval never holds a process (or test) open.
  const sweeper = setInterval(() => limiter.sweep(windowMs()), Math.max(windowMs(), 60_000));
  sweeper.unref();
  return (req, res, next) => {
    if (req.method !== 'GET' || !COVERED.some((re) => re.test(req.path))) return next();
    // Requests without a resolvable address share one fail-closed bucket.
    const key = `read:${clientIp(req) ?? 'unknown'}`;
    // Hard cardinality bound: while the key table is full, reject NEW keys
    // without recording them. Existing keys are never evicted, so flooding
    // fresh source addresses cannot reset an existing key's budget.
    if (!limiter.has(key) && limiter.trackedCount() >= maxKeys()) {
      res.set('Retry-After', String(Math.ceil(windowMs() / 1000)));
      res.status(429).json({ error: 'rate limit exceeded; slow down and retry later', code: 'rate_limited' });
      return;
    }
    if (!limiter.allow(key, limitPerWindow(), windowMs())) {
      res.set('Retry-After', String(Math.ceil(windowMs() / 1000)));
      res.status(429).json({ error: 'rate limit exceeded; slow down and retry later', code: 'rate_limited' });
      return;
    }
    next();
  };
}
