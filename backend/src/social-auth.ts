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
// Linking: an authenticated account can attach additional provider
// identities through /api/auth/social/<provider>/link/start. The callback
// is the SAME registered callback URL (no provider console change); the
// stored flow's linkTo marker turns the outcome into a binding instead of
// a session. An identity already bound to a different account is refused
// (409 social_identity_taken).
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

// Providers with an implementation-verified OIDC discovery document.
// google:    https://accounts.google.com/.well-known/openid-configuration
// linkedin:  https://www.linkedin.com/oauth/.well-known/openid-configuration
//            (issuer is https://www.linkedin.com/oauth, NOT the bare origin)
// telegram:  https://oauth.telegram.org/.well-known/openid-configuration
// GitHub/Discord/Facebook have no OIDC discovery + id_token and need a
// separate OAuth2 userinfo flow before they can join this list; Farcaster
// is AuthKit/SIWF, a different flow entirely.
export const SOCIAL_PROVIDERS = ['google', 'linkedin', 'telegram'] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

const SOCIAL_FLOW_TTL_MS = 10 * 60 * 1000;

const PROVIDER_ISSUER: Record<SocialProvider, string> = {
  google: 'https://accounts.google.com',
  linkedin: 'https://www.linkedin.com/oauth',
  telegram: 'https://oauth.telegram.org',
};

// Per-provider authorization scopes. Telegram's OIDC discovery advertises
// scopes openid/phone/profile/telegram:bot_access/ton:wallet and claims with
// NO email and NO email_verified - requesting an email scope it does not
// support would fail the authorization, and the missing email_verified means
// Telegram identities can NEVER create accounts under the fail-closed
// registration gate (they can only sign in once linked by a deliberate
// authenticated linking flow, which is not implemented yet). That is a
// product/policy boundary, not a bug to code around silently.
const PROVIDER_SCOPE: Record<SocialProvider, string> = {
  google: 'openid email profile',
  linkedin: 'openid email profile',
  telegram: 'openid profile',
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
  return client.discovery(
    new URL(PROVIDER_ISSUER[provider]),
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
  linkTo?: string,
): Promise<{ url: string }> {
  const state = client.randomState();
  const nonce = client.randomNonce();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  await store.change((s) => {
    for (const [k, f] of Object.entries(s.socialFlows)) if (f.expiresAt <= now) delete s.socialFlows[k];
    s.socialFlows[flowKey(state)] = { provider, nonce, codeVerifier, createdAt: now, expiresAt: now + SOCIAL_FLOW_TTL_MS, ...(linkTo ? { linkTo } : {}) };
  });
  const conf = await getClient(cfg, provider, fetchImpl);
  const url = client.buildAuthorizationUrl(conf, {
    redirect_uri: redirectUri,
    scope: PROVIDER_SCOPE[provider],
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return { url: url.href };
}

export type SocialLoginResult =
  | { kind: 'session'; token: string; expiresAt: number; account: Account }
  | { kind: 'totp'; ticket: string; expiresAt: number; account: Account }
  | { kind: 'linked'; account: Account };

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
  const subject = claims?.sub;
  if (!subject) throw new AuthError(502, 'the sign-in provider returned no identity', 'social_exchange_failed');
  const email = typeof claims?.email === 'string' ? (claims.email as string).trim().toLowerCase() : null;
  const emailVerified = claims?.email_verified === true;
  const identityKey = `${provider}:${subject}`;

  if (flow.linkTo) {
    // LINK flow (started by an authenticated account): bind the provider
    // identity to that account. No session is issued here, no account is
    // created, and the registration allowlist/email gate does not apply -
    // the account already exists and proved control with its session when
    // it started the flow. This is the only path a provider without email
    // evidence (e.g. Telegram OIDC carries no email claims) can ever take:
    // it can never register, only attach to an existing account.
    return store.change((s) => {
      const account = s.accounts[flow.linkTo as string];
      if (!account) throw new AuthError(401, 'sign-in flow expired; start again', 'social_flow_expired');
      const existing = s.socialIdentities[identityKey];
      if (existing && existing.publicKey !== account.publicKey) {
        throw new AuthError(409, 'this provider identity is already linked to a different account', 'social_identity_taken');
      }
      if (!existing) {
        s.socialIdentities[identityKey] = { provider, subject, publicKey: account.publicKey, email, createdAt: now, lastLoginAt: now };
      } else {
        existing.lastLoginAt = now;
      }
      return { kind: 'linked' as const, account: { ...account } };
    });
  }

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
