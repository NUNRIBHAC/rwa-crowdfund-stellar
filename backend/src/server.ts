import express from 'express';
import cors from 'cors';
import { PORT, NETWORK } from './config.js';
import { server } from './stellar.js';
import {
  buildInvestXdr,
  buildTrustlineXdr,
  createCampaign,
  finalize,
  invest,
  listCampaigns,
  listDemoInvestors,
  refund,
  retryPending,
  seedDemoInvestors,
  submitSignedInvest,
  submitSignedTrustline,
} from './campaigns.js';
import { getBalances } from './chain.js';

const app = express();
app.use(cors());
app.use(express.json());

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
  if ((req.header('x-admin-key') ?? '') !== adminSecret) {
    res.status(401).json({ error: 'missing or invalid admin key (x-admin-key header)' });
    return;
  }
  next();
};

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    network: NETWORK,
    horizon: server.serverURL.toString(),
  });
});

app.get('/api/campaigns', async (_req, res) => {
  try {
    res.json({ campaigns: await listCampaigns() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/campaigns', requireAdmin, async (req, res) => {
  try {
    res.json(await createCampaign(req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/campaigns/:id/invest', requireAdmin, async (req, res) => {
  try {
    res.json(await invest(String(req.params.id), req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/campaigns/:id/invest/build', async (req, res) => {
  try {
    res.json(await buildInvestXdr(String(req.params.id), req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/campaigns/:id/invest/submit', async (req, res) => {
  try {
    res.json(await submitSignedInvest(String(req.params.id), req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/campaigns/:id/finalize', requireAdmin, async (req, res) => {
  try {
    res.json(await finalize(String(req.params.id)));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/campaigns/:id/refund', requireAdmin, async (req, res) => {
  try {
    res.json(await refund(String(req.params.id)));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/campaigns/:id/retry-pending', requireAdmin, async (req, res) => {
  try {
    res.json(await retryPending(String(req.params.id)));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.get('/api/demo/investors', (_req, res) => {
  res.json({ investors: listDemoInvestors() });
});

app.post('/api/demo/seed-investors', requireAdmin, async (_req, res) => {
  try {
    res.json(await seedDemoInvestors());
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.get('/api/demo/wallet/:pub', async (req, res) => {
  try {
    res.json({ balances: await getBalances(req.params.pub) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/wallet/trustline/build', async (req, res) => {
  try {
    res.json(await buildTrustlineXdr(req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/wallet/trustline/submit', async (req, res) => {
  try {
    res.json(await submitSignedTrustline(req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API at http://localhost:${PORT}`);
  });
}
