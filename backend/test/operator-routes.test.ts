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
  const sig = Buffer.from(kp.signMessage(message)).toString('base64');
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

// --- Post-funding report publish gate (on-chain verified post-close only) ---

const investorKp = Keypair.random();
const pastDeadline = () => ({ id: 'demo-solar', goal: '100', raised: '100', deadlineSeconds: Math.floor(Date.now() / 1000) - 3600, withdrawn: false });
const futureDeadline = () => ({ id: 'demo-solar', goal: '100', raised: '100', deadlineSeconds: Math.floor(Date.now() / 1000) + 86400, withdrawn: false });

async function withReportsApp(
  fundingState: ((id: string) => Promise<any>) | undefined,
  run: (callApp: (path: string, init?: RequestInit) => Promise<Response>, tokenForApp: (kp: Keypair) => Promise<string>) => Promise<void>,
  entitlement?: (campaignId: string, publicKey: string) => Promise<{ registered: boolean; balanceUnits: bigint; contributedBefore: boolean }>,
) {
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'reports-test-'));
  const store2 = new FileCommunityStore(path.join(dir2, 'store.json'));
  const service2 = new CommunityService(store2, { retentionDays: 90 });
  // Tokens are store-scoped: mint against THIS app's store, not the outer one.
  const tokenForApp = async (kp: Keypair): Promise<string> => {
    const { message } = await createChallenge(store2, kp.publicKey());
    const sig = Buffer.from(kp.signMessage(message)).toString('base64');
    return (await verifyChallenge(store2, kp.publicKey(), sig)).token;
  };
  const app2 = express();
  app2.use(express.json());
  app2.use(createCommunityRouter({ service: service2, requireAdmin: (_req, _res, next) => next(), fundingState, investorEntitlement: entitlement }));
  const srv2 = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app2.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = srv2.address();
  const base2 = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
  try {
    await run((p, init) => fetch(`${base2}${p}`, init), tokenForApp);
  } finally {
    await new Promise((resolve) => srv2.close(resolve));
    fs.rmSync(dir2, { recursive: true, force: true });
  }
}

test('reports: publish refuses when no on-chain verifier is wired (fail closed)', async () => {
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();
  const op = await tokenFor(operatorKp);
  // The default app in before() has no fundingState dep.
  const res = await call('/api/operator/campaigns/demo-solar/reports', json(op, 'POST', { kind: 'funding_outcome', title: 't', body: 'b' }));
  assert.equal(res.status, 503);
  assert.match((await res.json()).error ?? '', /verification is not configured/);
});

