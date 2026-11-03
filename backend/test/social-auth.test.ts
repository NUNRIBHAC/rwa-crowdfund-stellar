import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { createHash } from 'node:crypto';
import * as jose from 'jose';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';
import { completeSocialFlow, requireSocialLinkStepUp, startSocialFlow } from '../src/social-auth.js';

const requireAdmin: express.RequestHandler = (_req, _res, next) => next();

const servers: ReturnType<express.Express['listen']>[] = [];
after(() => servers.forEach((s) => s.close()));
const pristineEnv = { ...process.env };
after(() => {
  for (const k of Object.keys(process.env)) if (!(k in pristineEnv)) delete process.env[k];
  Object.assign(process.env, pristineEnv);
});

const CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
const CLIENT_SECRET = 'test-secret';
const PROVIDER_ISSUERS: Record<string, string> = {
  google: 'https://accounts.google.com',
  linkedin: 'https://www.linkedin.com/oauth',
  telegram: 'https://oauth.telegram.org',
};
const PROVIDER_SCOPES: Record<string, string> = {
  google: 'openid email profile',
  linkedin: 'openid email profile',
  telegram: 'openid profile',
};

// A fake Google: discovery metadata, JWKS, token exchange (with a real
// PKCE check against the challenge seen in the authorization URL) and a
// signed id_token via jose. userinfo is never needed - the validated
// id_token claims are the identity source.
async function makeFakeProvider(provider: string, opts: { email?: string; emailVerified?: boolean; subject?: string }) {
  const ISSUER = PROVIDER_ISSUERS[provider];
  if (!ISSUER) throw new Error(`no fake for ${provider}`);
  // claims are mutable: tests update them between flows to simulate the
  // provider returning different profile data for the same subject.
  const claims = { email: opts.email, emailVerified: opts.emailVerified };
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
  const publicJwk = await jose.exportJWK(publicKey);
  publicJwk.kid = 'test-key';
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';
  const state = { challenge: null as string | null };
  const subject = opts.subject ?? `${provider}-sub-123`;
  const fetchImpl = async (input: any, init?: any): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.startsWith(`${ISSUER}/.well-known/openid-configuration`)) {
      return Response.json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/o/oauth2/v2/auth`,
        token_endpoint: `${ISSUER}/token`,
        userinfo_endpoint: `${ISSUER}/v1/userinfo`,
        jwks_uri: `${ISSUER}/jwks`,
      });
    }
    if (url === `${ISSUER}/jwks`) return Response.json({ keys: [publicJwk] });
    if (url === `${ISSUER}/token`) {
      const body = new URLSearchParams(init.body as string);
      // Real PKCE binding: the verifier must hash to the challenge the
      // /start redirect carried.
      const verifier = body.get('code_verifier');
      assert.ok(verifier, 'code_verifier present');
      const computed = createHash('sha256').update(verifier!).digest('base64url');
      assert.equal(computed, state.challenge, 'PKCE verifier matches the issued challenge');
      assert.equal(body.get('client_id'), CLIENT_ID);
      assert.equal(body.get('client_secret'), CLIENT_SECRET);
      assert.equal(body.get('grant_type'), 'authorization_code');
      assert.ok(body.get('redirect_uri')?.endsWith(`/api/auth/social/${provider}/callback`));
      const idToken = await new jose.SignJWT({
        sub: subject,
        email: claims.email,
        email_verified: claims.emailVerified,
        nonce: body.get('nonce') ?? (globalThis as any).__testNonce,
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
        .setIssuer(ISSUER)
        .setAudience(CLIENT_ID)
        .setIssuedAt()
        .setExpirationTime('10m')
        .sign(privateKey);
      return Response.json({ access_token: 'ya29.fake', token_type: 'Bearer', expires_in: 3600, id_token: idToken });
    }
    throw new Error(`unexpected provider call: ${url}`);
  };
  return { fetchImpl: fetchImpl as typeof fetch, state, claims };
}

const makeFakeGoogle = (opts: { email?: string; emailVerified?: boolean; subject?: string }) => makeFakeProvider('google', opts);

async function startApp(env: Record<string, string>, deps: Record<string, unknown> = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'social-auth-'));
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const service = new CommunityService(store);
  for (const k of [
    'TURNSTILE_SECRET_KEY',
    'TURNSTILE_SITE_KEY',
    'IPREP_API_KEY',
    'IPREP_ENFORCE',
    'SOCIAL_GOOGLE_CLIENT_ID',
    'SOCIAL_GOOGLE_CLIENT_SECRET',
    'SOCIAL_GOOGLE_REDIRECT_URI',
    'SOCIAL_LINKEDIN_CLIENT_ID',
    'SOCIAL_LINKEDIN_CLIENT_SECRET',
    'SOCIAL_TELEGRAM_CLIENT_ID',
    'SOCIAL_TELEGRAM_CLIENT_SECRET',
    'SOCIAL_GITHUB_CLIENT_ID',
    'SOCIAL_GITHUB_CLIENT_SECRET',
    'SOCIAL_GITHUB_REDIRECT_URI',
    'SOCIAL_REGISTRATION_ALLOWED_EMAILS',
  ])
    delete process.env[k];
  Object.assign(process.env, env);
  app.use(createCommunityRouter({ service, requireAdmin, ...deps } as never));
  const srv = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  servers.push(srv);
  const address = srv.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { base: `http://127.0.0.1:${port}`, store };
}

