import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { createChallenge, verifyChallenge, hashToken } from '../src/accounts.js';
import { createDeletionChallenge, consumeWalletDeletionProof } from '../src/deletion-proof.js';
const now = 1800000000000;
async function fixture() {
  const store = new FileCommunityStore(join(mkdtempSync(join(tmpdir(), 'deletion-proof-')), 'store.json'));
  const kp = Keypair.random();
  const challenge = await createChallenge(store, kp.publicKey(), now);
  const login = await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(challenge.message)).toString('base64'), now);
  assert.ok('token' in login);
  const authorization = `Bearer ${login.token}`;
  return { store, kp, authorization, login };
}
test('purpose challenge is explicit, not a login challenge, session-bound, single-use and cannot authorize another account', async () => {
  const { store, kp, authorization } = await fixture();
  const challenge = await createDeletionChallenge(store, authorization, now);
  assert.match(challenge.message, /Purpose: permanently delete/);
  assert.match(challenge.message, /not a transaction/);
  const proof = { nonce: challenge.nonce, signature: Buffer.from(kp.signMessage(challenge.message)).toString('base64') };
  await assert.rejects(verifyChallenge(store, kp.publicKey(), proof.signature, now));
  assert.equal(await store.change((s) => consumeWalletDeletionProof(s, authorization, proof, now)), true);
  assert.equal(await store.change((s) => consumeWalletDeletionProof(s, authorization, proof, now)), false);
});
test('ordinary login signature, expired challenge and wrong wallet signatures are refused', async () => {
  for (const mode of ['login', 'expired', 'wrong']) {
    const { store, kp, authorization } = await fixture();
    const challenge = await createDeletionChallenge(store, authorization, now);
    const message = mode === 'login' ? (await createChallenge(store, kp.publicKey(), now)).message : challenge.message;
    const signer = mode === 'wrong' ? Keypair.random() : kp;
    const proof = { nonce: challenge.nonce, signature: Buffer.from(signer.signMessage(message)).toString('base64') };
    assert.equal(await store.change((s) => consumeWalletDeletionProof(s, authorization, proof, mode === 'expired' ? now + 300001 : now)), false);
  }
});
test('same account in another session cannot use challenge, and reissue invalidates previous challenge', async () => {
  const { store, kp, authorization } = await fixture();
  const challenge = await createDeletionChallenge(store, authorization, now);
  const second = 'bls_' + '9'.repeat(48);
  await store.change((s) => {
    s.sessions[hashToken(second)] = { tokenHash: hashToken(second), publicKey: kp.publicKey(), createdAt: now, expiresAt: now + 100000 };
  });
  const proof = { nonce: challenge.nonce, signature: Buffer.from(kp.signMessage(challenge.message)).toString('base64') };
  assert.equal(await store.change((s) => consumeWalletDeletionProof(s, `Bearer ${second}`, proof, now)), false);
  await createDeletionChallenge(store, authorization, now + 1);
  assert.equal(await store.change((s) => consumeWalletDeletionProof(s, authorization, proof, now + 1)), false);
});
test('signed out and non-wallet identities cannot mint deletion challenge', async () => {
  const { store, kp, authorization } = await fixture();
  await assert.rejects(createDeletionChallenge(store, undefined, now));
  await store.change((s) => {
    s.accounts[kp.publicKey()].authMethod = 'social';
  });
  await assert.rejects(createDeletionChallenge(store, authorization, now), { code: 'deletion_unsupported' });
});

test('wallet deletion fails closed without retention proof, requires purpose signature, and rejects old in-flight logins', async () => {
  const { deleteEmailAccount } = await import('../src/account-deletion.js');
  const { store, kp, authorization } = await fixture();
  const stale = await createChallenge(store, kp.publicKey(), now);
  const challenge = await createDeletionChallenge(store, authorization, now + 1);
  const input = { confirmation: 'DELETE', nonce: challenge.nonce, signature: Buffer.from(kp.signMessage(challenge.message)).toString('base64') };
  for (const check of [undefined, async () => 'unavailable' as const, async () => 'protected' as const]) {
    const before = await store.read();
    await assert.rejects(deleteEmailAccount(store, authorization, input, [], now + 2, check));
    assert.deepEqual(await store.read(), before);
  }
  await assert.rejects(
    deleteEmailAccount(
      store,
      authorization,
      { ...input, signature: Buffer.from(kp.signMessage(stale.message)).toString('base64') },
      [],
      now + 2,
      async () => 'clear',
    ),
    { code: 'deletion_proof_failed' },
  );
  const fresh = await createDeletionChallenge(store, authorization, now + 3);
  await deleteEmailAccount(
    store,
    authorization,
    { confirmation: 'DELETE', nonce: fresh.nonce, signature: Buffer.from(kp.signMessage(fresh.message)).toString('base64') },
    [],
    now + 4,
    async () => 'clear',
  );
  assert.equal((await store.read()).accounts[kp.publicKey()], undefined);
  await assert.rejects(verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(stale.message)).toString('base64'), now + 5));
  const newLogin = await createChallenge(store, kp.publicKey(), now + 6);
  const result = await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(newLogin.message)).toString('base64'), now + 7);
  assert.ok('token' in result);
  assert.equal(result.account.displayName, null);
});

