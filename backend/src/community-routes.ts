import { createHash } from 'node:crypto';
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
  authenticateWithSession,
} from './accounts.js';
import { CommunityError, CommunityService, communityStoreFromEnv, requireCampaignId } from './community.js';
import { metadataFor } from './campaign-metadata.js';
import type { Account } from './community-store.js';
import { shareRegisterCsv, type ShareRegisterPayload } from './share-register.js';
import { buildShareRegisterPdf } from './share-register-pdf.js';
import { buildCapTable, buildDistributionPreview } from './corporate-actions.js';
import { turnstileConfigFromEnv, verifyTurnstileToken } from './turnstile.js';
import { ipReputationFromEnv, type IpReputation } from './ip-reputation.js';
import {
  DEFAULT_MAIL_BUDGET_PER_DAY,
  DEFAULT_MAIL_BUDGET_PER_HOUR,
  loginEmail,
  registerEmail,
  resendVerification,
  verifyEmailToken,
  requestPasswordReset,
  confirmPasswordReset,
  mailBudgetStatus,
  sendBudgetedMail,
} from './email-auth.js';
import { MAIL_LOCALES, resetEmail, verificationEmail } from './email-templates.js';
import {
  completeSocialFlow,
  confirmSocialEmail,
  newBindSecret,
  isSocialProvider,
  requestSocialEmail,
  requireSocialLinkStepUp,
  SOCIAL_PROVIDERS,
  socialConfigFromEnv,
  startSocialFlow,
} from './social-auth.js';
import { defaultFarcasterVerifier, farcasterDomain, issueFarcasterNonce, verifyFarcasterSignIn, type FarcasterVerifier } from './farcaster-auth.js';
import { allowedRecipientsFromEnv, type Mailer } from './mailer.js';
import { MailerError } from './mailer.js';

// Express wiring for accounts, community, support and metadata APIs.
// The admin gate is injected from server.ts so there is exactly one admin
// check implementation.

export type CommunityRouterDeps = {
  service: CommunityService;
  // Abuse-defense overrides for tests; production wires both from env.
  ipReputation?: IpReputation;
  // OAuth provider HTTP override for tests; production uses global fetch.
  socialFetch?: typeof fetch;
  requireAdmin: express.RequestHandler;
  // Read-only operator reconciliation payload provider (wired in server.ts
  // from the campaign registry + intent journal). Optional so route tests
  // without chain access stay hermetic; absent means 503, never a guess.
  reconciliation?: () => Promise<unknown>;
  // Post-funding report gate: on-chain funding state for one campaign id
  // (wired in server.ts from the Soroban registry views). Optional so route
  // tests without chain access stay hermetic; absent means the publish route
  // answers 503, never an operator-declared lifecycle guess.
  fundingState?: (campaignId: string) => Promise<{ id: string; goal: string; raised: string; deadlineSeconds: number; withdrawn: boolean } | null>;
  // Campaign deployment preparation (wired in server.ts from soroban.ts):
  // builds/submits the unsigned-then-wallet-signed deployment transaction
  // for the reviewed crowdfund contract. Optional so route tests without
  // chain access stay hermetic; absent means the routes answer 503 - a
  // deployment can never be faked by an unwired provider.
  campaignDeploy?: {
    build: (input: { actor: string; id: string; name: string; goal: string; deadline: number }) => Promise<unknown>;
    submit: (input: { actor: string; xdr: string; name?: string }) => Promise<unknown>;
    // v2 contract set (share-token + offering, wired); absent answers 503 on
    // contractSet:'v2' - an unwired v2 path can never fake a deployment.
    buildV2?: (input: {
      actor: string;
      id: string;
      name: string;
      goal: string;
      deadline: number;
      v2: { symbol: string; decimals: number; minPerInvestor: string; maxPerInvestor: string };
    }) => Promise<unknown>;
    submitV2?: (input: { actor: string; xdr: string; name?: string }) => Promise<unknown>;
  };
  // Report READ entitlement: on-chain contribution balance for the signed-in
  // wallet (wired in server.ts from the Soroban registry). Optional so route
  // tests without chain access stay hermetic; absent means report reads
  // answer 503 - reports are investor-scoped, never public, so a missing or
  // failed entitlement check fails closed instead of opening access.
  // contributedBefore grounds access for REFUNDED investors: the contract
  // removes the balance entry on refund, so current balance alone would
  // silently revoke access from people who did invest.
  investorEntitlement?: (campaignId: string, publicKey: string) => Promise<{ registered: boolean; balanceUnits: bigint; contributedBefore: boolean }>;
  // Share-register export provider (wired in server.ts from the campaign
  // registry + intent journal + durable contributor registry). Optional so
  // route tests without chain access stay hermetic; absent means 503, never
  // a guess. null means the campaign id is unknown (404).
  shareRegister?: (campaignId: string) => Promise<ShareRegisterPayload | null>;
  // Outbound email for account verification (mailer.ts). Absent means the
  // email registration routes answer 503 - fail closed, never pretend-sent.
  mailer?: Mailer | null;
  // Test seam: Farcaster SIWF verification (defaults to @farcaster/auth-client).
  farcasterVerifier?: FarcasterVerifier;
};