const CONF = { SOCIAL_GOOGLE_CLIENT_ID: CLIENT_ID, SOCIAL_GOOGLE_CLIENT_SECRET: CLIENT_SECRET };

// Drive one full flow: /start (302 to the fake provider), then /callback
// with the issued state. Returns the callback response.
async function driveFlow(base: string, fetchImpl: typeof fetch, challengeHolder: { challenge: string | null }, provider = 'google') {
  const start = await fetch(`${base}/api/auth/social/${provider}/start`, { redirect: 'manual' });
  assert.equal(start.status, 302);
  const authUrl = new URL(start.headers.get('location')!);
  assert.ok(authUrl.href.startsWith(PROVIDER_ISSUERS[provider]), `${provider} authorization URL on its issuer`);
  assert.equal(authUrl.searchParams.get('client_id'), CLIENT_ID);
  assert.equal(authUrl.searchParams.get('response_type'), 'code');
  assert.equal(authUrl.searchParams.get('scope'), PROVIDER_SCOPES[provider]);
  assert.equal(authUrl.searchParams.get('code_challenge_method'), 'S256');
  const state = authUrl.searchParams.get('state')!;
  const nonce = authUrl.searchParams.get('nonce')!;
  assert.ok(state && nonce, 'state and nonce issued');
  challengeHolder.challenge = authUrl.searchParams.get('code_challenge');
  (globalThis as any).__testNonce = nonce;
  const cb = await fetch(`${base}/api/auth/social/${provider}/callback?code=fake-auth-code&state=${encodeURIComponent(state)}`, { redirect: 'manual' });
  return cb;
}

// A fake GitHub OAuth2 provider: token exchange (with the same PKCE
// binding check as the Google fake) plus /user and /user/emails userinfo.
const GH_USER_ID = 424242;
async function makeFakeGithub(opts: { email?: string; emailVerified?: boolean; userId?: number }) {
  const state = { challenge: null as string | null };
  const claims = { email: opts.email, emailVerified: opts.emailVerified };
  const fetchImpl = async (input: any, init?: any): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://github.com/login/oauth/access_token') {
      const body = new URLSearchParams(init.body as string);
      const verifier = body.get('code_verifier');
      assert.ok(verifier, 'code_verifier present');
      const computed = createHash('sha256').update(verifier!).digest('base64url');
      assert.equal(computed, state.challenge, 'PKCE verifier matches the issued challenge');
      assert.equal(body.get('grant_type'), 'authorization_code');
      return Response.json({ access_token: 'gho_fake', token_type: 'bearer' });
    }
    if (url === 'https://api.github.com/user') {
      assert.equal(init?.headers?.authorization, 'Bearer gho_fake');
      return Response.json({ id: opts.userId ?? GH_USER_ID, login: 'octocat' });
    }
    if (url === 'https://api.github.com/user/emails') {
      return Response.json([{ email: claims.email, verified: claims.emailVerified, primary: true }]);
    }
    throw new Error(`unexpected provider call: ${url}`);
  };
  return { fetchImpl: fetchImpl as typeof fetch, state, claims };
}

const GH_CONF = { SOCIAL_GITHUB_CLIENT_ID: 'gh-client-id', SOCIAL_GITHUB_CLIENT_SECRET: 'gh-secret' };

