import { issueSocialLinkProof, consumeSocialLinkProof } from './social-link-proof.js';
import { issueSocialDeletionProof } from './deletion-proof.js';
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
// Registration is FAIL-CLOSED: email registration requires email proof and
// SOCIAL_REGISTRATION_ALLOWED_EMAILS. Telegram has an explicit alternative
// using its signed phone claim and SOCIAL_REGISTRATION_ALLOWED_PHONES.
// No phone claim is persisted. For email-bearing providers, (a) the provider
// must assert email_verified=true and (b) that address must be listed in
// SOCIAL_REGISTRATION_ALLOWED_EMAILS
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
import { AuthError, hashToken, SESSION_TTL_MS, TOTP_TICKET_TTL_MS, verifySignature } from './accounts.js';
import { normalizeEmail, sendBudgetedMail, verifyPassword } from './email-auth.js';
import type { Mailer } from './mailer.js';

// Providers with an implementation-verified OIDC discovery document.
// google:    https://accounts.google.com/.well-known/openid-configuration
// linkedin:  https://www.linkedin.com/oauth/.well-known/openid-configuration
//            (issuer is https://www.linkedin.com/oauth, NOT the bare origin)
// telegram:  https://oauth.telegram.org/.well-known/openid-configuration
// github uses the OAuth2 userinfo flow below (no OIDC discovery/id_token).
// Discord/Facebook have no OIDC discovery + id_token and need the same
// OAuth2 userinfo treatment before they can join this list; Farcaster is
// AuthKit/SIWF, a different flow entirely.
export const SOCIAL_PROVIDERS = ['google', 'linkedin', 'telegram', 'github', 'discord'] as const;
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
  linkedin: 'oidc',
  telegram: 'oidc',
  github: 'oauth2',
  discord: 'oauth2',
};

const PROVIDER_ISSUER: Partial<Record<SocialProvider, string>> = {
  google: 'https://accounts.google.com',
  linkedin: 'https://www.linkedin.com/oauth',
  telegram: 'https://oauth.telegram.org',
};

// Telegram carries no email claim. An explicitly allowlisted signed phone
// can admit a new identity without email; otherwise the existing browser-bound
// email-proof registration path remains in place. Neither path auto-links.
const PROVIDER_SCOPE: Partial<Record<SocialProvider, string>> = {
  google: 'openid email profile',
  linkedin: 'openid email profile',
  telegram: 'openid profile',
};

// Static OAuth2 endpoints for non-OIDC providers (GitHub publishes no
// discovery document).
const OAUTH2_ENDPOINTS: Partial<Record<SocialProvider, { authorize: string; token: string; user: string; emails: string | null; scope: string }>> = {
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    user: 'https://api.github.com/user',
    emails: 'https://api.github.com/user/emails',
    scope: 'read:user user:email',
  },
  // Discord: OAuth2 + /users/@me. The id is a stable snowflake string; the
  // email is only trusted when Discord's own `verified` flag is exactly true
  // (absent or false = unverified, so no new account can be created from it).
  discord: {
    authorize: 'https://discord.com/oauth2/authorize',
    token: 'https://discord.com/api/oauth2/token',
    user: 'https://discord.com/api/users/@me',
    emails: null,
    scope: 'identify email',
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

// Telegram phone admission is explicitly opt-in per deployment. Only digits
// are compared; the claim is used transiently and never persisted.
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}
export function socialRegistrationAllowedPhones(env: NodeJS.ProcessEnv): Set<string> {
  const out = new Set<string>();
  for (const part of (env.SOCIAL_REGISTRATION_ALLOWED_PHONES ?? '').split(',')) {
    const n = normalizePhone(part);
    if (n) out.add(n);
  }
  return out;
}

// Providers whose identity carries no email evidence at all. A NEW identity
// from one of these cannot register directly: it gets a pending ticket and
// must prove an allowlisted email by code (requestSocialEmail/confirm).
export const IDENTITY_ONLY_PROVIDERS: ReadonlySet<string> = new Set(['telegram', 'farcaster']);
const PENDING_TTL_MS = 15 * 60 * 1000;
const PENDING_CODE_TTL_MS = 10 * 60 * 1000;
const PENDING_RESEND_MS = 60 * 1000;
const PENDING_MAX_SENDS = 5;
const PENDING_MAX_FAILURES = 5;

