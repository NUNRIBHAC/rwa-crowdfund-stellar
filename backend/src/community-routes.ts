import express from 'express';
import { ZodError } from 'zod';
import {
  authenticate,
  createChallenge,
  listSessions,
  logout,
  logoutOtherSessions,
  revokeSession,
  setDisplayName,
  verifyChallenge,
  AuthError,
} from './accounts.js';
import { CommunityError, CommunityService, communityStoreFromEnv, requireCampaignId } from './community.js';
import { metadataFor } from './campaign-metadata.js';
import type { Account } from './community-store.js';

// Express wiring for accounts, community, support and metadata APIs.
// The admin gate is injected from server.ts so there is exactly one admin
// check implementation.

export type CommunityRouterDeps = {
  service: CommunityService;
  requireAdmin: express.RequestHandler;
};

function clientIp(req: express.Request): string | undefined {
  // Behind Render's proxy the leftmost XFF entry is the client. Only trust it
  // when TRUST_PROXY=1 is set for the hosting environment; otherwise use the
  // socket address. Used for rate limiting only, never persisted.
  if (process.env.TRUST_PROXY === '1') {
    const fwd = req.header('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? undefined;
}

function sendError(res: express.Response, err: unknown): void {
  if (err instanceof AuthError || err instanceof CommunityError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'invalid input: ' + err.issues.map((i) => i.message).join('; '),
    });
    return;
  }
  res.status(500).json({ error: 'internal error' });
}

