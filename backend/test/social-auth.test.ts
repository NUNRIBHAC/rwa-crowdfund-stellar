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
async function makeFakeProvider(provider: string, opts: { email?: string; emailVerified?: boolean; subject?: string; phone?: string }) {
  const ISSUER = PROVIDER_ISSUERS[provider];
  if (!ISSUER) throw new Error(`no fake for ${provider}`);
  // claims are mutable: tests update them between flows to simulate the
  // provider returning different profile data for the same subject.
  const claims = { email: opts.email, emailVerified: opts.emailVerified, phone: opts.phone };
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
        phone_number: claims.phone,
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
    'SOCIAL_DISCORD_CLIENT_ID',
    'SOCIAL_DISCORD_CLIENT_SECRET',
    'SOCIAL_DISCORD_REDIRECT_URI',
    'SOCIAL_REGISTRATION_ALLOWED_EMAILS',
    'SOCIAL_REGISTRATION_ALLOWED_PHONES',
    'SOCIAL_VALIDATION_PROVIDERS',
    'FARCASTER_AUTH_DOMAIN',
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
async function driveFlow(
  base: string,
  fetchImpl: typeof fetch,
  challengeHolder: { challenge: string | null },
  provider = 'google',
  callbackCookie?: string | null,
  registrationMethod?: 'phone',
) {
  const start = await fetch(`${base}/api/auth/social/${provider}/start${registrationMethod ? '?registration=phone' : ''}`, { redirect: 'manual' });
  assert.equal(start.status, 302);
  const authUrl = new URL(start.headers.get('location')!);
  assert.ok(authUrl.href.startsWith(PROVIDER_ISSUERS[provider]), `${provider} authorization URL on its issuer`);
  assert.equal(authUrl.searchParams.get('client_id'), CLIENT_ID);
  assert.equal(authUrl.searchParams.get('response_type'), 'code');
  assert.equal(authUrl.searchParams.get('scope'), registrationMethod === 'phone' ? 'openid profile phone' : PROVIDER_SCOPES[provider]);
  assert.equal(authUrl.searchParams.get('code_challenge_method'), 'S256');
  const state = authUrl.searchParams.get('state')!;
  const nonce = authUrl.searchParams.get('nonce')!;
  assert.ok(state && nonce, 'state and nonce issued');
  challengeHolder.challenge = authUrl.searchParams.get('code_challenge');
  (globalThis as any).__testNonce = nonce;
  const cookie = (start.headers.get('set-cookie') ?? '').split(';')[0];
  const sent = callbackCookie === undefined ? cookie : callbackCookie;
  const cb = await fetch(`${base}/api/auth/social/${provider}/callback?code=fake-auth-code&state=${encodeURIComponent(state)}`, {
    redirect: 'manual',
    headers: sent ? { cookie: sent } : {},
  });
  return Object.assign(cb, { bindCookie: cookie });
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
  return fetch(`${base}/api/auth/social/github/callback?code=fake-gh-code&state=${encodeURIComponent(state)}`, {
    headers: { cookie: (start.headers.get('set-cookie') ?? '').split(';')[0] },
    redirect: 'manual',
  });
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
  if (!body.password && !body.signature) {
    const proofStart = await fetch(`${base}/api/auth/social/${provider}/link-proof/start`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(proofStart.status, 200);
    const proofUrl = new URL(((await proofStart.json()) as any).url);
    challengeHolder.challenge = proofUrl.searchParams.get('code_challenge');
    (globalThis as any).__testNonce = proofUrl.searchParams.get('nonce');
    const callback = await fetch(
      `${base}/api/auth/social/${provider}/callback?code=fake-auth-code&state=${encodeURIComponent(proofUrl.searchParams.get('state')!)}`,
      { redirect: 'manual', headers: { cookie: proofStart.headers.get('set-cookie')!.split(';')[0] } },
    );
    const location = callback.headers.get('location')!;
    assert.match(location, /#link-proof=bll_/);
    body = { ...body, providerProof: location.split('#link-proof=')[1] };
  }
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
  // A fresh bearer is not a fresh linked-provider identity proof.
  await assert.rejects(requireSocialLinkStepUp(store, socialAccount as any, now - 60 * 1000, {}, now), (e: any) => e.code === 'social_stepup_required');

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
  const cb = await fetch(`${base}/api/auth/social/google/callback?code=fake&state=${encodeURIComponent(state)}`, {
    headers: { cookie: (start.headers.get('set-cookie') ?? '').split(';')[0] },
    redirect: 'manual',
  });
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
  let cookie = '';
  const post = (base: string, path: string, body: unknown, ck = cookie) =>
    fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(ck ? { cookie: ck } : {}) }, body: JSON.stringify(body) });
  const fake = await makeFakeProvider('telegram', {});
  const env = { ...PROVIDER_CONFS.telegram, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' };
  const { base, store } = await startApp(env, { socialFetch: fake.fetchImpl, mailer });
  const start = await fetch(`${base}/api/auth/social/telegram/start`, { redirect: 'manual' });
  assert.equal(new URL(start.headers.get('location')!).searchParams.get('scope'), 'openid profile');
  const cb = await driveFlow(base, fake.fetchImpl, fake.state, 'telegram');
  cookie = cb.bindCookie;
  assert.match(cookie, /^bl_sso=[0-9a-f]{48}$/);
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
  // Cross-browser: the same ticket and the RIGHT code without this browser's
  // cookie (or with another browser's) can neither request nor confirm.
  const other = (await fetch(`${base}/api/auth/social/telegram/start`, { redirect: 'manual' })).headers.get('set-cookie')!.split(';')[0];
  for (const ck of ['', other]) {
    r = await post(base, '/api/auth/social/email/confirm', { ticket, code }, ck);
    assert.equal(r.status, 401, 'stolen ticket + valid code must not bind');
    r = await post(base, '/api/auth/social/email/request', { ticket, email: 'nuno@example.com' }, ck);
    assert.equal(r.status, 401);
  }
  assert.equal(Object.keys((await store.read()).accounts).length, 0);
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
    headers: { 'content-type': 'application/json', cookie: cb.bindCookie },
    body: JSON.stringify({ ticket, email: 'nuno@example.com' }),
  });
  assert.equal(r.status, 200);
  assert.equal(sent.length, 0, 'no code is mailed for an email that belongs to an account');
  assert.equal(Object.keys((await store.read()).socialIdentities).length, 0);
});

