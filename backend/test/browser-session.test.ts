import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import type { AddressInfo } from 'node:net';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';

test('browser cookie login, CSRF, restore, bearer compatibility and logout use the real router', async () => {
  const app = express();
  app.use(express.json());
  const store = new FileCommunityStore(join(mkdtempSync(join(tmpdir(), 'browser-session-')), 'state.json'));
  app.use(
    createCommunityRouter({
      service: new CommunityService(store),
      requireAdmin: (_req, res) => {
        res.sendStatus(403);
      },
    }),
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  const api = (path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    const kp = Keypair.random();
    const challenge = (await (await api('/api/auth/challenge', 'POST', { publicKey: kp.publicKey() })).json()) as { message: string };
    const login = await api(
      '/api/auth/verify',
      'POST',
      { publicKey: kp.publicKey(), signature: Buffer.from(kp.signMessage(challenge.message)).toString('base64') },
      { 'x-community-session': 'cookie' },
    );
    assert.equal(login.status, 200);
    const result = (await login.json()) as { token: string };
    assert.equal(result.token, 'cookie-session');
    const set = login.headers.getSetCookie();
    assert.equal(set.length, 2);
    const session = set.find((s) => s.startsWith('__Host-blockallisto-session='))!;
    const csrf = set.find((s) => s.startsWith('__Host-blockallisto-csrf='))!;
    assert.match(session, /; HttpOnly/);
    assert.match(session, /; Secure/);
    assert.match(session, /; Path=\//);
    assert.match(session, /; SameSite=Lax/);
    assert.doesNotMatch(session, /Domain=/);
    assert.doesNotMatch(csrf, /HttpOnly/);
    const cookie = set.map((s) => s.split(';')[0]).join('; ');
    const csrfValue = csrf.split(';')[0].slice('__Host-blockallisto-csrf='.length);
    const h = { cookie, 'x-community-session': 'cookie' };
    const me = await api('/api/auth/me', 'GET', undefined, h);
    assert.equal(me.status, 200);
    assert.equal(((await me.json()) as { account: { publicKey: string } }).account.publicKey, kp.publicKey());
    for (const extra of [
      {},
      { 'x-community-csrf': 'wrong' },
      { 'x-community-csrf': csrfValue, origin: 'https://other.invalid' },
      { 'x-community-csrf': csrfValue, 'sec-fetch-site': 'same-site' },
    ]) {
      assert.equal((await api('/api/auth/me', 'PUT', { displayName: 'Denied' }, { ...h, ...extra })).status, 403);
    }
    assert.equal((await api('/api/auth/me', 'PUT', { displayName: 'Cookie User' }, { ...h, 'x-community-csrf': csrfValue })).status, 200);
    const duplicate = cookie + '; ' + session.split(';')[0];
    assert.equal((await api('/api/auth/me', 'GET', undefined, { ...h, cookie: duplicate })).status, 401);
    // Explicit bearer remains usable by existing non-browser clients.
    const bearer = session.split(';')[0].slice('__Host-blockallisto-session='.length);
    assert.equal((await api('/api/auth/me', 'GET', undefined, { authorization: 'Bearer ' + bearer })).status, 200);
    const out = await api('/api/auth/logout', 'POST', {}, { ...h, 'x-community-csrf': csrfValue });
    assert.equal(out.status, 200);
    assert.ok(out.headers.getSetCookie().every((c) => c.includes('Expires=Thu, 01 Jan 1970')));
    assert.equal((await api('/api/auth/me', 'GET', undefined, h)).status, 401);
    assert.equal((await api('/api/auth/email/login', 'POST', {}, { 'x-community-session': 'cookie', origin: 'https://other.invalid' })).status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