test('reports: publish gate enforces verified post-close state', async () => {
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();

  // Unknown campaign -> 404.
  await withReportsApp(
    async () => null,
    async (callApp, tokenForApp) => {
      const res = await callApp(
        '/api/operator/campaigns/demo-solar/reports',
        json(await tokenForApp(operatorKp), 'POST', { kind: 'funding_outcome', title: 't', body: 'b' }),
      );
      assert.equal(res.status, 404);
    },
  );

  // On-chain read failure -> 503, never a guess.
  await withReportsApp(
    async () => {
      throw new Error('rpc down');
    },
    async (callApp, tokenForApp) => {
      const res = await callApp(
        '/api/operator/campaigns/demo-solar/reports',
        json(await tokenForApp(operatorKp), 'POST', { kind: 'funding_outcome', title: 't', body: 'b' }),
      );
      assert.equal(res.status, 503);
      assert.match((await res.json()).error ?? '', /could not verify on-chain campaign state/);
    },
  );

  // Funding period still open -> 409.
  await withReportsApp(
    async () => futureDeadline(),
    async (callApp, tokenForApp) => {
      const res = await callApp(
        '/api/operator/campaigns/demo-solar/reports',
        json(await tokenForApp(operatorKp), 'POST', { kind: 'funding_outcome', title: 't', body: 'b' }),
      );
      assert.equal(res.status, 409);
      assert.match((await res.json()).error ?? '', /funding period has not ended/);
    },
  );

  // Deadline passed but goal not reached -> funding_outcome still publishes
  // (deadline-only gate; reporting after close covers failed campaigns too).
  await withReportsApp(
    async () => ({ ...pastDeadline(), raised: '40' }),
    async (callApp, tokenForApp) => {
      const res = await callApp(
        '/api/operator/campaigns/demo-solar/reports',
        json(await tokenForApp(operatorKp), 'POST', { kind: 'funding_outcome', title: 'Outcome', body: 'Fictional underfunded outcome.' }),
      );
      assert.equal(res.status, 201);
    },
  );

  // use_of_proceeds implies a payout: refused until on-chain state shows the
  // withdrawal actually happened.
  await withReportsApp(
    async () => pastDeadline(), // withdrawn: false
    async (callApp, tokenForApp) => {
      const res = await callApp(
        '/api/operator/campaigns/demo-solar/reports',
        json(await tokenForApp(operatorKp), 'POST', { kind: 'use_of_proceeds', title: 'Proceeds', body: 'Fictional proceeds use.' }),
      );
      assert.equal(res.status, 409);
      assert.match((await res.json()).error ?? '', /not recorded as withdrawn/);
    },
  );
  await withReportsApp(
    async () => ({ ...pastDeadline(), withdrawn: true }),
    async (callApp, tokenForApp) => {
      const res = await callApp(
        '/api/operator/campaigns/demo-solar/reports',
        json(await tokenForApp(operatorKp), 'POST', { kind: 'use_of_proceeds', title: 'Proceeds', body: 'Fictional proceeds use.' }),
      );
      assert.equal(res.status, 201);
    },
  );

  // Deadline passed -> publish succeeds, report is labeled and readable only
  // by entitled investors and operators - never publicly.
  const entitlementByWallet = async (_id: string, pk: string) => ({
    registered: true,
    balanceUnits: pk === investorKp.publicKey() ? 5n : 0n,
    contributedBefore: false,
  });
  await withReportsApp(
    async () => pastDeadline(),
    async (callApp, tokenForApp) => {
      const op2 = await tokenForApp(operatorKp);
      const res = await callApp(
        '/api/operator/campaigns/demo-solar/reports',
        json(op2, 'POST', {
          kind: 'funding_outcome',
          title: 'Funding outcome',
          body: 'Fictional outcome report for the demo campaign.',
        }),
      );
      assert.equal(res.status, 201);
      const { report } = await res.json();
      assert.equal(report.authorLabel, 'platform-demo');
      assert.equal(report.kind, 'funding_outcome');

      // Unauthenticated readers get nothing.
      const anon = await callApp('/api/campaigns/demo-solar/reports');
      assert.equal(anon.status, 401);
      // Signed-in non-investors get nothing.
      const user2 = await tokenForApp(userKp);
      const notInvestor = await callApp('/api/campaigns/demo-solar/reports', { headers: { authorization: `Bearer ${user2}` } });
      assert.equal(notInvestor.status, 403);
      assert.match((await notInvestor.json()).error ?? '', /available to investors/);
      // An on-chain contributor reads the report.
      const investor = await callApp('/api/campaigns/demo-solar/reports', {
        headers: { authorization: `Bearer ${await tokenForApp(investorKp)}` },
      });
      assert.equal(investor.status, 200);
      const { reports } = await investor.json();
      assert.equal(reports.length, 1);
      assert.equal(reports[0].id, report.id);
      // Operators read for moderation/ops without a contribution balance.
      const asOperator = await callApp('/api/campaigns/demo-solar/reports', { headers: { authorization: `Bearer ${op2}` } });
      assert.equal(asOperator.status, 200);
      // Non-operators cannot publish even when the gate would pass.
      const denied = await callApp('/api/operator/campaigns/demo-solar/reports', json(user2, 'POST', { kind: 'milestone', title: 't', body: 'b' }));
      assert.equal(denied.status, 403);
    },
    entitlementByWallet,
  );

  // Entitlement unverifiable or unwired -> read fails closed, never public.
  await withReportsApp(
    async () => pastDeadline(),
    async (callApp, tokenForApp) => {
      const res = await callApp('/api/campaigns/demo-solar/reports', {
        headers: { authorization: `Bearer ${await tokenForApp(investorKp)}` },
      });
      assert.equal(res.status, 503);
      assert.match((await res.json()).error ?? '', /entitlement verification is not configured/);
    },
  );
  await withReportsApp(
    async () => pastDeadline(),
    async (callApp, tokenForApp) => {
      const res = await callApp('/api/campaigns/demo-solar/reports', {
        headers: { authorization: `Bearer ${await tokenForApp(investorKp)}` },
      });
      assert.equal(res.status, 503);
      assert.match((await res.json()).error ?? '', /could not verify on-chain investor entitlement/);
    },
    async () => {
      throw new Error('rpc down');
    },
  );
  await withReportsApp(
    async () => pastDeadline(),
    async (callApp, tokenForApp) => {
      const res = await callApp('/api/campaigns/unknown-x/reports', {
        headers: { authorization: `Bearer ${await tokenForApp(investorKp)}` },
      });
      assert.equal(res.status, 404);
    },
    async () => ({ registered: false, balanceUnits: 0n, contributedBefore: false }),
  );

  // Refunded investor: the contract REMOVED their balance entry on refund,
  // so current balance is 0 - access is grounded on the durable contributor
  // registry instead (main's requirement: refunds must not silently revoke).
  await withReportsApp(
    async () => pastDeadline(),
    async (callApp, tokenForApp) => {
      const res = await callApp('/api/campaigns/demo-solar/reports', {
        headers: { authorization: `Bearer ${await tokenForApp(investorKp)}` },
      });
      assert.equal(res.status, 200);
    },
    async () => ({ registered: true, balanceUnits: 0n, contributedBefore: true }),
  );
  // Balance 0 AND no registry record -> still 403.
  await withReportsApp(
    async () => pastDeadline(),
    async (callApp, tokenForApp) => {
      const res = await callApp('/api/campaigns/demo-solar/reports', {
        headers: { authorization: `Bearer ${await tokenForApp(investorKp)}` },
      });
      assert.equal(res.status, 403);
    },
    async () => ({ registered: true, balanceUnits: 0n, contributedBefore: false }),
  );
});