test('callback replayed from another browser (no cookie) is rejected and consumes the flow', async () => {
  const fake = await makeFakeProvider('telegram', {});
  const { base, store } = await startApp(
    { ...PROVIDER_CONFS.telegram, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' },
    { socialFetch: fake.fetchImpl, mailer: { send: async () => {} } },
  );
  const cb = await driveFlow(base, fake.fetchImpl, fake.state, 'telegram', null);
  assert.ok(!cb.headers.get('location')!.includes('social-email=bsp_'));
  assert.equal(Object.keys((await store.read()).socialPending).length, 0);
});

import { createSiweMessage } from 'viem/siwe';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { createPublicClient, custom } from 'viem';
import { optimism } from 'viem/chains';
import { defaultFarcasterVerifier } from '../src/farcaster-auth.js';

const FC_DOMAIN = 'app.example.test';
const fcAccount = privateKeyToAccount(generatePrivateKey());
async function siwe(nonce: string, over: Record<string, unknown> = {}, acct = fcAccount, fid = 3357330) {
  const message = createSiweMessage({
    address: acct.address,
    chainId: 10,
    domain: FC_DOMAIN,
    nonce,
    uri: `https://${FC_DOMAIN}/account`,
    version: '1',
    statement: 'Farcaster Auth',
    resources: [`farcaster://fid/${fid}`],
    issuedAt: new Date(),
    expirationTime: new Date(Date.now() + 5 * 60 * 1000),
    ...over,
  } as never);
  return { message, signature: await acct.signMessage({ message }) };
}
// REAL @farcaster/auth-client verification (statement, chain 10, fid resource,
// nonce, domain, auth-address check). The Optimism RPC is stubbed: eth_call
// answers "valid" for the signature validator (so signature forgery is NOT tested) and the fid
// registry reads are replaced by an in-memory connector.
function stubConnector(ownerFid: bigint | ((addr: string) => bigint), callResult: 'valid' | 'invalid' | 'error' = 'valid') {
  const publicClient = createPublicClient({
    chain: optimism,
    transport: custom({
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_call') {
          if (callResult === 'error') throw new Error('rpc down');
          return callResult === 'valid' ? '0x01' : '0x00';
        }
        return method === 'eth_chainId' ? '0xa' : '0x';
      },
    }),
  });
  return {
    publicClient,
    getFid: async (addr: string) => (typeof ownerFid === 'function' ? ownerFid(addr) : ownerFid),
    isValidAuthAddress: async () => false,
  } as never;
}