function clientIp(req: express.Request): string | undefined {
  // TRUST_PROXY_DEPTH=N: the N rightmost XFF entries are trusted proxy
  // appends, so the client is chain[length - N]. The depth must come from a
  // MEASURED chain on the deployed environment (XFF_DEBUG=1 window), never
  // from assumption - the legacy TRUST_PROXY=1 mode below trusts the leftmost
  // entry, which a client can spoof. When the received chain is shorter than
  // the assumed depth the topology guess is wrong: fall back to the socket
  // address (coarse but unspoofable) rather than to a spoofable entry.
  // Used for rate limiting and abuse-defense checks, never persisted.
  const fwd = req.header('x-forwarded-for');
  const depthRaw = process.env.TRUST_PROXY_DEPTH ?? '';
  const depth = Number(depthRaw);
  if (depthRaw !== '' && Number.isInteger(depth) && depth >= 1) {
    if (!fwd) return req.socket.remoteAddress ?? undefined;
    const chain = fwd
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (process.env.XFF_DEBUG === '1') {
      // Short-lived measurement windows only: logs the full received chain.
      console.info('[xff-debug]', JSON.stringify({ chain, socket: req.socket.remoteAddress }));
    }
    if (chain.length >= depth) return chain[chain.length - depth];
    return req.socket.remoteAddress ?? undefined;
  }
  // Legacy mode, kept for unchanged deployments: leftmost XFF is trusted
  // when TRUST_PROXY=1. Known-spoofable; migrate to TRUST_PROXY_DEPTH.
  if (process.env.TRUST_PROXY === '1' && fwd) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress ?? undefined;
}

// Coarse address CLASS for the redacted xff-probe diagnostic - never returns
// the address itself. v4 only in practice behind Render; anything else is
// 'other'.
function ipClass(ip: string): string {
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') ? 'private' : 'other';
  const a = Number(v4[1]);
  const b = Number(v4[2]);
  if (a === 127 || a === 0) return 'loopback';
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return 'private';
  if (a === 169 && b === 254) return 'link-local';
  if ((a === 192 && b === 0 && Number(v4[3]) === 2) || (a === 198 && b === 51 && Number(v4[3]) === 100) || (a === 203 && b === 0 && Number(v4[3]) === 113))
    return 'reserved-docs';
  if ((a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)) || a >= 224) return 'reserved';
  return 'public';
}

function sendError(res: express.Response, err: unknown): void {
  if (err instanceof AuthError || err instanceof CommunityError || err instanceof MailerError) {
    res.status(err.status).json(err.code ? { error: err.message, code: err.code } : { error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'invalid input: ' + err.issues.map((i) => i.message).join('; '),
      code: 'invalid_input',
    });
    return;
  }
  res.status(500).json({ error: 'internal error', code: 'internal_error' });
}

