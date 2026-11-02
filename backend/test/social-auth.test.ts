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
const ISSUER = 'https://accounts.google.com';

// A fake Google: discovery metadata, JWKS, token exchange (with a real
// PKCE check against the challenge seen in the authorization URL) and a
// signed id_token via jose. userinfo is never needed - the validated
// id_token claims are the identity source.
async function makeFakeGoogle(opts: { email?: string; emailVerified?: boolean; subject?: string }) {
  // claims are mutable: tests update them between flows to simulate the
  // provider returning different profile data for the same subject.
  const claims = { email: opts.email, emailVerified: opts.emailVerified };
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
  const publicJwk = await jose.exportJWK(publicKey);
  publicJwk.kid = 'test-key';
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';
  const state = { challenge: null as string | null };
  const subject = opts.subject ?? 'google-sub-123';
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
      assert.ok(body.get('redirect_uri')?.endsWith('/api/auth/social/google/callback'));
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
async function driveFlow(base: string, fetchImpl: typeof fetch, challengeHolder: { challenge: string | null }) {
  const start = await fetch(`${base}/api/auth/social/google/start`, { redirect: 'manual' });
  assert.equal(start.status, 302);
  const authUrl = new URL(start.headers.get('location')!);
  assert.equal(authUrl.origin, ISSUER);
  assert.equal(authUrl.searchParams.get('client_id'), CLIENT_ID);
  assert.equal(authUrl.searchParams.get('response_type'), 'code');
  assert.equal(authUrl.searchParams.get('scope'), 'openid email profile');
  assert.equal(authUrl.searchParams.get('code_challenge_method'), 'S256');
  const state = authUrl.searchParams.get('state')!;
  const nonce = authUrl.searchParams.get('nonce')!;
  assert.ok(state && nonce, 'state and nonce issued');
  challengeHolder.challenge = authUrl.searchParams.get('code_challenge');
  (globalThis as any).__testNonce = nonce;
  const cb = await fetch(`${base}/api/auth/social/google/callback?code=fake-auth-code&state=${encodeURIComponent(state)}`, { redirect: 'manual' });
  return cb;
}

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