test('farcaster: real SIWF verification, server nonce, browser binding, pending-email then account', async () => {
  const sent: { to: string; text: string }[] = [];
  const mailer = { send: async (m: { to: string; subject: string; text: string }) => void sent.push(m) };
  const env = { FARCASTER_AUTH_DOMAIN: FC_DOMAIN, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' };
  const farcasterVerifier = defaultFarcasterVerifier({}, stubConnector(3357330n));
  const { base, store } = await startApp(env, { mailer, farcasterVerifier });
  const post = (path: string, body: unknown, ck = '') =>
    fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(ck ? { cookie: ck } : {}) }, body: JSON.stringify(body) });
  const getNonce = async () => {
    const r = await post('/api/auth/farcaster/nonce', {});
    return { ck: r.headers.get('set-cookie')!.split(';')[0], ...((await r.json()) as { nonce: string; domain: string; siweUri: string }) };
  };
  const cfg = (await (await fetch(`${base}/api/auth/abuse-config`)).json()) as { socialProviders: string[] };
  assert.ok(cfg.socialProviders.includes('farcaster'));

  // Wrong browser: rejected and does NOT burn the owner's nonce.
  const a = await getNonce();
  assert.equal(a.siweUri, `https://${FC_DOMAIN}/account`);
  const other = (await getNonce()).ck;
  const m = await siwe(a.nonce);
  let r = await post('/api/auth/farcaster/verify', { nonce: a.nonce, ...m }, other);
  assert.equal(r.status, 401);
  r = await post('/api/auth/farcaster/verify', { nonce: a.nonce, ...m }, a.ck);
  assert.equal(r.status, 200, 'owner browser still succeeds after a stranger attempt');
  const { socialEmailTicket } = (await r.json()) as { socialEmailTicket: string };
  assert.ok(socialEmailTicket.startsWith('bsp_'));
  assert.equal(Object.keys((await store.read()).accounts).length, 0);
  r = await post('/api/auth/farcaster/verify', { nonce: a.nonce, ...m }, a.ck);
  assert.equal(r.status, 401, 'nonce is single use');

  // Message-level rejections (each burns only its own nonce, after binding).
  const rejects: Array<[string, (n: string) => Promise<{ message: string; signature: string }>]> = [
    ['wrong domain', (n) => siwe(n, { domain: 'evil.example.test' })],
    ['wrong uri', (n) => siwe(n, { uri: 'https://evil.example.test/account' })],
    ['wrong chain', (n) => siwe(n, { chainId: 1 })],
    ['wrong statement', (n) => siwe(n, { statement: 'Sign in to anything' })],
    ['expired', (n) => siwe(n, { issuedAt: new Date(Date.now() - 3600_000), expirationTime: new Date(Date.now() - 1000) })],
    ['stale issuedAt', (n) => siwe(n, { issuedAt: new Date(Date.now() - 3600_000), expirationTime: new Date(Date.now() + 3600_000) })],
    ['no fid resource', (n) => siwe(n, { resources: [] })],
    ['wrong nonce in message', () => siwe('b'.repeat(32))],
  ];
  for (const [label, build] of rejects) {
    const n = await getNonce();
    const bad = await build(n.nonce);
    const res = await post('/api/auth/farcaster/verify', { nonce: n.nonce, ...bad }, n.ck);
    assert.equal(res.status, 401, label);
  }
  // NOTE: signature validity itself is checked on-chain by the library through the
  // Optimism RPC (stubbed here), so a forged-signature case is NOT proven by this test.
  assert.equal(Object.keys((await store.read()).socialIdentities).length, 0);

  // Email proof, same cookie only.
  await post('/api/auth/social/email/request', { ticket: socialEmailTicket, email: 'nuno@example.com' }, a.ck);
  assert.equal(sent.length, 1);
  const code = sent[0].text.match(/\b(\d{6})\b/)![1];
  r = await post('/api/auth/social/email/confirm', { ticket: socialEmailTicket, code }, other);
  assert.equal(r.status, 401);
  r = await post('/api/auth/social/email/confirm', { ticket: socialEmailTicket, code }, a.ck);
  assert.equal(r.status, 200);
  assert.ok((await store.read()).socialIdentities['farcaster:3357330']);

  // Returning fid signs in directly.
  const n4 = await getNonce();
  r = await post('/api/auth/farcaster/verify', { nonce: n4.nonce, ...(await siwe(n4.nonce)) }, n4.ck);
  assert.ok(((await r.json()) as { token?: string }).token?.startsWith('bls_'));

  // A signer that does not own the claimed fid is refused.
  const { base: base2 } = await startApp(env, { mailer, farcasterVerifier: defaultFarcasterVerifier({}, stubConnector(1n)) });
  const rr = await fetch(`${base2}/api/auth/farcaster/nonce`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const n5 = (await rr.json()) as { nonce: string };
  const res5 = await fetch(`${base2}/api/auth/farcaster/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: rr.headers.get('set-cookie')!.split(';')[0] },
    body: JSON.stringify({ nonce: n5.nonce, ...(await siwe(n5.nonce)) }),
  });
  assert.equal(res5.status, 401);
});

test('farcaster routes do not exist without FARCASTER_AUTH_DOMAIN (fail-closed)', async () => {
  const { base } = await startApp({}, {});
  const r = await fetch(`${base}/api/auth/farcaster/nonce`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 404);
  const cfg = (await (await fetch(`${base}/api/auth/abuse-config`)).json()) as { socialProviders: string[] };
  assert.ok(!cfg.socialProviders.includes('farcaster'));
});

test('farcaster linking: step-up, binds the fid to the signed-in account only; owned fid is never reassigned; no email auto-link', async () => {
  const sent: { to: string; text: string }[] = [];
  const mailer = { send: async (m: { to: string; subject: string; text: string }) => void sent.push(m) };
  const accA = privateKeyToAccount(generatePrivateKey());
  const accB = privateKeyToAccount(generatePrivateKey());
  const accC = privateKeyToAccount(generatePrivateKey());
  const fidOf = (addr: string) => (addr === accA.address ? 11n : addr === accC.address ? 33n : 22n);
  const env = { FARCASTER_AUTH_DOMAIN: FC_DOMAIN, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'a@example.com,b@example.com' };
  const { base, store } = await startApp(env, { mailer, farcasterVerifier: defaultFarcasterVerifier({}, stubConnector(fidOf)) });
  const post = (path: string, body: unknown, ck = '', token = '') =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(ck ? { cookie: ck } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  const nonceOf = async (path: string, token = '') => {
    let body: Record<string, string> = {};
    if (path === '/api/auth/farcaster/link/nonce' && token) {
      const start = await post('/api/auth/farcaster/link-proof/nonce', {}, '', token);
      assert.equal(start.status, 200);
      const nonce = ((await start.json()) as { nonce: string }).nonce;
      const signed = await siwe(nonce, { uri: `https://${FC_DOMAIN}/account?purpose=account-link` }, accA, 11);
      const verified = await post('/api/auth/farcaster/verify', { nonce, ...signed }, start.headers.get('set-cookie')!.split(';')[0]);
      assert.equal(verified.status, 200);
      body = { providerProof: ((await verified.json()) as { providerProof: string }).providerProof };
    }
    const r = await post(path, body, '', token);
    return { status: r.status, ck: (r.headers.get('set-cookie') ?? '').split(';')[0], ...((await r.json()) as { nonce: string }) };
  };
  const register = async (acct: typeof accA, fid: number, email: string) => {
    const n = await nonceOf('/api/auth/farcaster/nonce');
    const v = (await (await post('/api/auth/farcaster/verify', { nonce: n.nonce, ...(await siwe(n.nonce, {}, acct, fid)) }, n.ck)).json()) as {
      socialEmailTicket: string;
    };
    const before = sent.length;
    await post('/api/auth/social/email/request', { ticket: v.socialEmailTicket, email }, n.ck);
    assert.equal(sent.length, before + 1);
    const code = sent[sent.length - 1].text.match(/\b(\d{6})\b/)![1];
    const c = (await (await post('/api/auth/social/email/confirm', { ticket: v.socialEmailTicket, code }, n.ck)).json()) as { token: string };
    return c.token;
  };
  const tokA = await register(accA, 11, 'a@example.com');
  await register(accB, 22, 'b@example.com');
  assert.equal(Object.keys((await store.read()).socialIdentities).length, 2);

  // Link requires authentication.
  assert.equal((await post('/api/auth/farcaster/link/nonce', {})).status, 401);

  // A (fid 11) links a SECOND fid (22 key is owned by B): refused, nothing reassigned.
  const l1 = await nonceOf('/api/auth/farcaster/link/nonce', tokA);
  assert.equal(l1.status, 200);
  const r1 = await post('/api/auth/farcaster/verify', { nonce: l1.nonce, ...(await siwe(l1.nonce, {}, accB, 22)) }, l1.ck);
  assert.equal(r1.status, 409);
  assert.equal(
    (await store.read()).socialIdentities['farcaster:22'].publicKey,
    Object.values((await store.read()).accounts).find((a) => a.email === 'b@example.com')!.publicKey,
  );

  // A links its own fid again: idempotent no-op, no session issued, no duplicate.
  const sessionsBefore = Object.keys((await store.read()).sessions).length;
  const l2 = await nonceOf('/api/auth/farcaster/link/nonce', tokA);
  const r2 = await post('/api/auth/farcaster/verify', { nonce: l2.nonce, ...(await siwe(l2.nonce, {}, accA, 11)) }, l2.ck);
  assert.equal(r2.status, 200);
  assert.deepEqual(await r2.json(), { status: 'linked' });
  const st = await store.read();
  assert.equal(Object.keys(st.socialIdentities).length, 2);
  assert.equal(Object.keys(st.sessions).length, sessionsBefore);

  // A new fid (33) linked by signed-in A attaches to A only.
  const l3 = await nonceOf('/api/auth/farcaster/link/nonce', tokA);
  const r3 = await post('/api/auth/farcaster/verify', { nonce: l3.nonce, ...(await siwe(l3.nonce, {}, accC, 33)) }, l3.ck);
  assert.equal(r3.status, 200);
  const aPub = Object.values((await store.read()).accounts).find((x) => x.email === 'a@example.com')!.publicKey;
  assert.equal((await store.read()).socialIdentities['farcaster:33'].publicKey, aPub);
  // Another browser cannot spend A's link nonce.
  const l4 = await nonceOf('/api/auth/farcaster/link/nonce', tokA);
  const r4 = await post('/api/auth/farcaster/verify', { nonce: l4.nonce, ...(await siwe(l4.nonce, {}, accC, 33)) }, 'bl_sso=' + 'f'.repeat(48));
  assert.equal(r4.status, 401);
});

