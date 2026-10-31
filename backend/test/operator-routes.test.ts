import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';
import { createCommunityRouter } from '../src/community-routes.js';

// The operator surface backs the demo admin dashboard: browser operators use
// the ordinary wallet sign-in, authorization is OPERATOR_WALLETS membership
// checked server-side per request, fail-closed when unset. The x-admin-key
// secret never reaches the browser.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'operator-test-'));
let srv: ReturnType<express.Express['listen']>;
let base: string;
let store: FileCommunityStore;
let service: CommunityService;

const operatorKp = Keypair.random();
const userKp = Keypair.random();

async function tokenFor(kp: Keypair): Promise<string> {
  const { message } = await createChallenge(store, kp.publicKey());
  const sig = Buffer.from(kp.sign(Buffer.from(message, 'utf8'))).toString('base64');
  return (await verifyChallenge(store, kp.publicKey(), sig)).token;
}

const call = (path: string, init?: RequestInit) => fetch(`${base}${path}`, init);
const json = (token: string, method: string, body?: unknown) => ({
  method,
  headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
  body: body === undefined ? undefined : JSON.stringify(body),
});

before(async () => {
  store = new FileCommunityStore(path.join(dir, 'store.json'));
  service = new CommunityService(store, { retentionDays: 90 });
  const app = express();
  app.use(express.json());
  app.use(createCommunityRouter({ service, requireAdmin: (_req, _res, next) => next() }));
  await new Promise<void>((resolve) => {
    srv = app.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = srv.address();
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
});

after(async () => {
  delete process.env.OPERATOR_WALLETS;
  await new Promise((resolve) => srv.close(resolve));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('operator endpoints fail closed when OPERATOR_WALLETS is unset', async () => {
  delete process.env.OPERATOR_WALLETS;
  const token = await tokenFor(operatorKp);
  const res = await call('/api/operator/tickets', { headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error ?? '', /OPERATOR_WALLETS not configured/);
});

test('/api/auth/me reports operator designation for the UI reveal hint', async () => {
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();
  const opMe = await (await call('/api/auth/me', { headers: { authorization: `Bearer ${await tokenFor(operatorKp)}` } })).json();
  assert.equal(opMe.isOperator, true);
  const userMe = await (await call('/api/auth/me', { headers: { authorization: `Bearer ${await tokenFor(userKp)}` } })).json();
  assert.equal(userMe.isOperator, false);
});

test('operator endpoints reject anonymous and non-operator wallets', async () => {
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();
  const anon = await call('/api/operator/tickets');
  assert.equal(anon.status, 401);
  const userToken = await tokenFor(userKp);
  const wrong = await call('/api/operator/tickets', { headers: { authorization: `Bearer ${userToken}` } });
  assert.equal(wrong.status, 403);
  assert.match((await wrong.json()).error ?? '', /not a designated operator/);
});

test('designated operator runs the full moderation pipeline and owners get notified', async () => {
  process.env.OPERATOR_WALLETS = `placeholder, ${operatorKp.publicKey()} ,`;
  const op = await tokenFor(operatorKp);
  const user = await tokenFor(userKp);

  // Real owner-scoped fixtures created by the user wallet, not seed scripts.
  const appRes = await call(
    '/api/issuer-applications',
    json(user, 'POST', {
      projectName: 'Operator QA Grove [DEMO]',
      country: 'PT',
      instrumentType: 'equity',
      targetAmount: '1000',
      description: 'demo',
    }),
  );
  assert.equal(appRes.status, 201);
  const application = (await appRes.json()).application;

  const ticketRes = await call('/api/support/tickets', json(user, 'POST', { kind: 'support', subject: 'Operator QA', body: 'demo' }));
  assert.equal(ticketRes.status, 201);
  const ticket = (await ticketRes.json()).ticket;

  const commentRes = await call('/api/campaigns/demo-solar/comments', json(user, 'POST', { body: 'demo comment' }));
  assert.equal(commentRes.status, 201);
  const comment = (await commentRes.json()).comment;

  // Lists are operator-visible.
  const apps = await (await call('/api/operator/issuer-applications', { headers: { authorization: `Bearer ${op}` } })).json();
  assert.ok(apps.applications.some((a: any) => a.id === application.id));
  const tickets = await (await call('/api/operator/tickets', { headers: { authorization: `Bearer ${op}` } })).json();
  assert.ok(tickets.tickets.some((t: any) => t.id === ticket.id));
  const comments = await (await call('/api/operator/comments', { headers: { authorization: `Bearer ${op}` } })).json();
  assert.ok(comments.comments.some((c: any) => c.id === comment.id));

  // Mutations: status change, moderation with reason, ticket close.
  const st = await call(`/api/operator/issuer-applications/${application.id}/status`, json(op, 'POST', { status: 'under_review' }));
  assert.equal(st.status, 200);
  const hide = await call(`/api/operator/comments/${comment.id}/hide`, json(op, 'POST', { reason: 'qa moderation' }));
  assert.equal(hide.status, 200);
  const close = await call(`/api/operator/tickets/${ticket.id}/close`, json(op, 'POST', {}));
  assert.equal(close.status, 200);

  // Operator news posting labels the post platform-demo like the seed.
  const news = await call('/api/operator/campaigns/demo-solar/news', json(op, 'POST', { title: 'Operator QA note [DEMO]', body: 'demo body' }));
  assert.equal(news.status, 201);
  const post = (await news.json()).post;
  assert.equal(post.authorLabel, 'platform-demo');
  const feed = await (await call('/api/campaigns/demo-solar/news')).json();
  assert.ok(feed.news.some((n: any) => n.id === post.id));

  // Every mutation notified the owning wallet with structured vars.
  const mine = await (await call('/api/notifications', { headers: { authorization: `Bearer ${user}` } })).json();
  const kinds = mine.notifications.map((n: any) => n.kind).sort();
  assert.deepEqual(kinds, ['application_received', 'application_status', 'comment_moderated', 'ticket_closed']);
  assert.deepEqual(mine.notifications.find((n: any) => n.kind === 'application_status').vars, {
    projectName: 'Operator QA Grove [DEMO]',
    status: 'under_review',
  });
  assert.deepEqual(mine.notifications.find((n: any) => n.kind === 'comment_moderated').vars, {
    campaignId: 'demo-solar',
    reason: 'qa moderation',
  });
  assert.deepEqual(mine.notifications.find((n: any) => n.kind === 'ticket_closed').vars, {
    ticketKind: 'support',
    subject: 'Operator QA',
  });
});

test('empty-string OPERATOR_WALLETS also fails closed', async () => {
  process.env.OPERATOR_WALLETS = '  , ,';
  const token = await tokenFor(operatorKp);
  const res = await call('/api/operator/tickets', { headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.status, 503);
});
