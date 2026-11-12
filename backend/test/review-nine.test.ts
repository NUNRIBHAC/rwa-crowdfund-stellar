import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PostgresCommunityStore, emptyCommunityState } from '../src/community-store.js';

function transactionalPool(failWrite = false) {
  const queries: string[] = [];
  let released = 0;
  const query = async (sql: string) => {
    queries.push(sql);
    if (sql.startsWith('SELECT doc')) return { rows: [{ doc: emptyCommunityState() }] };
    if (failWrite && sql.startsWith('INSERT')) throw new Error('test write failed');
    return { rows: [] };
  };
  return {
    queries,
    query,
    connect: async () => ({
      query,
      release() {
        released++;
      },
    }),
    releases: () => released,
  };
}
test('R4 schema and changes hold transaction-scoped advisory locks until commit', async () => {
  const pool = transactionalPool();
  const store = new PostgresCommunityStore(pool);
  await store.change((s) => {
    s.accounts.GTEST = { publicKey: 'GTEST', displayName: null, createdAt: 1 };
  });
  assert.equal(pool.queries.filter((q) => q === 'BEGIN').length, 2);
  assert.equal(pool.queries.filter((q) => q === 'COMMIT').length, 2);
  assert.equal(pool.queries.filter((q) => q.startsWith('SELECT pg_advisory_xact_lock(')).length, 2);
  assert.equal(
    pool.queries.some((q) => q.startsWith('SELECT pg_advisory_lock(') || q.startsWith('SELECT pg_advisory_unlock(')),
    false,
  );
  const begin = pool.queries.lastIndexOf('BEGIN');
  const lock = pool.queries.findIndex((q, i) => i > begin && q.startsWith('SELECT pg_advisory_xact_lock('));
  const read = pool.queries.findIndex((q, i) => i > begin && q.startsWith('SELECT doc'));
  const write = pool.queries.findIndex((q, i) => i > begin && q.startsWith('INSERT'));
  assert.ok(begin < lock && lock < read && read < write && write < pool.queries.lastIndexOf('COMMIT'));
  assert.equal(pool.releases(), 2);
});
test('R4 failed write rolls back before releasing client', async () => {
  const pool = transactionalPool(true);
  const store = new PostgresCommunityStore(pool);
  await assert.rejects(
    store.change(() => {}),
    /test write failed/,
  );
  assert.equal(pool.queries.at(-1), 'ROLLBACK');
  assert.equal(pool.releases(), 2);
});

test('R3 public Soroban build limits run before handler and cannot be reset with fresh wallets', async () => {
  const { sorobanBuildLimiter } = await import('../src/soroban-build-limiter.js');
  let now = 100000;
  const gate = sorobanBuildLimiter({ now: () => now, global: 5, ip: 2, campaign: 3, actor: 2, maxKeys: 30 });
  let hits = 0;
  const request = (ip: string, campaign: string, actor: string) => {
    let status = 200;
    gate(
      { method: 'POST', path: `/api/campaigns/${campaign}/soroban/build`, body: { actor }, header: () => undefined, socket: { remoteAddress: ip } } as any,
      {
        set() {},
        status(n: number) {
          status = n;
          return this;
        },
        json() {},
      } as any,
      () => {
        hits++;
      },
    );
    return status;
  };
  assert.equal(request('one', 'demo', 'wallet1'), 200);
  assert.equal(request('one', 'demo', 'wallet2'), 200);
  assert.equal(request('one', 'other', 'wallet3'), 429);
  assert.equal(hits, 2);
  assert.equal(request('two', 'demo', 'wallet3'), 200);
  assert.equal(request('three', 'demo', 'wallet4'), 429);
  assert.equal(request('four', 'other', 'wallet4'), 200);
  assert.equal(request('five', 'other', 'wallet5'), 200);
  assert.equal(request('six', 'new', 'wallet6'), 429);
  now += 60001;
  assert.equal(request('six', 'new', 'wallet6'), 200);
});
test('R3 bounds actor cardinality without evicting active limits', async () => {
  const { sorobanBuildLimiter } = await import('../src/soroban-build-limiter.js');
  let now = 100000;
  const gate = sorobanBuildLimiter({ now: () => now, global: 100, ip: 100, campaign: 100, actor: 1, maxKeys: 3 });
  const request = (actor: string) => {
    let status = 200;
    gate(
      { method: 'POST', path: '/api/campaigns/demo/soroban/build', body: { actor }, header: () => undefined, socket: { remoteAddress: 'one' } } as any,
      {
        set() {},
        status(n: number) {
          status = n;
          return this;
        },
        json() {},
      } as any,
      () => {},
    );
    return status;
  };
  assert.equal(request('a'), 200);
  assert.equal(request('b'), 429);
  assert.equal(request('a'), 429);
  now += 60001;
  assert.equal(request('b'), 200);
});

