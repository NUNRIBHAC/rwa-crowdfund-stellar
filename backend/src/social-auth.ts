// Social (OAuth/OIDC) sign-in, sitting NEXT TO the email+password flow
// (email-auth.ts) and the wallet-challenge flow (accounts.ts).
//
// Identity model: a social account is keyed on (provider, subject) ONLY -
// the stable opaque id the provider issues (Google "sub"). The provider-
// returned email is stored for reference but is NEVER used to link or look
// up accounts: no email auto-link, ever. Linking a social identity to an
// existing account is a deliberate, authenticated, re-authenticated
// follow-up flow - not a side effect of sign-in.
//
// Flow: GET /api/auth/social/<provider>/start creates a short-lived
// single-use flow (state + nonce + PKCE S256, stored server-side keyed by
// sha256(state)) behind the same abuseGate as the email routes, then 302s
// to the provider. The callback (unauthenticated by nature) redeems the
// code with the stored verifier through the maintained openid-client
// library, which validates state, nonce and the id_token signature (JWKS).
// The subject comes from the validated id_token claims; access tokens are
// discarded immediately (access_type=online: no refresh token is issued).
//
// Registration is FAIL-CLOSED: creating a NEW account from a social
// identity requires (a) the provider asserting email_verified=true and
// (b) that address listed in the per-env SOCIAL_REGISTRATION_ALLOWED_EMAILS
// (comma-separated). Unset = no new social registrations on this
// deployment, independent of provider-side consent-screen restrictions.
// Existing linked identities always sign in. TOTP, when enabled on the
// account, still applies after social sign-in (same ticket path as the
// email login); sessions are the same bls_ bearer sessions every flow
// issues. There is no account disable flag in the data model today; social
// sign-in goes through exactly the gates that exist.
//
// Fail-closed config: a provider without SOCIAL_<P>_CLIENT_ID and
// SOCIAL_<P>_CLIENT_SECRET in the environment has no routes (404).

import { createHash, randomBytes } from 'node:crypto';
import * as client from 'openid-client';
import { Keypair } from '@stellar/stellar-sdk';
import type { Account, CommunityStore } from './community-store.js';
import { AuthError, hashToken, SESSION_TTL_MS, TOTP_TICKET_TTL_MS } from './accounts.js';

export const SOCIAL_PROVIDERS = ['google', 'github'] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

const SOCIAL_FLOW_TTL_MS = 10 * 60 * 1000;

// Two provider kinds: OIDC (identity from the validated id_token) and plain
// OAuth2 + userinfo (GitHub issues no id_token; identity comes from the
// api.github.com/user id and the verified primary email from
// /user/emails). The fail-closed registration gate below is identical for
// both kinds - only the evidence source differs.
type ProviderKind = 'oidc' | 'oauth2';
const PROVIDER_KIND: Record<SocialProvider, ProviderKind> = {
  google: 'oidc',
  github: 'oauth2',
};

const PROVIDER_ISSUER: Partial<Record<SocialProvider, string>> = {
  google: 'https://accounts.google.com',
};

// Static OAuth2 endpoints for non-OIDC providers (GitHub publishes no
// discovery document).
const OAUTH2_ENDPOINTS: Partial<Record<SocialProvider, { authorize: string; token: string; user: string; emails: string; scope: string }>> = {
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    user: 'https://api.github.com/user',
    emails: 'https://api.github.com/user/emails',
    scope: 'read:user user:email',
  },
};

export function isSocialProvider(value: unknown): value is SocialProvider {
  return typeof value === 'string' && (SOCIAL_PROVIDERS as readonly string[]).includes(value);
}

export type SocialClientConfig = { clientId: string; clientSecret: string };

