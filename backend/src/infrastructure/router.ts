import express from 'express';
import { z } from 'zod';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Infrastructure, type Actor } from './service.js';
export type Credential = Actor & { token: string };
export function infrastructureRouter(service: Infrastructure, credentials: Credential[]) {
  credentials = z.array(z.object({ id: z.string().regex(/^[a-zA-Z0-9_.:-]{1,120}$/), role: z.enum(['compliance', 'valuation', 'governor', 'operator', 'auditor']), token: z.string().min(32).max(512) }).strict()).max(100).parse(credentials);
  const seen = new Set<string>();
  for (const c of credentials) { if (c.token.length < 32 || seen.has(c.token) || !c.id || !['compliance', 'valuation', 'governor', 'operator', 'auditor'].includes(c.role)) throw new Error('invalid, duplicate or weak infrastructure credential'); seen.add(c.token); }
  if (new Set(credentials.map(c => c.id)).size !== credentials.length) throw new Error('principal ids must be unique');
  const router = express.Router(); router.use(express.json({ limit: '32kb' }));
  router.get('/status', (_req, res) => res.json(service.status()));
  router.use((req, res, next) => {
    const supplied = createHash('sha256').update(req.header('authorization') ?? '').digest();
    const actor = credentials.find(c => timingSafeEqual(supplied, createHash('sha256').update(`Bearer ${c.token}`).digest()));
    if (!actor) { res.status(401).json({ error: 'infrastructure credential required' }); return; }
    res.locals.actor = { id: actor.id, role: actor.role }; next();
  });
  const route = (path: string, fn: (req: express.Request, actor: Actor) => unknown) => router.post(path, async (req, res) => {
    try { res.json(await fn(req, res.locals.actor)); } catch (e) { res.status(422).json({ error: e instanceof Error ? e.message : 'held' }); }
  });
  route('/identities', (r,a) => service.recordIdentity(a,r.body));
  route('/valuations', (r,a) => service.publishValuation(a,r.body?.valuation,r.body?.signature ?? ''));
  route('/proposals', (r,a) => service.propose(a,r.body));
  route('/proposals/:id/approve', (r,a) => service.approve(a,String(r.params.id)));
  route('/eligibility', r => service.eligibility(r.body?.subject,r.body?.assetId,r.body?.network));
  route('/cashouts', (r,a) => service.requestCashout(a,r.body));
  route('/cashouts/:key/approve', (r,a) => service.approveCashout(a,String(r.params.key)));
  route('/cashouts/:key/dispatch', (r,a) => service.dispatchCashout(a,String(r.params.key)));
  router.get('/audit', (_req,res) => { if (res.locals.actor.role !== 'auditor') { res.status(403).json({ error: 'auditor role required' }); return; } res.json(service.store.read().audit); });
  return router;
}