async function driveGithubFlow(base: string, challengeHolder: { challenge: string | null }) {
  const start = await fetch(`${base}/api/auth/social/github/start`, { redirect: 'manual' });
  assert.equal(start.status, 302);
  const authUrl = new URL(start.headers.get('location')!);
  assert.equal(authUrl.origin + authUrl.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(authUrl.searchParams.get('client_id'), 'gh-client-id');
  assert.equal(authUrl.searchParams.get('scope'), 'read:user user:email');
  assert.equal(authUrl.searchParams.get('code_challenge_method'), 'S256');
  const state = authUrl.searchParams.get('state')!;
  assert.ok(state, 'state issued');
  challengeHolder.challenge = authUrl.searchParams.get('code_challenge');
  return fetch(`${base}/api/auth/social/github/callback?code=fake-gh-code&state=${encodeURIComponent(state)}`, { redirect: 'manual' });
}

test('github oauth2: fail-closed registration gate uses the verified primary email from userinfo', async () => {
  // Case 1: allowlisted + GitHub-verified primary email -> account created, session issued.
  const fake1 = await makeFakeGithub({ email: 'someone@example.com', emailVerified: true });
  const app1 = await startApp({ ...GH_CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'someone@example.com' }, { socialFetch: fake1.fetchImpl });
  let res = await driveGithubFlow(app1.base, fake1.state);
  assert.equal(res.status, 302);
  const loc = res.headers.get('location')!;
  assert.ok(loc.startsWith('/account#social-token=bls_'), loc);
  const state1 = await app1.store.read();
  assert.equal(Object.keys(state1.accounts).length, 1);
  assert.ok(state1.socialIdentities[`github:${GH_USER_ID}`], 'identity keyed on provider + numeric user id');

  // Sign-in again with the same identity -> same account, no duplicate.
  res = await driveGithubFlow(app1.base, fake1.state);
  assert.ok(res.headers.get('location')!.startsWith('/account#social-token=bls_'));
  assert.equal(Object.keys((await app1.store.read()).accounts).length, 1);

  // Case 2: GitHub has NOT verified the email -> refuse, nothing created.
  const fake2 = await makeFakeGithub({ email: 'someone@example.com', emailVerified: false });
  const app2 = await startApp({ ...GH_CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'someone@example.com' }, { socialFetch: fake2.fetchImpl });
  res = await driveGithubFlow(app2.base, fake2.state);
  assert.equal(res.headers.get('location'), '/account#social-error=social_registration_restricted');
  assert.equal(Object.keys((await app2.store.read()).accounts).length, 0);

  // Case 3: verified but not allowlisted -> refuse.
  const fake3 = await makeFakeGithub({ email: 'someone@example.com', emailVerified: true });
  const app3 = await startApp({ ...GH_CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'other@example.com' }, { socialFetch: fake3.fetchImpl });
  res = await driveGithubFlow(app3.base, fake3.state);
  assert.equal(res.headers.get('location'), '/account#social-error=social_registration_restricted');
});

test('github oauth2: provider rejection and missing user id fail closed', async () => {
  // Token endpoint rejects -> exchange failure, no account.
  const rejectFetch = (async (input: any): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://github.com/login/oauth/access_token') return Response.json({ error: 'bad_verification_code' });
    throw new Error(`unexpected provider call: ${url}`);
  }) as typeof fetch;
  const app1 = await startApp(GH_CONF, { socialFetch: rejectFetch });
  let res = await driveGithubFlow(app1.base, { challenge: null });
  assert.equal(res.headers.get('location'), '/account#social-error=social_exchange_failed');

  // /user returns no id -> exchange failure.
  const noIdFetch = (async (input: any): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://github.com/login/oauth/access_token') return Response.json({ access_token: 'gho_fake', token_type: 'bearer' });
    if (url === 'https://api.github.com/user') return Response.json({ login: 'octocat' });
    if (url === 'https://api.github.com/user/emails') return Response.json([]);
    throw new Error(`unexpected provider call: ${url}`);
  }) as typeof fetch;
  const app2 = await startApp(GH_CONF, { socialFetch: noIdFetch });
  res = await driveGithubFlow(app2.base, { challenge: null });
  assert.equal(res.headers.get('location'), '/account#social-error=social_exchange_failed');
  assert.equal(Object.keys((await app2.store.read()).accounts).length, 0);
});

