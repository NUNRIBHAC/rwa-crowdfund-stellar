import { createCommunityTestDirectory } from '../src/test-storage-guard.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';

test('real default server advertises legacy mode, accepts inline upload and never enables private transport', async () => {
  const dir = createCommunityTestDirectory();
  const previous = { store: process.env.COMMUNITY_STORE_PATH, mode: process.env.COMMUNITY_APPLICATION_UPLOAD_MODE };
  process.env.COMMUNITY_STORE_PATH = path.join(dir, 'community.json');
  delete process.env.COMMUNITY_APPLICATION_UPLOAD_MODE;
  const { app } = await import('../src/server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  async function request(url: string, token?: string, body?: unknown) {
    return fetch(base + url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  try {
    const key = Keypair.random();
    const challenge = await (await request('/api/auth/challenge', undefined, { publicKey: key.publicKey() })).json();
    const { token } = await (
      await request('/api/auth/verify', undefined, {
        publicKey: key.publicKey(),
        signature: Buffer.from(key.signMessage(challenge.message)).toString('base64'),
      })
    ).json();
    assert.equal((await request('/api/issuer-applications/upload-mode')).status, 401);
    const mode = await request('/api/issuer-applications/upload-mode', token);
    assert.equal(mode.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await mode.json(), { mode: 'legacy-inline' });
    const { application } = await (
      await request('/api/issuer-applications/drafts', token, {
        projectName: 'Synthetic',
        country: 'PT',
        instrumentType: 'Test',
        targetAmount: '1',
        description: 'Synthetic only',
      })
    ).json();
    const url = `/api/issuer-applications/${application.id}/documents`;
    const payload = { filename: 'legacy.txt', content: 'SYNTHETIC INLINE' };
    const uploaded = await request(url, token, payload);
    assert.equal(uploaded.status, 201);
    const { document } = await uploaded.json();
    assert.equal(await (await request(url + '/' + document.id, token)).text(), payload.content);
    // A private request still fails closed instead of being stored inline.
    const privateAttempt = await request(url, token, { ...payload, operationId: '00000000-0000-4000-8000-000000000001' });
    assert.equal(privateAttempt.status, 503);
    assert.equal((await privateAttempt.json()).code, 'feature_unavailable');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (previous.store === undefined) delete process.env.COMMUNITY_STORE_PATH;
    else process.env.COMMUNITY_STORE_PATH = previous.store;
    if (previous.mode === undefined) delete process.env.COMMUNITY_APPLICATION_UPLOAD_MODE;
    else process.env.COMMUNITY_APPLICATION_UPLOAD_MODE = previous.mode;
    await fs.rm(dir, { recursive: true, force: true });
  }
});