test('R7 TOTP disable is IP-limited before account code verification', async () => {
  const express = (await import('express')).default;
  const { FileCommunityStore } = await import('../src/community-store.js');
  const { CommunityService } = await import('../src/community.js');
  const { createCommunityRouter } = await import('../src/community-routes.js');
  const { hashToken } = await import('../src/accounts.js');
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r7-'));
  const store = new FileCommunityStore(path.join(dir, 'community.json'));
  const token = 'bls_' + 'a'.repeat(48);
  const now = Date.now();
  await store.change((s) => {
    s.accounts.GTEST = { publicKey: 'GTEST', displayName: null, createdAt: now };
    s.sessions[hashToken(token)] = { tokenHash: hashToken(token), publicKey: 'GTEST', createdAt: now, expiresAt: now + 600000 };
  });
  const app = express();
  app.use(express.json());
  app.use(createCommunityRouter({ service: new CommunityService(store), requireAdmin: (_req, _res, next) => next() }));
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = server.address() as { port: number };
  try {
    for (let i = 0; i < 31; i++) {
      const res = await fetch(`http://127.0.0.1:${addr.port}/api/auth/totp/disable`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: '{"code":"invalid"}',
      });
      const body = (await res.json()) as { code?: string };
      if (i === 30) {
        assert.equal(res.status, 429);
        assert.equal(body.code, 'rate_limited');
      }
    }
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R2 PR-controlled capture step has no Argos token; upload is restricted to trusted main', async () => {
  const fs = await import('node:fs');
  const workflow = fs.readFileSync(new URL('../../.github/workflows/visual.yml', import.meta.url), 'utf8');
  const capture = workflow.split('- name: Capture screenshots')[1]?.split('- name: Upload screenshots')[0];
  assert.ok(capture, 'separate capture step');
  assert.equal(capture.includes('secrets.ARGOS_TOKEN'), false);
  const upload = workflow.split('- name: Upload screenshots')[1] ?? '';
  assert.match(upload, /github.ref == 'refs\/heads\/main'/);
  assert.match(upload, /github.event_name == 'push'/);
  assert.match(upload, /github.event_name == 'workflow_dispatch'/);
  assert.match(upload, /secrets.ARGOS_TOKEN/);
  assert.equal(upload.includes('playwright test'), false);
  const config = fs.readFileSync(new URL('../../frontend/playwright.config.ts', import.meta.url), 'utf8');
  assert.equal(config.includes('@argos-ci/playwright/reporter'), false, 'reporter diverts captures into a temporary upload directory, not screenshots');
});

