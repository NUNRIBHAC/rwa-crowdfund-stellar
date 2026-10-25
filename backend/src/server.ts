import express from 'express';
import cors from 'cors';
import { PORT, NETWORK } from './config.js';
import { server } from './stellar.js';
import {
  buildInvestXdr,
  createCampaign,
  finalize,
  invest,
  listCampaigns,
  listDemoInvestors,
  refund,
  seedDemoInvestors,
  submitSignedInvest,
} from './campaigns.js';
import { getBalances } from './chain.js';

const app = express();
app.use(cors());
app.use(express.json());

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
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    res.status(201).json(await createCampaign(req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.post('/api/campaigns/:id/invest', async (req, res) => {
  try {
    res.json(await invest(req.params.id, req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.post('/api/campaigns/:id/invest/build', async (req, res) => {
  try {
    res.json(await buildInvestXdr(req.params.id, req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.post('/api/campaigns/:id/invest/submit', async (req, res) => {
  try {
    res.json(await submitSignedInvest(req.params.id, req.body ?? {}));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.post('/api/campaigns/:id/finalize', async (req, res) => {
  try {
    res.json(await finalize(req.params.id));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.post('/api/campaigns/:id/refund', async (req, res) => {
  try {
    res.json(await refund(req.params.id));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.get('/api/demo/investors', (_req, res) => {
  res.json({ investors: listDemoInvestors() });
});

app.post('/api/demo/seed-investors', async (_req, res) => {
  try {
    res.json(await seedDemoInvestors());
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.get('/api/demo/wallet/:pub', async (req, res) => {
  try {
    res.json({ balances: await getBalances(req.params.pub) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}`);
});
