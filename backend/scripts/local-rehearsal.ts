// Explicit opt-in loopback harness. Never imported by server.ts. No provider,
// real account, wallet, mailer or hosted store is reachable through this file.
import express from 'express';
import { createServer } from 'vite';
import { Keypair } from '@stellar/stellar-sdk';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileCommunityStore } from '../src/community-store.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';
import { DistributionSimulationLedger } from '../src/distribution-simulation.js';
import { createDistributionSimulationRouter } from '../src/distribution-simulation-routes.js';
import { createMeetingSimulationRouter } from '../src/meeting-simulation-routes.js';
import type { ShareRegisterPayload } from '../src/share-register.js';
if (process.env.LOCAL_REHEARSAL !== 'test_only') throw Error('Set LOCAL_REHEARSAL=test_only for isolated loopback fixtures');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'local-rehearsal-ui-'));
const store = new FileCommunityStore(path.join(dir, 'accounts.json'));
const sessions = [];
for (const label of ['Fixture preparer', 'Fixture reviewer']) {
  const kp = Keypair.random();
  const challenge = await createChallenge(store, kp.publicKey());
  const verified = await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(challenge.message)).toString('base64'));
  sessions.push({ label, account: kp.publicKey(), token: verified.token });
}
const accounts = sessions.map((s) => s.account);
const app = express();
// Reject non-loopback Host and cross-origin writes, including DNS rebinding.
app.use((req, res, next) => {
  const host = req.hostname;
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) {
    res.sendStatus(403);
    return;
  }
  if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) {
    res.sendStatus(403);
    return;
  }
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '32kb' }));
app.get('/local-rehearsal/fixture-sessions', (_req, res) => {
  res.json(sessions);
});
const register = {
  campaignId: 'synthetic',
  generatedAt: 'fixture',
  network: 'testnet',
  demo: true,
  semantics: 'Fixture only',
  notes: [],
  totals: {},
  contributors: [
    { publicKey: 'fictional-holder-A', netIntended: '3' },
    { publicKey: 'fictional-holder-B', netIntended: '1' },
  ],
} as unknown as ShareRegisterPayload;
app.use(
  '/local-rehearsal',
  createDistributionSimulationRouter({
    mode: 'test_only',
    store,
    ledger: new DistributionSimulationLedger(path.join(dir, 'distributions.json')),
    operatorWallets: () => accounts,
    syntheticRegister: async (id) => (id === 'synthetic' ? register : null),
  }),
);
app.use('/local-rehearsal', createMeetingSimulationRouter({ mode: 'test_only', store, organizers: () => accounts }));
const vite = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { middlewareMode: true }, appType: 'mpa' });
app.use(vite.middlewares);
const server = app.listen(0, '127.0.0.1', () => {
  console.log(`LOCAL_REHEARSAL_URL=http://127.0.0.1:${(server.address() as { port: number }).port}/rehearsal/`);
});
async function close() {
  await vite.close();
  server.close(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    process.exit(0);
  });
}
process.on('SIGINT', () => void close());
process.on('SIGTERM', () => void close());
