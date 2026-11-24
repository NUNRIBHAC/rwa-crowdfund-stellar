import express from 'express';
import { Horizon } from '@stellar/stellar-sdk';
import { clientIp } from './client-ip.js';
import { RateLimiter } from './ratelimit.js';
import { createTestnetSetup, TESTNET_HORIZON, TestnetSetupError, type TestnetSetupConfig, type SetupPorts } from './testnet-setup.js';

export function testnetSetupRouter(config: TestnetSetupConfig, ports: SetupPorts) {
  const router = express.Router();
  const service = createTestnetSetup(config, ports);
  const limiter = new RateLimiter();
  let globalHits: number[] = [];
  router.use((req, res, next) => {
    if (req.method !== 'POST') return next();
    const now = Date.now();
    globalHits = globalHits.filter((at) => at > now - 60000);
    limiter.sweep(60000);
    const ip = `ip:${clientIp(req) ?? 'unknown'}`;
    if (globalHits.length >= 120 || (!limiter.has(ip) && limiter.trackedCount() >= 10000) || !limiter.allow(ip, 30, 60000)) {
      res.set('Retry-After', '60').status(429).json({ code: 'TESTNET_RATE_LIMITED' });
      return;
    }
    globalHits.push(now);
    next();
  });
  function handler(action: 'status' | 'fundXlm' | 'buildTrustline' | 'submitTrustline'): express.RequestHandler {
    return async (req, res) => {
      res.set('Cache-Control', 'no-store');
      const actor = req.body?.actor;
      if (typeof actor !== 'string' || actor.length > 64 || !req.body || typeof req.body !== 'object') {
        res.status(400).json({ code: 'TESTNET_ADDRESS_INVALID' });
        return;
      }
      if (Object.keys(req.body).some((key) => key !== 'actor' && !(action === 'submitTrustline' && key === 'xdr'))) {
        res.status(400).json({ code: 'TESTNET_REQUEST_INVALID' });
        return;
      }
      if (action === 'submitTrustline' && typeof req.body.xdr !== 'string') {
        res.status(400).json({ code: 'TESTNET_TRANSACTION_INVALID' });
        return;
      }
      try {
        const result = action === 'submitTrustline' ? await service.submitTrustline(actor, req.body.xdr) : await service[action](actor);
        res.json(result);
      } catch (error) {
        const code = error instanceof TestnetSetupError ? error.code : 'TESTNET_UPSTREAM_UNAVAILABLE';
        const status =
          code === 'TESTNET_SETUP_DISABLED'
            ? 503
            : code === 'TESTNET_UPSTREAM_UNAVAILABLE' || code === 'TESTNET_FAUCET_UNAVAILABLE' || code.endsWith('UNCONFIRMED')
              ? 502
              : 400;
        res.status(status).json({ code });
      }
    };
  }
  router.post('/status', handler('status'));
  router.post('/fund-xlm', handler('fundXlm'));
  router.post('/trustline/build', handler('buildTrustline'));
  router.post('/trustline/submit', handler('submitTrustline'));
  return router;
}

// Used by the server only through the disabled-by-default setup feature gate.
// No environment-controlled upstream URLs and no redirect following.
export function testnetSetupPorts(): SetupPorts {
  const server = new Horizon.Server(TESTNET_HORIZON);
  server.httpClient.defaults.timeout = 15000;
  server.httpClient.defaults.maxRedirects = 0;
  return {
    async loadAccount(address) {
      const response = await fetch(`${TESTNET_HORIZON}/accounts/${encodeURIComponent(address)}`, { redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('account read unavailable');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object') throw new Error('account response invalid');
      const result = data as Record<string, unknown>;
      if (result.account_id !== address || typeof result.sequence !== 'string' || !/^[0-9]+$/.test(result.sequence) || !Array.isArray(result.balances))
        throw new Error('account response invalid');
      const balances = result.balances.map((value: unknown) => {
        if (!value || typeof value !== 'object') throw new Error('balance response invalid');
        const b = value as Record<string, unknown>;
        if (typeof b.asset_type !== 'string' || typeof b.balance !== 'string' || !/^[0-9]+(?:\.[0-9]{1,7})?$/.test(b.balance))
          throw new Error('balance response invalid');
        if (b.asset_type !== 'native' && (typeof b.asset_code !== 'string' || typeof b.asset_issuer !== 'string')) throw new Error('asset response invalid');
        return {
          asset_type: b.asset_type,
          balance: b.balance,
          ...(typeof b.asset_code === 'string' ? { asset_code: b.asset_code } : {}),
          ...(typeof b.asset_issuer === 'string' ? { asset_issuer: b.asset_issuer } : {}),
        };
      });
      return { sequence: result.sequence, balances };
    },
    async fundXlm(address) {
      const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`, {
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('testnet funding unavailable');
    },
    async submit(tx) {
      const result = await server.submitTransaction(tx);
      return { hash: result.hash };
    },
  };
}
