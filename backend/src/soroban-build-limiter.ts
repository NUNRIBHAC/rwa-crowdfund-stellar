// Reject public build floods before any database or Soroban RPC work. These
// budgets supplement the durable actor limiter, not authentication. In-process
// scope fits the current single-instance deploy; replicas need a shared gate.
import type express from 'express';
import { clientIp } from './client-ip.js';

type Options = { now?: () => number; global?: number; ip?: number; campaign?: number; actor?: number; maxKeys?: number };
export function sorobanBuildLimiter(options: Options = {}): express.RequestHandler {
  return sorobanWriteLimiter('build', options);
}
export function sorobanSubmitLimiter(options: Options = {}): express.RequestHandler {
  return sorobanWriteLimiter('submit', options);
}
function sorobanWriteLimiter(action: 'build' | 'submit', options: Options): express.RequestHandler {
  const nowFn = options.now ?? Date.now;
  const windowMs = 60000;
  const limits = { global: options.global ?? 120, ip: options.ip ?? 20, campaign: options.campaign ?? 60, actor: options.actor ?? 10 };
  const maxKeys = options.maxKeys ?? 10000;
  const hits = new Map<string, number[]>();
  let globalHits: number[] = [];
  return (req, res, next) => {
    if (req.method !== 'POST' || !new RegExp(`^/api/campaigns/[^/]+/soroban/${action}/?$`, 'i').test(req.path)) return next();
    const now = nowFn();
    const cutoff = now - windowMs;
    // Lazy expiry on every request also bounds distinct-wallet attacks, without
    // evicting any live key and thereby resetting its budget.
    for (const [key, list] of hits) {
      const kept = list.filter((t) => t > cutoff);
      if (kept.length) hits.set(key, kept);
      else hits.delete(key);
    }
    globalHits = globalHits.filter((t) => t > cutoff);
    const actor = typeof req.body?.actor === 'string' && req.body.actor.length <= 64 ? req.body.actor : 'invalid';
    let campaign = req.path.split('/')[3];
    // Express accepts percent-encoded path parameters and case-insensitive
    // static route segments. Aliases must not create fresh campaign budgets.
    try {
      campaign = decodeURIComponent(campaign);
    } catch {
      /* Express rejects malformed encodings before its handler. */
    }
    const buckets: [string, number][] = [
      [`ip:${clientIp(req) ?? 'unknown'}`, limits.ip],
      [`campaign:${campaign}`, limits.campaign],
      [`actor:${actor}`, limits.actor],
    ];
    const newKeys = buckets.filter(([key]) => !hits.has(key)).length;
    if (globalHits.length >= limits.global || hits.size + newKeys > maxKeys || buckets.some(([key, limit]) => (hits.get(key)?.length ?? 0) >= limit)) {
      res.set('Retry-After', '60');
      res.status(429).json({ error: 'rate limit exceeded; slow down and retry later', code: 'rate_limited' });
      return;
    }
    globalHits.push(now);
    for (const [key] of buckets) hits.set(key, [...(hits.get(key) ?? []), now]);
    next();
  };
}
