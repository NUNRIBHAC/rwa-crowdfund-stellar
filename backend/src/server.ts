import express from 'express';
import cors from 'cors';
import { PORT, NETWORK } from './config.js';
import { server } from './stellar.js';

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

// Próximo passo: rotas de campanhas e investimento
app.get('/api/campaigns', (_req, res) => {
  res.json({ campaigns: [] });
});

app.listen(PORT, () => {
  console.log(`API em http://localhost:${PORT}`);
});