test('issuer application review: operator-only, rejection needs a note, no self-review', async () => {
  process.env.OPERATOR_WALLETS = operatorKp.publicKey();
  const userToken = await tokenFor(userKp);
  const created = await (
    await call(
      '/api/issuer-applications',
      json(userToken, 'POST', {
        projectName: 'Boundary Test Project',
        country: 'PT',
        instrumentType: 'equity',
        targetAmount: '100000 EUR',
        description: 'Fictional demo application for boundary tests.',
        contactEmail: 'boundary@example.org',
      }),
    )
  ).json();
  const id = created.application.id;

  // Anonymous and the applicant themself cannot review.
  const anon = await call(`/api/operator/issuer-applications/${id}/status`, json('', 'POST', { status: 'approved' }));
  assert.equal(anon.status, 401);
  const selfReview = await call(`/api/operator/issuer-applications/${id}/status`, json(userToken, 'POST', { status: 'approved' }));
  assert.equal(selfReview.status, 403);

  // Rejection without a note is refused; with a note it lands and the owner sees it.
  const opToken = await tokenFor(operatorKp);
  const noNote = await call(`/api/operator/issuer-applications/${id}/status`, json(opToken, 'POST', { status: 'rejected' }));
  assert.equal(noNote.status, 400);
  const withNote = await call(
    `/api/operator/issuer-applications/${id}/status`,
    json(opToken, 'POST', { status: 'rejected', note: 'Demo: boundary test rejection.' }),
  );
  assert.equal(withNote.status, 200);
  const mine = await (await call('/api/issuer-applications', { headers: { authorization: `Bearer ${userToken}` } })).json();
  const mineRejected = mine.applications.find((a: any) => a.id === id);
  assert.equal(mineRejected.status, 'rejected');
  assert.equal(mineRejected.reviewNote, 'Demo: boundary test rejection.');
  assert.equal(mineRejected.reviewedBy, `operator:${operatorKp.publicKey()}`);
});
