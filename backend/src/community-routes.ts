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
  publicAccount,
  enrollTotp,
  enableTotp,
  disableTotp,
  completeTotpLogin,
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
  // Read-only operator reconciliation payload provider (wired in server.ts
  // from the campaign registry + intent journal). Optional so route tests
  // without chain access stay hermetic; absent means 503, never a guess.
  reconciliation?: () => Promise<unknown>;
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
  const { service, requireAdmin, reconciliation } = deps;
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
      if ('requiresTotp' in v) {
        res.json({ requiresTotp: true, ticket: v.ticket, expiresAt: v.expiresAt });
        return;
      }
      res.json({ token: v.token, expiresAt: v.expiresAt, account: publicAccount(v.account), isOperator: operatorWallets().includes(v.account.publicKey) });
    } catch (err) {
      sendError(res, err);
    }
  });
  // --- Second factor (TOTP). Enrollment/disable need a session; the login
  // completion endpoint takes the one-purpose ticket from /api/auth/verify.
  // The enrollment secret is returned to the account owner exactly once
  // (standard authenticator onboarding); it is never logged or re-served.
  router.post(
    '/api/auth/totp/enroll',
    authed(async (_req, res, account) => {
      const ip = clientIp(_req);
      if (ip && !service.limiter.allow(`totp-enroll-ip:${ip}`, 10, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later');
      res.json(await enrollTotp(store, account.publicKey));
    }),
  );
  router.post(
    '/api/auth/totp/enable',
    authed(async (req, res, account) => {
      res.json(await enableTotp(store, account.publicKey, String(req.body?.code ?? '')));
    }),
  );
  router.post(
    '/api/auth/totp/disable',
    authed(async (req, res, account) => {
      await disableTotp(store, account.publicKey, String(req.body?.code ?? ''));
      res.json({ ok: true });
    }),
  );
  router.post('/api/auth/totp/complete', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`totp-complete-ip:${ip}`, 30, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later');
      const v = await completeTotpLogin(store, String(req.body?.ticket ?? ''), String(req.body?.code ?? ''));
      res.json({ token: v.token, expiresAt: v.expiresAt, account: publicAccount(v.account), isOperator: operatorWallets().includes(v.account.publicKey) });
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- ECSPR Art. 21 appropriateness test + loss simulation (RTS 2022/2114) ---
  // Demo infrastructure: synthetic QA scope, no live sensitive-data
  // collection. The simulation's financial INPUTS never reach these
  // endpoints (client-side computation; RTS Art. 5(5) non-access rule);
  // only the transmitted RESULT is stored. Paths sit under the gated
  // /api/auth prefix, so no COMMUNITY_PATH change is needed.
  // HOLD GATE (fail-closed): live collection is held until separately
  // approved. APPROPRIATENESS_COLLECT must be set explicitly (staging QA
  // only); unset on demo/production, so real accounts have NO live
  // submission path - every appropriateness request answers 503, enforced
  // here, not by report caveat. Read at request time so tests can toggle.
  // Two-layer hold, both fail-closed, both read at request time:
  //  1. APPROPRIATENESS_COLLECT must be set explicitly (staging QA only);
  //     unset on demo/production, so real accounts have NO live submission
  //     path - every appropriateness request answers 503.
  //  2. APPROPRIATENESS_ALLOWLIST (comma-separated Stellar public keys)
  //     restricts collection to designated synthetic QA wallets even where
  //     the flag is set; empty/absent allowlist collects from NOBODY (403),
  //     so enabling the flag can never open blanket collection.
  const appropriatenessGate = (account: Account): CommunityError | null => {
    if (!process.env.APPROPRIATENESS_COLLECT) return new CommunityError(503, 'appropriateness collection is disabled on this deployment (held)');
    const allowed = (process.env.APPROPRIATENESS_ALLOWLIST ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (!allowed.includes(account.publicKey)) return new CommunityError(403, 'appropriateness collection is limited to designated QA accounts');
    return null;
  };
  const appropriatenessHeld: express.RequestHandler = (req, res, next) => {
    if (!process.env.APPROPRIATENESS_COLLECT) {
      res.status(503).json({ error: 'appropriateness collection is disabled on this deployment (held)' });
      return;
    }
    next();
  };
  router.get('/api/auth/appropriateness', appropriatenessHeld, async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      const denied = appropriatenessGate(account);
      if (denied) throw denied;
      res.json({ record: await service.getAppropriateness(account) });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/appropriateness/knowledge', appropriatenessHeld, async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      const denied = appropriatenessGate(account);
      if (denied) throw denied;
      service.checkRate(`appr-knowledge:${account.publicKey}`, 10, 60 * 60 * 1000);
      res.json({ record: await service.submitKnowledgeAssessment(account, req.body) });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/appropriateness/simulation-result', appropriatenessHeld, async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      const denied = appropriatenessGate(account);
      if (denied) throw denied;
      service.checkRate(`appr-sim:${account.publicKey}`, 20, 60 * 60 * 1000);
      res.json({ record: await service.transmitSimulationResult(account, req.body) });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/appropriateness/acknowledge-warning', appropriatenessHeld, async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      const denied = appropriatenessGate(account);
      if (denied) throw denied;
      res.json({ record: await service.acknowledgeWarning(account) });
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
      res.json({ account: publicAccount(account), isOperator: operatorWallets().includes(account.publicKey) });
    }),
  );
  router.put(
    '/api/auth/me',
    authed(async (req, res, account) => {
      res.json({
        account: publicAccount(await setDisplayName(store, account.publicKey, req.body?.displayName)),
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

  // --- Podcast episodes (public reads; admin-key publish, same gate as news) ---
  // Audio is external https only; the platform never hosts audio files.
  router.get('/api/podcast/episodes', async (_req, res) => {
    try {
      res.json({ episodes: await service.listEpisodes() });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.get('/api/campaigns/:id/podcast', async (req, res) => {
    try {
      res.json({
        episodes: await service.listCampaignEpisodes(requireCampaignId(req.params.id)),
      });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/podcast/episodes', requireAdmin, async (req, res) => {
    try {
      res.status(201).json({
        episode: await service.addEpisode(req.body, 'admin-key'),
      });
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
  router.post(
    '/api/operator/podcast/episodes',
    operator(async (req, res, account) => {
      res.status(201).json({
        episode: await service.addEpisode(req.body, `operator:${account.publicKey}`),
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
  router.get(
    '/api/operator/reconciliation',
    operator(async (_req, res) => {
      if (!reconciliation) {
        res.status(503).json({ error: 'reconciliation is not wired on this deployment' });
        return;
      }
      try {
        res.json(await reconciliation());
      } catch (err) {
        sendError(res, err);
      }
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
