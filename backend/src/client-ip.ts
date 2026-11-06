// Shared client-IP resolution for rate limiting and abuse defense.
// Moved from community-routes.ts so the read limiter and the community/auth
// gates key on the SAME spoof-resistant address.
//
// TRUST_PROXY_DEPTH=N: the N rightmost XFF entries are trusted proxy
// appends, so the client is chain[length - N]. The depth must come from a
// MEASURED chain on the deployed environment (XFF_DEBUG=1 window), never
// from assumption - the legacy TRUST_PROXY=1 mode below trusts the leftmost
// entry, which a client can spoof. When the received chain is shorter than
// the assumed depth the topology guess is wrong: fall back to the socket
// address (coarse but unspoofable) rather than to a spoofable entry.
// Used for rate limiting and abuse-defense checks, never persisted.
import type express from 'express';

export function clientIp(req: express.Request): string | undefined {
  const fwd = req.header('x-forwarded-for');
  const depthRaw = process.env.TRUST_PROXY_DEPTH ?? '';
  const depth = Number(depthRaw);
  if (depthRaw !== '' && Number.isInteger(depth) && depth >= 1) {
    if (!fwd) return req.socket.remoteAddress ?? undefined;
    const chain = fwd
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (process.env.XFF_DEBUG === '1') {
      // Short-lived measurement windows only: logs the full received chain.
      console.info('[xff-debug]', JSON.stringify({ chain, socket: req.socket.remoteAddress }));
    }
    if (chain.length >= depth) return chain[chain.length - depth];
    return req.socket.remoteAddress ?? undefined;
  }
  // Legacy mode, kept for unchanged deployments: leftmost XFF is trusted
  // when TRUST_PROXY=1. Known-spoofable; migrate to TRUST_PROXY_DEPTH.
  if (process.env.TRUST_PROXY === '1' && fwd) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress ?? undefined;
}
