import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';
import { createMeetingSimulationRouter } from '../src/meeting-simulation-routes.js';
test('local session API: organizer controls lifecycle, fixture participants cast only their own non-binding choice', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meeting-http-'));
  const store = new FileCommunityStore(path.join(dir, 'isolated.json'));
  let organizers: string[] = [];
  const app = express();
  app.use(express.json());
  app.use('/fixture', createMeetingSimulationRouter({ mode: 'test_only', store, organizers: () => organizers }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.on('listening', r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/fixture`;
  const login = async () => {
    const kp = Keypair.random();
    const c = await createChallenge(store, kp.publicKey());
    return { wallet: kp.publicKey(), token: (await verifyChallenge(store, kp.publicKey(), Buffer.from(kp.signMessage(c.message)).toString('base64'))).token };
  };
  const req = (route: string, token?: string, body?: unknown) =>
    fetch(`${base}${route}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    const org = await login(),
      a = await login(),
      b = await login(),
      outsider = await login();
    const before = await store.read();
    const input = {
      campaignId: 'synthetic',
      title: 'Fixture meeting',
      resolution: 'Non-binding fixture choice',
      participants: [a.wallet, b.wallet],
      idempotencyKey: 'first',
    };
    assert.equal((await req('/meetings', undefined, input)).status, 401);
    assert.equal((await req('/meetings', org.token, input)).status, 503);
    organizers = [org.wallet];
    assert.equal((await req('/meetings', outsider.token, input)).status, 403);
    assert.equal((await req('/meetings', org.token, { ...input, binding: true })).status, 400);
    const response = await req('/meetings', org.token, input);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const m = await response.json();
    const route = `/meetings/${m.id}`;
    assert.equal((await req(route, outsider.token)).status, 409);
    assert.equal((await req(`${route}/state`, a.token, { state: 'open' })).status, 403);
    assert.equal((await req(`${route}/state`, org.token, { state: 'open' })).status, 200);
    assert.equal((await req(`${route}/participation`, a.token, { choice: 'for', actor: b.wallet })).status, 400);
    const own = await (await req(`${route}/participation`, a.token, { choice: 'for' })).json();
    assert.equal(own.totals, null);
    assert.equal(own.ownChoice, 'for');
    assert.equal((await req(`${route}/participation`, a.token, { choice: 'against' })).status, 409);
    await req(`${route}/participation`, b.token, { choice: 'against' });
    organizers = [];
    assert.equal((await req(`${route}/state`, org.token, { state: 'closed' })).status, 503);
    organizers = [org.wallet];
    await req(`${route}/state`, org.token, { state: 'closed' });
    const closed = await (await req(route, a.token)).json();
    assert.equal(closed.binding, false);
    assert.equal(closed.legalEffect, false);
    assert.deepEqual(closed.totals, { for: 1, against: 1, abstain: 0 });
    assert.equal('ballots' in closed, false);
    assert.equal((await req(`${route}/participation`, b.token, { choice: 'against' })).status, 409);
    const after = await store.read();
    delete after.simulatedMeetings;
    assert.deepEqual(after, before);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