// Negative contract: when the on-chain signature validator says "invalid" (a forged
// or wrong-key signature) or the RPC fails, no session, identity, account, pending
// ticket or link can result, even though the message itself is perfectly formed and
// the signer "owns" the fid in the registry stub.
for (const mode of ['invalid', 'error', 'valid'] as const) {
  test(`farcaster: forged signature + bad signature proof (${mode}) never reaches a session, pending ticket or link`, async () => {
    const env = { FARCASTER_AUTH_DOMAIN: FC_DOMAIN, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'nuno@example.com' };
    const { base, store } = await startApp(env, { farcasterVerifier: defaultFarcasterVerifier({}, stubConnector(3357330n, mode)) });
    const nr = await fetch(`${base}/api/auth/farcaster/nonce`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    const ck = nr.headers.get('set-cookie')!.split(';')[0];
    const { nonce } = (await nr.json()) as { nonce: string };
    const real = await siwe(nonce);
    // Forged: well-formed message for the fid owner, signed by a DIFFERENT key.
    const m = { message: real.message, signature: await privateKeyToAccount(generatePrivateKey()).signMessage({ message: real.message }) };
    const res = await fetch(`${base}/api/auth/farcaster/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: ck },
      body: JSON.stringify({ nonce, ...m }),
    });
    assert.ok(res.status === 401 || res.status === 502, `status ${res.status}`);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.token, undefined);
    assert.equal(body.socialEmailTicket, undefined);
    const st = await store.read();
    assert.equal(Object.keys(st.socialIdentities).length, 0);
    assert.equal(Object.keys(st.accounts).length, 0);
    assert.equal(Object.keys(st.sessions ?? {}).length, 0);
    const again = await fetch(`${base}/api/auth/farcaster/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: ck },
      body: JSON.stringify({ nonce, ...m }),
    });
    assert.equal(again.status, 401, 'failed proof burns the nonce');
  });
}