// Drive one LINK flow: authenticated /link/start, then the same /callback
// path with the issued state. Returns the callback response.
async function driveLinkFlow(base: string, provider: string, token: string, challengeHolder: { challenge: string | null }, body: Record<string, unknown> = {}) {
  const start = await fetch(`${base}/api/auth/social/${provider}/link/start`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  assert.equal(start.status, 200);
  const authUrl = new URL(((await start.json()) as any).url);
  const state = authUrl.searchParams.get('state')!;
  const nonce = authUrl.searchParams.get('nonce')!;
  assert.ok(state && nonce, 'state and nonce issued');
  challengeHolder.challenge = authUrl.searchParams.get('code_challenge');
  (globalThis as any).__testNonce = nonce;
  return fetch(`${base}/api/auth/social/${provider}/callback?code=fake-auth-code&state=${encodeURIComponent(state)}`, { redirect: 'manual' });
}

function tokenFromRedirect(res: Response): string {
  const loc = res.headers.get('location')!;
  assert.ok(loc.includes('#social-token=bls_'), loc);
  return loc.split('#social-token=')[1];
}

test('social linking: authenticated account binds its identity; link callback issues no session; start requires auth', async () => {
  const fake = await makeFakeGoogle({ email: 'owner@example.com', emailVerified: true, subject: 'sub-owner' });
  const { base, store } = await startApp({ ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'owner@example.com' }, { socialFetch: fake.fetchImpl });
  const token = tokenFromRedirect(await driveFlow(base, fake.fetchImpl, fake.state));

  // Link/start requires authentication (POST).
  assert.equal((await fetch(`${base}/api/auth/social/google/link/start`, { method: 'POST' })).status, 401);

  // Binding the same identity to its own account: a no-op link outcome,
  // and crucially NO session comes back from a link flow.
  const relink = await driveLinkFlow(base, 'google', token, fake.state);
  assert.equal(relink.headers.get('location'), '/account#social-linked=google');
  const state = await store.read();
  assert.equal(Object.keys(state.socialIdentities).length, 1, 'no duplicate identity');
  assert.equal(state.sessions ? Object.keys(state.sessions).length : 0, 1, 'no extra session from linking');
});

test('social linking: an identity bound to another account is refused (social_identity_taken)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'social-link-'));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const cfg = { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET };
  const env = { ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'a@example.com,b@example.com' };
  const fakeA = await makeFakeGoogle({ email: 'a@example.com', emailVerified: true, subject: 'sub-shared' });
  const fakeB = await makeFakeGoogle({ email: 'b@example.com', emailVerified: true, subject: 'sub-b' });

  const login = async (fake: Awaited<ReturnType<typeof makeFakeGoogle>>, linkTo?: string) => {
    const { url } = await startSocialFlow(store, 'google', cfg, 'http://test/api/auth/social/google/callback', Date.now(), fake.fetchImpl, linkTo);
    const authUrl = new URL(url);
    fake.state.challenge = authUrl.searchParams.get('code_challenge');
    (globalThis as any).__testNonce = authUrl.searchParams.get('nonce');
    const state = authUrl.searchParams.get('state')!;
    return completeSocialFlow(
      store,
      env,
      'google',
      cfg,
      `http://test/api/auth/social/google/callback?code=x&state=${encodeURIComponent(state)}`,
      state,
      Date.now(),
      fake.fetchImpl,
    );
  };

  const a = await login(fakeA);
  assert.equal(a.kind, 'session');
  const b = await login(fakeB);
  assert.equal(b.kind, 'session');
  if (b.kind !== 'session') throw new Error('unreachable');

  // Account B tries to bind sub-shared, already owned by A: refused.
  await assert.rejects(
    () => login(fakeA, b.account.publicKey),
    (e: any) => e.status === 409 && e.code === 'social_identity_taken',
  );

  // Account B binds a fresh identity successfully - the link outcome
  // carries no token and creates nothing but the binding.
  const fakeC = await makeFakeGoogle({ email: undefined, emailVerified: false, subject: 'sub-c-noemail' });
  const linked = await login(fakeC, b.account.publicKey);
  assert.equal(linked.kind, 'linked');
  if (linked.kind !== 'linked') throw new Error('unreachable');
  assert.equal(linked.account.publicKey, b.account.publicKey);
  const state = await store.read();
  assert.equal(Object.keys(state.accounts).length, 2, 'linking never creates accounts');
  assert.ok(state.socialIdentities['google:sub-c-noemail'], 'identity without any email evidence can link but never register');

  // ...and that email-less identity can now SIGN IN to the linked account
  // (existing identities always sign in; the gate only bars registration).
  const signin = await login(fakeC);
  assert.equal(signin.kind, 'session');
  if (signin.kind !== 'session') throw new Error('unreachable');
  assert.equal(signin.account.publicKey, b.account.publicKey);
});