export function newBindSecret(): { secret: string; hash: string } {
  const secret = randomBytes(24).toString('hex');
  return { secret, hash: hashToken(secret) };
}
export function bindMatches(hash: string, secret: unknown): boolean {
  return typeof secret === 'string' && secret.length > 0 && hashToken(secret) === hash;
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
  linkTo?: string,
  bindHash?: string,
  deletionPurpose?: import('./deletion-proof.js').SocialDeletionPurpose,
  registrationMethod?: 'phone',
  linkPurpose?: import('./social-link-proof.js').SocialLinkPurpose,
): Promise<{ url: string }> {
  const state = client.randomState();
  const nonce = client.randomNonce();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  await store.change((s) => {
    for (const [k, f] of Object.entries(s.socialFlows)) if (f.expiresAt <= now) delete s.socialFlows[k];
    s.socialFlows[flowKey(state)] = {
      provider,
      nonce,
      codeVerifier,
      createdAt: now,
      expiresAt: now + SOCIAL_FLOW_TTL_MS,
      ...(linkTo ? { linkTo } : {}),
      ...(linkPurpose ? { linkPurpose } : {}),
      ...(deletionPurpose ? { deletionPurpose } : {}),
      ...(bindHash ? { bindHash } : {}),
      ...(provider === 'telegram' && registrationMethod === 'phone' ? { registrationMethod } : {}),
    };
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
    scope: provider === 'telegram' && registrationMethod === 'phone' ? 'openid profile phone' : (PROVIDER_SCOPE[provider] ?? 'openid'),
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
  | { kind: 'email'; ticket: string; expiresAt: number }
  | { kind: 'linked'; account: Account }
  | { kind: 'deletion-proof'; proof: string; expiresAt: number }
  | { kind: 'link-proof'; proof: string; expiresAt: number };

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
  bindSecret?: string,
): Promise<SocialLoginResult> {
  if (typeof stateParam !== 'string' || !stateParam) throw new AuthError(401, 'sign-in flow expired; start again', 'social_flow_expired');
  const key = flowKey(stateParam);
  const flow = await store.change((s) => {
    const f = s.socialFlows[key];
    if (!f || f.expiresAt <= now || f.provider !== provider) return null;
    delete s.socialFlows[key]; // single-use, consumed on ANY terminal outcome
    // Browser binding: a callback replayed from another browser (no or wrong
    // cookie) is rejected like an expired flow.
    if (f.bindHash && !bindMatches(f.bindHash, bindSecret)) return null;
    return f;
  });
  if (!flow) throw new AuthError(401, 'sign-in flow expired; start again', 'social_flow_expired');

  let subject: string | null;
  let email: string | null;
  let emailVerified: boolean;
  let phone: string | null = null;
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
    if (provider === 'telegram') phone = normalizePhone(claims?.phone_number);
  }
  if (!subject) throw new AuthError(502, 'the sign-in provider returned no identity', 'social_exchange_failed');
  return finishSocialIdentity(store, env, provider, subject, email, emailVerified, flow, now, phone);
}

// Shared tail of every provider flow: link to an existing account, sign an
// existing identity in, admit an allowlisted Telegram phone, or park a pending
// email-proof ticket for other new identity-only registrations.
export type SocialFlowRecord = {
  linkPurpose?: import('./social-link-proof.js').SocialLinkPurpose;
  deletionPurpose?: import('./deletion-proof.js').SocialDeletionPurpose;
  linkTo?: string;
  bindHash?: string;
  createdAt?: number;
  registrationMethod?: 'phone';
};
export async function finishSocialIdentity(
  store: CommunityStore,
  env: NodeJS.ProcessEnv,
  provider: string,
  subject: string,
  email: string | null,
  emailVerified: boolean,
  flow: SocialFlowRecord,
  now: number,
  phone: string | null = null,
): Promise<SocialLoginResult> {
  const identityKey = `${provider}:${subject}`;
  const rejectDeletedFlow = (s: import('./community-store.js').CommunityState) => {
    const cutoff = s.deletedSocialIdentityBefore?.[hashToken(identityKey)];
    if (cutoff !== undefined && (flow.createdAt === undefined || flow.createdAt <= cutoff))
      throw new AuthError(401, 'account was deleted; start a new sign-in explicitly', 'social_flow_expired');
  };

  if (flow.linkPurpose)
    return store.change((s) => {
      rejectDeletedFlow(s);
      return { kind: 'link-proof' as const, ...issueSocialLinkProof(s, flow.linkPurpose!, provider, subject, now) };
    });

  if (flow.deletionPurpose)
    return store.change((s) => {
      rejectDeletedFlow(s);
      return { kind: 'deletion-proof' as const, ...issueSocialDeletionProof(s, flow.deletionPurpose!, provider, subject, now) };
    });

  if (flow.linkTo) {
    // LINK flow (started by an authenticated account): bind the provider
    // identity to that account. No session is issued here, no account is
    // created, and the registration allowlist/email gate does not apply -
    // the account already exists and proved control with its session when
    // it started the flow. This path stays separate from phone/email
    // registration and never merges accounts by a contact address.
    return store.change((s) => {
      rejectDeletedFlow(s);
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
    rejectDeletedFlow(s);
    const existing = s.socialIdentities[identityKey];
    let account: Account;
    if (existing) {
      existing.lastLoginAt = now;
      account = s.accounts[existing.publicKey];
      if (!account) throw new AuthError(500, 'account record missing');
    } else {
      // New social registration: fail-closed gate (module header).
      const phoneChosen = provider === 'telegram' && flow.registrationMethod === 'phone';
      const phoneAllowed = phoneChosen && phone !== null && socialRegistrationAllowedPhones(env).has(phone);
      if (phoneChosen && !phoneAllowed)
        throw new AuthError(403, 'sign-in with this provider is not open for new accounts on this deployment', 'social_registration_restricted');
      if (IDENTITY_ONLY_PROVIDERS.has(provider) && !phoneAllowed) {
        if (!flow.bindHash) throw new AuthError(401, 'sign-in flow expired; start again', 'social_flow_expired');
        const ticket = `bsp_${randomBytes(24).toString('hex')}`;
        const expiresAt = now + PENDING_TTL_MS;
        for (const [k, v] of Object.entries(s.socialPending)) if (v.expiresAt <= now) delete s.socialPending[k];
        s.socialPending[hashToken(ticket)] = { bindHash: flow.bindHash, provider, subject, createdAt: now, expiresAt, sendCount: 0, failedAttempts: 0 };
        return { kind: 'email' as const, ticket, expiresAt };
      }
      const allowed = socialRegistrationAllowedEmails(env);
      if (!phoneAllowed && (!email || !emailVerified || !allowed.has(email))) {
        throw new AuthError(403, 'sign-in with this provider is not open for new accounts on this deployment', 'social_registration_restricted');
      }
      const publicKey = Keypair.random().publicKey();
      s.accounts[publicKey] = {
        publicKey,
        displayName: null,
        createdAt: now,
        authMethod: 'social',
        ...(email ? { email } : {}),
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
  const headers = { accept: provider === 'github' ? 'application/vnd.github+json' : 'application/json', authorization: `Bearer ${accessToken}` };
  let user: any;
  let emails: any = null;
  try {
    const userRes = await doFetch(ep.user, { headers });
    user = await userRes.json();
    if (ep.emails) {
      const emailsRes = await doFetch(ep.emails, { headers });
      emails = await emailsRes.json();
    }
  } catch {
    throw fail();
  }
  if (provider === 'discord') {
    // Snowflake ids are strings of digits; anything else is not an identity.
    const did = typeof user?.id === 'string' && /^\d{5,25}$/.test(user.id) ? user.id : null;
    const demail = typeof user?.email === 'string' ? user.email.trim().toLowerCase() : null;
    return { subject: did, email: demail, emailVerified: user?.verified === true && demail !== null };
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

// --- Link step-up ------------------------------------------------------------
// Linking a provider identity adds a persistent new sign-in path to the
// account: a stolen or merely old session must not be enough to create one.
// link/start therefore requires a recent re-authentication appropriate to
// the account's own credential, and linking is only offered to accounts
// with a verified email on record (email accounts: credential.verified;
// social accounts: the provider-verified email that registration required).
// Wallet-only accounts have no verified email and cannot link.
export const SOCIAL_LINK_STEPUP_FRESH_MS = 10 * 60 * 1000;

export type LinkStepUpProof = { password?: unknown; signature?: unknown; providerProof?: unknown };

export async function requireSocialLinkStepUp(
  store: CommunityStore,
  account: Account,
  _sessionCreatedAt: number,
  proof: LinkStepUpProof,
  now = Date.now(),
  authorization?: string,
): Promise<void> {
  const fail = (code: string, msg: string) => new AuthError(403, msg, code);
  if (!account.authMethod && !account.email) {
    // Classic wallet account: no email record exists; the fresh-signature
    // step-up below is the whole ceremony for this method.
  } else if (!account.email) {
    throw fail('social_link_requires_verified_email', 'linking a sign-in provider requires an account with a verified email');
  }
  if (account.authMethod === 'email') {
    const ok = await store.change((s) => {
      const cred = account.email ? s.emailCredentials[account.email] : undefined;
      if (!cred || cred.publicKey !== account.publicKey || cred.verified !== true) return false;
      return typeof proof.password === 'string' && verifyPassword(proof.password, cred.passwordRecord);
    });
    if (!ok) throw fail('social_stepup_failed', 're-authentication failed; enter your current password to link a provider');
    return;
  }
  if (account.authMethod === 'social') {
    const ok = await store.change((s) => consumeSocialLinkProof(s, account.publicKey, authorization, proof.providerProof, now));
    if (!ok) throw fail('social_stepup_required', 'prove an already linked provider identity before linking another provider');
    return;
  }
  // Wallet account: fresh signature over an unused login challenge for this
  // exact account, consumed single-use here (no session issued).
  if (typeof proof.signature !== 'string' || !proof.signature) {
    throw fail('social_stepup_required', 'sign a fresh wallet challenge to link a provider');
  }
  let signature: Buffer;
  try {
    signature = Buffer.from(proof.signature, 'base64');
    if (signature.length !== 64) throw new Error('bad length');
  } catch {
    throw fail('social_stepup_failed', 'signature must be base64-encoded 64-byte Ed25519');
  }
  const ok = await store.change((s) => {
    const challenge = Object.values(s.challenges).find(
      (c) => c.publicKey === account.publicKey && !c.used && c.expiresAt > now && verifySignature(account.publicKey, c.message, signature),
    );
    if (!challenge) return false;
    challenge.used = true;
    return true;
  });
  if (!ok) throw fail('social_stepup_failed', 'wallet challenge signature did not verify; request a fresh challenge');
}

// --- Email proof for identity-only providers -----------------------------------
// Step 2: the holder of a pending ticket names an email. The answer is the
// same whether or not the address is eligible (no enumeration). A code is
// mailed only when the address is on SOCIAL_REGISTRATION_ALLOWED_EMAILS and no
// account or email credential already uses it (an existing account is NEVER
// linked from here: its owner signs in and uses the authenticated link flow).
export async function requestSocialEmail(
  store: CommunityStore,
  mailer: Mailer,
  env: NodeJS.ProcessEnv,
  input: { ticket: unknown; email: unknown; bind: unknown },
  now = Date.now(),
  maxPerHour = 50,
  maxPerDay = 250,
): Promise<{ status: 'code-sent' }> {
  if (typeof input.ticket !== 'string' || !input.ticket.startsWith('bsp_')) throw new AuthError(401, 'sign-in expired; start again', 'social_pending_expired');
  const email = normalizeEmail(input.email);
  const key = hashToken(input.ticket);
  const code = String(randomBytes(4).readUInt32BE(0) % 1000000).padStart(6, '0');
  const eligible = socialRegistrationAllowedEmails(env).has(email);
  const go = await store.change((s) => {
    const p = s.socialPending[key];
    if (!p || p.expiresAt <= now || !bindMatches(p.bindHash, input.bind)) throw new AuthError(401, 'sign-in expired; start again', 'social_pending_expired');
    if (p.sendCount >= PENDING_MAX_SENDS) throw new AuthError(429, 'too many codes requested; start again', 'rate_limited');
    if (p.sentAt && now - p.sentAt < PENDING_RESEND_MS) return false;
    const taken = !!s.emailCredentials[email] || Object.values(s.accounts).some((a) => a.email === email);
    if (!eligible || taken) {
      p.sentAt = now; // same cooldown and counter as a real send: no timing or count signal
      p.sendCount += 1;
      return false;
    }
    p.email = email;
    p.codeHash = hashToken(code);
    p.codeExpiresAt = now + PENDING_CODE_TTL_MS;
    p.failedAttempts = 0;
    p.sentAt = now;
    p.sendCount += 1;
    return true;
  });
  if (go) {
    await sendBudgetedMail(
      store,
      mailer,
      {
        to: email,
        subject: 'Your Blockallisto sign-in code',
        text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
      },
      now,
      maxPerHour,
      maxPerDay,
    );
  }
  return { status: 'code-sent' };
}

// Step 3: the right code for the pending ticket creates the account with that
// email verified and binds the provider identity, then issues a session (or
// the TOTP ticket when the new account somehow has TOTP enabled - it cannot,
// but the path stays identical to every other flow).
export async function confirmSocialEmail(
  store: CommunityStore,
  input: { ticket: unknown; code: unknown; bind: unknown },
  now = Date.now(),
): Promise<SocialLoginResult> {
  if (typeof input.ticket !== 'string' || !input.ticket.startsWith('bsp_')) throw new AuthError(401, 'sign-in expired; start again', 'social_pending_expired');
  const key = hashToken(input.ticket);
  const code = typeof input.code === 'string' ? input.code.trim() : '';
  const wrong = new AuthError(400, 'that code is not valid; check it or request a new one', 'social_code_invalid');
  const outcome = await store.change((s) => {
    const p = s.socialPending[key];
    if (!p || p.expiresAt <= now || !bindMatches(p.bindHash, input.bind))
      return { error: new AuthError(401, 'sign-in expired; start again', 'social_pending_expired') };
    if (!p.codeHash || !p.codeExpiresAt || !p.email || p.codeExpiresAt <= now || p.failedAttempts >= PENDING_MAX_FAILURES) return { error: wrong };
    if (!/^\d{6}$/.test(code) || hashToken(code) !== p.codeHash) {
      p.failedAttempts += 1;
      if (p.failedAttempts >= PENDING_MAX_FAILURES) delete s.socialPending[key];
      return { error: wrong };
    }
    delete s.socialPending[key]; // single use
    const identityKey = `${p.provider}:${p.subject}`;
    if (s.socialIdentities[identityKey])
      return { error: new AuthError(409, 'this provider identity is already linked to an account', 'social_identity_taken') };
    if (s.emailCredentials[p.email] || Object.values(s.accounts).some((a) => a.email === p.email)) {
      return { error: new AuthError(409, 'that email already has an account; sign in to it and link this provider from your account', 'social_email_in_use') };
    }
    const publicKey = Keypair.random().publicKey();
    s.accounts[publicKey] = { publicKey, displayName: null, createdAt: now, authMethod: 'social', email: p.email } satisfies Account;
    s.socialIdentities[identityKey] = { provider: p.provider, subject: p.subject, publicKey, email: p.email, createdAt: now, lastLoginAt: now };
    const token = `bls_${randomBytes(24).toString('hex')}`;
    const session = { tokenHash: hashToken(token), publicKey, createdAt: now, expiresAt: now + SESSION_TTL_MS };
    s.sessions[session.tokenHash] = session;
    return { ok: { kind: 'session' as const, token, expiresAt: session.expiresAt, account: { ...s.accounts[publicKey] } } };
  });
  if ('error' in outcome && outcome.error) throw outcome.error;
  return (outcome as { ok: SocialLoginResult }).ok;
}