test('validation-provider list requires a verified allowlisted account and exposes no credentials', async () => {
  const { hashToken } = await import('../src/accounts.js');
  const { base, store } = await startApp({ ...CONF, SOCIAL_VALIDATION_PROVIDERS: 'google, github', SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'owner@example.com' });
  const url = base + '/api/auth/social/validation-providers';
  assert.equal((await fetch(url)).status, 401);
  const token = 'bls_' + 'a'.repeat(48);
  const publicKey = 'GVALIDATIONOWNER';
  const headers = { authorization: `Bearer ${token}` };
  await store.change((s) => {
    s.accounts[publicKey] = { publicKey, displayName: null, createdAt: Date.now(), authMethod: 'email', email: 'owner@example.com' };
    s.sessions[hashToken(token)] = { tokenHash: hashToken(token), publicKey, createdAt: Date.now(), expiresAt: Date.now() + 60000 };
  });
  assert.equal((await fetch(url, { headers })).status, 403, 'email text alone is not verified ownership');
  const { registerEmail, verifyEmailToken } = await import('../src/email-auth.js');
  let mail = '';
  await registerEmail(
    store,
    {
      send: async (m) => {
        mail = m.text;
      },
    },
    { email: 'owner@example.com', password: 'original-long-password' },
  );
  const proof = mail.match(/blv_[0-9a-f]{48}/)?.[0];
  assert.ok(proof);
  const verified = await verifyEmailToken(store, { email: 'owner@example.com', token: proof, password: 'original-long-password' });
  const goodHeaders = { authorization: `Bearer ${verified.token}` };
  const accepted = await fetch(url, { headers: goodHeaders });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.headers.get('cache-control'), 'no-store');
  const data = await accepted.json();
  assert.deepEqual(data, { socialProviders: ['google'] });
  assert.ok(!JSON.stringify(data).includes(CLIENT_SECRET));
  process.env.SOCIAL_REGISTRATION_ALLOWED_EMAILS = 'other@example.com';
  assert.equal((await fetch(url, { headers: goodHeaders })).status, 403, 'revoked allowlist access fails closed');
});