export function socialConfigFromEnv(env: NodeJS.ProcessEnv, provider: SocialProvider): SocialClientConfig | null {
  const prefix = `SOCIAL_${provider.toUpperCase()}_`;
  const clientId = (env[`${prefix}CLIENT_ID`] ?? '').trim();
  const clientSecret = (env[`${prefix}CLIENT_SECRET`] ?? '').trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// New-account creation from a social identity: comma-separated lowercase
// emails. Unset/empty = no new social registrations (fail-closed).
export function socialRegistrationAllowedEmails(env: NodeJS.ProcessEnv): Set<string> {
  const raw = (env.SOCIAL_REGISTRATION_ALLOWED_EMAILS ?? '').trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

type FetchLike = typeof fetch;

async function getClient(cfg: SocialClientConfig, provider: SocialProvider, fetchImpl?: FetchLike): Promise<client.Configuration> {
  const issuer = PROVIDER_ISSUER[provider];
  if (PROVIDER_KIND[provider] !== 'oidc' || !issuer) throw new AuthError(500, `provider ${provider} is not an OIDC provider`);
  return client.discovery(
    new URL(issuer),
    cfg.clientId,
    undefined,
    client.ClientSecretPost(cfg.clientSecret),
    fetchImpl ? { [client.customFetch]: fetchImpl } : undefined,
  );
}

function flowKey(state: string): string {
  return createHash('sha256').update(state).digest('hex');
}

// Begin a flow: stores the single-use state and returns the provider URL to
// 302 to. Expired flows are pruned inline.
export async function startSocialFlow(
  store: CommunityStore,
  provider: SocialProvider,
  cfg: SocialClientConfig,
  redirectUri: string,
  now = Date.now(),
  fetchImpl?: FetchLike,
): Promise<{ url: string }> {
  const state = client.randomState();
  const nonce = client.randomNonce();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  await store.change((s) => {
    for (const [k, f] of Object.entries(s.socialFlows)) if (f.expiresAt <= now) delete s.socialFlows[k];
    s.socialFlows[flowKey(state)] = { provider, nonce, codeVerifier, createdAt: now, expiresAt: now + SOCIAL_FLOW_TTL_MS };
  });
  if (PROVIDER_KIND[provider] === 'oauth2') {
    const ep = OAUTH2_ENDPOINTS[provider];
    if (!ep) throw new AuthError(500, `provider ${provider} has no OAuth2 endpoints configured`);
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: redirectUri,
      scope: ep.scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    return { url: `${ep.authorize}?${params.toString()}` };
  }
  const conf = await getClient(cfg, provider, fetchImpl);
  const url = client.buildAuthorizationUrl(conf, {
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return { url: url.href };
}

export type SocialLoginResult =
  { kind: 'session'; token: string; expiresAt: number; account: Account } | { kind: 'totp'; ticket: string; expiresAt: number; account: Account };

// Complete a flow from the callback. currentUrl is the full callback URL
// (openid-client validates state/iss against it). Errors:
//   401 social_flow_expired   - unknown/expired/reused state
//   502 social_exchange_failed- provider rejected the exchange/validation
//   403 social_registration_restricted - new identity not allowlisted or
//                                 provider did not verify the email
export async function completeSocialFlow(
  store: CommunityStore,
  env: NodeJS.ProcessEnv,
  provider: SocialProvider,
  cfg: SocialClientConfig,
  currentUrl: string,
  stateParam: unknown,
  now = Date.now(),
  fetchImpl?: FetchLike,
): Promise<SocialLoginResult> {
  if (typeof stateParam !== 'string' || !stateParam) throw new AuthError(401, 'sign-in flow expired; start again', 'social_flow_expired');
  const key = flowKey(stateParam);
  const flow = await store.change((s) => {
    const f = s.socialFlows[key];
    if (!f || f.expiresAt <= now || f.provider !== provider) return null;
    delete s.socialFlows[key]; // single-use, consumed on ANY terminal outcome
    return f;
  });
  if (!flow) throw new AuthError(401, 'sign-in flow expired; start again', 'social_flow_expired');

  let subject: string | null;
  let email: string | null;
  let emailVerified: boolean;
  if (PROVIDER_KIND[provider] === 'oauth2') {
    ({ subject, email, emailVerified } = await exchangeOAuth2Userinfo(provider, cfg, currentUrl, stateParam, flow.codeVerifier, fetchImpl));
  } else {
    const conf = await getClient(cfg, provider, fetchImpl);
    let claims: client.IDToken | undefined;
    try {
      const tokens = await client.authorizationCodeGrant(conf, new URL(currentUrl), {
        pkceCodeVerifier: flow.codeVerifier,
        expectedState: stateParam,
        expectedNonce: flow.nonce,
        idTokenExpected: true,
      });
      claims = tokens.claims();
    } catch {
      throw new AuthError(502, 'the sign-in provider rejected the exchange; start again', 'social_exchange_failed');
    }
    subject = claims?.sub ?? null;
    email = typeof claims?.email === 'string' ? (claims.email as string).trim().toLowerCase() : null;
    emailVerified = claims?.email_verified === true;
  }
  if (!subject) throw new AuthError(502, 'the sign-in provider returned no identity', 'social_exchange_failed');
  const identityKey = `${provider}:${subject}`;

  return store.change((s) => {
    const existing = s.socialIdentities[identityKey];
    let account: Account;
    if (existing) {
      existing.lastLoginAt = now;
      account = s.accounts[existing.publicKey];
      if (!account) throw new AuthError(500, 'account record missing');
    } else {
      // New social registration: fail-closed gate (module header).
      const allowed = socialRegistrationAllowedEmails(env);
      if (!email || !emailVerified || !allowed.has(email)) {
        throw new AuthError(403, 'sign-in with this provider is not open for new accounts on this deployment', 'social_registration_restricted');
      }
      const publicKey = Keypair.random().publicKey();
      s.accounts[publicKey] = {
        publicKey,
        displayName: null,
        createdAt: now,
        authMethod: 'social',
        email,
      } satisfies Account;
      s.socialIdentities[identityKey] = { provider, subject, publicKey, email, createdAt: now, lastLoginAt: now };
      account = s.accounts[publicKey];
    }
    // Second-factor parity with every other flow: a completed provider
    // sign-in alone is never enough when TOTP is enabled.
    if (account.totp?.status === 'enabled') {
      const ticket = `blt_${randomBytes(24).toString('hex')}`;
      const expiresAt = now + TOTP_TICKET_TTL_MS;
      s.totpTickets[ticket] = { id: ticket, publicKey: account.publicKey, expiresAt };
      return { kind: 'totp' as const, ticket, expiresAt, account: { ...account } };
    }
    const token = `bls_${randomBytes(24).toString('hex')}`;
    const session = { tokenHash: hashToken(token), publicKey: account.publicKey, createdAt: now, expiresAt: now + SESSION_TTL_MS };
    s.sessions[session.tokenHash] = session;
    return { kind: 'session' as const, token, expiresAt: session.expiresAt, account: { ...account } };
  });
}

// Plain OAuth2 (no OIDC): redeem the code for a short-lived access token,
// read the stable numeric user id from /user and the verified primary email
// from /user/emails. The access token is used for exactly these two reads
// and then dropped - nothing is stored. GitHub's documented expiry for a
// primary-email record is that verified stays true while the address stays
// on the account; we re-read it on every sign-in rather than caching.
async function exchangeOAuth2Userinfo(
  provider: SocialProvider,
  cfg: SocialClientConfig,
  currentUrl: string,
  stateParam: string,
  codeVerifier: string,
  fetchImpl?: FetchLike,
): Promise<{ subject: string | null; email: string | null; emailVerified: boolean }> {
  const ep = OAUTH2_ENDPOINTS[provider];
  if (!ep) throw new AuthError(500, `provider ${provider} has no OAuth2 endpoints configured`);
  const doFetch = fetchImpl ?? fetch;
  const fail = () => new AuthError(502, 'the sign-in provider rejected the exchange; start again', 'social_exchange_failed');
  const params = new URL(currentUrl).searchParams;
  // openid-client performs this check for OIDC providers; for plain OAuth2
  // we own it: the returned state must be the one we looked up.
  if (params.get('state') !== stateParam) throw fail();
  const code = params.get('code');
  if (!code) throw fail();
  let tokenJson: any;
  try {
    const tokenRes = await doFetch(ep.token, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: `${new URL(currentUrl).origin}${new URL(currentUrl).pathname}`,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
      }).toString(),
    });
    tokenJson = await tokenRes.json();
  } catch {
    throw fail();
  }
  const accessToken = typeof tokenJson?.access_token === 'string' ? tokenJson.access_token : null;
  if (!accessToken) throw fail();
  const headers = { accept: 'application/vnd.github+json', authorization: `Bearer ${accessToken}` };
  let user: any;
  let emails: any;
  try {
    const userRes = await doFetch(ep.user, { headers });
    user = await userRes.json();
    const emailsRes = await doFetch(ep.emails, { headers });
    emails = await emailsRes.json();
  } catch {
    throw fail();
  }
  const id = user?.id;
  const subject = typeof id === 'number' && Number.isFinite(id) ? String(id) : null;
  const list: { email?: unknown; verified?: unknown; primary?: unknown }[] = Array.isArray(emails) ? emails : [];
  const primary = list.find((e) => e && e.primary === true) ?? null;
  const chosen = primary ?? list[0] ?? null;
  const email = typeof chosen?.email === 'string' ? chosen.email.trim().toLowerCase() : null;
  const emailVerified = chosen?.verified === true;
  return { subject, email, emailVerified };
}