test('wallet purpose proof does not bypass an enabled second factor', async () => {
  const { deleteEmailAccount } = await import('../src/account-deletion.js');
  const { encryptSeed, totpAt } = await import('../src/totp.js');
  const { store, kp, authorization } = await fixture();
  const old = process.env.COMMUNITY_TOTP_KEY;
  process.env.COMMUNITY_TOTP_KEY = 'local-proof-key';
  const seed = 'JBSWY3DPEHPK3PXP';
  try {
    await store.change((s) => {
      s.accounts[kp.publicKey()].totp = {
        status: 'enabled',
        encSeed: encryptSeed('local-proof-key', seed),
        lastUsedStep: -1,
        recoveryHashes: [],
        enabledAt: now,
        failedAttempts: 0,
        lockUntil: null,
      };
    });
    const first = await createDeletionChallenge(store, authorization, now);
    await assert.rejects(
      deleteEmailAccount(
        store,
        authorization,
        { confirmation: 'DELETE', nonce: first.nonce, signature: Buffer.from(kp.signMessage(first.message)).toString('base64') },
        [],
        now,
        async () => 'clear',
      ),
      { code: 'deletion_factor_required' },
    );
    assert.ok((await store.read()).accounts[kp.publicKey()]);
    const second = await createDeletionChallenge(store, authorization, now + 1);
    await deleteEmailAccount(
      store,
      authorization,
      {
        confirmation: 'DELETE',
        nonce: second.nonce,
        signature: Buffer.from(kp.signMessage(second.message)).toString('base64'),
        totpCode: totpAt(seed, now / 1000),
      },
      [],
      now + 2,
      async () => 'clear',
    );
    assert.equal((await store.read()).accounts[kp.publicKey()], undefined);
  } finally {
    if (old === undefined) delete process.env.COMMUNITY_TOTP_KEY;
    else process.env.COMMUNITY_TOTP_KEY = old;
  }
});