test('dedicated social deletion HTTP ceremony returns proof only and requires a separate final DELETE', async () => {
  const fake = await makeFakeProvider('google', { email: 'delete@example.com', emailVerified: true });
  const { base, store } = await startApp({ ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'delete@example.com' }, { socialFetch: fake.fetchImpl });
  const login = await driveFlow(base, fake.fetchImpl, fake.state);
  const token = login.headers.get('location')!.split('social-token=')[1];
  assert.ok(token?.startsWith('bls_'));
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  assert.equal((await fetch(base + '/api/auth/account/deletion-providers')).status, 401);
  assert.deepEqual(await (await fetch(base + '/api/auth/account/deletion-providers', { headers })).json(), { providers: ['google'] });
  const startUrl = base + '/api/auth/account/deletion-provider/google/start';
  assert.equal((await fetch(startUrl, { method: 'POST', headers, body: '{}' })).status, 400);
  const start = await fetch(startUrl, { method: 'POST', headers, body: JSON.stringify({ confirmation: 'DELETE' }) });
  assert.equal(start.status, 200);
  const authUrl = new URL((await start.json()).url);
  fake.state.challenge = authUrl.searchParams.get('code_challenge');
  (globalThis as any).__testNonce = authUrl.searchParams.get('nonce');
  const before = await store.read();
  const callback = await fetch(base + '/api/auth/social/google/callback?code=fake&state=' + encodeURIComponent(authUrl.searchParams.get('state')!), {
    redirect: 'manual',
    headers: { cookie: (start.headers.get('set-cookie') ?? '').split(';')[0] },
  });
  const location = callback.headers.get('location')!;
  assert.match(location, /^\/account#deletion-proof=bld_[0-9a-f]{48}$/);
  const after = await store.read();
  assert.deepEqual(after.accounts, before.accounts);
  assert.deepEqual(after.sessions, before.sessions);
  assert.deepEqual(after.socialIdentities, before.socialIdentities);
  const socialProof = location.split('deletion-proof=')[1];
  const deleteUrl = base + '/api/auth/account/delete';
  assert.equal((await fetch(deleteUrl, { method: 'POST', headers, body: JSON.stringify({ socialProof }) })).status, 400);
  assert.equal((await fetch(deleteUrl, { method: 'POST', headers, body: JSON.stringify({ confirmation: 'DELETE', socialProof }) })).status, 200);
  const final = await store.read();
  assert.equal(Object.keys(final.accounts).length, 0);
  assert.equal(Object.keys(final.sessions).length, 0);
  assert.equal(Object.keys(final.socialIdentities).length, 0);
  assert.equal((await fetch(base + '/api/auth/me', { headers })).status, 401);
});

test('Farcaster deletion foundation: dedicated signed URI, linked fid and original session, callback proof only', async () => {
  const { issueFarcasterDeletionNonce, verifyFarcasterSignIn } = await import('../src/farcaster-auth.js');
  const { newBindSecret } = await import('../src/social-auth.js');
  const fake = await makeFakeProvider('google', { email: 'fcdelete@example.com', emailVerified: true });
  const { base, store } = await startApp({ ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'fcdelete@example.com' }, { socialFetch: fake.fetchImpl });
  const login = await driveFlow(base, fake.fetchImpl, fake.state);
  const authorization = 'Bearer ' + login.headers.get('location')!.split('social-token=')[1];
  const state = await store.read();
  const publicKey = Object.keys(state.accounts)[0];
  await store.change((s) => {
    s.socialIdentities['farcaster:3357330'] = { provider: 'farcaster', subject: '3357330', publicKey, createdAt: Date.now(), lastLoginAt: Date.now() };
  });
  const bind = newBindSecret();
  await assert.rejects(issueFarcasterDeletionNonce(store, authorization, bind.hash, 'delete'), { code: 'deletion_confirmation_required' });
  const verifier = defaultFarcasterVerifier({}, stubConnector(3357330n));
  const ordinary = await issueFarcasterDeletionNonce(store, authorization, bind.hash, 'DELETE');
  await assert.rejects(
    verifyFarcasterSignIn(
      store,
      { FARCASTER_AUTH_DOMAIN: FC_DOMAIN },
      verifier,
      { nonce: ordinary.nonce, ...(await siwe(ordinary.nonce)), bind: bind.secret },
      Date.now(),
      authorization,
    ),
    { code: 'social_exchange_failed' },
  );
  const otherIdentity = await issueFarcasterDeletionNonce(store, authorization, bind.hash, 'DELETE');
  const otherSigned = await siwe(otherIdentity.nonce, { uri: `https://${FC_DOMAIN}/account?purpose=account-deletion` }, fcAccount, 123);
  await assert.rejects(
    verifyFarcasterSignIn(
      store,
      { FARCASTER_AUTH_DOMAIN: FC_DOMAIN },
      defaultFarcasterVerifier({}, stubConnector(123n)),
      {
        nonce: otherIdentity.nonce,
        ...otherSigned,
        bind: bind.secret,
      },
      Date.now(),
      authorization,
    ),
    { code: 'deletion_proof_failed' },
  );
  const dedicated = await issueFarcasterDeletionNonce(store, authorization, bind.hash, 'DELETE');
  const signed = await siwe(dedicated.nonce, { uri: `https://${FC_DOMAIN}/account?purpose=account-deletion` });
  const before = await store.read();
  const result = await verifyFarcasterSignIn(
    store,
    { FARCASTER_AUTH_DOMAIN: FC_DOMAIN },
    verifier,
    { nonce: dedicated.nonce, ...signed, bind: bind.secret },
    Date.now(),
    authorization,
  );
  assert.equal(result.kind, 'deletion-proof');
  if (result.kind !== 'deletion-proof') throw new Error('wrong outcome');
  const { consumeSocialDeletionProof } = await import('../src/deletion-proof.js');
  assert.equal(await store.change((s) => consumeSocialDeletionProof(s, undefined, result.proof, Date.now())).catch(() => false), false);
  const after = await store.read();
  assert.deepEqual(after.accounts, before.accounts);
  assert.deepEqual(after.sessions, before.sessions);
  assert.deepEqual(after.socialIdentities, before.socialIdentities);
  await assert.rejects(
    verifyFarcasterSignIn(
      store,
      { FARCASTER_AUTH_DOMAIN: FC_DOMAIN },
      verifier,
      { nonce: dedicated.nonce, ...signed, bind: bind.secret },
      Date.now(),
      authorization,
    ),
    {
      code: 'social_flow_expired',
    },
  );
});

test('Farcaster client builds the dedicated deletion URI without replacing it', async () => {
  const { createWalletClient } = await import('@farcaster/auth-client');
  const wallet = createWalletClient({});
  const uri = `https://${FC_DOMAIN}/account?purpose=account-deletion`;
  const request = new URL('farcaster://connect');
  request.searchParams.set('channelToken', 'local-fixture-channel');
  request.searchParams.set('nonce', '1234567890abcdef');
  request.searchParams.set('siweUri', uri);
  request.searchParams.set('domain', FC_DOMAIN);
  const parsed = wallet.parseSignInURI({ uri: request.href });
  assert.equal(parsed.isError, false);
  assert.equal(parsed.channelToken, 'local-fixture-channel');
  // Installed0.7.1 parser returns only channelToken, unlike the current docs.
  const built = wallet.buildSignInMessage({ uri, domain: FC_DOMAIN, nonce: '1234567890abcdef', address: fcAccount.address, fid: 3357330 });
  assert.equal(built.isError, false);
  assert.equal(built.siweMessage?.uri, uri);
  assert.equal(built.siweMessage?.statement, 'Farcaster Auth');
});

test('dedicated Farcaster deletion HTTP routes separate identity proof from login and final deletion', async () => {
  const fake = await makeFakeProvider('google', { email: 'fc-http@example.com', emailVerified: true });
  const { base, store } = await startApp(
    { ...CONF, FARCASTER_AUTH_DOMAIN: FC_DOMAIN, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'fc-http@example.com' },
    { socialFetch: fake.fetchImpl, farcasterVerifier: defaultFarcasterVerifier({}, stubConnector(3357330n)) },
  );
  const login = await driveFlow(base, fake.fetchImpl, fake.state);
  const token = login.headers.get('location')!.split('social-token=')[1];
  const state = await store.read();
  const publicKey = Object.keys(state.accounts)[0];
  await store.change((s) => {
    s.socialIdentities['farcaster:3357330'] = { provider: 'farcaster', subject: '3357330', publicKey, createdAt: Date.now(), lastLoginAt: Date.now() };
  });
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const post = (path: string, body: unknown, extra = {}) =>
    fetch(base + path, { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) });
  assert.deepEqual((await (await fetch(base + '/api/auth/account/deletion-providers', { headers })).json()).providers, ['google', 'farcaster']);
  assert.equal((await post('/api/auth/account/deletion-farcaster/nonce', {})).status, 400);
  const start = await post('/api/auth/account/deletion-farcaster/nonce', { confirmation: 'DELETE' });
  assert.equal(start.status, 200);
  const n = await start.json();
  assert.equal(n.siweUri, `https://${FC_DOMAIN}/account?purpose=account-deletion`);
  const cookie = (start.headers.get('set-cookie') ?? '').split(';')[0];
  const signed = await siwe(n.nonce, { uri: n.siweUri });
  // Existing public verifier cannot consume deletion nonce, even with cookie.
  assert.equal((await post('/api/auth/farcaster/verify', { nonce: n.nonce, ...signed }, { cookie })).status, 401);
  assert.equal((await post('/api/auth/account/deletion-farcaster/verify', { nonce: n.nonce, ...signed })).status, 401);
  const before = await store.read();
  const verified = await post('/api/auth/account/deletion-farcaster/verify', { nonce: n.nonce, ...signed }, { cookie });
  assert.equal(verified.status, 200);
  const proof = await verified.json();
  assert.match(proof.proof, /^bld_[0-9a-f]{48}$/);
  assert.equal(proof.token, undefined);
  const after = await store.read();
  assert.deepEqual(after.accounts, before.accounts);
  assert.deepEqual(after.sessions, before.sessions);
  assert.deepEqual(after.socialIdentities, before.socialIdentities);
  assert.equal((await post('/api/auth/account/delete', { socialProof: proof.proof })).status, 400);
  assert.equal((await post('/api/auth/account/delete', { confirmation: 'DELETE', socialProof: proof.proof })).status, 200);
  assert.equal(Object.keys((await store.read()).accounts).length, 0);
});

