import express from 'express';
import { ZodError } from 'zod';
import { authenticate, createChallenge, logout, setDisplayName, verifyChallenge, AuthError } from './accounts.js';
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
      res.json(await verifyChallenge(store, String(req.body?.publicKey ?? ''), String(req.body?.signature ?? '')));
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
      res.json({ account });
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
        post: await service.addNews(requireCampaignId(req.params.id), req.body),
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
      await service.adminSetCommentHidden(String(req.params.id), true, req.body?.reason);
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/admin/comments/:id/unhide', requireAdmin, async (req, res) => {
    try {
      await service.adminSetCommentHidden(String(req.params.id), false);
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
      await service.adminCloseTicket(String(req.params.id));
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
      await service.adminSetApplicationStatus(String(req.params.id), req.body?.status);
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err);
    }
  });

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