async function socialFixture() {
  const f = await fixture();
  await f.store.change((s) => {
    const key = f.kp.publicKey();
    s.accounts[key].authMethod = 'social';
    s.accounts[key].email = 'social@example.invalid';
    s.socialIdentities['google:my-subject'] = {
      provider: 'google',
      subject: 'my-subject',
      publicKey: key,
      email: 'social@example.invalid',
      createdAt: now,
      lastLoginAt: now,
    };
  });
  return f;
}
test('dedicated social callback issues only deletion proof, never deletes or creates another session', async () => {
  const { socialDeletionPurpose } = await import('../src/deletion-proof.js');
  const { finishSocialIdentity } = await import('../src/social-auth.js');
  const { deleteEmailAccount } = await import('../src/account-deletion.js');
  const { store, kp, authorization } = await socialFixture();
  const purpose = await socialDeletionPurpose(store, authorization, 'google', now);
  const before = await store.read();
  const outcome = await finishSocialIdentity(
    store,
    {},
    'google',
    'my-subject',
    'different@example.invalid',
    true,
    { createdAt: now, deletionPurpose: purpose },
    now + 1,
  );
  assert.equal(outcome.kind, 'deletion-proof');
  assert.ok((await store.read()).accounts[kp.publicKey()]);
  assert.deepEqual((await store.read()).sessions, before.sessions);
  if (outcome.kind !== 'deletion-proof') throw Error('wrong outcome');
  await deleteEmailAccount(store, authorization, { confirmation: 'DELETE', socialProof: outcome.proof }, [], now + 2);
  assert.equal((await store.read()).accounts[kp.publicKey()], undefined);
});
test('social deletion rejects different identity, another session, expired/reused proof and provider removed after callback', async () => {
  const { socialDeletionPurpose, issueSocialDeletionProof, consumeSocialDeletionProof } = await import('../src/deletion-proof.js');
  const { finishSocialIdentity } = await import('../src/social-auth.js');
  const { store, kp, authorization } = await socialFixture();
  const purpose = await socialDeletionPurpose(store, authorization, 'google', now);
  await assert.rejects(
    finishSocialIdentity(store, {}, 'google', 'other-subject', 'social@example.invalid', true, { createdAt: now, deletionPurpose: purpose }, now + 1),
    { code: 'deletion_proof_failed' },
  );
  const result = await store.change((s) => issueSocialDeletionProof(s, purpose, 'google', 'my-subject', now));
  const second = 'bls_' + '9'.repeat(48);
  await store.change((s) => {
    s.sessions[hashToken(second)] = { tokenHash: hashToken(second), publicKey: kp.publicKey(), createdAt: now, expiresAt: now + 1000000 };
  });
  assert.equal(await store.change((s) => consumeSocialDeletionProof(s, `Bearer ${second}`, result.proof, now)), false);
  assert.equal(await store.change((s) => consumeSocialDeletionProof(s, authorization, result.proof, now)), true);
  assert.equal(await store.change((s) => consumeSocialDeletionProof(s, authorization, result.proof, now)), false);
  const expired = await store.change((s) => issueSocialDeletionProof(s, purpose, 'google', 'my-subject', now));
  assert.equal(await store.change((s) => consumeSocialDeletionProof(s, `Bearer ${second}`, expired.proof, now + 300001)), false);
  const removed = await store.change((s) => issueSocialDeletionProof(s, purpose, 'google', 'my-subject', now));
  await store.change((s) => {
    delete s.socialIdentities['google:my-subject'];
  });
  assert.equal(await store.change((s) => consumeSocialDeletionProof(s, authorization, removed.proof, now)), false);
});
test('social deletion still requires confirmation, enabled 2FA, and leaves protected state intact', async () => {
  const { socialDeletionPurpose, issueSocialDeletionProof } = await import('../src/deletion-proof.js');
  const { deleteEmailAccount } = await import('../src/account-deletion.js');
  const { store, kp, authorization } = await socialFixture();
  const purpose = await socialDeletionPurpose(store, authorization, 'google', now);
  const result = await store.change((s) => issueSocialDeletionProof(s, purpose, 'google', 'my-subject', now));
  await assert.rejects(deleteEmailAccount(store, authorization, { socialProof: result.proof }, [], now), { code: 'deletion_confirmation_required' });
  await store.change((s) => {
    s.appropriateness[kp.publicKey()] = { publicKey: kp.publicKey() } as any;
  });
  const before = await store.read();
  await assert.rejects(deleteEmailAccount(store, authorization, { confirmation: 'DELETE', socialProof: result.proof }, [], now), {
    code: 'deletion_protected_records',
  });
  assert.deepEqual(await store.read(), before);
});

test('social purpose proof cannot skip enabled TOTP and an ordinary provider login is not a deletion proof', async () => {
  const { socialDeletionPurpose, issueSocialDeletionProof } = await import('../src/deletion-proof.js');
  const { deleteEmailAccount } = await import('../src/account-deletion.js');
  const { encryptSeed, totpAt } = await import('../src/totp.js');
  const { store, kp, authorization } = await socialFixture();
  const old = process.env.COMMUNITY_TOTP_KEY;
  process.env.COMMUNITY_TOTP_KEY = 'local-social-key';
  const seed = 'JBSWY3DPEHPK3PXP';
  try {
    await store.change((s) => {
      s.accounts[kp.publicKey()].totp = {
        status: 'enabled',
        encSeed: encryptSeed('local-social-key', seed),
        lastUsedStep: -1,
        recoveryHashes: [],
        enabledAt: now,
        failedAttempts: 0,
        lockUntil: null,
      };
    });
    await assert.rejects(deleteEmailAccount(store, authorization, { confirmation: 'DELETE' }, [], now), { code: 'deletion_proof_failed' });
    const purpose = await socialDeletionPurpose(store, authorization, 'google', now);
    const first = await store.change((s) => issueSocialDeletionProof(s, purpose, 'google', 'my-subject', now));
    await assert.rejects(deleteEmailAccount(store, authorization, { confirmation: 'DELETE', socialProof: first.proof }, [], now), {
      code: 'deletion_factor_required',
    });
    assert.ok((await store.read()).accounts[kp.publicKey()]);
    const second = await store.change((s) => issueSocialDeletionProof(s, purpose, 'google', 'my-subject', now + 1));
    await deleteEmailAccount(store, authorization, { confirmation: 'DELETE', socialProof: second.proof, totpCode: totpAt(seed, now / 1000) }, [], now + 2);
    assert.equal((await store.read()).accounts[kp.publicKey()], undefined);
  } finally {
    if (old === undefined) delete process.env.COMMUNITY_TOTP_KEY;
    else process.env.COMMUNITY_TOTP_KEY = old;
  }
});