// --- Discord (OAuth2 + /users/@me): verified flag gate, id binding ---------
const DC_ID = '80351110224678912';
const DC_CONF = { SOCIAL_DISCORD_CLIENT_ID: 'dc-client-id', SOCIAL_DISCORD_CLIENT_SECRET: 'dc-secret' };
function makeFakeDiscord(user: Record<string, unknown>) {
  const state = { challenge: null as string | null };
  const fetchImpl = (async (input: any, init?: any): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://discord.com/api/oauth2/token') {
      const body = new URLSearchParams(init.body as string);
      const computed = createHash('sha256').update(body.get('code_verifier')!).digest('base64url');
      assert.equal(computed, state.challenge, 'PKCE verifier matches the issued challenge');
      return Response.json({ access_token: 'dc_fake', token_type: 'Bearer' });
    }
    if (url === 'https://discord.com/api/users/@me') {
      assert.equal(init?.headers?.authorization, 'Bearer dc_fake');
      return Response.json(user);
    }
    throw new Error(`unexpected provider call: ${url}`);
  }) as typeof fetch;
  return { fetchImpl, state };
}
async function driveDiscordFlow(base: string, holder: { challenge: string | null }) {
  const start = await fetch(`${base}/api/auth/social/discord/start`, { redirect: 'manual' });
  assert.equal(start.status, 302);
  const authUrl = new URL(start.headers.get('location')!);
  assert.equal(authUrl.origin + authUrl.pathname, 'https://discord.com/oauth2/authorize');
  assert.equal(authUrl.searchParams.get('scope'), 'identify email');
  assert.equal(authUrl.searchParams.get('code_challenge_method'), 'S256');
  const st = authUrl.searchParams.get('state')!;
  holder.challenge = authUrl.searchParams.get('code_challenge');
  return fetch(`${base}/api/auth/social/discord/callback?code=fake&state=${encodeURIComponent(st)}`, {
    headers: { cookie: (start.headers.get('set-cookie') ?? '').split(';')[0] },
    redirect: 'manual',
  });
}

test('discord oauth2: only verified === true plus allowlist can register; id is the identity', async () => {
  const ok = makeFakeDiscord({ id: DC_ID, email: 'Someone@Example.com', verified: true });
  const app = await startApp({ ...DC_CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'someone@example.com' }, { socialFetch: ok.fetchImpl });
  let res = await driveDiscordFlow(app.base, ok.state);
  assert.ok(res.headers.get('location')!.startsWith('/account#social-token=bls_'));
  assert.ok((await app.store.read()).socialIdentities[`discord:${DC_ID}`], 'keyed on provider + snowflake id');
  res = await driveDiscordFlow(app.base, ok.state);
  assert.ok(res.headers.get('location')!.startsWith('/account#social-token=bls_'));
  assert.equal(Object.keys((await app.store.read()).accounts).length, 1);

  for (const user of [
    { id: DC_ID, email: 'someone@example.com', verified: false },
    { id: DC_ID, email: 'someone@example.com' },
    { id: DC_ID, verified: true },
    { id: DC_ID, email: 'someone@example.com', verified: 'true' },
  ]) {
    const fake = makeFakeDiscord(user);
    const a = await startApp({ ...DC_CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'someone@example.com' }, { socialFetch: fake.fetchImpl });
    const r = await driveDiscordFlow(a.base, fake.state);
    assert.equal(r.headers.get('location'), '/account#social-error=social_registration_restricted', JSON.stringify(user));
    assert.equal(Object.keys((await a.store.read()).accounts).length, 0);
  }
});

