import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityError, CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';
import { createIpReputation, ABUSE_SCORE_DENY } from '../src/ip-reputation.js';
import { verifyTurnstileToken } from '../src/turnstile.js';
import type { Mailer } from '../src/mailer.js';

const requireAdmin: express.RequestHandler = (_req, _res, next) => next();

class FakeMailer implements Mailer {
  sent: { to: string; subject: string; text: string }[] = [];
  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    this.sent.push(message);
  }
}

const servers: ReturnType<express.Express['listen']>[] = [];
after(() => servers.forEach((s) => s.close()));

// Env is read per-request (clientIp, abuse-config) as well as at router
// creation (turnstile), so test env stays set for the app's lifetime and the
// pristine env is restored once at the end of the file. Each startApp call
// overrides the full key set for the tests that follow it; every test that
// starts an app passes its complete key set, so no stale key leaks.
const pristineEnv = { ...process.env };
after(() => {
  for (const k of Object.keys(process.env)) if (!(k in pristineEnv)) delete process.env[k];
  Object.assign(process.env, pristineEnv);
});

async function startApp(env: Record<string, string>, deps: Parameters<typeof createCommunityRouter>[0] = {} as never) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abuse-defense-'));
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const service = new CommunityService(store);
  for (const k of ['TURNSTILE_SECRET_KEY', 'TURNSTILE_SITE_KEY', 'IPREP_API_KEY', 'IPREP_ENFORCE', 'TRUST_PROXY_DEPTH', 'TRUST_PROXY', 'XFF_DEBUG'])
    delete process.env[k];
  Object.assign(process.env, env);
  app.use(createCommunityRouter({ service, requireAdmin, mailer: new FakeMailer(), ...deps }));
  const srv = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  servers.push(srv);
  return `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
}

async function post(baseUrl: string, p: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(baseUrl + p, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json()) as { code?: string } };
}

const registerBody = { email: 'abuse-test@example.com', password: 'correct horse battery staple 9' };

// --- Turnstile token verification (mocked siteverify) ---

test('turnstile: missing or oversized token is a local rejection, no provider call', async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }) as typeof fetch;
  assert.equal((await verifyTurnstileToken({ secretKey: 's' }, undefined, undefined, fetchImpl)).ok, false);
  assert.equal((await verifyTurnstileToken({ secretKey: 's' }, 'x'.repeat(2049), undefined, fetchImpl)).ok, false);
  assert.equal(calls, 0);
});

test('turnstile: provider success/rejection/unavailable map to distinct outcomes', async () => {
  const okFetch = (async () => new Response(JSON.stringify({ success: true }), { status: 200 })) as typeof fetch;
  assert.deepEqual(await verifyTurnstileToken({ secretKey: 's' }, 'tok', undefined, okFetch), { ok: true });
  const denyFetch = (async () => new Response(JSON.stringify({ success: false, 'error-codes': ['timeout-or-duplicate'] }), { status: 200 })) as typeof fetch;
  const denied = await verifyTurnstileToken({ secretKey: 's' }, 'tok', undefined, denyFetch);
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.reason, 'rejected');
    assert.deepEqual(denied.errorCodes, ['timeout-or-duplicate']);
  }
  const downFetch = (async () => {
    throw new Error('network down');
  }) as typeof fetch;
  const down = await verifyTurnstileToken({ secretKey: 's' }, 'tok', undefined, downFetch);
  assert.equal(down.ok, false);
  if (!down.ok) assert.equal(down.reason, 'verify-unavailable');
});

// --- Reputation classification, cache, budget, shadow/enforce ---

const ipapiResponse = (fields: Record<string, unknown>) => (async () => new Response(JSON.stringify(fields), { status: 200 })) as typeof fetch;

test('reputation: classification - abuse only on is_abuser or very high score, never on anonymity type', async () => {
  const abuse = createIpReputation({ apiKey: 'k', enforce: false, fetchImpl: ipapiResponse({ is_abuser: true, is_vpn: true }) });
  assert.equal(await abuse.check('203.0.113.1'), 'abuse');
  const highScore = createIpReputation({
    apiKey: 'k',
    enforce: false,
    fetchImpl: ipapiResponse({ is_abuser: false, abuser_score: `${ABUSE_SCORE_DENY} (Very High)` }),
  });
  assert.equal(await highScore.check('203.0.113.2'), 'abuse');
  // Bare VPN/proxy/Tor/datacenter is 'anonymous', never 'abuse'.
  const vpn = createIpReputation({ apiKey: 'k', enforce: false, fetchImpl: ipapiResponse({ is_vpn: true }) });
  assert.equal(await vpn.check('203.0.113.3'), 'anonymous');
  const torDc = createIpReputation({ apiKey: 'k', enforce: false, fetchImpl: ipapiResponse({ is_tor: true, is_datacenter: true }) });
  assert.equal(await torDc.check('203.0.113.4'), 'anonymous');
  const clean = createIpReputation({ apiKey: 'k', enforce: false, fetchImpl: ipapiResponse({}) });
  assert.equal(await clean.check('203.0.113.5'), 'clean');
});

test('reputation: shadow mode never denies abuse; enforce mode denies only abuse', async () => {
  const shadow = createIpReputation({ apiKey: 'k', enforce: false, fetchImpl: ipapiResponse({ is_abuser: true }) });
  assert.equal(await shadow.check('203.0.113.10'), 'abuse'); // computed, not blocked
  assert.equal(shadow.stats().denied, 0);
  const enforcing = createIpReputation({ apiKey: 'k', enforce: true, fetchImpl: ipapiResponse({ is_abuser: true }) });
  await assert.rejects(enforcing.check('203.0.113.11'), /ip_reputation_abuse/);
  assert.equal(enforcing.stats().denied, 1);
  const enforcingAnonymous = createIpReputation({ apiKey: 'k', enforce: true, fetchImpl: ipapiResponse({ is_proxy: true }) });
  assert.equal(await enforcingAnonymous.check('203.0.113.12'), 'anonymous'); // never denied
});

test('reputation: cache serves repeat lookups; daily budget fails open and is counted', async () => {
  let calls = 0;
  const counting = (async () => {
    calls += 1;
    return new Response(JSON.stringify({}), { status: 200 });
  }) as typeof fetch;
  const rep = createIpReputation({ apiKey: 'k', enforce: false, dailyBudget: 2, fetchImpl: counting });
  await rep.check('203.0.113.20');
  await rep.check('203.0.113.20'); // cache hit
  assert.equal(calls, 1);
  assert.equal(rep.stats().cacheHits, 1);
  await rep.check('203.0.113.21');
  await rep.check('203.0.113.22'); // over budget -> no call, unknown, fail open
  assert.equal(calls, 2);
  assert.equal(rep.stats().budgetTripped, true);
  assert.equal(rep.stats().verdicts.unknown, 1);
});

test('reputation: provider error fails open; stats carry no raw IPs', async () => {
  const rep = createIpReputation({
    apiKey: 'k',
    enforce: true,
    fetchImpl: (async () => {
      throw new Error('down');
    }) as typeof fetch,
  });
  assert.equal(await rep.check('203.0.113.30'), 'unknown');
  assert.equal(rep.stats().providerErrors, 1);
  assert.ok(!JSON.stringify(rep.stats()).includes('203.0.113.30'), 'stats must not retain raw IPs');
});

test('reputation: no API key = disabled, fail open without calls', async () => {
  let calls = 0;
  const rep = createIpReputation({
    enforce: true,
    fetchImpl: (async () => {
      calls += 1;
      return new Response('{}', { status: 200 });
    }) as typeof fetch,
  });
  assert.equal(await rep.check('203.0.113.40'), 'unknown');
  assert.equal(calls, 0);
});

// --- Route integration ---

test('routes: turnstile configured -> register without token is 403, resend/reset gated too', async () => {
  const base = await startApp({ TURNSTILE_SECRET_KEY: 'test-secret' });
  // Without a reachable Cloudflare the token can never validate; both failure
  // modes (rejected/unavailable) must not reach the mail flow.
  const reg = await post(base, '/api/auth/email/register', registerBody);
  assert.ok([403, 503].includes(reg.status));
  assert.match(reg.json.code ?? '', /^turnstile_/);
  const resend = await post(base, '/api/auth/email/resend', { email: 'abuse-test@example.com' });
  assert.ok([403, 503].includes(resend.status));
  const reset = await post(base, '/api/auth/email/reset-request', { email: 'abuse-test@example.com' });
  assert.ok([403, 503].includes(reset.status));
});

test('routes: turnstile absent -> register proceeds exactly as before', async () => {
  const base = await startApp({ TURNSTILE_SECRET_KEY: '', IPREP_API_KEY: '' });
  const reg = await post(base, '/api/auth/email/register', registerBody);
  assert.equal(reg.status, 200);
});

test('routes: enforcing reputation denies abusive IP; shadow lets it through', async () => {
  const deny = (m: string, c: string) => new CommunityError(403, m, c);
  const abusive = createIpReputation({ apiKey: 'k', enforce: true, denyError: deny, fetchImpl: ipapiResponse({ is_abuser: true }) });
  const base = await startApp({}, { ipReputation: abusive } as never);
  const reg = await post(base, '/api/auth/email/register', registerBody);
  assert.equal(reg.status, 403);
  assert.equal(reg.json.code, 'ip_reputation_abuse');
  const shadow = createIpReputation({ apiKey: 'k', enforce: false, fetchImpl: ipapiResponse({ is_abuser: true }) });
  const base2 = await startApp({}, { ipReputation: shadow } as never);
  const reg2 = await post(base2, '/api/auth/email/register', { email: 'abuse-test2@example.com', password: 'correct horse battery staple 9' });
  assert.equal(reg2.status, 200);
});

test('routes: abuse-config exposes the site key only, never the secret', async () => {
  const base = await startApp({ TURNSTILE_SITE_KEY: '0x4_public_sitekey', TURNSTILE_SECRET_KEY: 'super-secret-value' });
  const res = await fetch(base + '/api/auth/abuse-config');
  const json = (await res.json()) as { turnstileSiteKey?: string };
  assert.equal(json.turnstileSiteKey, '0x4_public_sitekey');
  assert.ok(!JSON.stringify(json).includes('super-secret-value'));
  const base2 = await startApp({ TURNSTILE_SITE_KEY: '' });
  const json2 = (await (await fetch(base2 + '/api/auth/abuse-config')).json()) as { turnstileSiteKey: string | null };
  assert.equal(json2.turnstileSiteKey, null);
});

// --- clientIp chain derivation (via register rate-limit keying) ---

test('clientIp: TRUST_PROXY_DEPTH keys the limiter on chain[length-depth], proven at the 429 boundary', async () => {
  const base = await startApp({ TRUST_PROXY_DEPTH: '1' });
  // Depth 1 with a 2-entry forged chain: client = rightmost. 10 requests from
  // one rightmost IP exhaust its 10/h bucket; the 11th must 429; rotating
  // ONLY the rightmost entry must immediately clear it - proving the limiter
  // keys on the derived rightmost IP, not the socket or the leftmost.
  const mk = (ip: string) => post(base, '/api/auth/email/register', registerBody, { 'x-forwarded-for': `192.0.2.1, ${ip}` });
  for (let i = 0; i < 10; i += 1) assert.equal((await mk('198.51.100.10')).status, 200, `request ${i + 1}`);
  assert.equal((await mk('198.51.100.10')).status, 429);
  assert.equal((await mk('198.51.100.11')).status, 200);
  // Chain shorter than depth: depth 3 but only 1 entry -> socket fallback,
  // no spoofed value used, request still processed.
  const base3 = await startApp({ TRUST_PROXY_DEPTH: '3' });
  const b = await post(base3, '/api/auth/email/register', registerBody, { 'x-forwarded-for': '198.51.100.20' });
  assert.equal(b.status, 200);
  // No trust env: XFF ignored entirely (shared socket bucket).
  const base0 = await startApp({});
  const c = await post(base0, '/api/auth/email/register', registerBody, { 'x-forwarded-for': '203.0.113.99, 198.51.100.99' });
  assert.equal(c.status, 200);
});

test('abuse-diagnostics: admin-gated aggregate view and fixed-IP self-check exercise the counter path', async () => {
  const base = await startApp({ IPREP_API_KEY: 'test-key' }, {
    ipReputation: createIpReputation({
      apiKey: 'test-key',
      enforce: false,
      fetchImpl: async () => new Response(JSON.stringify({ is_abuser: false, abuser_score: '0.01 (Low)' }), { status: 200 }),
    }),
  } as never);
  const diag = await fetch(base + '/api/admin/abuse-diagnostics');
  assert.equal(diag.status, 200);
  const before = (await diag.json()) as any;
  assert.equal(before.turnstile, 'disabled');
  assert.equal(before.ipReputation.enforce, false);
  assert.equal(before.ipReputation.lookups, 0);

  const self = await fetch(base + '/api/admin/abuse-diagnostics/reputation-self-check', { method: 'POST' });
  assert.equal(self.status, 200);
  const after1 = (await self.json()) as any;
  assert.equal(after1.probeVerdict, 'clean');
  assert.equal(after1.stats.lookups, 1);
  assert.equal(after1.stats.verdicts.clean, 1);

  // Second self-check hits the cache: counter path stable, no extra lookup.
  const self2 = await fetch(base + '/api/admin/abuse-diagnostics/reputation-self-check', { method: 'POST' });
  const after2 = (await self2.json()) as any;
  assert.equal(after2.stats.lookups, 1);
  assert.equal(after2.stats.cacheHits, 1);
});

test('abuse-diagnostics: reflects configured Turnstile and enforce flag', async () => {
  const base = await startApp({ TURNSTILE_SECRET_KEY: 'x', IPREP_ENFORCE: '1' });
  const diag = await fetch(base + '/api/admin/abuse-diagnostics');
  const body = (await diag.json()) as any;
  assert.equal(body.turnstile, 'configured');
  assert.equal(body.ipReputation.enforce, true);
});

test('xff-probe: redacted chain classes under unchanged trust; forged leftmost does not steer', async () => {
  const base = await startApp({});
  const plain = (await (await fetch(base + '/api/admin/abuse-diagnostics/xff-probe')).json()) as any;
  assert.equal(plain.chainLength, 0);
  assert.equal(plain.trustMode, 'none');
  const forged = (await (
    await fetch(base + '/api/admin/abuse-diagnostics/xff-probe', {
      headers: { 'x-forwarded-for': '203.0.113.77, 198.51.100.77' },
    })
  ).json()) as any;
  assert.equal(forged.chainLength, 2);
  assert.deepEqual(forged.chainClasses, ['reserved-docs', 'reserved-docs']);
  assert.equal(forged.leftmostSteersClient, false);
  // Test server has no proxy: client falls back to the socket peer.
  assert.equal(forged.clientIpClass, 'loopback');
  assert.ok(!JSON.stringify(forged).includes('203.0.113.77'), 'no raw IP leaks');
});

test('xff-probe: legacy TRUST_PROXY=1 marks leftmost as steering', async () => {
  const base = await startApp({ TRUST_PROXY: '1' });
  const body = (await (
    await fetch(base + '/api/admin/abuse-diagnostics/xff-probe', {
      headers: { 'x-forwarded-for': '203.0.113.77' },
    })
  ).json()) as any;
  assert.equal(body.trustMode, 'legacy');
  assert.equal(body.leftmostSteersClient, true);
  assert.equal(body.clientIpClass, 'reserved-docs');
});

test('xff-probe expect: sha256 equality reveals positions without raw IPs', async () => {
  const base = await startApp({});
  const { createHash: hash } = await import('node:crypto');
  const h = (v: string) => hash('sha256').update(v).digest('hex');
  const res = await fetch(base + '/api/admin/abuse-diagnostics/xff-probe', {
    headers: { 'x-xff-expect-sha256': h('203.0.113.77'), 'x-forwarded-for': '203.0.113.77, 198.51.100.77' },
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as any;
  assert.deepEqual(body.matchedPositions, [0]);
  assert.equal(body.resolvedMatch, false); // trust none -> resolved is the socket peer
  assert.equal(body.socketMatch, false);
  const sock = await fetch(base + '/api/admin/abuse-diagnostics/xff-probe', { headers: { 'x-xff-expect-sha256': h('127.0.0.1') } });
  const sockBody = (await sock.json()) as any;
  assert.equal(sockBody.socketMatch, true);
  assert.equal(sockBody.resolvedMatch, true);
  // Malformed entries survive as classes; no crash, no raw echo.
  const malformed = (await (
    await fetch(base + '/api/admin/abuse-diagnostics/xff-probe', {
      headers: { 'x-forwarded-for': 'abc,,,,' },
    })
  ).json()) as any;
  assert.equal(malformed.chainLength, 1);
  assert.deepEqual(malformed.chainClasses, ['other']);
  // Invalid expect is ignored (no equality fields).
  const bad = (await (await fetch(base + '/api/admin/abuse-diagnostics/xff-probe', { headers: { 'x-xff-expect-sha256': 'xyz' } })).json()) as any;
  assert.equal('matchedPositions' in bad, false);
});
