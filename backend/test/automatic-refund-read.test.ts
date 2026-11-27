import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { Asset, Networks, Keypair, StrKey } from '@stellar/stellar-sdk';
import { FileRefundStore } from '../src/automatic-refund-store.js';
import { readAutomaticRefunds } from '../src/automatic-refund-read.js';
import { TESTNET_PASSPHRASE } from '../src/automatic-refunds.js';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';
const wallet = Keypair.random();
const other = Keypair.random();
const campaign = StrKey.encodeContract(Buffer.alloc(32, 4));
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'refund-read-'));
  const path = join(dir, 'config.json');
  const c = {
    networkPassphrase: TESTNET_PASSPHRASE,
    storeDirectory: join(dir, 'journal'),
    contracts: { [campaign]: { token: Asset.native().contractId(Networks.TESTNET) } },
    recipients: [
      { campaign, contributor: wallet.publicKey() },
      { campaign, contributor: other.publicKey() },
    ],
  };
  await writeFile(path, JSON.stringify(c), { mode: 0o600 });
  const store = new FileRefundStore(c.storeDirectory);
  await store.write(JSON.stringify([campaign, wallet.publicKey()]), {
    campaign,
    contributor: wallet.publicKey(),
    state: 'confirmed',
    amount: '10000000',
    confirmedAmount: '10000000',
    signedXdr: 'NEVER_LEAK',
    error: 'PRIVATE',
  });
  return { dir, path, c, store };
}
test('private read scopes to explicit wallet and strips all operator fields', async () => {
  const f = await fixture();
  assert.deepEqual(await readAutomaticRefunds(f.path, wallet.publicKey()), [{ campaign, status: 'paid', amount: '10000000' }]);
  assert.deepEqual(await readAutomaticRefunds(f.path, other.publicKey()), []);
  await f.store.write(JSON.stringify([campaign, wallet.publicKey()]), { campaign, contributor: other.publicKey(), state: 'confirmed' });
  await assert.rejects(readAutomaticRefunds(f.path, wallet.publicKey()), /IDENTITY/);
});
test('read rejects broad config permissions, mainnet, token mismatch and invalid wallet', async () => {
  const f = await fixture();
  await chmod(f.path, 0o644);
  await assert.rejects(readAutomaticRefunds(f.path, wallet.publicKey()));
  await chmod(f.path, 0o600);
  await writeFile(f.path, JSON.stringify({ ...f.c, networkPassphrase: Networks.PUBLIC }));
  await assert.rejects(readAutomaticRefunds(f.path, wallet.publicKey()));
  await writeFile(f.path, JSON.stringify({ ...f.c, contracts: { [campaign]: { token: campaign } } }));
  await assert.rejects(readAutomaticRefunds(f.path, wallet.publicKey()));
  await assert.rejects(readAutomaticRefunds(f.path, 'invalid'));
});
test('read-only route authenticates wallet, refuses actor override, uses no-store and fails closed', async () => {
  const f = await fixture();
  const store = new FileCommunityStore(join(f.dir, 'accounts.json'));
  const challenge = await createChallenge(store, wallet.publicKey());
  const login = await verifyChallenge(store, wallet.publicKey(), Buffer.from(wallet.signMessage(challenge.message)).toString('base64'));
  let fail = false,
    seen = '';
  const app = express();
  app.use(
    createCommunityRouter({
      service: new CommunityService(store),
      requireAdmin: (_req, res) => {
        res.sendStatus(403);
      },
      automaticRefunds: async (actor) => {
        seen = actor;
        if (fail) throw Error('PRIVATE-XDR');
        return readAutomaticRefunds(f.path, actor);
      },
    }),
  );
  for (const reason of ['not_configured', 'unsupported_network'] as const)
    app.use(
      '/' + reason,
      createCommunityRouter({
        service: new CommunityService(store),
        requireAdmin: (_req, res) => {
          res.sendStatus(403);
        },
        automaticRefundsUnavailable: reason,
      }),
    );
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((ok) => server.once('listening', ok));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}/api/auth/automatic-refunds`;
  try {
    const headers = { authorization: `Bearer ${login.token}` };
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await fetch(base + '?actor=' + other.publicKey(), { headers })).status, 400);
    const r = await fetch(base, { headers });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    const body = await r.json();
    assert.deepEqual(body.refunds, [{ campaign, status: 'paid', amount: '10000000' }]);
    assert.equal(seen, wallet.publicKey());
    assert.ok(!JSON.stringify(body).includes('NEVER_LEAK'));
    const cookie = await fetch(base, { headers: { cookie: `__Host-blockallisto-session=${login.token}` } });
    assert.equal(cookie.status, 200);
    assert.deepEqual((await cookie.json()).refunds, body.refunds);
    for (const authMethod of ['email', 'social'] as const) {
      await store.change((state) => {
        state.accounts[wallet.publicKey()].authMethod = authMethod;
      });
      assert.equal((await fetch(base, { headers })).status, 403);
    }
    await store.change((state) => {
      delete state.accounts[wallet.publicKey()].authMethod;
    });
    for (const reason of ['not_configured', 'unsupported_network']) {
      const disabled = await fetch(`http://127.0.0.1:${address.port}/${reason}/api/auth/automatic-refunds`, { headers });
      assert.equal(disabled.status, 200);
      assert.deepEqual(await disabled.json(), { enabled: false, reason });
    }
    fail = true;
    const unavailable = await fetch(base, { headers });
    assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), { code: 'API_UNAVAILABLE' });
    await store.change((state) => {
      state.sessions = {};
    });
    assert.equal((await fetch(base, { headers })).status, 401);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((ok) => server.close(() => ok()));
  }
});