test('social linking step-up: stale social session and bad wallet signature are rejected; verified-email rule enforced', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'social-stepup-'));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const now = Date.now();

  // Social account with a STALE session (created >10 min ago): refused.
  const socialAccount = { publicKey: 'G' + 'A'.repeat(55), displayName: null, createdAt: now, authMethod: 'social' as const, email: 's@example.com' };
  await assert.rejects(
    () => requireSocialLinkStepUp(store, socialAccount as any, now - 11 * 60 * 1000, {}, now),
    (e: any) => e.status === 403 && e.code === 'social_stepup_required',
  );
  // Fresh session passes.
  await requireSocialLinkStepUp(store, socialAccount as any, now - 60 * 1000, {}, now);

  // Email account, UNVERIFIED credential: refused even with the right password.
  const { hashPassword } = await import('../src/email-auth.js');
  const emailAccount = { publicKey: 'G' + 'B'.repeat(55), displayName: null, createdAt: now, authMethod: 'email' as const, email: 'e@example.com' };
  await store.change((s) => {
    s.emailCredentials['e@example.com'] = {
      email: 'e@example.com',
      passwordRecord: hashPassword('correct horse'),
      publicKey: emailAccount.publicKey,
      verified: false,
      verifyTokenHash: null,
      verifyExpiresAt: null,
      createdAt: now,
      failedAttempts: 0,
      lockUntil: null,
    };
  });
  await assert.rejects(
    () => requireSocialLinkStepUp(store, emailAccount as any, now, { password: 'correct horse' }, now),
    (e: any) => e.status === 403 && e.code === 'social_stepup_failed',
  );
  // Verified credential + WRONG password: refused. Right password: passes.
  await store.change((s) => {
    s.emailCredentials['e@example.com'].verified = true;
  });
  await assert.rejects(
    () => requireSocialLinkStepUp(store, emailAccount as any, now, { password: 'wrong' }, now),
    (e: any) => e.status === 403 && e.code === 'social_stepup_failed',
  );
  await requireSocialLinkStepUp(store, emailAccount as any, now, { password: 'correct horse' }, now);

  // Wallet account (no email): missing signature refused; bad signature refused.
  const { Keypair } = await import('@stellar/stellar-sdk');
  const kp = Keypair.random();
  const walletAccount = { publicKey: kp.publicKey(), displayName: null, createdAt: now };
  await assert.rejects(
    () => requireSocialLinkStepUp(store, walletAccount as any, now, {}, now),
    (e: any) => e.status === 403 && e.code === 'social_stepup_required',
  );
  await assert.rejects(
    () => requireSocialLinkStepUp(store, walletAccount as any, now, { signature: Buffer.alloc(64).toString('base64') }, now),
    (e: any) => e.status === 403 && e.code === 'social_stepup_failed',
  );
  // Legitimate: fresh challenge signed by the wallet passes, single-use.
  const { createChallenge } = await import('../src/accounts.js');
  const { message } = await createChallenge(store, kp.publicKey(), now);
  // SEP-53 framing, matching Freighter and accounts.ts verifySignature.
  const framed = Buffer.concat([Buffer.from('Stellar Signed Message:\n', 'utf8'), Buffer.from(message, 'utf8')]);
  const digest = (await import('node:crypto')).createHash('sha256').update(framed).digest();
  const sig = Buffer.from(kp.sign(digest)).toString('base64');
  await requireSocialLinkStepUp(store, walletAccount as any, now, { signature: sig }, now);
  await assert.rejects(
    () => requireSocialLinkStepUp(store, walletAccount as any, now, { signature: sig }, now),
    (e: any) => e.status === 403 && e.code === 'social_stepup_failed',
  );
});

test('social routes fail closed: 404 without provider config, 404 for unknown providers', async () => {
  const { base } = await startApp({});
  for (const path of ['/api/auth/social/google/start', '/api/auth/social/google/callback?code=x&state=y']) {
    const res = await fetch(base + path, { redirect: 'manual' });
    assert.equal(res.status, 404, path);
  }
  const res = await fetch(`${base}/api/auth/social/facebook/start`, { redirect: 'manual' });
  assert.equal(res.status, 404);
  Object.assign(process.env, CONF);
  const res2 = await fetch(`${base}/api/auth/social/facebook/start`, { redirect: 'manual' });
  assert.equal(res2.status, 404);
});