export function createCommunityRouter(deps: CommunityRouterDeps): express.Router {
  const { service, requireAdmin } = deps;
  const store = service.store;
  const router = express.Router();

  const operatorWallets = (): string[] =>
    (process.env.OPERATOR_WALLETS ?? '')
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

  const authed =
    (handler: (req: express.Request, res: express.Response, account: Account) => Promise<void>) => async (req: express.Request, res: express.Response) => {
      try {
        const account = await authenticate(store, req.header('authorization'));
        await handler(req, res, account);
      } catch (err) {
        sendError(res, err);
      }
    };

  // --- Auth ---
  router.post('/api/auth/challenge', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`challenge-ip:${ip}`, 30, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later');
      res.json(await createChallenge(store, String(req.body?.publicKey ?? '')));
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/verify', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`verify-ip:${ip}`, 60, 60 * 60 * 1000)) throw new CommunityError(429, 'rate limit exceeded; slow down and retry later');
      const v = await verifyChallenge(store, String(req.body?.publicKey ?? ''), String(req.body?.signature ?? ''));
      res.json({ ...v, isOperator: operatorWallets().includes(v.account.publicKey) });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.get('/api/auth/sessions', async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      res.json({ sessions: await listSessions(store, account.publicKey, req.header('authorization')) });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.delete('/api/auth/sessions/:id', async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      const removed = await revokeSession(store, account.publicKey, String(req.params.id));
      if (!removed) throw new AuthError(404, 'session not found');
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/logout-others', async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      res.json({ removed: await logoutOtherSessions(store, account.publicKey, req.header('authorization')) });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.get('/api/companies/mine', async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      res.json({ companies: await service.myCompanies(account.publicKey) });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/companies', async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      res.status(201).json({ company: await service.applyForCompany(account, req.body) });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post(
    '/api/auth/logout',
    authed(async (req, res) => {
      await logout(store, req.header('authorization'));
      res.json({ ok: true });
    }),
  );
  router.get(
    '/api/auth/me',
    authed(async (_req, res, account) => {
      // isOperator lets the signed-in UI reveal the operator dashboard; it is
      // a display hint only - every /api/operator/* route re-checks the
      // allow-list server-side per request.
      res.json({ account, isOperator: operatorWallets().includes(account.publicKey) });
    }),
  );
  router.put(
    '/api/auth/me',
    authed(async (req, res, account) => {
      res.json({
        account: await setDisplayName(store, account.publicKey, req.body?.displayName),
      });
    }),
  );

  // --- Campaign metadata (industry chips/filters, documents) ---
  router.get('/api/campaigns/:id/metadata', (req, res) => {
    try {
      const id = requireCampaignId(req.params.id);
      res.json({ metadata: metadataFor(id) });
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Comments ---
  router.get('/api/campaigns/:id/comments', async (req, res) => {
    try {
      res.json({
        comments: await service.listComments(requireCampaignId(req.params.id)),
      });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post(
    '/api/campaigns/:id/comments',
    authed(async (req, res, account) => {
      const comment = await service.addComment(requireCampaignId(req.params.id), account, req.body, clientIp(req));
      res.status(201).json({ comment });
    }),
  );

  // --- News ---
  router.get('/api/campaigns/:id/news', async (req, res) => {
    try {
      res.json({
        news: await service.listNews(requireCampaignId(req.params.id)),
      });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/campaigns/:id/news', requireAdmin, async (req, res) => {
    try {
      res.status(201).json({
        post: await service.addNews(requireCampaignId(req.params.id), req.body, 'admin-key'),
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Site-wide news feed (public; same visibility as per-campaign news) ---
  router.get('/api/news', async (_req, res) => {
    try {
      res.json({ news: await service.listAllNews() });
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Support and feedback tickets ---
  router.post(
    '/api/support/tickets',
    authed(async (_req, res, account) => {
      res.status(201).json({ ticket: await service.createTicket(account, _req.body) });
    }),
  );
  router.get(
    '/api/support/tickets',
    authed(async (_req, res, account) => {
      res.json({ tickets: await service.listOwnTickets(account) });
    }),
  );

  // --- Issuer applications ---
  router.post(
    '/api/issuer-applications',
    authed(async (_req, res, account) => {
      res.status(201).json({
        application: await service.submitApplication(account, _req.body),
      });
    }),
  );

  router.get(
    '/api/issuer-applications',
    authed(async (_req, res, account) => {
      res.json({ applications: await service.listOwnApplications(account) });
    }),
  );

  // --- Own activity (account dashboard feed) ---
  router.get(
    '/api/comments/mine',
    authed(async (_req, res, account) => {
      res.json({ comments: await service.listOwnComments(account) });
    }),
  );

  // --- Owner-scoped notifications ---
  router.get(
    '/api/notifications',
    authed(async (_req, res, account) => {
      res.json(await service.listNotifications(account));
    }),
  );
  router.post(
    '/api/notifications/read-all',
    authed(async (_req, res, account) => {
      res.json(await service.markAllNotificationsRead(account));
    }),
  );
  router.post(
    '/api/notifications/:id/read',
    authed(async (req, res, account) => {
      await service.markNotificationRead(account, String(req.params.id));
      res.json({ ok: true });
    }),
  );

  // --- Operator surface for the demo admin dashboard ---
  // Browser operators authenticate with the EXISTING community wallet
  // sign-in (signed challenge bearer token); authorization is membership of
  // the OPERATOR_WALLETS env allow-list, checked server-side on every
  // request. The x-admin-key shared secret stays server/CLI-only and never
  // reaches the frontend. Fail closed when the allow-list is unset, same
  // posture as requireAdmin. Demo-grade designation; production needs real
  // operator identities (multisig), as noted in server.ts.
  const operator = (handler: (req: express.Request, res: express.Response, account: Account) => Promise<void>) =>
    authed(async (req, res, account) => {
      const wallets = operatorWallets();
      if (wallets.length === 0) {
        res.status(503).json({ error: 'OPERATOR_WALLETS not configured; operator endpoints disabled' });
        return;
      }
      if (!wallets.includes(account.publicKey)) {
        res.status(403).json({ error: 'this wallet is not a designated operator' });
        return;
      }
      await handler(req, res, account);
    });

  router.get(
    '/api/operator/comments',
    operator(async (_req, res) => {
      res.json({ comments: await service.adminListComments() });
    }),
  );
  router.post(
    '/api/operator/comments/:id/hide',
    operator(async (req, res, account) => {
      await service.adminSetCommentHidden(String(req.params.id), true, req.body?.reason, `operator:${account.publicKey}`);
      res.json({ ok: true });
    }),
  );
  router.post(
    '/api/operator/comments/:id/unhide',
    operator(async (req, res, account) => {
      await service.adminSetCommentHidden(String(req.params.id), false, undefined, `operator:${account.publicKey}`);
      res.json({ ok: true });
    }),
  );
  router.get(
    '/api/operator/tickets',
    operator(async (_req, res) => {
      res.json({ tickets: await service.adminListTickets() });
    }),
  );
  router.post(
    '/api/operator/tickets/:id/close',
    operator(async (req, res, account) => {
      await service.adminCloseTicket(String(req.params.id), `operator:${account.publicKey}`);
      res.json({ ok: true });
    }),
  );
  router.get(
    '/api/operator/issuer-applications',
    operator(async (_req, res) => {
      res.json({ applications: await service.adminListApplications() });
    }),
  );
  router.post(
    '/api/operator/issuer-applications/:id/status',
    operator(async (req, res, account) => {
      await service.adminSetApplicationStatus(String(req.params.id), req.body?.status, `operator:${account.publicKey}`);
      res.json({ ok: true });
    }),
  );
  router.get(
    '/api/operator/companies',
    operator(async (_req, res) => {
      res.json({ companies: await service.adminListCompanies() });
    }),
  );
  router.post(
    '/api/operator/companies/:id/status',
    operator(async (req, res, account) => {
      await service.adminSetCompanyStatus(String(req.params.id), req.body?.status, `operator:${account.publicKey}`);
      res.json({ ok: true });
    }),
  );
  router.post(
    '/api/operator/campaigns/:id/news',
    operator(async (req, res, account) => {
      res.status(201).json({
        post: await service.addNews(requireCampaignId(req.params.id), req.body, `operator:${account.publicKey}`),
      });
    }),
  );

  // --- Admin operations (moderation, support desk, issuer pipeline) ---
  router.get('/api/admin/comments', requireAdmin, async (_req, res) => {
    try {
      res.json({ comments: await service.adminListComments() });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/admin/comments/:id/hide', requireAdmin, async (req, res) => {
    try {
      await service.adminSetCommentHidden(String(req.params.id), true, req.body?.reason, 'admin-key');
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/admin/comments/:id/unhide', requireAdmin, async (req, res) => {
    try {
      await service.adminSetCommentHidden(String(req.params.id), false, undefined, 'admin-key');
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.get('/api/admin/tickets', requireAdmin, async (_req, res) => {
    try {
      res.json({ tickets: await service.adminListTickets() });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/admin/tickets/:id/close', requireAdmin, async (req, res) => {
    try {
      await service.adminCloseTicket(String(req.params.id), 'admin-key');
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.get('/api/admin/issuer-applications', requireAdmin, async (_req, res) => {
    try {
      res.json({ applications: await service.adminListApplications() });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/admin/issuer-applications/:id/status', requireAdmin, async (req, res) => {
    try {
      await service.adminSetApplicationStatus(String(req.params.id), req.body?.status, 'admin-key');
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get('/api/admin/audit-log', requireAdmin, async (req, res) => {
    try {
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      res.json({ audit: await service.adminAuditLog(limit) });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get(
    '/api/operator/audit-log',
    operator(async (req, res) => {
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      res.json({ audit: await service.adminAuditLog(limit) });
    }),
  );

  return router;
}

// Boot helper for server.ts: builds store + service from env and prunes on a
// slow interval (unref'd; never keeps the process alive).
export async function communityServiceFromEnv(): Promise<CommunityService> {
  const store = await communityStoreFromEnv();
  const service = new CommunityService(store, {
    retentionDays: Number(process.env.COMMUNITY_RETENTION_DAYS ?? 90),
  });
  await service.prune();
  const timer = setInterval(() => service.prune().catch(() => {}), 60 * 60 * 1000);
  timer.unref();
  return service;
}
