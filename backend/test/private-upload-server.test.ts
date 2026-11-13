import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@stellar/stellar-sdk';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { FileCommunityStore } from '../src/community-store.js';
import { communityServiceFromEnv } from '../src/community-routes.js';
import { runPrivateApplicationCleanup } from '../src/private-application-runtime.js';

test('real server + env factory + fake OCI: private upload/read/delete/cleanup and freeze after Submit', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'private-server-'));
  const file = path.join(dir, 'store.json');
  const owner = Keypair.random(),
    outsider = Keypair.random(),
    operator = Keypair.random();
  const env = {
    COMMUNITY_STORE_PATH: file,
    OPERATOR_WALLETS: operator.publicKey(),
    COMMUNITY_APPLICATION_UPLOAD_MODE: 'oracle-private',
    COMMUNITY_PRIVATE_UPLOAD_ENABLED: '1',
    COMMUNITY_PRIVATE_CLEANUP_ENABLED: '1',
    COMMUNITY_PRIVATE_OCI_NAMESPACE: 'synthetic',
    COMMUNITY_PRIVATE_OCI_REGION: 'eu-frankfurt-1',
    COMMUNITY_PRIVATE_OCI_BUCKET: 'synthetic-private',
    COMMUNITY_PRIVATE_OCI_PREFIX: 'website uploads',
    COMMUNITY_PRIVATE_OCI_ACCESS_KEY: 'SYNTHETIC',
    COMMUNITY_PRIVATE_OCI_SECRET_KEY: 'synthetic-only-not-a-secret',
  };
  const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  const http = globalThis.fetch;
  const objects = new Map<string, string>();
  const methods: string[] = [];
  const transport: typeof fetch = async (url, init) => {
    assert.match(String(url), /^https:\/\/synthetic\.compat\.objectstorage\.eu-frankfurt-1\.oci\.customer-oci\.com\//);
    assert.ok(String((init?.headers as Record<string, string>).authorization).startsWith('AWS4-HMAC-SHA256 '));
    const key = new URL(String(url)).pathname;
    const method = init?.method ?? 'GET';
    methods.push(method);
    if (method === 'PUT') {
      objects.set(key, Buffer.from(init?.body as Uint8Array).toString());
      return new Response('', { status: 200 });
    }
    if (method === 'GET') return new Response(objects.get(key) ?? '', { status: objects.has(key) ? 200 : 404 });
    if (method === 'DELETE') {
      objects.delete(key);
      return new Response('', { status: 200 });
    }
    throw new Error('unexpected fake provider method');
  };
  globalThis.fetch = transport;
  let server: ReturnType<import('express').Express['listen']> | undefined;
  try {
    const { app } = await import('../src/server.js');
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server!.once('listening', resolve));
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    async function request(url: string, token?: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') {
      return http(base + url, {
        method,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    }
    async function login(key: Keypair) {
      const challenge = await (await request('/api/auth/challenge', undefined, { publicKey: key.publicKey() })).json();
      return (
        await (
          await request('/api/auth/verify', undefined, {
            publicKey: key.publicKey(),
            signature: Buffer.from(key.signMessage(challenge.message)).toString('base64'),
          })
        ).json()
      ).token as string;
    }
    const token = await login(owner),
      foreign = await login(outsider),
      admin = await login(operator);
    assert.equal((await request('/api/issuer-applications/upload-mode')).status, 401);
    assert.deepEqual(await (await request('/api/issuer-applications/upload-mode', token)).json(), { mode: 'oracle-private' });
    const payload = { projectName: 'Synthetic', country: 'PT', instrumentType: 'Test', targetAmount: '1', description: 'Synthetic only' };
    const application = (await (await request('/api/issuer-applications/drafts', token, payload)).json()).application;
    const root = `/api/issuer-applications/${application.id}`;
    const upload = { filename: 'one.txt', content: 'PRIVATE SYNTHETIC ONLY', operationId: '00000000-0000-4000-8000-000000000001' };
    const response = await request(root + '/documents', token, upload);
    assert.equal(response.status, 201);
    const { document } = await response.json();
    assert.deepEqual(Object.keys(document).sort(), ['filename', 'id', 'sha256', 'uploadedAt']);
    const read = await request(root + '/documents/' + document.id, token);
    assert.equal(read.status, 200);
    assert.equal(await read.text(), upload.content);
    assert.equal((await request(root + '/documents/' + document.id, foreign)).status, 404);
    assert.equal((await request('/api/operator/issuer-applications/' + application.id + '/documents/' + document.id, admin)).status, 404);
    const ownList = await (await request('/api/issuer-applications', token)).text();
    assert.ok(!ownList.includes('PRIVATE SYNTHETIC') && !ownList.includes('storageId') && !ownList.includes('website uploads'));
    assert.equal((await request(root + '/documents/' + document.id, token, undefined, 'DELETE')).status, 202);
    const service = await communityServiceFromEnv({ store: new FileCommunityStore(file), transport, startTimers: false });
    assert.equal((await runPrivateApplicationCleanup(service)).deleted, 1);
    assert.equal(objects.size, 0);
    assert.equal((await request(root + '/documents', token, { ...upload, operationId: '00000000-0000-4000-8000-000000000002' })).status, 201);
    assert.equal((await request(root + '/submit', token, {})).status, 200);
    assert.equal(
      (
        await request(
          '/api/operator/issuer-applications/' +
            application.id +
            '/documents/' +
            (await (await request('/api/issuer-applications', token)).json()).applications[0].documents[0].id,
          admin,
        )
      ).status,
      200,
    );
    const calls = methods.length;
    assert.equal((await request(root + '/documents', token, { ...upload, operationId: '00000000-0000-4000-8000-000000000003' })).status, 409);
    const state = await service.store.read();
    const remaining = state.applications[application.id].documents![0];
    assert.equal((await request(root + '/documents/' + remaining.id, token, undefined, 'DELETE')).status, 409);
    assert.equal(methods.length, calls);
    assert.deepEqual(methods, ['PUT', 'GET', 'DELETE', 'PUT', 'GET']);
  } finally {
    globalThis.fetch = http;
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await fs.rm(dir, { recursive: true, force: true });
  }
});