test('callback with an unknown state consumes nothing and redirects to the SPA error fragment', async () => {
  const fake = await makeFakeGoogle({});
  const { base } = await startApp(CONF, { socialFetch: fake.fetchImpl });
  const res = await fetch(`${base}/api/auth/social/google/callback?code=x&state=nope`, { redirect: 'manual' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/account#social-error=social_flow_expired');
});

test('new social registration is fail-closed: no allowlist, unverified email, unlisted email all refuse without creating anything', async () => {
  // Case 1: allowlist unset (fail closed) even with a verified email.
  const fake1 = await makeFakeGoogle({ email: 'someone@example.com', emailVerified: true });
  const app1 = await startApp(CONF, { socialFetch: fake1.fetchImpl });
  let res = await driveFlow(app1.base, fake1.fetchImpl, fake1.state);
  assert.equal(res.headers.get('location'), '/account#social-error=social_registration_restricted');
  const state1 = await app1.store.read();
  assert.equal(Object.keys(state1.socialIdentities).length, 0);
  assert.equal(Object.keys(state1.accounts).length, 0);

  // Case 2: allowlisted other address + provider did NOT verify the email.
  const fake2 = await makeFakeGoogle({ email: 'someone@example.com', emailVerified: false });
  const app2 = await startApp({ ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'someone@example.com' }, { socialFetch: fake2.fetchImpl });
  res = await driveFlow(app2.base, fake2.fetchImpl, fake2.state);
  assert.equal(res.headers.get('location'), '/account#social-error=social_registration_restricted');

  // Case 3: verified email but not on the list.
  const fake3 = await makeFakeGoogle({ email: 'someone@example.com', emailVerified: true });
  const app3 = await startApp({ ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'other@example.com' }, { socialFetch: fake3.fetchImpl });
  res = await driveFlow(app3.base, fake3.fetchImpl, fake3.state);
  assert.equal(res.headers.get('location'), '/account#social-error=social_registration_restricted');
});

test('allowlisted verified registration creates a social account and a working session; replay of the same state is rejected', async () => {
  const fake = await makeFakeGoogle({ email: 'nuno@example.com', emailVerified: true });
  const { base, store } = await startApp({ ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' }, { socialFetch: fake.fetchImpl });
  const start = await fetch(`${base}/api/auth/social/google/start`, { redirect: 'manual' });
  const authUrl = new URL(start.headers.get('location')!);
  fake.state.challenge = authUrl.searchParams.get('code_challenge');
  (globalThis as any).__testNonce = authUrl.searchParams.get('nonce');
  const state = authUrl.searchParams.get('state')!;
  const cb = await fetch(`${base}/api/auth/social/google/callback?code=fake&state=${encodeURIComponent(state)}`, { redirect: 'manual' });
  assert.equal(cb.status, 302);
  const loc = cb.headers.get('location')!;
  assert.ok(loc.startsWith('/account#social-token=bls_'), loc);
  const token = loc.split('=bls_')[1];
  // The session authenticates against the normal authed endpoints.
  const sessions = await fetch(`${base}/api/auth/sessions`, { headers: { authorization: `Bearer bls_${token}` } });
  assert.equal(sessions.status, 200);
  // /me serializes the real auth method (never 'wallet' for a social
  // account) and the owner's own provider-verified email.
  const me = await (await fetch(`${base}/api/auth/me`, { headers: { authorization: `Bearer bls_${token}` } })).json();
  assert.equal(me.account.authMethod, 'social');
  assert.equal(me.account.email, 'nuno@example.com');
  // Account + identity keyed on (provider, subject); email is reference only.
  const data = await store.read();
  const identity = data.socialIdentities['google:google-sub-123'];
  assert.ok(identity, 'identity stored under provider:subject');
  assert.equal(identity.email, 'nuno@example.com');
  const account = data.accounts[identity.publicKey];
  assert.equal(account.authMethod, 'social');
  assert.equal(account.email, 'nuno@example.com');
  // Flow is single-use: a replay never reaches the provider.
  const replay = await fetch(`${base}/api/auth/social/google/callback?code=fake&state=${encodeURIComponent(state)}`, { redirect: 'manual' });
  assert.equal(replay.headers.get('location'), '/account#social-error=social_flow_expired');
});

test('existing identity signs into the SAME account again; no duplicate account, no email-based lookup', async () => {
  const fake = await makeFakeGoogle({ email: 'nuno@example.com', emailVerified: true });
  const { base, store } = await startApp({ ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' }, { socialFetch: fake.fetchImpl });
  const cb1 = await driveFlow(base, fake.fetchImpl, fake.state);
  const key1 = (await store.read()).socialIdentities['google:google-sub-123'].publicKey;
  // A second flow for the same subject but a DIFFERENT (unlisted) email
  // still signs into the same account: the email is never a lookup key.
  fake.claims.email = 'changed@example.com';
  fake.claims.emailVerified = false;
  const cb2 = await driveFlow(base, fake.fetchImpl, fake.state);
  assert.ok(cb2.headers.get('location')!.startsWith('/account#social-token='), cb2.headers.get('location'));
  const data = await store.read();
  assert.equal(Object.keys(data.accounts).length, 1);
  assert.equal(data.socialIdentities['google:google-sub-123'].publicKey, key1);
  assert.ok(cb1.headers.get('location'));
});

test('a TOTP-enabled account gets a one-purpose ticket, not a session', async () => {
  const fake = await makeFakeGoogle({ email: 'nuno@example.com', emailVerified: true });
  const { base, store } = await startApp({ ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' }, { socialFetch: fake.fetchImpl });
  await driveFlow(base, fake.fetchImpl, fake.state);
  // Enable TOTP on the created account (enrollment crypto is irrelevant to
  // this gate: only status === enabled matters at social login).
  await store.change((s) => {
    const acct = s.accounts[s.socialIdentities['google:google-sub-123'].publicKey];
    acct.totp = { status: 'enabled', encSeed: 'x', lastUsedStep: -1, recoveryHashes: [], enabledAt: 1, failedAttempts: 0, lockUntil: null };
  });
  const cb = await driveFlow(base, fake.fetchImpl, fake.state);
  const loc = cb.headers.get('location')!;
  assert.ok(loc.startsWith('/account#social-totp=blt_'), loc);
  const data = await store.read();
  assert.equal(Object.keys(data.sessions).length, 1, 'no second session issued behind TOTP');
  assert.equal(Object.keys(data.totpTickets).length, 1, 'one ticket issued');
});

const PROVIDER_CONFS: Record<string, Record<string, string>> = {
  linkedin: { SOCIAL_LINKEDIN_CLIENT_ID: CLIENT_ID, SOCIAL_LINKEDIN_CLIENT_SECRET: CLIENT_SECRET },
  telegram: { SOCIAL_TELEGRAM_CLIENT_ID: CLIENT_ID, SOCIAL_TELEGRAM_CLIENT_SECRET: CLIENT_SECRET },
};

test('linkedin and telegram routes exist only with their own env config; github stays 404', async () => {
  const { base } = await startApp({});
  for (const p of ['linkedin', 'telegram', 'github']) {
    const res = await fetch(`${base}/api/auth/social/${p}/start`, { redirect: 'manual' });
    assert.equal(res.status, 404, `${p} without env`);
  }
  const conf = { ...CONF, ...PROVIDER_CONFS.linkedin, ...PROVIDER_CONFS.telegram };
  const fake = await makeFakeProvider('linkedin', {});
  const app2 = await startApp(conf, { socialFetch: fake.fetchImpl });
  const cfg = await (await fetch(`${app2.base}/api/auth/abuse-config`)).json();
  assert.deepEqual([...cfg.socialProviders].sort(), ['google', 'linkedin', 'telegram']);
  const gh = await fetch(`${app2.base}/api/auth/social/github/start`, { redirect: 'manual' });
  assert.equal(gh.status, 404, 'github not implemented (no OIDC)');
});

test('linkedin completes a full allowlisted registration flow and issues a working session', async () => {
  const fake = await makeFakeProvider('linkedin', { email: 'nuno@example.com', emailVerified: true });
  const { base, store } = await startApp(
    { ...PROVIDER_CONFS.linkedin, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' },
    { socialFetch: fake.fetchImpl },
  );
  const cb = await driveFlow(base, fake.fetchImpl, fake.state, 'linkedin');
  const loc = cb.headers.get('location')!;
  assert.ok(loc.startsWith('/account#social-token=bls_'), loc);
  const data = await store.read();
  assert.ok(data.socialIdentities['linkedin:linkedin-sub-123'], 'identity stored under linkedin:subject');
});

test('telegram (identity only): pending ticket, allowlisted email proven by code, no auto-link', async () => {
  const sent: { to: string; text: string }[] = [];
  const mailer = { send: async (m: { to: string; subject: string; text: string }) => void sent.push(m) };
  const post = (base: string, path: string, body: unknown) =>
    fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const fake = await makeFakeProvider('telegram', {});
  const env = { ...PROVIDER_CONFS.telegram, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' };
  const { base, store } = await startApp(env, { socialFetch: fake.fetchImpl, mailer });
  const start = await fetch(`${base}/api/auth/social/telegram/start`, { redirect: 'manual' });
  assert.equal(new URL(start.headers.get('location')!).searchParams.get('scope'), 'openid profile');
  const cb = await driveFlow(base, fake.fetchImpl, fake.state, 'telegram');
  const loc = cb.headers.get('location')!;
  assert.ok(loc.startsWith('/account#social-email=bsp_'), loc);
  const ticket = loc.split('=')[1];
  assert.equal(Object.keys((await store.read()).accounts).length, 0, 'no account before the email proof');

  // An ineligible email gets the same answer and no mail.
  let r = await post(base, '/api/auth/social/email/request', { ticket, email: 'stranger@example.com' });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { status: 'code-sent' });
  assert.equal(sent.length, 0);
  // Cooldown applies to the next request too (no signal difference).
  r = await post(base, '/api/auth/social/email/request', { ticket, email: 'nuno@example.com' });
  assert.equal(sent.length, 0, 'cooldown blocks an immediate retry');
  // Expire the cooldown, then the allowlisted email is mailed a code.
  await store.change((s) => {
    for (const p of Object.values(s.socialPending)) p.sentAt = 0;
  });
  r = await post(base, '/api/auth/social/email/request', { ticket, email: 'nuno@example.com' });
  assert.equal(r.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'nuno@example.com');
  const code = sent[0].text.match(/\b(\d{6})\b/)![1];
  // Wrong code and wrong ticket fail; the right pair creates the account.
  r = await post(base, '/api/auth/social/email/confirm', { ticket, code: code === '000000' ? '111111' : '000000' });
  assert.equal(r.status, 400);
  r = await post(base, '/api/auth/social/email/confirm', { ticket: 'bsp_' + '0'.repeat(48), code });
  assert.equal(r.status, 401);
  r = await post(base, '/api/auth/social/email/confirm', { ticket, code });
  assert.equal(r.status, 200);
  const body = (await r.json()) as { token: string };
  assert.ok(body.token.startsWith('bls_'));
  const data = await store.read();
  assert.equal(Object.keys(data.accounts).length, 1);
  assert.equal(Object.values(data.accounts)[0].email, 'nuno@example.com');
  assert.ok(data.socialIdentities['telegram:telegram-sub-123']);
  // Ticket is single use.
  r = await post(base, '/api/auth/social/email/confirm', { ticket, code });
  assert.equal(r.status, 401);
  // The identity now signs in directly.
  const again = await driveFlow(base, fake.fetchImpl, fake.state, 'telegram');
  assert.ok(again.headers.get('location')!.startsWith('/account#social-token=bls_'));
});

test('telegram pending: an email that already has an account is never linked from here', async () => {
  const sent: { to: string; text: string }[] = [];
  const mailer = { send: async (m: { to: string; subject: string; text: string }) => void sent.push(m) };
  const fake = await makeFakeProvider('telegram', {});
  const env = { ...PROVIDER_CONFS.telegram, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' };
  const { base, store } = await startApp(env, { socialFetch: fake.fetchImpl, mailer });
  await store.change((s) => {
    s.accounts['GEXISTING'] = { publicKey: 'GEXISTING', displayName: null, createdAt: 1, authMethod: 'social', email: 'nuno@example.com' };
  });
  const cb = await driveFlow(base, fake.fetchImpl, fake.state, 'telegram');
  const ticket = cb.headers.get('location')!.split('=')[1];
  const r = await fetch(`${base}/api/auth/social/email/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ticket, email: 'nuno@example.com' }),
  });
  assert.equal(r.status, 200);
  assert.equal(sent.length, 0, 'no code is mailed for an email that belongs to an account');
  assert.equal(Object.keys((await store.read()).socialIdentities).length, 0);
});
