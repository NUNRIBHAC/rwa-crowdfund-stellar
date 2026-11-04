import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileCommunityStore } from '../src/community-store.js';
import { deleteEmailAccount } from '../src/account-deletion.js';
import { authenticate, hashToken } from '../src/accounts.js';
import { hashPassword } from '../src/email-auth.js';
import { encryptSeed, totpAt } from '../src/totp.js';
const one = 'bls_' + '1'.repeat(48);
const two = 'bls_' + '2'.repeat(48);
const other = 'bls_' + '3'.repeat(48);
const now = 1800000000000;
const password = 'a-test-only-password-123';
async function fixture() {
  const store = new FileCommunityStore(join(mkdtempSync(join(tmpdir(), 'delete-account-')), 'store.json'));
  await store.change((s) => {
    s.accounts.owner = { publicKey: 'owner', email: 'test@example.invalid', authMethod: 'email', displayName: 'Test', createdAt: now };
    s.accounts.other = { publicKey: 'other', displayName: 'Other', createdAt: now };
    s.emailCredentials['test@example.invalid'] = {
      email: 'test@example.invalid',
      publicKey: 'owner',
      passwordRecord: hashPassword(password),
      verified: true,
      verifyTokenHash: null,
      verifyExpiresAt: null,
      createdAt: now,
      failedAttempts: 0,
      lockUntil: null,
    };
    for (const [token, publicKey] of [
      [one, 'owner'],
      [two, 'owner'],
      [other, 'other'],
    ])
      s.sessions[hashToken(token)] = { tokenHash: hashToken(token), publicKey, createdAt: now, expiresAt: now + 100000 };
    s.socialIdentities['google:owner'] = {
      provider: 'google',
      subject: 'owner',
      publicKey: 'owner',
      email: 'test@example.invalid',
      createdAt: now,
      lastLoginAt: now,
    };
    s.comments.c = {
      id: 'c',
      publicKey: 'owner',
      campaignId: 'demo-solar',
      body: 'personal text',
      displayName: 'Test',
      createdAt: now,
      hiddenAt: null,
      hiddenReason: null,
    };
    s.socialFlows.f = { provider: 'google', nonce: 'x', codeVerifier: 'x', createdAt: now, expiresAt: now + 10000, linkTo: 'owner' };
    s.audit.push({ id: 'other-audit', actor: 'admin-key', action: 'test', target: 'unrelated', at: now });
  });
  return store;
}
test('verified email deletion removes owner data and all sessions, preserves other accounts and audit', async () => {
  const store = await fixture();
  await deleteEmailAccount(store, `Bearer ${one}`, { confirmation: 'DELETE', password }, [], now);
  const s = await store.read();
  assert.equal(s.accounts.owner, undefined);
  assert.equal(s.accounts.other.publicKey, 'other');
  for (const records of [s.emailCredentials, s.socialIdentities, s.comments, s.socialFlows]) assert.equal(Object.keys(records).length, 0);
  assert.equal(Object.keys(s.sessions).length, 1);
  assert.equal(s.audit.length, 1);
  await assert.rejects(authenticate(store, `Bearer ${one}`, now));
  await assert.rejects(authenticate(store, `Bearer ${two}`, now));
  assert.equal((await authenticate(store, `Bearer ${other}`, now)).publicKey, 'other');
});
test('confirmation, authentication, verified ownership and password fail closed without deletion', async () => {
  const store = await fixture();
  for (const [auth, proof, code] of [
    [`Bearer ${one}`, { password }, 'deletion_confirmation_required'],
    ['Bearer wrong', { confirmation: 'DELETE', password }, 'unauthorized'],
    [`Bearer ${one}`, { confirmation: 'DELETE', password: 'wrong' }, 'deletion_proof_failed'],
  ] as const)
    await assert.rejects(deleteEmailAccount(store, auth, proof, [], now), { code });
  assert.ok((await store.read()).accounts.owner);
  await store.change((s) => {
    s.emailCredentials['test@example.invalid'].verified = false;
  });
  await assert.rejects(deleteEmailAccount(store, `Bearer ${one}`, { confirmation: 'DELETE', password }, [], now), { code: 'deletion_unsupported' });
});
test('repeated bad passwords persist throttle and prevent deletion even with correct password', async () => {
  const store = await fixture();
  for (let i = 0; i < 5; i++)
    await assert.rejects(deleteEmailAccount(store, `Bearer ${one}`, { confirmation: 'DELETE', password: 'wrong' }, [], now), { code: 'deletion_proof_failed' });
  await assert.rejects(deleteEmailAccount(store, `Bearer ${one}`, { confirmation: 'DELETE', password }, [], now), { code: 'deletion_locked' });
  assert.ok((await store.read()).accounts.owner);
});
test('protected records and operator membership block deletion without submitting any request', async () => {
  for (const protection of ['contributor', 'assessment', 'operator', 'wallet', 'social']) {
    const store = await fixture();
    await store.change((s) => {
      if (protection === 'contributor') s.contributors.r = { publicKey: 'owner' } as any;
      if (protection === 'assessment') s.appropriateness.owner = { publicKey: 'owner' } as any;
      if (protection === 'wallet') delete s.accounts.owner.authMethod;
      if (protection === 'social') s.accounts.owner.authMethod = 'social';
    });
    const before = await store.read();
    await assert.rejects(deleteEmailAccount(store, `Bearer ${one}`, { confirmation: 'DELETE', password }, protection === 'operator' ? ['owner'] : [], now), {
      code: protection === 'wallet' ? 'deletion_unavailable' : protection === 'social' ? 'deletion_unsupported' : 'deletion_protected_records',
    });
    assert.deepEqual(await store.read(), before);
  }
});
test('enabled 2FA requires a new current code, rejects replay, and deletes only after both proofs', async () => {
  const store = await fixture();
  const old = process.env.COMMUNITY_TOTP_KEY;
  process.env.COMMUNITY_TOTP_KEY = 'test-only-key';
  const seed = 'JBSWY3DPEHPK3PXP';
  try {
    await store.change((s) => {
      s.accounts.owner.totp = {
        status: 'enabled',
        encSeed: encryptSeed('test-only-key', seed),
        lastUsedStep: Math.floor(now / 30000),
        recoveryHashes: [],
        enabledAt: now,
        failedAttempts: 0,
        lockUntil: null,
      };
    });
    await assert.rejects(deleteEmailAccount(store, `Bearer ${one}`, { confirmation: 'DELETE', password, totpCode: totpAt(seed, now / 1000) }, [], now), {
      code: 'deletion_factor_required',
    });
    await deleteEmailAccount(store, `Bearer ${one}`, { confirmation: 'DELETE', password, totpCode: totpAt(seed, (now + 30000) / 1000) }, [], now + 30000);
    assert.equal((await store.read()).accounts.owner, undefined);
  } finally {
    if (old === undefined) delete process.env.COMMUNITY_TOTP_KEY;
    else process.env.COMMUNITY_TOTP_KEY = old;
  }
});