export function createCommunityRouter(deps: CommunityRouterDeps): express.Router {
  const { service, requireAdmin, reconciliation, fundingState, investorEntitlement, mailer, campaignDeploy } = deps;
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
  // Email + password registration (email-auth.ts), alongside the wallet
  // challenge flow. Every route fails closed when no mailer is configured.
  // Global outbound-mail budget (rolling hour); env override for tests/ops.
  const mailBudgetPerHour = (): number => {
    const raw = Number(process.env.COMMUNITY_EMAIL_MAX_SENDS_PER_HOUR ?? '');
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : DEFAULT_MAIL_BUDGET_PER_HOUR;
  };
  const mailBudgetPerDay = (): number => {
    const raw = Number(process.env.COMMUNITY_EMAIL_MAX_SENDS_PER_DAY ?? '');
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : DEFAULT_MAIL_BUDGET_PER_DAY;
  };
  const requireMailer = (): Mailer => {
    if (!mailer) throw new CommunityError(503, 'email provider not configured on this deployment', 'email_provider_unconfigured');
    return mailer;
  };

  // Abuse defense for the mail-triggering routes. Turnstile (when
  // configured) fails CLOSED; IP reputation is shadow-mode by default and
  // only denies on recent-abuse evidence when IPREP_ENFORCE=1. Turnstile
  // runs before the reputation lookup so token-less bots never consume the
  // reputation provider's daily quota.
  const turnstile = turnstileConfigFromEnv();
  const reputation = deps.ipReputation ?? ipReputationFromEnv(process.env, (message, code) => new CommunityError(403, message, code));
  const abuseGate = async (req: express.Request): Promise<void> => {
    if (turnstile) {
      const result = await verifyTurnstileToken(turnstile, req.body?.turnstileToken ?? req.query?.turnstileToken, clientIp(req));
      if (!result.ok) {
        if (result.reason === 'verify-unavailable') throw new CommunityError(503, 'bot-check service unavailable; retry later', 'turnstile_unavailable');
        throw new CommunityError(403, 'bot check failed; reload the page and retry', 'turnstile_failed');
      }
    }
    const ip = clientIp(req);
    if (ip) await reputation.check(ip);
  };
  // Public abuse-defense config for the frontend: the Turnstile SITE key is a
  // public value by design; the secret never leaves the backend.
  router.get('/api/auth/abuse-config', (_req, res) => {
    res.json({
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY?.trim() || null,
      // Providers with full per-env credentials; the frontend renders a
      // sign-in button only for these. IDs/secrets never leave this object.
      socialProviders: [
        ...SOCIAL_PROVIDERS.filter((p) => socialConfigFromEnv(process.env, p) !== null),
        ...(farcasterDomain(process.env) ? ['farcaster'] : []),
      ],
    });
  });

  // Social (OAuth/OIDC) sign-in: /start behind the same abuseGate as the
  // email routes (top-level navigation, so the Turnstile token arrives as a
  // query param the frontend attaches after running the widget), /callback
  // unauthenticated by nature - state+nonce+PKCE, validated by
  // openid-client, are the flow's protection (social-auth.ts header).
  // Results 302 back to the SPA with the outcome in the FRAGMENT so tokens
  // and error codes never touch URL access logs.
  const socialRedirectUri = (req: express.Request, provider: string): string =>
    (process.env[`SOCIAL_${provider.toUpperCase()}_REDIRECT_URI`] ?? '').trim() || `https://${req.get('host')}/api/auth/social/${provider}/callback`;
  // Link flow: attach a provider identity to the currently authenticated
  // account. Completion reuses the SAME registered callback URL below (no
  // provider console change); the flow's linkTo marker makes the outcome a
  // binding, never a session.
  router.post('/api/auth/social/:provider/link/start', async (req, res) => {
    try {
      const provider = req.params.provider;
      if (!isSocialProvider(provider)) throw new CommunityError(404, 'not found', 'not_found');
      const cfg = socialConfigFromEnv(process.env, provider);
      if (!cfg) throw new CommunityError(404, 'not found', 'not_found');
      await abuseGate(req);
      const { account, sessionCreatedAt } = await authenticateWithSession(store, req.header('authorization'));
      await requireSocialLinkStepUp(store, account, sessionCreatedAt, req.body ?? {});
      const { url } = await startSocialFlow(store, provider, cfg, socialRedirectUri(req, provider), Date.now(), deps.socialFetch, account.publicKey);
      // JSON, not a 302: the SPA navigates after collecting the step-up
      // proof, so the provider URL is data here.
      res.json({ url });
    } catch (err) {
      sendError(res, err);
    }
  });
  let farcasterVerifierCache: FarcasterVerifier | undefined;
  const BIND_COOKIE = 'bl_sso';
  const readBind = (req: express.Request): string | undefined => /(?:^|;\s*)bl_sso=([0-9a-f]{48})(?:;|$)/.exec(req.headers.cookie ?? '')?.[1];
  router.get('/api/auth/social/:provider/start', async (req, res) => {
    try {
      const provider = req.params.provider;
      if (!isSocialProvider(provider)) throw new CommunityError(404, 'not found', 'not_found');
      const cfg = socialConfigFromEnv(process.env, provider);
      if (!cfg) throw new CommunityError(404, 'not found', 'not_found');
      await abuseGate(req);
      const bind = newBindSecret();
      const { url } = await startSocialFlow(store, provider, cfg, socialRedirectUri(req, provider), Date.now(), deps.socialFetch, undefined, bind.hash);
      res.setHeader(
        'Set-Cookie',
        `${BIND_COOKIE}=${bind.secret}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=900${req.secure || req.get('x-forwarded-proto') === 'https' ? '; Secure' : ''}`,
      );
      res.redirect(302, url);
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/farcaster/nonce', async (req, res) => {
    try {
      const domain = farcasterDomain(process.env);
      if (!domain) throw new CommunityError(404, 'not found', 'not_found');
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`farcaster-nonce-ip:${ip}`, 30, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      await abuseGate(req);
      const bind = newBindSecret();
      const { nonce } = await issueFarcasterNonce(store, bind.hash);
      res.setHeader(
        'Set-Cookie',
        `${BIND_COOKIE}=${bind.secret}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=900${req.secure || req.get('x-forwarded-proto') === 'https' ? '; Secure' : ''}`,
      );
      res.json({ nonce, domain, siweUri: `https://${domain}/account` });
    } catch (err) {
      sendError(res, err);
    }
  });
  // Authenticated LINK of a fid to the signed-in account. Same step-up proof
  // as every other provider link (own credential, fresh). The nonce carries
  // linkTo server-side, so /verify binds the fid to THAT account and issues
  // no session; a fid already owned by another account is refused (409), an
  // email is never used to match accounts, nothing is reassigned.
  router.post('/api/auth/farcaster/link/nonce', async (req, res) => {
    try {
      const domain = farcasterDomain(process.env);
      if (!domain) throw new CommunityError(404, 'not found', 'not_found');
      await abuseGate(req);
      const { account, sessionCreatedAt } = await authenticateWithSession(store, req.header('authorization'));
      await requireSocialLinkStepUp(store, account, sessionCreatedAt, req.body ?? {});
      const bind = newBindSecret();
      const { nonce } = await issueFarcasterNonce(store, bind.hash, Date.now(), account.publicKey);
      res.setHeader(
        'Set-Cookie',
        `${BIND_COOKIE}=${bind.secret}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=900${req.secure || req.get('x-forwarded-proto') === 'https' ? '; Secure' : ''}`,
      );
      res.json({ nonce, domain, siweUri: `https://${domain}/account` });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/farcaster/verify', async (req, res) => {
    try {
      if (!farcasterDomain(process.env)) throw new CommunityError(404, 'not found', 'not_found');
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`farcaster-verify-ip:${ip}`, 30, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      const verifier = deps.farcasterVerifier ?? (farcasterVerifierCache ??= defaultFarcasterVerifier(process.env));
      const r = await verifyFarcasterSignIn(store, process.env, verifier, {
        nonce: req.body?.nonce,
        message: req.body?.message,
        signature: req.body?.signature,
        bind: readBind(req),
      });
      if (r.kind === 'session') res.json({ token: r.token, expiresAt: r.expiresAt, account: publicAccount(r.account) });
      else if (r.kind === 'totp') res.json({ totpTicket: r.ticket, expiresAt: r.expiresAt });
      else if (r.kind === 'email') res.json({ socialEmailTicket: r.ticket, expiresAt: r.expiresAt });
      else res.json({ status: 'linked' });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/social/email/request', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`social-email-ip:${ip}`, 10, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      await abuseGate(req);
      res.json(
        await requestSocialEmail(
          store,
          requireMailer(),
          process.env,
          { ticket: req.body?.ticket, email: req.body?.email, bind: readBind(req) },
          Date.now(),
          mailBudgetPerHour(),
          mailBudgetPerDay(),
        ),
      );
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/social/email/confirm', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`social-email-confirm-ip:${ip}`, 30, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      const r = await confirmSocialEmail(store, { ticket: req.body?.ticket, code: req.body?.code, bind: readBind(req) });
      if (r.kind === 'session') res.json({ token: r.token, expiresAt: r.expiresAt, account: publicAccount(r.account) });
      else if (r.kind === 'totp') res.json({ totpTicket: r.ticket, expiresAt: r.expiresAt });
      else res.json({ status: 'pending' });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.get('/api/auth/social/:provider/callback', async (req, res) => {
    const fail = (code: string) => res.redirect(302, `/account#social-error=${code}`);
    try {
      const provider = req.params.provider;
      if (!isSocialProvider(provider)) throw new CommunityError(404, 'not found', 'not_found');
      const cfg = socialConfigFromEnv(process.env, provider);
      if (!cfg) throw new CommunityError(404, 'not found', 'not_found');
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`social-callback-ip:${ip}`, 30, 60 * 60 * 1000)) {
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      }
      if (typeof req.query.error === 'string') return fail('social_provider_denied');
      const currentUrl = `https://${req.get('host')}${req.originalUrl}`;
      const result = await completeSocialFlow(store, process.env, provider, cfg, currentUrl, req.query.state, Date.now(), deps.socialFetch, readBind(req));
      if (result.kind === 'email') return res.redirect(302, `/account#social-email=${result.ticket}`);
      if (result.kind === 'totp') return res.redirect(302, `/account#social-totp=${result.ticket}`);
      if (result.kind === 'linked') return res.redirect(302, `/account#social-linked=${provider}`);
      return res.redirect(302, `/account#social-token=${result.token}`);
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      const status = (err as { status?: number } | null)?.status;
      // Flow outcomes redirect to the SPA fragment; a disabled/unknown
      // provider stays a plain 404 (fail-closed, no SPA signal).
      if (code && status !== 404 && (err instanceof AuthError || err instanceof CommunityError)) return fail(code);
      sendError(res, err);
    }
  });
  // Admin-gated abuse-defense observability for the controlled verification
  // window. Aggregate counters only - no IPs, tokens or emails leave these
  // endpoints. The self-check exercises the DEPLOYED reputation client and
  // counter path against a fixed RFC 5737 TEST-NET-3 address (reserved for
  // documentation, never a visitor or caller-supplied address, one cached
  // lookup). It proves provider WIRING only: the verdict on a reserved
  // address is not calibration data for enforcement thresholds.
  const SELF_CHECK_IP = '203.0.113.1';
  router.get('/api/admin/abuse-diagnostics', requireAdmin, (_req, res) => {
    res.json({
      turnstile: turnstile ? 'configured' : 'disabled',
      ipReputation: { enforce: process.env.IPREP_ENFORCE === '1', ...reputation.stats() },
    });
  });
  router.post('/api/admin/abuse-diagnostics/reputation-self-check', requireAdmin, async (_req, res) => {
    try {
      const probeVerdict = await reputation.check(SELF_CHECK_IP);
      res.json({ probeVerdict, stats: reputation.stats() });
    } catch (err) {
      sendError(res, err);
    }
  });
  // Measured client-IP chain observation WITHOUT changing trust behavior and
  // WITHOUT retaining raw addresses: returns only the chain length and the
  // address CLASS of each entry (loopback/private/reserved/public), the
  // socket peer class, the active trust mode, and which class clientIp
  // resolved to. Used with controlled forged-XFF requests to derive the
  // deployed ingress structure before any TRUST_PROXY* setting exists.
  // Controlled multilingual delivery proof. TEST-ONLY tooling, OFF by
  // default: requires MAIL_TEMPLATE_CHECK_ENABLE=1, set only for an approved
  // verification window and removed after (a follow-up removes this endpoint
  // once the window closes). The batch is FIXED, not caller-shaped: every
  // MAIL_LOCALES locale x both template kinds (22 mails max) to the
  // deployment's sole allowlisted recipient, rendered by the REAL localized
  // templates and sent through the REAL configured mailer chain (allowlist
  // -> provider) with dead synthetic tokens. Sends CONSUME the same
  // persisted global mail budget/backoff as user-facing auth mail
  // (sendBudgetedMail): remaining budget is checked up front and the batch
  // stops at the first provider throttle or budget refusal with a partial
  // report - never a blind retry. No account, credential, cooldown or token
  // state is touched: this exercises renderer + sender chain, NOT account
  // routing. Per-item results distinguish provider acceptance from failure.
  router.post('/api/admin/abuse-diagnostics/mail-template-check', requireAdmin, async (_req, res) => {
    try {
      if (process.env.MAIL_TEMPLATE_CHECK_ENABLE !== '1') throw new CommunityError(404, 'not found', 'not_found');
      const m = requireMailer();
      const allowed = allowedRecipientsFromEnv(process.env);
      if (!allowed || allowed.size !== 1) {
        throw new CommunityError(400, 'requires exactly one allowed recipient on this deployment', 'email_recipient_restricted');
      }
      const to = [...allowed][0];
      const batch: { locale: (typeof MAIL_LOCALES)[number]; kind: 'verify' | 'reset' }[] = [];
      for (const locale of MAIL_LOCALES) for (const kind of ['verify', 'reset'] as const) batch.push({ locale, kind });
      const budgetAt = async () => mailBudgetStatus(await store.read(), Date.now(), mailBudgetPerHour(), mailBudgetPerDay());
      const before = await budgetAt();
      if (before.providerMutedUntil || Math.min(before.hourRemaining, before.dayRemaining) < batch.length) {
        res.json({ sent: 0, failed: 0, refused: true, reason: 'insufficient remaining mail budget or provider muted', budget: { before }, results: [] });
        return;
      }
      const results: { locale: string; kind: string; ok: boolean; error?: string }[] = [];
      let stopped: string | null = null;
      for (const { locale, kind } of batch) {
        const token = `blr_SELFTEST_${kind}_${locale}_dead`;
        const mail = kind === 'verify' ? verificationEmail(locale, to, token) : resetEmail(locale, to, token);
        try {
          await sendBudgetedMail(
            store,
            m,
            { to, subject: `[${kind}:${locale}] ` + mail.subject, text: mail.text },
            Date.now(),
            mailBudgetPerHour(),
            mailBudgetPerDay(),
          );
          results.push({ locale, kind, ok: true });
        } catch (err) {
          const code = (err as { code?: string } | null)?.code;
          results.push({ locale, kind, ok: false, error: err instanceof Error ? err.message : 'unknown' });
          if (code === 'email_provider_throttled' || code === 'email_budget_exceeded') {
            stopped = code;
            break;
          }
        }
      }
      res.json({
        sent: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        stopped,
        budget: { before, after: await budgetAt() },
        results,
      });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.get('/api/admin/abuse-diagnostics/xff-probe', requireAdmin, (req, res) => {
    const fwd = req.header('x-forwarded-for');
    const chain = fwd
      ? fwd
          .split(',')
          .map((s2) => s2.trim())
          .filter(Boolean)
      : [];
    const depthRaw = process.env.TRUST_PROXY_DEPTH ?? '';
    const trustMode =
      depthRaw !== '' && Number.isInteger(Number(depthRaw)) && Number(depthRaw) >= 1 ? 'depth' : process.env.TRUST_PROXY === '1' ? 'legacy' : 'none';
    const resolved = clientIp(req);
    // Transient equality proof without raw-IP disclosure: the caller passes
    // x-xff-expect-sha256: <sha256-hex of a candidate address> (a HEADER, not
    // a query parameter, so the pseudonymous hash is not retained in URL
    // access logs) and learns only WHICH positions (if any) hold that
    // address - never any address itself. Used to bind the measured chain to
    // an independently known controlled egress. Probe endpoints are removed
    // once the verification window closes.
    const expectHeader = req.header('x-xff-expect-sha256');
    const expect = expectHeader && /^[0-9a-f]{64}$/.test(expectHeader) ? expectHeader : null;
    const matches = (ip: string) => expect !== null && createHash('sha256').update(ip).digest('hex') === expect;
    res.json({
      chainLength: chain.length,
      chainClasses: chain.map(ipClass),
      socketPeerClass: req.socket.remoteAddress ? ipClass(req.socket.remoteAddress) : null,
      trustMode,
      clientIpClass: resolved ? ipClass(resolved) : null,
      // True when the resolved client IP is steerable by the leftmost XFF
      // entry (spoofable) under the CURRENT trust settings.
      leftmostSteersClient: trustMode === 'legacy' && chain.length > 0 && resolved === chain[0],
      ...(expect !== null
        ? {
            matchedPositions: chain.flatMap((entry, i) => (matches(entry) ? [i] : [])),
            socketMatch: req.socket.remoteAddress ? matches(req.socket.remoteAddress) : false,
            resolvedMatch: resolved ? matches(resolved) : false,
          }
        : {}),
    });
  });
  router.post('/api/auth/email/register', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`email-register-ip:${ip}`, 10, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      await abuseGate(req);
      res.json(
        await registerEmail(
          store,
          requireMailer(),
          { email: req.body?.email, password: req.body?.password, locale: req.body?.locale },
          Date.now(),
          mailBudgetPerHour(),
          mailBudgetPerDay(),
        ),
      );
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/email/resend', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`email-resend-ip:${ip}`, 10, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      await abuseGate(req);
      res.json(
        await resendVerification(
          store,
          requireMailer(),
          { email: req.body?.email, locale: req.body?.locale },
          Date.now(),
          mailBudgetPerHour(),
          mailBudgetPerDay(),
        ),
      );
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/email/reset-request', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`email-reset-request-ip:${ip}`, 10, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      await abuseGate(req);
      res.json(
        await requestPasswordReset(
          store,
          requireMailer(),
          { email: req.body?.email, locale: req.body?.locale },
          Date.now(),
          mailBudgetPerHour(),
          mailBudgetPerDay(),
        ),
      );
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/email/reset-confirm', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`email-reset-confirm-ip:${ip}`, 30, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      res.json(await confirmPasswordReset(store, { email: req.body?.email, token: req.body?.token, password: req.body?.password }));
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/email/verify', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`email-verify-ip:${ip}`, 30, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      const result = await verifyEmailToken(store, { email: req.body?.email, token: req.body?.token });
      res.json({ token: result.token, expiresAt: result.expiresAt, account: publicAccount(result.account) });
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/email/login', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`email-login-ip:${ip}`, 30, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      const result = await loginEmail(store, { email: req.body?.email, password: req.body?.password });
      if ('requiresTotp' in result) {
        // Second factor owed: one-purpose ticket, no session (same shape as
        // the wallet flow's gated sign-in).
        res.json({ requiresTotp: true, ticket: result.ticket, expiresAt: result.expiresAt, account: publicAccount(result.account) });
        return;
      }
      res.json({ token: result.token, expiresAt: result.expiresAt, account: publicAccount(result.account) });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/api/auth/challenge', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`challenge-ip:${ip}`, 30, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
      res.json(await createChallenge(store, String(req.body?.publicKey ?? '')));
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/auth/verify', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (ip && !service.limiter.allow(`verify-ip:${ip}`, 60, 60 * 60 * 1000))
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
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
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
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
        throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
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
    if (!process.env.APPROPRIATENESS_COLLECT)
      return new CommunityError(503, 'appropriateness collection is disabled on this deployment (held)', 'feature_unavailable');
    const allowed = (process.env.APPROPRIATENESS_ALLOWLIST ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (!allowed.includes(account.publicKey))
      return new CommunityError(403, 'appropriateness collection is limited to designated QA accounts', 'feature_restricted');
    return null;
  };
  const appropriatenessHeld: express.RequestHandler = (req, res, next) => {
    if (!process.env.APPROPRIATENESS_COLLECT) {
      res.status(503).json({ error: 'appropriateness collection is disabled on this deployment (held)', code: 'feature_unavailable' });
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

  // ECSPR Annex II Section II request template (CAPTURE-ONLY: no approval
  // path on this deployment; a captured request never upgrades treatment).
  router.post('/api/auth/appropriateness/sophistication-request', appropriatenessHeld, async (req, res) => {
    try {
      const account = await authenticate(store, req.header('authorization'));
      const denied = appropriatenessGate(account);
      if (denied) throw denied;
      service.checkRate(`appr-soph:${account.publicKey}`, 10, 60 * 60 * 1000);
      res.json({ record: await service.requestSophistication(account, req.body) });
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

  // --- Share-register export (operator) ---
  // Admin-gated read-only export derived from the durable contributor
  // registry + intent journal. Wallet addresses are investor data, so the
  // register is never public. Absent provider (hermetic tests, unconfigured
  // chain) answers 503, never a guess; unknown campaign answers 404.
  // Semantics and limits are carried in the payload itself.
  router.get('/api/campaigns/:id/share-register.json', requireAdmin, async (req, res) => {
    if (!deps.shareRegister) {
      res.status(503).json({ error: 'share register unavailable: provider not configured', code: 'feature_unavailable' });
      return;
    }
    try {
      const payload = await deps.shareRegister(requireCampaignId(req.params.id));
      if (!payload) {
        res.status(404).json({ error: 'unknown campaign', code: 'campaign_not_found' });
        return;
      }
      res.json(payload);
    } catch (err) {
      sendError(res, err);
    }
  });
  router.get('/api/campaigns/:id/share-register.csv', requireAdmin, async (req, res) => {
    if (!deps.shareRegister) {
      res.status(503).json({ error: 'share register unavailable: provider not configured', code: 'feature_unavailable' });
      return;
    }
    try {
      const payload = await deps.shareRegister(requireCampaignId(req.params.id));
      if (!payload) {
        res.status(404).json({ error: 'unknown campaign', code: 'campaign_not_found' });
        return;
      }
      res.type('text/csv').send(shareRegisterCsv(payload));
    } catch (err) {
      sendError(res, err);
    }
  });
  router.get('/api/campaigns/:id/share-register.pdf', requireAdmin, async (req, res) => {
    if (!deps.shareRegister) {
      res.status(503).json({ error: 'share register unavailable: provider not configured', code: 'feature_unavailable' });
      return;
    }
    try {
      const payload = await deps.shareRegister(requireCampaignId(req.params.id));
      if (!payload) {
        res.status(404).json({ error: 'unknown campaign', code: 'campaign_not_found' });
        return;
      }
      const pdf = await buildShareRegisterPdf(payload);
      res.type('application/pdf').send(pdf);
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Corporate actions prototype (operator, read-only, off-chain) ---
  // Cap table and a distribution PREVIEW derived from the share register. No
  // funds move, nothing is persisted, no holder right is created. Admin-gated
  // like the register (wallet addresses are investor data).
  router.get('/api/campaigns/:id/corporate-actions/cap-table.json', requireAdmin, async (req, res) => {
    if (!deps.shareRegister) {
      res.status(503).json({ error: 'share register unavailable: provider not configured' });
      return;
    }
    try {
      const payload = await deps.shareRegister(requireCampaignId(req.params.id));
      if (!payload) {
        res.status(404).json({ error: 'unknown campaign' });
        return;
      }
      res.json(buildCapTable(payload));
    } catch (err) {
      sendError(res, err);
    }
  });
  router.post('/api/campaigns/:id/corporate-actions/distribution-preview', requireAdmin, async (req, res) => {
    if (!deps.shareRegister) {
      res.status(503).json({ error: 'share register unavailable: provider not configured' });
      return;
    }
    try {
      const total = (req.body as { total?: unknown } | undefined)?.total;
      if (typeof total !== 'string' || total.length > 40) {
        res.status(400).json({ error: 'total must be a decimal string' });
        return;
      }
      const payload = await deps.shareRegister(requireCampaignId(req.params.id));
      if (!payload) {
        res.status(404).json({ error: 'unknown campaign' });
        return;
      }
      try {
        res.json(buildDistributionPreview(buildCapTable(payload), total));
      } catch (e) {
        res.status(400).json({ error: e instanceof Error ? e.message : 'invalid total' });
      }
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Post-funding reports ---
  // Investor-scoped reads: report content (titles included) goes only to
  // wallets with an on-chain contribution balance in that campaign, plus
  // designated operators for moderation/ops. Unauthenticated or
  // non-investor requests never receive report content; when the on-chain
  // entitlement cannot be established the read fails closed (503), it never
  // falls back to public access. Distinct from the news feed (public) and
  // from per-account notifications.
  router.get(
    '/api/campaigns/:id/reports',
    authed(async (req, res, account) => {
      const campaignId = requireCampaignId(req.params.id);
      if (!investorEntitlement) {
        res.status(503).json({ error: 'investor entitlement verification is not configured; report access disabled', code: 'feature_unavailable' });
        return;
      }
      let entitlement: { registered: boolean; balanceUnits: bigint; contributedBefore: boolean };
      try {
        entitlement = await investorEntitlement(campaignId, account.publicKey);
      } catch (err) {
        console.error('on-chain verification failed', err instanceof Error ? err.message : String(err));
        res.status(503).json({
          error: 'could not verify on-chain investor entitlement; refusing report access',
          code: 'verification_unavailable',
        });
        return;
      }
      if (!entitlement.registered) {
        res.status(404).json({ error: 'unknown campaign', code: 'campaign_not_found' });
        return;
      }
      const wallets = operatorWallets();
      const isOperator = wallets.length > 0 && wallets.includes(account.publicKey);
      if (!isOperator && entitlement.balanceUnits <= 0n && !entitlement.contributedBefore) {
        res.status(403).json({ error: 'post-funding reports are available to investors in this campaign', code: 'investor_only' });
        return;
      }
      res.json({ reports: await service.listReports(campaignId) });
    }),
  );
  // --- Investment documents (investor-entitled delivery) ---
  // Read gating mirrors post-funding reports exactly: authenticated wallet,
  // on-chain/registry entitlement (fail closed 503 when unverifiable),
  // investors and designated operators only. Unapproved (pending) documents
  // are invisible to investors and never downloadable - only after an
  // explicit demo-grade operator approval.
  const investmentDocEntitlement = async (req: express.Request, res: express.Response, account: Account, campaignId: string): Promise<boolean> => {
    if (!investorEntitlement) {
      res.status(503).json({ error: 'investor entitlement verification is not configured; investment documents disabled', code: 'feature_unavailable' });
      return false;
    }
    let entitlement: { registered: boolean; balanceUnits: bigint; contributedBefore: boolean };
    try {
      entitlement = await investorEntitlement(campaignId, account.publicKey);
    } catch (err) {
      console.error('on-chain verification failed', err instanceof Error ? err.message : String(err));
      res.status(503).json({
        error: 'could not verify on-chain investor entitlement; refusing investment document access',
        code: 'verification_unavailable',
      });
      return false;
    }
    if (!entitlement.registered) {
      res.status(404).json({ error: 'unknown campaign', code: 'campaign_not_found' });
      return false;
    }
    const wallets = operatorWallets();
    const isOperator = wallets.length > 0 && wallets.includes(account.publicKey);
    if (!isOperator && entitlement.balanceUnits <= 0n && !entitlement.contributedBefore) {
      res.status(403).json({ error: 'investment documents are available to investors in this campaign', code: 'investor_only' });
      return false;
    }
    return true;
  };

  router.get(
    '/api/campaigns/:id/investment-documents',
    authed(async (req, res, account) => {
      const campaignId = requireCampaignId(req.params.id);
      if (!(await investmentDocEntitlement(req, res, account, campaignId))) return;
      res.json({ documents: await service.listInvestmentDocuments(campaignId), demo: true });
    }),
  );

  router.get(
    '/api/investment-documents/:docId/download',
    authed(async (req, res, account) => {
      const doc = await service.getInvestmentDocument(String(req.params.docId));
      if (!doc) {
        res.status(404).json({ error: 'investment document not found', code: 'not_found' });
        return;
      }
      // Entitlement BEFORE the approval check: non-investors are refused
      // without learning whether the document is pending or approved.
      if (!(await investmentDocEntitlement(req, res, account, doc.campaignId))) return;
      const wallets = operatorWallets();
      const isOperator = wallets.length > 0 && wallets.includes(account.publicKey);
      if (doc.status !== 'approved' && !isOperator) {
        res.status(404).json({ error: 'investment document not found', code: 'not_found' });
        return;
      }
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.setHeader('content-disposition', `attachment; filename="${doc.id}.txt"`);
      res.send(`[SYNTHETIC DEMO DOCUMENT - not an offer, not advice, no approved content]\n\n${doc.title}\n\n${doc.content}`);
    }),
  );

  router.post('/api/campaigns/:id/news', requireAdmin, async (req, res) => {
    try {
      res.status(201).json({
        post: await service.addNews(requireCampaignId(req.params.id), req.body, 'admin-key'),
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  // Scoped admin deletes: moderation cleanup (e.g. synthetic fixtures). Hard
  // removal from the content store; the audit log preserves the evidence.
  router.delete('/api/news/:id', requireAdmin, async (req, res) => {
    try {
      await service.deleteNews(String(req.params.id), 'admin-key');
      res.json({ ok: true });
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

  router.delete('/api/podcast/episodes/:id', requireAdmin, async (req, res) => {
    try {
      await service.deleteEpisode(String(req.params.id), 'admin-key');
      res.json({ ok: true });
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
        res.status(503).json({ error: 'OPERATOR_WALLETS not configured; operator endpoints disabled', code: 'feature_unavailable' });
        return;
      }
      if (!wallets.includes(account.publicKey)) {
        res.status(403).json({ error: 'this wallet is not a designated operator', code: 'operator_required' });
        return;
      }
      await handler(req, res, account);
    });

  router.post(
    '/api/operator/campaigns/:id/investment-documents',
    operator(async (req, res, account) => {
      const campaignId = requireCampaignId(req.params.id);
      const doc = await service.publishInvestmentDocument(`operator:${account.publicKey}`, {
        campaignId,
        title: String(req.body?.title ?? ''),
        kind: req.body?.kind,
        content: String(req.body?.content ?? ''),
      });
      res.status(201).json({ document: { ...doc, content: undefined } });
    }),
  );

  router.post(
    '/api/operator/investment-documents/:docId/approve',
    operator(async (req, res, account) => {
      const doc = await service.approveInvestmentDocument(String(req.params.docId), `operator:${account.publicKey}`);
      res.json({ document: { ...doc, content: undefined } });
    }),
  );

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
  // Campaign deployment: operator-only, wallet-signed. Build returns an
  // unsigned envelope for Freighter; submit broadcasts the signed envelope
  // and returns a registry entry for manual SOROBAN_CAMPAIGNS_JSON addition.
  router.post(
    '/api/operator/campaign-deploy/build',
    operator(async (req, res, account) => {
      if (!campaignDeploy) {
        res.status(503).json({ error: 'campaign deployment is not wired on this deployment', code: 'feature_unavailable' });
        return;
      }
      const contractSet = req.body?.contractSet === undefined ? 'v1' : String(req.body.contractSet);
      if (contractSet === 'v2' && !campaignDeploy.buildV2) {
        res.status(503).json({ error: 'v2 campaign deployment is not wired on this deployment', code: 'feature_unavailable' });
        return;
      }
      res.json(
        contractSet === 'v2'
          ? await campaignDeploy.buildV2!({
              actor: account.publicKey,
              id: String(req.body?.id ?? ''),
              name: String(req.body?.name ?? ''),
              goal: String(req.body?.goal ?? ''),
              deadline: Number(req.body?.deadline),
              v2: {
                symbol: String(req.body?.v2?.symbol ?? ''),
                decimals: Number(req.body?.v2?.decimals),
                minPerInvestor: String(req.body?.v2?.minPerInvestor ?? ''),
                maxPerInvestor: String(req.body?.v2?.maxPerInvestor ?? ''),
              },
            })
          : contractSet === 'v1'
            ? await campaignDeploy.build({
                actor: account.publicKey,
                id: String(req.body?.id ?? ''),
                name: String(req.body?.name ?? ''),
                goal: String(req.body?.goal ?? ''),
                deadline: Number(req.body?.deadline),
              })
            : (() => {
                throw new Error('invalid contractSet');
              })(),
      );
    }),
  );
  router.post(
    '/api/operator/campaign-deploy/submit',
    operator(async (req, res, account) => {
      if (!campaignDeploy) {
        res.status(503).json({ error: 'campaign deployment is not wired on this deployment', code: 'feature_unavailable' });
        return;
      }
      const submitSet = req.body?.contractSet === undefined ? 'v1' : String(req.body.contractSet);
      if (submitSet === 'v2' && !campaignDeploy.submitV2) {
        res.status(503).json({ error: 'v2 campaign deployment is not wired on this deployment', code: 'feature_unavailable' });
        return;
      }
      res.json(
        await (submitSet === 'v2' ? campaignDeploy.submitV2! : campaignDeploy.submit)({
          actor: account.publicKey,
          xdr: String(req.body?.xdr ?? ''),
          name: typeof req.body?.name === 'string' ? req.body.name : undefined,
        }),
      );
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
      await service.adminSetApplicationStatus(String(req.params.id), req.body?.status, `operator:${account.publicKey}`, req.body?.note);
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

  // Post-funding reports: publishable only after the campaign's funding
  // period has ended, verified against the on-chain state at publish time.
  // The gate fails closed: unreadable chain state or an unwired verifier
  // refuse the publish rather than trust an operator-declared lifecycle.
  // Reports are never generated; the service stores exactly what the
  // operator submits under the fixed 'platform-demo' stand-in label.
  router.post(
    '/api/operator/campaigns/:id/reports',
    operator(async (req, res, account) => {
      const campaignId = requireCampaignId(req.params.id);
      if (!fundingState) {
        res.status(503).json({ error: 'on-chain funding state verification is not configured; report publishing disabled', code: 'feature_unavailable' });
        return;
      }
      let state: Awaited<ReturnType<NonNullable<typeof fundingState>>>;
      try {
        state = await fundingState(campaignId);
      } catch (err) {
        console.error('on-chain verification failed', err instanceof Error ? err.message : String(err));
        res.status(503).json({
          error: 'could not verify on-chain campaign state; refusing to publish',
          code: 'verification_unavailable',
        });
        return;
      }
      if (!state) {
        res.status(404).json({ error: 'unknown campaign', code: 'campaign_not_found' });
        return;
      }
      if (Math.floor(Date.now() / 1000) < state.deadlineSeconds) {
        res.status(409).json({
          error: 'campaign funding period has not ended; post-funding reports publish after the on-chain deadline passes',
          code: 'report_not_publishable',
        });
        return;
      }
      // A use_of_proceeds report states how raised funds were paid out and
      // used; it may only be published once the on-chain state shows the
      // issuer actually withdrew, so it never implies a payout that did not
      // happen.
      if (req.body?.kind === 'use_of_proceeds' && !state.withdrawn) {
        res.status(409).json({
          error: 'campaign funds are not recorded as withdrawn on-chain; a use-of-proceeds report would imply a payout that is not verified',
          code: 'report_not_publishable',
        });
        return;
      }
      res.status(201).json({
        report: await service.addReport(campaignId, req.body, `operator:${account.publicKey}`),
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
      await service.adminSetApplicationStatus(String(req.params.id), req.body?.status, 'admin-key', req.body?.note);
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
        res.status(503).json({ error: 'reconciliation is not wired on this deployment', code: 'feature_unavailable' });
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