test('R1 inbox owner selects password during verification, never inherits pre-registration password', async () => {
  const { FileCommunityStore } = await import('../src/community-store.js');
  const { registerEmail, verifyEmailToken, loginEmail } = await import('../src/email-auth.js');
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r1-'));
  const store = new FileCommunityStore(path.join(dir, 'community.json'));
  let text = '';
  try {
    const email = 'inbox-owner@example.com';
    await registerEmail(
      store,
      {
        send: async (mail: { text: string }) => {
          text = mail.text;
        },
      },
      { email, password: 'attacker-chosen-password' },
    );
    assert.equal((await store.read()).emailCredentials[email].passwordRecord, '');
    const token = text.match(/blv_[a-f0-9]{48}/)![0];
    await assert.rejects(verifyEmailToken(store, { email, token }), /password/);
    await verifyEmailToken(store, { email, token, password: 'inbox-owner-new-password' } as any);
    await assert.rejects(loginEmail(store, { email, password: 'attacker-chosen-password' }));
    assert.ok('token' in (await loginEmail(store, { email, password: 'inbox-owner-new-password' })));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R5 a fresh social bearer alone is never a provider identity proof', async () => {
  const { FileCommunityStore } = await import('../src/community-store.js');
  const { requireSocialLinkStepUp } = await import('../src/social-auth.js');
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r5-'));
  const store = new FileCommunityStore(path.join(dir, 'community.json'));
  const now = Date.now();
  try {
    await assert.rejects(
      requireSocialLinkStepUp(store, { publicKey: 'GTEST', displayName: null, createdAt: now, authMethod: 'social', email: 'owner@example.com' }, now, {}, now),
      (e: any) => e.code === 'social_stepup_required',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R5 proof pins provider identity and original session and is single-use', async () => {
  const { issueSocialLinkProof, consumeSocialLinkProof } = await import('../src/social-link-proof.js');
  const { hashToken } = await import('../src/accounts.js');
  const now = Date.now();
  const token = 'bls_' + 'a'.repeat(48);
  const other = 'bls_' + 'b'.repeat(48);
  const state = emptyCommunityState();
  state.accounts.GTEST = { publicKey: 'GTEST', displayName: null, createdAt: now, authMethod: 'social', email: 'owner@example.com' };
  for (const t of [token, other]) state.sessions[hashToken(t)] = { tokenHash: hashToken(t), publicKey: 'GTEST', createdAt: now, expiresAt: now + 600000 };
  state.socialIdentities['google:original'] = {
    provider: 'google',
    subject: 'original',
    publicKey: 'GTEST',
    email: 'owner@example.com',
    createdAt: now,
    lastLoginAt: now,
  };
  const purpose = { publicKey: 'GTEST', sessionHash: hashToken(token), identityKey: 'google:original' };
  assert.throws(() => issueSocialLinkProof(state, purpose, 'google', 'attacker', now));
  const { proof } = issueSocialLinkProof(state, purpose, 'google', 'original', now);
  assert.equal(consumeSocialLinkProof(state, 'GTEST', `Bearer ${other}`, proof, now), false);
  assert.equal(consumeSocialLinkProof(state, 'GTEST', `Bearer ${token}`, proof, now), true);
  assert.equal(consumeSocialLinkProof(state, 'GTEST', `Bearer ${token}`, proof, now), false);
  const expired = issueSocialLinkProof(state, purpose, 'google', 'original', now);
  assert.equal(consumeSocialLinkProof(state, 'GTEST', `Bearer ${token}`, expired.proof, now + 300001), false);
  const revoked = issueSocialLinkProof(state, purpose, 'google', 'original', now);
  delete state.socialIdentities['google:original'];
  assert.equal(consumeSocialLinkProof(state, 'GTEST', `Bearer ${token}`, revoked.proof, now), false);
});

test('R3 the live server installs the build gate before the build route', async () => {
  const fs = await import('node:fs');
  const source = fs.readFileSync(new URL('../src/server.ts', import.meta.url), 'utf8');
  assert.ok(source.indexOf('app.use(sorobanBuildLimiter())') < source.indexOf("app.post('/api/campaigns/:id/soroban/build'"));
});

test('R8 legacy boolean proxy trust cannot select a caller-supplied leftmost IP', async () => {
  const { clientIp } = await import('../src/client-ip.js');
  const old = { trust: process.env.TRUST_PROXY, depth: process.env.TRUST_PROXY_DEPTH };
  try {
    process.env.TRUST_PROXY = '1';
    delete process.env.TRUST_PROXY_DEPTH;
    assert.equal(clientIp({ header: () => 'attacker, 203.0.113.1', socket: { remoteAddress: '127.0.0.1' } } as any), '127.0.0.1');
    process.env.TRUST_PROXY_DEPTH = '1';
    assert.equal(clientIp({ header: () => 'attacker, 203.0.113.1', socket: { remoteAddress: '127.0.0.1' } } as any), '203.0.113.1');
  } finally {
    if (old.trust === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = old.trust;
    if (old.depth === undefined) delete process.env.TRUST_PROXY_DEPTH;
    else process.env.TRUST_PROXY_DEPTH = old.depth;
  }
});

test('R3 Express case-insensitive routes and encoded campaign aliases share the same build budgets', async () => {
  const express = (await import('express')).default;
  const { sorobanBuildLimiter } = await import('../src/soroban-build-limiter.js');
  const app = express();
  let handlerHits = 0;
  app.use(express.json());
  app.use(sorobanBuildLimiter({ global: 100, ip: 100, campaign: 2, actor: 100 }));
  app.post('/api/campaigns/:id/soroban/build', (_req, res) => {
    handlerHits++;
    res.json({ ok: true });
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.once('listening', r));
  try {
    const address = server.address() as import('node:net').AddressInfo;
    const statuses = [];
    for (const path of ['/api/campaigns/demo/soroban/build', '/api/campaigns/%64emo/soroban/build', '/API/CAMPAIGNS/demo/SOROBAN/BUILD']) {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"actor":"fresh"}',
      });
      await response.arrayBuffer();
      statuses.push(response.status);
    }
    assert.deepEqual(statuses, [200, 200, 429]);
    assert.equal(handlerHits, 2);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});

test('submit gate rejects before handler, with separate build and submit budgets', async () => {
  const { sorobanSubmitLimiter } = await import('../src/soroban-build-limiter.js');
  const gate = sorobanSubmitLimiter({ ip: 1 });
  let calls = 0;
  const statuses: number[] = [];
  for (const path of ['/api/campaigns/demo/soroban/build', '/api/campaigns/demo/soroban/submit', '/API/campaigns/%64emo/soroban/submit/']) {
    let status = 200;
    gate(
      { method: 'POST', path, body: { actor: 'wallet' }, header: () => undefined, socket: { remoteAddress: 'one' } } as any,
      {
        set() {},
        status(n: number) {
          status = n;
          return this;
        },
        json() {},
      } as any,
      () => {
        calls++;
      },
    );
    statuses.push(status);
  }
  assert.deepEqual(statuses, [200, 200, 429]);
  assert.equal(calls, 2);
});
