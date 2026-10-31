import express from 'express';
import cors from 'cors';
import { createHash, timingSafeEqual } from 'node:crypto';
import { PORT, NETWORK } from './config.js';
import { listCampaigns } from './campaigns.js';
import { registerDiscoveryEndpoints } from './sitemap.js';
import { sorobanCampaigns, buildSoroban, submitSoroban, statusSoroban, recoverSoroban } from './soroban.js';

const app = express();
app.disable('x-powered-by');
// Browser-origin requests are denied unless explicitly allowlisted. No-Origin
// CLI/server requests still require the admin key on privileged endpoints.
const allowedOrigins = () =>
  (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
app.use((req, res, next) => {
  const origin = req.header('origin');
  if (origin && !allowedOrigins().includes(origin)) {
    res.status(403).json({ error: 'origin not allowed' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Web security headers on every response (API, static assets and SPA
  // fallback all pass through this middleware). CSP allows the Vite-built
  // bundle and inline style attributes only; no inline script, no framing.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(
  cors({
    origin: (origin, done) => done(null, !origin || allowedOrigins().includes(origin)),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-key'],
  }),
);
app.use(express.json({ limit: '64kb' }));

// Admin gate for operations that move money or spend platform/demo funds
// (create, demo invest, finalize, refund, retry, seed). Demo-grade shared
// secret (x-admin-key header); production needs creator/admin multisig,
// eventually enforced by the Soroban contract. The Freighter build/submit
// paths stay open: investors sign with their own funds.
// Read at request time so tests can toggle it. Fail closed when unset.
const requireAdmin: express.RequestHandler = (req, res, next) => {
  const adminSecret = process.env.ADMIN_SECRET ?? '';
  if (!adminSecret) {
    res.status(503).json({
      error: 'ADMIN_SECRET not configured (backend/.env); admin endpoints disabled',
    });
    return;
  }
  if (
    !timingSafeEqual(
      createHash('sha256')
        .update(req.header('x-admin-key') ?? '')
        .digest(),
      createHash('sha256').update(adminSecret).digest(),
    )
  ) {
    res.status(401).json({ error: 'missing or invalid admin key (x-admin-key header)' });
    return;
  }
  next();
};

// Machine-readable discovery: sitemap.xml + robots.txt (see sitemap.ts).
registerDiscoveryEndpoints(app);

app.get('/health', (_req, res) => {
  res.json({ ok: true, mode: 'soroban', network: NETWORK, productionEligible: false, deploymentIncluded: false });
});

app.get('/api/campaigns', async (req, res) => {
  try {
    res.json({ campaigns: await sorobanCampaigns(typeof req.query.actor === 'string' ? req.query.actor : undefined), mode: 'soroban' });
  } catch (err) {
    res.status(503).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
app.get('/api/legacy/campaigns', requireAdmin, async (_req, res) => {
  // Migration evidence only. Never return signed XDRs or private keys.
  const campaigns = await listCampaigns();
  res.json({
    readOnly: true,
    migrationRequired: true,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      goalUsdc: c.goalUsdc,
      investments: c.investments.map((i) => ({
        id: i.id,
        investorPub: i.investorPub,
        amountUsdc: i.amountUsdc,
        status: i.status,
        usdcTx: i.usdcTx,
        tokenTx: i.tokenTx,
        refundTx: i.refundTx,
        error: i.error,
      })),
    })),
  });
});
app.post('/api/campaigns/:id/soroban/build', async (req, res) => {
  try {
    res.json(await buildSoroban(String(req.params.id), req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
app.post('/api/campaigns/:id/soroban/submit', async (req, res) => {
  try {
    res.json(await submitSoroban(String(req.params.id), req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
app.post('/api/soroban/recover', async (req, res) => {
  // Re-register an exact signed envelope lost with the journal. Read-only
  // against the network: looks up the hash, never submits.
  try {
    res.json(await recoverSoroban(req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
app.get('/api/soroban/transactions/:hash', async (req, res) => {
  try {
    res.json(await statusSoroban(String(req.params.hash)));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
// All old money-moving and wallet submission routes are disabled. Existing
// classic state is never converted, cleared or resubmitted by the new server.
app.post('/api/{*path}', (_req, res) => {
  res
    .status(410)
    .json({ error: 'Classic campaign writes disabled. Soroban is the active flow. Legacy state requires a separately reviewed migration/reconciliation.' });
});

export { app };
if (process.env.NODE_ENV !== 'test' && !process.env.EMBEDDED_HOST) {
  app.listen(PORT, process.env.HOST ?? '127.0.0.1', () => console.log(`Soroban test-only API at http://127.0.0.1:${PORT}`));
}
