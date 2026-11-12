import { publicFailure } from './public-errors.js';
import { sorobanBuildLimiter, sorobanSubmitLimiter } from './soroban-build-limiter.js';
import { readLimiter } from './read-limiter.js';
import express from 'express';
import cors from 'cors';
import { createHash, timingSafeEqual } from 'node:crypto';
import { PORT, NETWORK } from './config.js';
import { listCampaigns } from './campaigns.js';
import { CampaignListCache, CAMPAIGN_LIST_CACHE_TTL_MS } from './campaign-list-cache.js';
import { registerDiscoveryEndpoints } from './sitemap.js';
import {
  sorobanCampaigns,
  sorobanCampaignFundingState,
  sorobanInvestorEntitlement,
  confirmedContribution,
  deriveContributionFromNetwork,
  buildSoroban,
  submitSoroban,
  statusSoroban,
  recoverSoroban,
  accountActivity,
  accountPayouts,
  sorobanRegisteredCampaigns,
  sorobanDeps,
  buildCampaignDeploy,
  submitCampaignDeploy,
  buildCampaignDeployV2,
  submitCampaignDeployV2,
  sorobanRegistryEntry,
  sorobanArchiveTargets,
  isV2Entry,
  readV2SharePositions,
} from './soroban.js';
import { journalBackend, readJournalSummary } from './journal.js';
import { drainPendingContributors, pendContribution, readPending } from './pending-contributors.js';
import { reconcileCampaigns, RECONCILIATION_SEMANTICS } from './reconciliation.js';
import { backfillCampaignContributors } from './contributor-backfill.js';
import { communityServiceFromEnv, createCommunityRouter } from './community-routes.js';
import { mailerFromEnv } from './mailer.js';
import { buildShareRegister, type ShareRegisterPayload } from './share-register.js';
import { buildCapTable, holdingFromCapTable, CORPORATE_ACTIONS_SEMANTICS } from './corporate-actions.js';
import { archiveCampaignEvents, eventArchiveBackend, archiveSnapshotJsonl, verifyArchiveSnapshot } from './event-archive.js';