test('discord oauth2: a non-snowflake id is no identity; provider has no routes without env', async () => {
  const bad = makeFakeDiscord({ id: 'not-an-id', email: 'someone@example.com', verified: true });
  const app = await startApp({ ...DC_CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'someone@example.com' }, { socialFetch: bad.fetchImpl });
  const res = await driveDiscordFlow(app.base, bad.state);
  assert.match(res.headers.get('location')!, /social-error=social_exchange_failed/);
  const none = await startApp({}, {});
  const r = await fetch(`${none.base}/api/auth/social/discord/start`, { redirect: 'manual' });
  assert.equal(r.status, 404);
});

test('telegram phone is an explicit alternative; default email remains primary and phone is never stored', async () => {
  const allowedPhone = '+351 910 000 111';
  for (const scenario of [
    { phone: undefined, allowed: allowedPhone, direct: false },
    { phone: '351910999999', allowed: allowedPhone, direct: false },
    { phone: '351910000111', allowed: '', direct: false },
    { phone: 'bad', allowed: allowedPhone, direct: false },
    { phone: '351910000111', allowed: allowedPhone, direct: true },
  ]) {
    const fake = await makeFakeProvider('telegram', { phone: scenario.phone });
    const { base, store } = await startApp(
      { ...PROVIDER_CONFS.telegram, SOCIAL_REGISTRATION_ALLOWED_PHONES: scenario.allowed },
      { socialFetch: fake.fetchImpl },
    );
    const primary = await driveFlow(base, fake.fetchImpl, fake.state, 'telegram');
    assert.ok(primary.headers.get('location')!.startsWith('/account#social-email=bsp_'), 'default stays email even for allowlisted phone');
    const cb = await driveFlow(base, fake.fetchImpl, fake.state, 'telegram', undefined, 'phone');
    const loc = cb.headers.get('location')!;
    assert.ok(loc.startsWith(scenario.direct ? '/account#social-token=bls_' : '/account#social-error=social_registration_restricted'), loc);
    const data = await store.read();
    assert.equal(Object.keys(data.accounts).length, scenario.direct ? 1 : 0);
    assert.ok(!JSON.stringify(data).includes('910000111'), 'phone claim not persisted');
    if (scenario.direct) {
      const identity = data.socialIdentities['telegram:telegram-sub-123'];
      assert.ok(identity);
      assert.equal(data.accounts[identity.publicKey].email, undefined, 'no email invented or verified');
      // Existing identities stay bound to their account even if the phone
      // changes and admission is closed. Enabled TOTP still gates sessions.
      await store.change((s) => {
        s.accounts[identity.publicKey].totp = { status: 'enabled' } as never;
      });
      process.env.SOCIAL_REGISTRATION_ALLOWED_PHONES = '';
      fake.claims.phone = '351910999999';
      const again = await driveFlow(base, fake.fetchImpl, fake.state, 'telegram');
      assert.ok(again.headers.get('location')!.startsWith('/account#social-totp=blt_'));
      assert.equal(Object.keys((await store.read()).accounts).length, 1);
    }
  }
});

test('social linking proof HTTP routes reject bare bearer, unlinked provider, wrong session and replay', async () => {
  const fake = await makeFakeGoogle({ email: 'proof@example.com', emailVerified: true, subject: 'proof-owner' });
  const { base, store } = await startApp({ ...CONF, SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'proof@example.com' }, { socialFetch: fake.fetchImpl });
  const firstToken = tokenFromRedirect(await driveFlow(base, fake.fetchImpl, fake.state));
  const secondToken = tokenFromRedirect(await driveFlow(base, fake.fetchImpl, fake.state));
  const post = (path: string, token: string, body: unknown = {}) =>
    fetch(base + path, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await post('/api/auth/social/google/link-proof/start', '')).status, 403);
  assert.equal((await post('/api/auth/social/google/link/start', firstToken)).status, 403);
  const providers = await fetch(base + '/api/auth/social/link-proof/providers', { headers: { authorization: `Bearer ${firstToken}` } });
  assert.deepEqual(await providers.json(), { providers: ['google'] });
  const start = await post('/api/auth/social/google/link-proof/start', firstToken);
  assert.equal(start.status, 200);
  const url = new URL(((await start.json()) as { url: string }).url);
  fake.state.challenge = url.searchParams.get('code_challenge');
  (globalThis as any).__testNonce = url.searchParams.get('nonce');
  const callback = await fetch(base + '/api/auth/social/google/callback?code=fake-auth-code&state=' + encodeURIComponent(url.searchParams.get('state')!), {
    redirect: 'manual',
    headers: { cookie: start.headers.get('set-cookie')!.split(';')[0] },
  });
  const location = callback.headers.get('location')!;
  assert.match(location, /^\/account#link-proof=bll_/);
  const proof = location.split('#link-proof=')[1];
  assert.equal((await post('/api/auth/social/google/link/start', secondToken, { providerProof: proof })).status, 403);
  assert.equal((await post('/api/auth/social/google/link/start', firstToken, { providerProof: proof })).status, 200);
  assert.equal((await post('/api/auth/social/google/link/start', firstToken, { providerProof: proof })).status, 403);
  assert.equal(Object.keys((await store.read()).sessions).length, 2, 'proof callback issues no session');
  const { socialLinkPurpose } = await import('../src/social-link-proof.js');
  await assert.rejects(socialLinkPurpose(store, `Bearer ${firstToken}`, 'github'), (e: any) => e.code === 'social_stepup_required');
});
