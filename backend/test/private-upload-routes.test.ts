import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';
import { createCommunityRouter } from '../src/community-routes.js';
import type { PrivateTextObjects } from '../src/private-application-upload-workflow.js';

test('actual router + disk persistence: private refs never leak, cross-user/app/document/ended-session deny before provider', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'private-upload-http-'));
  const filename = path.join(dir, 'state.json');
  let store = new FileCommunityStore(filename);
  const contents = new Map<string, string>();
  const calls: string[] = [];
  let serial = 0;
  const objects: PrivateTextObjects = {
    plan: (content) => ({
      storageId: 'synthetic-config',
      key: `website uploads/${++serial}.txt`,
      sha256: createHash('sha256').update(content).digest('hex'),
      bytes: Buffer.byteLength(content),
    }),
    upload: async (ref, content) => {
      calls.push('PUT');
      contents.set(ref.key, content);
    },
    read: async (ref) => {
      calls.push('GET');
      return contents.get(ref.key)!;
    },
  };
  let service = new CommunityService(store, {
    retentionDays: 90,
    privateApplicationObjects: objects,
  });
  const issuer = Keypair.random(),
    outsider = Keypair.random(),
    operator = Keypair.random();
  process.env.OPERATOR_WALLETS = operator.publicKey();
  const app = express();
  app.use(express.json({ limit: '32kb' }));
  const router = () =>
    createCommunityRouter({
      service,
      requireAdmin: (_q, r) => {
        r.sendStatus(403);
      },
    });
  app.use((req, res, next) => router()(req, res, next));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.on('listening', r));
  const port = (server.address() as { port: number }).port;
  async function login(kp: Keypair) {
    const c = await createChallenge(store, kp.publicKey());
    return (await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(c.message)).toString('base64'))).token;
  }
  async function req(p: string, token?: string, body?: unknown) {
    return fetch(`http://127.0.0.1:${port}${p}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  const payload = {
    projectName: 'Synthetic private',
    country: 'PT',
    instrumentType: 'Testnet escrow',
    targetAmount: '2',
    description: 'Synthetic only',
  };
  try {
    const it = await login(issuer),
      xt = await login(outsider),
      ot = await login(operator);
    const own = (await (await req('/api/issuer-applications/drafts', it, payload)).json()).application;
    const other = (await (await req('/api/issuer-applications', xt, payload)).json()).application;
    const op = '00000000-0000-4000-8000-000000000001';
    const upload = await req(`/api/issuer-applications/${own.id}/documents`, it, {
      filename: 'original name.txt',
      content: 'PRIVATE SYNTHETIC CONTENT',
      operationId: op,
    });
    assert.equal(upload.status, 201);
    const { document } = await upload.json();
    assert.deepEqual(Object.keys(document).sort(), ['filename', 'id', 'sha256', 'uploadedAt']);
    const persisted = await store.read();
    assert.equal(persisted.applications[own.id].documents![0].content, undefined);
    assert.equal(persisted.privateApplicationUploads!.intents[op].status, 'committed');
    // Real fs JSON is reopened through a new Store and Service, not a cloned fake repo.
    store = new FileCommunityStore(filename);
    service = new CommunityService(store, {
      retentionDays: 90,
      privateApplicationObjects: objects,
    });
    const root = `/api/issuer-applications/${own.id}/documents/${document.id}`;
    const valid = await req(root, it);
    assert.equal(valid.status, 200);
    assert.equal(await valid.text(), 'PRIVATE SYNTHETIC CONTENT');
    assert.equal(valid.headers.get('cache-control'), 'no-store');
    const gets = calls.filter((x) => x === 'GET').length;
    for (const [p, t, status] of [
      [root, xt, 404],
      [`/api/issuer-applications/${other.id}/documents/${document.id}`, it, 404],
      [`/api/issuer-applications/${other.id}/documents/${document.id}`, xt, 404],
      [root, undefined, 401],
      [`/api/operator/issuer-applications/${own.id}/documents/${document.id}`, it, 403],
    ] as const) {
      const r = await req(p, t);
      assert.equal(r.status, status);
      assert.equal(r.headers.get('cache-control'), 'no-store');
      const text = await r.text();
      assert.ok(!text.includes('PRIVATE SYNTHETIC') && !text.includes('website uploads') && !text.includes('synthetic-config'));
    }
    assert.equal(calls.filter((x) => x === 'GET').length, gets);
    const wrongUpload = await req(`/api/issuer-applications/${own.id}/documents`, xt, {
      filename: 'x.txt',
      content: 'wrong owner',
      operationId: '00000000-0000-4000-8000-000000000002',
    });
    assert.equal(wrongUpload.status, 404);
    assert.equal(calls.filter((x) => x === 'PUT').length, 1);
    const ownList = await (await req('/api/issuer-applications', it)).json();
    const listText = JSON.stringify(ownList);
    assert.ok(!listText.includes('PRIVATE SYNTHETIC') && !listText.includes('website uploads') && !listText.includes('synthetic-config'));
    assert.equal(ownList.applications.length, 1);
    const otherList = await (await req('/api/issuer-applications', xt)).json();
    assert.equal(otherList.applications.length, 1);
    assert.equal(otherList.applications[0].id, other.id);
    assert.equal((await req(`/api/issuer-applications/${own.id}/submit`, it, {})).status, 200);
    assert.equal((await req(`/api/operator/issuer-applications/${own.id}/documents/${document.id}`, ot)).status, 200);
    async function del(p: string, t?: string) {
      return fetch(`http://127.0.0.1:${port}${p}`, {
        method: 'DELETE',
        headers: t ? { authorization: `Bearer ${t}` } : {},
      });
    }
    const draft = (await (await req('/api/issuer-applications/drafts', it, payload)).json()).application;
    assert.equal(draft.status, 'draft');
    const dd = (
      await (
        await req(`/api/issuer-applications/${draft.id}/documents`, it, {
          filename: 'draft.txt',
          content: 'draft synthetic',
          operationId: '00000000-0000-4000-8000-000000000002',
        })
      ).json()
    ).document;
    const dp = `/api/issuer-applications/${draft.id}/documents/${dd.id}`;
    const callsBeforeDelete = calls.length;
    assert.equal((await del(dp, xt)).status, 404);
    assert.equal((await del(dp)).status, 401);
    assert.equal(calls.length, callsBeforeDelete);
    const deletion = await del(dp, it);
    assert.equal(deletion.status, 202);
    assert.deepEqual(await deletion.json(), { status: 'deletion_pending' });
    assert.equal(deletion.headers.get('cache-control'), 'no-store');
    assert.equal((await req(dp, it)).status, 404);
    assert.equal(calls.length, callsBeforeDelete);
    assert.ok((await new FileCommunityStore(filename).read()).privateApplicationDeletions![dd.id]);
    assert.equal((await req(`/api/issuer-applications/${draft.id}/submit`, it, {})).status, 409);
    const finalDraft = (await (await req('/api/issuer-applications/drafts', it, payload)).json()).application;
    const fd = (
      await (
        await req(`/api/issuer-applications/${finalDraft.id}/documents`, it, {
          filename: 'final.txt',
          content: 'final synthetic',
          operationId: '00000000-0000-4000-8000-000000000003',
        })
      ).json()
    ).document;
    assert.equal((await req(`/api/issuer-applications/${finalDraft.id}/submit`, it, {})).status, 200);
    const frozen = await del(`/api/issuer-applications/${finalDraft.id}/documents/${fd.id}`, it);
    assert.equal(frozen.status, 409);
    assert.equal(frozen.headers.get('cache-control'), 'no-store');
    const loggedOut = await req('/api/auth/logout', it, {});
    assert.equal(loggedOut.status, 200);
    const beforeLogoutGet = calls.length;
    assert.equal((await req(root, it)).status, 401);
    assert.equal(calls.length, beforeLogoutGet);
    const fresh = await login(issuer);
    await store.change((s) => {
      for (const session of Object.values(s.sessions)) if (session.publicKey === issuer.publicKey()) session.expiresAt = 0;
    });
    const before = calls.length;
    const expired = await req(root, fresh);
    assert.equal(expired.status, 401);
    assert.equal(calls.length, before);
    const expiredUpload = await req(`/api/issuer-applications/${own.id}/documents`, it, {
      filename: 'x.txt',
      content: 'expired',
      operationId: '00000000-0000-4000-8000-000000000003',
    });
    assert.equal(expiredUpload.status, 401);
    assert.equal(calls.length, before);
  } finally {
    delete process.env.OPERATOR_WALLETS;
    await new Promise<void>((r) => server.close(() => r()));
    await fs.rm(dir, { recursive: true, force: true });
  }
});