test('HTTP deletion is owner-scoped, rejects unauthenticated or wrong proof, and invalidates both owner sessions', async () => {
  const { default: express } = await import('express');
  const { CommunityService } = await import('../src/community.js');
  const { createCommunityRouter } = await import('../src/community-routes.js');
  const store = await fixture();
  const app = express();
  app.use(express.json());
  app.use(
    createCommunityRouter({
      service: new CommunityService(store),
      requireAdmin: (_req, res) => {
        res.sendStatus(401);
      },
    }),
  );
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
  const send = (authorization?: string, passwordValue = password) =>
    fetch(base + '/api/auth/account/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
      body: JSON.stringify({ confirmation: 'DELETE', password: passwordValue, publicKey: 'other' }),
    });
  try {
    assert.equal((await send()).status, 401);
    assert.equal((await send(`Bearer ${one}`, 'wrong')).status, 403);
    assert.ok((await store.read()).accounts.owner);
    assert.equal((await send(`Bearer ${one}`)).status, 200);
    for (const token of [one, two]) assert.equal((await fetch(base + '/api/auth/me', { headers: { authorization: `Bearer ${token}` } })).status, 401);
    assert.equal((await fetch(base + '/api/auth/me', { headers: { authorization: `Bearer ${other}` } })).status, 200);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('deleted social binding rejects stale callbacks and cannot resurrect the old account', async () => {
  const { finishSocialIdentity } = await import('../src/social-auth.js');
  const store = await fixture();
  await deleteEmailAccount(store, `Bearer ${one}`, { confirmation: 'DELETE', password }, [], now);
  const env = { SOCIAL_REGISTRATION_ALLOWED_EMAILS: 'test@example.invalid' };
  for (const flow of [{ createdAt: now - 1 }, { linkTo: 'owner', createdAt: now - 1 }, {}]) {
    await assert.rejects(finishSocialIdentity(store, env, 'google', 'owner', 'test@example.invalid', true, flow, now + 1), { code: 'social_flow_expired' });
  }
  assert.equal((await store.read()).accounts.owner, undefined);
  const result = await finishSocialIdentity(store, env, 'google', 'owner', 'test@example.invalid', true, { createdAt: now + 1 }, now + 2);
  assert.equal(result.kind, 'session');
  if (result.kind === 'session') assert.notEqual(result.account.publicKey, 'owner');
  assert.equal((await store.read()).accounts.owner, undefined);
});