const app = express();
app.disable('x-powered-by');
// Browser-origin requests are denied unless explicitly allowlisted. No-Origin
// CLI/server requests still require the admin key on privileged endpoints.
const allowedOrigins = () =>
  (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
app.use((req, res, next) => {
  const origin = req.header('origin');
  if (origin && !allowedOrigins().includes(origin)) {
    res.status(403).json({ error: 'origin not allowed' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Web security headers on every response (API, static assets and SPA
  // fallback all pass through this middleware). CSP allows the Vite-built
  // bundle and inline style attributes only; no inline script. The only
  // third-party origin is Cloudflare Turnstile: the bot-check widget script
  // loads from challenges.cloudflare.com and renders its challenge in an
  // iframe on the same origin, so script/frame/connect need it or the
  // widget fails closed with "turnstile script failed to load". No other
  // framing: frame-ancestors stays 'none'.
  // Sign In With Farcaster talks to the public Farcaster relay from the
  // browser; that origin is allowed ONLY when the feature is configured.
  const relayOrigin = process.env.FARCASTER_AUTH_DOMAIN?.trim() ? ' https://relay.farcaster.xyz' : '';
  // Media origin (private B2 bucket fronted by the blockallisto-media
  // Cloudflare Worker) serves migrated public images and self-hosted fonts.
  // Scoped to the exact worker origin, only in img-src/font-src, and ONLY
  // when configured - unset keeps the previous 'self'-only policy so dev and
  // un-migrated deploys are unchanged. connect-src stays closed: no XHR/
  // fetch of static assets exists (FontFace loading is governed by
  // font-src). No wildcards.
  const mediaEnv = process.env.MEDIA_ORIGIN?.trim() ?? '';
  // Strict shape: scheme + host only. Anything else (paths, whitespace,
  // quotes) would corrupt or widen the policy, so it is rejected to ''.
  const mediaOrigin = /^https:\/\/[a-z0-9][a-z0-9.-]*$/.test(mediaEnv) ? ` ${mediaEnv}` : '';
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:${mediaOrigin}; connect-src 'self' https://challenges.cloudflare.com${relayOrigin}; frame-src https://challenges.cloudflare.com; font-src 'self'${mediaOrigin}; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
  );
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(
  cors({
    origin: (origin, done) => done(null, !origin || allowedOrigins().includes(origin)),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-key', 'authorization'],
  }),
);
app.use(express.json({ limit: '64kb' }));
app.use(readLimiter());

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
  if (
    !timingSafeEqual(
      createHash('sha256')
        .update(req.header('x-admin-key') ?? '')
        .digest(),
      createHash('sha256').update(adminSecret).digest(),
    )
  ) {
    res.status(401).json({ error: 'missing or invalid admin key (x-admin-key header)' });
    return;
  }
  next();
};

// Machine-readable discovery: sitemap.xml + robots.txt (see sitemap.ts).
// Live campaign URLs come from the Soroban registry (same source as /api/campaigns),
// not the legacy file store.
registerDiscoveryEndpoints(app, { listCampaignIds: async () => (await sorobanCampaigns()).map((c) => c.id) });
// Accounts, community, support, issuer applications and campaign metadata.
// The router must be registered synchronously: Express matches in
// registration order, and a router app.use()d only after the async store boot
// would land BEHIND the legacy-write catch-all below, so every community POST
// would be answered 410. Register a lazy placeholder now; requests on
// community paths wait for the store to boot. Boot failures must not take
// down the campaign API: the placeholder answers 503 for community paths and
// everything else is unaffected.
// Durable contributor registry, written only from network-derived
// contribution facts (journal row fields originate from the build request
// and are never trusted). Reliability layers:
//  - immediate: the submit/status routes attempt the record when a hash
//    confirms; transaction responses stay truthful - success is reported
//    even if this secondary write fails
//  - durable pending-proof queue (pending-contributors.ts, file-backed and
//    independent of the journal AND the community store): every deferral is
//    persisted, so the journal's ~30-day terminal pruning can never strand
//    an unrecorded confirmed contribution the way a journal-only retry
//    would during an extended outage
//  - reconciliation: startup + every 30 minutes drains the pending queue
//    (hash-only entries re-derive from the network, post-prune-safe), then
//    re-scans the journal's surviving SUCCESS contribute intents.
const recordConfirmedContributor = async (hash: string | undefined): Promise<void> => {
  if (!hash) return;
  try {
    const confirmed = await confirmedContribution(hash);
    if (!confirmed) return;
    const service = await communityServiceFromEnv();
    await service.recordContributor(confirmed.campaignId, confirmed.contributor);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('contributor registry write deferred to pending queue:', hash, message);
    // Hash-only entry: facts were not established here, so the drain will
    // re-derive from the network. If facts WERE established above and only
    // the registry write failed, the drain re-derives identically.
    pendContribution({ hash, lastError: message });
  }
};

const reconcileContributorRegistry = async (): Promise<void> => {
  try {
    const service = await communityServiceFromEnv();
    const drain = await drainPendingContributors({
      record: (campaignId, contributor) => service.recordContributor(campaignId, contributor),
      derive: deriveContributionFromNetwork,
    });
    if (drain.pending > 0) console.error('contributor pending queue not fully drained:', drain.pending);
    const journal = await readJournalSummary(await journalBackend());
    for (const i of journal.intents) {
      if (i.status !== 'SUCCESS' || i.action !== 'contribute') continue;
      if (await service.hasContributed(i.campaign, i.actor)) continue;
      try {
        const confirmed = await confirmedContribution(i.hash);
        if (confirmed) await service.recordContributor(confirmed.campaignId, confirmed.contributor);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('contributor reconciliation deferred to pending queue:', i.hash, message);
        pendContribution({ hash: i.hash, lastError: message });
      }
    }
  } catch (err) {
    console.error('contributor reconciliation failed:', err instanceof Error ? err.message : err);
  }
};
void reconcileContributorRegistry();
const contributorReconcileTimer = setInterval(() => void reconcileContributorRegistry(), 30 * 60 * 1000);
contributorReconcileTimer.unref();

// Chain-history backfill (contributor-backfill.ts): recovers registry
// records from on-chain Contributed events for contributions that bypassed
// the app submit path. Bounded by the configured RPC's retention; any
// unverifiable window is flagged per campaign and surfaced on the
// reconciliation endpoint, never filled by inference. Per-campaign failures
// move nothing: the durable checkpoint only advances past fully processed
// ledger windows.
const runContributorBackfill = async (): Promise<void> => {
  let campaigns: { id: string; contractId: string }[];
  try {
    campaigns = sorobanRegisteredCampaigns();
  } catch (err) {
    console.error('contributor backfill unavailable:', err instanceof Error ? err.message : err);
    return;
  }
  const service = await communityServiceFromEnv();
  for (const c of campaigns) {
    try {
      const r = await backfillCampaignContributors({
        client: sorobanDeps.client(),
        campaignId: c.id,
        contractId: c.contractId,
        readCheckpoint: (id) => service.getContributorBackfillCheckpoint(id),
        record: (id, contributor) => service.recordContributor(id, contributor, 'backend-backfill'),
        checkpoint: (id, cp) => service.setContributorBackfillCheckpoint(id, cp),
      });
      if (r.gap) console.error('contributor backfill gap:', c.id, r.gap);
    } catch (err) {
      console.error('contributor backfill failed:', c.id, err instanceof Error ? err.message : err);
    }
  }
  // Verbatim chain-event archive (prospective, never pruned). Runs on the
  // same cadence as the contributor backfill, in its own loop over EVERY
  // registry contract (v1 campaigns plus each v2 token/offering member under
  // its own key): a contributor-registry issue can never block archiving and
  // vice versa, and deletion-history coverage needs per-contract checkpoints
  // for v2 sets too. Gaps (RPC floor passed the cursor) are logged loudly
  // and kept on the checkpoint for the reconciliation view.
  let targets: { id: string; contractId: string }[];
  try {
    targets = sorobanArchiveTargets();
  } catch (err) {
    console.error('event archive unavailable:', err instanceof Error ? err.message : err);
    return;
  }
  for (const t of targets) {
    try {
      const store = await eventArchiveBackend();
      const a = await archiveCampaignEvents({ client: sorobanDeps.client(), campaignId: t.id, contractId: t.contractId, store });
      if (a.gap) console.error('event archive gap:', t.id, a.gap);
    } catch (err) {
      console.error('event archive failed:', t.id, err instanceof Error ? err.message : err);
    }
  }
};

// Serialized entry point: a scan slower than the timer interval must never
// overlap the next tick - concurrent runs race the archive store's
// read-modify-write cycle and can lose events or advance a checkpoint past
// rows the other run lost.
let contributorBackfillInFlight = false;
const backfillContributorRegistry = async (): Promise<void> => {
  if (contributorBackfillInFlight) return;
  contributorBackfillInFlight = true;
  try {
    await runContributorBackfill();
  } finally {
    contributorBackfillInFlight = false;
  }
};
void backfillContributorRegistry();
const contributorBackfillTimer = setInterval(() => void backfillContributorRegistry(), 30 * 60 * 1000);
contributorBackfillTimer.unref();

const communityRouterReady = communityServiceFromEnv()
  .then((service) =>
    createCommunityRouter({
      service,
      requireAdmin,
      mailer: mailerFromEnv(),
      reconciliation: reconciliationPayload,
      shareRegister: shareRegisterPayload,
      fundingState: sorobanCampaignFundingState,
      applicationCampaign: async (id) => {
        const campaign = (await sorobanCampaigns()).find((c) => c.id === id);
        return campaign ? { id: campaign.id, contractId: campaign.contractId, creator: campaign.config.creator, network: NETWORK } : null;
      },
      campaignDeploy: { build: buildCampaignDeploy, submit: submitCampaignDeploy, buildV2: buildCampaignDeployV2, submitV2: submitCampaignDeployV2 },
      investorEntitlement: async (campaignId: string, publicKey: string) => {
        // On-chain failure propagates so the route fails closed (503).
        const chain = await sorobanInvestorEntitlement(campaignId, publicKey);
        // Registry failure degrades to chain-only access (narrower, never wider).
        let contributedBefore = false;
        try {
          contributedBefore = await service.hasContributed(campaignId, publicKey);
        } catch (err) {
          console.error('contributor registry read failed:', err instanceof Error ? err.message : err);
        }
        return { ...chain, contributedBefore };
      },
    }),
  )
  .catch((err) => {
    console.error('community API disabled:', err instanceof Error ? err.message : err);
    return null;
  });
const COMMUNITY_PATH =
  /^\/api\/(auth|support|issuer-applications|companies|comments|news|notifications|podcast)(\/|$)|^\/api\/campaigns\/[^/]+\/(comments|news|metadata|podcast|reports|investment-documents|share-register\.(json|csv|pdf)|corporate-actions|messages)(\/|$|\?)|^\/api\/admin\/(comments|tickets|issuer-applications|audit-log|abuse-diagnostics)(\/|$)|^\/api\/operator(\/|$)|^\/api\/investment-documents(\/|$)/;
app.use((req, res, next) => {
  if (!COMMUNITY_PATH.test(req.path)) return next();
  communityRouterReady.then((router) => {
    if (!router) {
      res.status(503).json({ error: 'Community API unavailable: community storage is not configured or failed to start' });
      return;
    }
    router(req, res, next);
  }, next);
});
app.get('/health', (_req, res) => {
  res.json({ ok: true, mode: 'soroban', network: NETWORK, productionEligible: false, deploymentIncluded: false });
});

// Display cache for the LIST route only: 30s TTL + single-flight; expired
// entries are re-read fresh and failures keep the existing 503 contract.
// Decision/operator paths (reconciliation, entitlement, invest/refund,
// discovery, community) bypass it and stay live-chain.
const campaignListCache = new CampaignListCache<unknown[]>(CAMPAIGN_LIST_CACHE_TTL_MS);
app.get('/api/campaigns', async (req, res) => {
  try {
    res.json({ campaigns: await campaignListCache.read(sorobanCampaigns, typeof req.query.actor === 'string' ? req.query.actor : undefined), mode: 'soroban' });
  } catch (err) {
    // Upstream (RPC/Horizon) failures carry raw client text such as
    // "Request failed with status code 502": log it, never show it. The
    // stable code lets the UI localize the banner.
    console.error('campaigns read failed:', err instanceof Error ? err.message : String(err));
    res.status(503).json({ error: 'campaign data is temporarily unavailable', code: 'API_UNAVAILABLE' });
  }
});
app.get('/api/account/payouts', async (req, res) => {
  try {
    const actor = typeof req.query.actor === 'string' ? req.query.actor : '';
    if (!actor) return res.status(400).json({ error: 'actor query param required' });
    // Public read of on-chain-equivalent journal fields only; no signed material.
    // Completed refunds/withdrawals ONLY - no return distributions exist in
    // this prototype and none are fabricated.
    res.json({ payouts: await accountPayouts(actor), network: NETWORK, productionEligible: false });
  } catch (err) {
    console.error('API request failed:', err);
    res.status(400).json(publicFailure(err));
  }
});
// Own-position view: the wallet's row from the same cap table the operator
// sees, for campaigns where this wallet has a SUCCESS contribute/refund in the
// journal. Public read of journal-equivalent fields (like payouts/activity);
// no signed material. INTENDED/on-chain basis and UNKNOWN are surfaced, never
// coerced to 0. No holder right, dividend or obligation is implied.
app.get('/api/account/holdings', async (req, res) => {
  try {
    const actor = typeof req.query.actor === 'string' ? req.query.actor : '';
    if (!actor) return res.status(400).json({ error: 'actor query param required' });
    const activity = await accountActivity(actor);
    const ids = [
      ...new Set(
        activity
          .filter((a: { status: string; action: string }) => a.status === 'SUCCESS' && (a.action === 'contribute' || a.action === 'refund'))
          .map((a: { campaign: string }) => a.campaign),
      ),
    ].slice(0, 20);
    const holdings = [];
    const unavailable: string[] = [];
    for (const id of ids) {
      try {
        const payload = await shareRegisterPayload(id);
        const h = payload ? holdingFromCapTable(buildCapTable(payload), actor) : null;
        if (h) holdings.push(h);
      } catch {
        unavailable.push(id);
      }
    }
    res.json({ holdings, unavailable, semantics: CORPORATE_ACTIONS_SEMANTICS, network: NETWORK, productionEligible: false });
  } catch (err) {
    console.error('API request failed:', err);
    res.status(400).json(publicFailure(err));
  }
});
app.get('/api/account/activity', async (req, res) => {
  try {
    const actor = typeof req.query.actor === 'string' ? req.query.actor : '';
    if (!actor) return res.status(400).json({ error: 'actor query param required' });
    // Public read of on-chain-equivalent fields only; no signed material.
    res.json({ activity: await accountActivity(actor), network: NETWORK, productionEligible: false });
  } catch (err) {
    console.error('API request failed:', err);
    res.status(400).json(publicFailure(err));
  }
});
// Read-only operator aid: journal-recorded SUCCESS contributions vs the
// on-chain cumulative counter per campaign. See RECONCILIATION_SEMANTICS;
// no accounting, custody or compliance claim is made or implied.
const reconciliationPayload = async () => {
  const campaigns = await sorobanCampaigns();
  // Deliberately a FULL read: this operator payload's quarantinedIntents
  // count must include envelope-corrupt rows, which only read() detects.
  // Admin-gated and human-cadence, so the envelope transfer cost is bounded.
  const store = await (await journalBackend()).read();
  const result = reconcileCampaigns(
    campaigns.map((c: { id: string; raised?: string | null }) => ({ id: c.id, raised: c.raised ?? null })),
    store.intents,
    (store.quarantined ?? []).length,
    // Durable-queue observation: an undrained backlog of confirmed-
    // contribution proofs is operator-visible here, not only in logs.
    readPending().length,
  );
  // Backfill coverage per campaign: durable cursor plus any honestly
  // flagged unverifiable window (gap). A missing entry means the backfill
  // has never completed a window for that campaign. Store failure omits
  // the field rather than blocking reconciliation.
  let contributorBackfill: Record<string, unknown> | undefined;
  try {
    contributorBackfill = await (await communityServiceFromEnv()).listContributorBackfillCheckpoints();
  } catch (err) {
    console.error('contributor backfill coverage read failed:', err instanceof Error ? err.message : err);
  }
  // Event-archive coverage per campaign: durable verbatim copy size plus the
  // archive checkpoint (gap/floor fields travel verbatim). A missing entry
  // means no archive pass has completed for that campaign. Store failure
  // omits the field rather than blocking reconciliation.
  let eventArchive: Record<string, unknown> | undefined;
  try {
    const store = await eventArchiveBackend();
    eventArchive = {};
    for (const c of campaigns) {
      eventArchive[c.id] = { events: await store.count(c.id), checkpoint: (await store.readCheckpoint(c.id)) ?? null };
    }
  } catch (err) {
    console.error('event archive coverage read failed:', err instanceof Error ? err.message : err);
    eventArchive = undefined;
  }
  return {
    generatedAt: new Date().toISOString(),
    network: NETWORK,
    semantics: RECONCILIATION_SEMANTICS,
    ...result,
    ...(contributorBackfill !== undefined ? { contributorBackfill } : {}),
    ...(eventArchive !== undefined ? { eventArchive } : {}),
  };
};

// Read-only operator export: per-campaign share register derived from the
// durable contributor registry + this app's intent journal. Wallet addresses
// are investor data - admin-gated in the router. Unknown campaign id answers
// null so the route can 404 instead of exporting an empty register that
// looks authoritative. See SHARE_REGISTER_SEMANTICS; intended amounts are
// not per-hash verified transfers.
const shareRegisterPayload = async (campaignId: string): Promise<ShareRegisterPayload | null> => {
  // Existence comes from the validated operator registry (no RPC): the v1
  // register is app-data derived, and v2 entries would never survive the v1
  // listing's crowdfund code-pin read.
  const entry = sorobanRegistryEntry(campaignId);
  if (!entry) return null;
  // Full read on purpose: share-register integrity inherits the full
  // quarantine semantics (incl. envelope corruption). Admin-gated, bounded.
  const store = await (await journalBackend()).read();
  const service = await communityServiceFromEnv();
  const contributors = await service.listContributors(campaignId);
  if (!isV2Entry(entry)) return buildShareRegister(campaignId, store.intents, contributors, NETWORK);
  // v2 contract set: query on-chain positions for every app-known address
  // (contributor registry + SUCCESS contribution/refund journal actors).
  // The token contract cannot enumerate holders, so this set is disclosed
  // as the query universe in the payload semantics. A read failure throws:
  // the route answers 503 rather than exporting a v2 register without its
  // on-chain positions.
  const holders = new Set<string>(contributors.filter((c) => c.campaignId === campaignId).map((c) => c.publicKey));
  for (const i of store.intents) {
    if (i.campaign !== campaignId || i.status !== 'SUCCESS') continue;
    if (i.action !== 'contribute' && i.action !== 'refund') continue;
    holders.add(i.actor);
  }
  const v2OnChain = await readV2SharePositions(campaignId, [...holders]);
  return buildShareRegister(campaignId, store.intents, contributors, NETWORK, v2OnChain);
};

app.get('/api/admin/reconciliation', requireAdmin, async (_req, res) => {
  try {
    res.json(await reconciliationPayload());
  } catch (err) {
    console.error('API service unavailable:', err);
    res.status(503).json(publicFailure(err));
  }
});

// Independent-backup endpoints for the chain-event archive. The snapshot is
// the off-database copy (an operator cron fetches and stores it outside the
// database host); posting a snapshot back verifies a restored (or current)
// store row-by-row. Admin-gated; never public.
app.get('/api/admin/event-archive/snapshot', requireAdmin, async (_req, res) => {
  try {
    const store = await eventArchiveBackend();
    res.type('application/x-ndjson').send(archiveSnapshotJsonl(await store.list()));
  } catch (err) {
    console.error('API service unavailable:', err);
    res.status(503).json(publicFailure(err));
  }
});

app.post('/api/admin/event-archive/snapshot/verify', requireAdmin, express.text({ limit: '25mb', type: () => true }), async (req, res) => {
  try {
    if (typeof req.body !== 'string' || req.body.length === 0) {
      res.status(400).json({ error: 'snapshot body required (JSONL text)' });
      return;
    }
    const store = await eventArchiveBackend();
    res.json(verifyArchiveSnapshot(req.body, await store.list()));
  } catch (err) {
    console.error('API service unavailable:', err);
    res.status(503).json(publicFailure(err));
  }
});

app.get('/api/legacy/campaigns', requireAdmin, async (_req, res) => {
  // Migration evidence only. Never return signed XDRs or private keys.
  const campaigns = await listCampaigns();
  res.json({
    readOnly: true,
    migrationRequired: true,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      goalUsdc: c.goalUsdc,
      investments: c.investments.map((i) => ({
        id: i.id,
        investorPub: i.investorPub,
        amountUsdc: i.amountUsdc,
        status: i.status,
        usdcTx: i.usdcTx,
        tokenTx: i.tokenTx,
        refundTx: i.refundTx,
        error: i.error,
      })),
    })),
  });
});
app.use(sorobanBuildLimiter());
app.use(sorobanSubmitLimiter());
app.post('/api/campaigns/:id/soroban/build', async (req, res) => {
  try {
    res.json(await buildSoroban(String(req.params.id), req.body ?? {}));
  } catch (err) {
    console.error('Soroban preparation failed:', err);
    res.status(400).json(publicFailure(err));
  }
});
app.post('/api/campaigns/:id/soroban/submit', async (req, res) => {
  try {
    const out = await submitSoroban(String(req.params.id), req.body ?? {});
    await recordConfirmedContributor((out as { hash?: string }).hash);
    res.json(out);
  } catch (err) {
    console.error('API request failed:', err);
    res.status(400).json(publicFailure(err));
  }
});
app.post('/api/soroban/recover', async (req, res) => {
  // Re-register an exact signed envelope lost with the journal. Read-only
  // against the network: looks up the hash, never submits.
  try {
    res.json(await recoverSoroban(req.body ?? {}));
  } catch (err) {
    console.error('API request failed:', err);
    res.status(400).json(publicFailure(err));
  }
});
app.get('/api/soroban/transactions/:hash', async (req, res) => {
  try {
    const out = await statusSoroban(String(req.params.hash));
    await recordConfirmedContributor(String(req.params.hash));
    res.json(out);
  } catch (err) {
    console.error('API request failed:', err);
    res.status(400).json(publicFailure(err));
  }
});
// All old money-moving and wallet submission routes are disabled. Existing
// classic state is never converted, cleared or resubmitted by the new server.
app.post('/api/{*path}', (_req, res) => {
  res
    .status(410)
    .json({ error: 'Classic campaign writes disabled. Soroban is the active flow. Legacy state requires a separately reviewed migration/reconciliation.' });
});

export { app };
if (process.env.NODE_ENV !== 'test' && !process.env.EMBEDDED_HOST) {
  app.listen(PORT, process.env.HOST ?? '127.0.0.1', () => console.log(`Soroban test-only API at http://127.0.0.1:${PORT}`));
}
