// Optional local rehearsal router. Not mounted by server.ts or any deployment.
// Session authentication is real; fixtures, register and receipts are test-only.
import express from 'express';
import { z, ZodError } from 'zod';
import { authenticate, AuthError } from './accounts.js';
import type { CommunityStore } from './community-store.js';
import { buildCapTable } from './corporate-actions.js';
import type { ShareRegisterPayload } from './share-register.js';
import { DistributionSimulationLedger } from './distribution-simulation.js';
const prepareSchema = z.object({ total: z.string().max(40), idempotencyKey: z.string().max(120) }).strict();
const actionSchema = z.object({ action: z.enum(['approve', 'simulate', 'cancel']), reason: z.string().optional() }).strict();
export function createDistributionSimulationRouter(deps: {
  mode: 'test_only';
  store: CommunityStore;
  ledger: DistributionSimulationLedger;
  operatorWallets: () => string[];
  syntheticRegister: (campaignId: string) => Promise<ShareRegisterPayload | null>;
}) {
  if (deps.mode !== 'test_only') throw new Error('live rehearsal router unsupported');
  const router = express.Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  const handle = (fn: (req: express.Request, res: express.Response, actor: string) => Promise<void>) => async (req: express.Request, res: express.Response) => {
    try {
      const account = await authenticate(deps.store, req.header('authorization'));
      const operators = deps.operatorWallets();
      if (operators.length === 0) {
        res.status(503).json({ error: 'simulation operators unavailable' });
        return;
      }
      if (!operators.includes(account.publicKey)) {
        res.status(403).json({ error: 'simulation operator required' });
        return;
      }
      await fn(req, res, account.publicKey);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'invalid simulation input' });
        return;
      }
      // Synthetic responses deliberately omit internal store/adapter details.
      res.status(409).json({ error: 'simulation unavailable or transition rejected' });
    }
  };
  router.post(
    '/campaigns/:campaignId/distributions',
    handle(async (req, res, actor) => {
      const input = prepareSchema.parse(req.body);
      const register = await deps.syntheticRegister(String(req.params.campaignId));
      if (!register) {
        res.status(404).json({ error: 'synthetic campaign not found' });
        return;
      }
      if (register.demo !== true || register.network !== 'testnet' || register.campaignId !== req.params.campaignId) {
        res.status(409).json({ error: 'synthetic testnet register required' });
        return;
      }
      res.status(201).json(deps.ledger.prepare(actor, buildCapTable(register), input.total, input.idempotencyKey));
    }),
  );
  router.get(
    '/distributions/:id',
    handle(async (req, res) => {
      res.json(deps.ledger.get(String(req.params.id)));
    }),
  );
  router.post(
    '/distributions/:id',
    handle(async (req, res, actor) => {
      const input = actionSchema.parse(req.body);
      const id = String(req.params.id);
      if (input.action === 'approve') res.json(deps.ledger.approve(actor, id));
      else if (input.action === 'simulate') res.json(await deps.ledger.execute(actor, id));
      else res.json(deps.ledger.cancel(actor, id, input.reason ?? ''));
    }),
  );
  return router;
}
