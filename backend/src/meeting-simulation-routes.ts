// Optional isolated rehearsal endpoints. Never mounted in the application.
import express from 'express';
import { z, ZodError } from 'zod';
import { authenticate, AuthError } from './accounts.js';
import type { CommunityStore } from './community-store.js';
import { MeetingSimulationService } from './meeting-simulation.js';
export function createMeetingSimulationRouter(deps: { mode: 'test_only'; store: CommunityStore; organizers: () => string[] }) {
  if (deps.mode !== 'test_only') throw new Error('live meeting router unsupported');
  const service = new MeetingSimulationService(deps.store);
  const router = express.Router();
  router.use((_q, r, next) => {
    r.set('Cache-Control', 'no-store');
    next();
  });
  const handler =
    (organizer: boolean, fn: (req: express.Request, res: express.Response, actor: string) => Promise<void>) =>
    async (req: express.Request, res: express.Response) => {
      try {
        const account = await authenticate(deps.store, req.header('authorization'));
        if (organizer) {
          const allowed = deps.organizers();
          if (!allowed.length) {
            res.status(503).json({ error: 'fixture organizers unavailable' });
            return;
          }
          if (!allowed.includes(account.publicKey)) {
            res.status(403).json({ error: 'fixture organizer required' });
            return;
          }
        }
        await fn(req, res, account.publicKey);
      } catch (error) {
        if (error instanceof AuthError) {
          res.status(error.status).json({ error: error.message });
          return;
        }
        if (error instanceof ZodError) {
          res.status(400).json({ error: 'invalid fixture input' });
          return;
        }
        res.status(409).json({ error: 'fixture meeting unavailable or action rejected' });
      }
    };
  router.post(
    '/meetings',
    handler(true, async (req, res, actor) => {
      res.status(201).json(await service.create(actor, req.body));
    }),
  );
  router.get(
    '/meetings/:id',
    handler(false, async (req, res, actor) => {
      res.json(await service.read(actor, String(req.params.id)));
    }),
  );
  router.post(
    '/meetings/:id/state',
    handler(true, async (req, res, actor) => {
      const { state } = z
        .object({ state: z.enum(['open', 'closed', 'cancelled']) })
        .strict()
        .parse(req.body);
      res.json(await service.transition(actor, String(req.params.id), state));
    }),
  );
  router.post(
    '/meetings/:id/participation',
    handler(false, async (req, res, actor) => {
      res.json(await service.participate(actor, String(req.params.id), req.body));
    }),
  );
  return router;
}
