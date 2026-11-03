import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Keypair } from '@stellar/stellar-sdk';
import type { AddressInfo } from 'node:net';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'community-routes-'));
const ADMIN = 'test-admin-secret';

// Mirror of server.ts's admin gate, kept local so the router is tested
// against the same contract.
const requireAdmin: express.RequestHandler = (req, res, next) => {
  const ok = timingSafeEqual(
    createHash('sha256')
      .update(req.header('x-admin-key') ?? '')
      .digest(),
    createHash('sha256').update(ADMIN).digest(),
  );
  if (!ok) {
    res.status(401).json({ error: 'missing or invalid admin key' });
    return;
  }
  next();
};

let base = '';
let server: ReturnType<express.Express['listen']>;

before(async () => {
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  const store = new FileCommunityStore(path.join(dir, 'store.json'));
  const service = new CommunityService(store);
  app.use(createCommunityRouter({ service, requireAdmin }));
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

async function api(method: string, path: string, opts: { token?: string; admin?: boolean; body?: unknown } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.admin ? { 'x-admin-key': ADMIN } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  return { status: res.status, json: (await res.json()) as any };
}

async function login(kp: Keypair): Promise<string> {
  const ch = await api('POST', '/api/auth/challenge', {
    body: { publicKey: kp.publicKey() },
  });
  assert.equal(ch.status, 200);
  const sig = Buffer.from(kp.signMessage(ch.json.message)).toString('base64');
  const v = await api('POST', '/api/auth/verify', {
    body: { publicKey: kp.publicKey(), signature: sig },
  });
  assert.equal(v.status, 200);
  return v.json.token;
}

test('full auth flow over HTTP: challenge, verify, me, rename, logout', async () => {
  const kp = Keypair.random();
  const token = await login(kp);
  const me = await api('GET', '/api/auth/me', { token });
  assert.equal(me.status, 200);
  assert.equal(me.json.account.publicKey, kp.publicKey());
  const renamed = await api('PUT', '/api/auth/me', {
    token,
    body: { displayName: 'SolarFan' },
  });
  assert.equal(renamed.json.account.displayName, 'SolarFan');
  const out = await api('POST', '/api/auth/logout', { token });
  assert.equal(out.status, 200);
  assert.equal((await api('GET', '/api/auth/me', { token })).status, 401);
});

test('writes without a session are rejected', async () => {
  assert.equal(
    (
      await api('POST', '/api/campaigns/demo-solar/comments', {
        body: { body: 'hi' },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await api('POST', '/api/support/tickets', {
        body: { kind: 'support', subject: 'a', body: 'b' },
      })
    ).status,
    401,
  );
  assert.equal((await api('POST', '/api/issuer-applications', { body: {} })).status, 401);
});

test('comment lifecycle over HTTP with author masking', async () => {
  const kp = Keypair.random();
  const token = await login(kp);
  const created = await api('POST', '/api/campaigns/demo-solar/comments', {
    token,
    body: { body: 'Nice testnet demo.' },
  });
  assert.equal(created.status, 201);
  const listed = await api('GET', '/api/campaigns/demo-solar/comments');
  assert.equal(listed.json.comments.length, 1);
  assert.ok(!JSON.stringify(listed.json).includes(kp.publicKey()));
  // Admin moderation requires the admin key.
  const id = created.json.comment.id;
  assert.equal((await api('POST', `/api/admin/comments/${id}/hide`, { body: {} })).status, 401);
  assert.equal(
    (
      await api('POST', `/api/admin/comments/${id}/hide`, {
        admin: true,
        body: { reason: 'test' },
      })
    ).status,
    200,
  );
  assert.equal((await api('GET', '/api/campaigns/demo-solar/comments')).json.comments.length, 0);
});

test('tickets are private to their owner over HTTP', async () => {
  const a = Keypair.random();
  const b = Keypair.random();
  const tokenA = await login(a);
  const tokenB = await login(b);
  await api('POST', '/api/support/tickets', {
    token: tokenA,
    body: { kind: 'support', subject: 'Help', body: 'Question body' },
  });
  assert.equal((await api('GET', '/api/support/tickets', { token: tokenA })).json.tickets.length, 1);
  assert.equal((await api('GET', '/api/support/tickets', { token: tokenB })).json.tickets.length, 0);
  assert.equal((await api('GET', '/api/admin/tickets')).status, 401);
  assert.equal((await api('GET', '/api/admin/tickets', { admin: true })).json.tickets.length, 1);
});

test('news posting is admin-only and labeled', async () => {
  assert.equal(
    (
      await api('POST', '/api/campaigns/demo-solar/news', {
        body: { title: 't', body: 'b' },
      })
    ).status,
    401,
  );
  const posted = await api('POST', '/api/campaigns/demo-solar/news', {
    admin: true,
    body: { title: 'Update', body: 'Fictional demo update.' },
  });
  assert.equal(posted.status, 201);
  assert.equal(posted.json.post.authorLabel, 'platform-demo');
  const listed = await api('GET', '/api/campaigns/demo-solar/news');
  assert.equal(listed.json.news.length, 1);
});

test('news and podcast deletes are admin-only and remove public content', async () => {
  // News: public until the admin delete; 401 without the key; 404 after.
  const posted = await api('POST', '/api/campaigns/demo-solar/news', {
    admin: true,
    body: { title: 'QA fixture', body: 'Synthetic fixture to remove.' },
  });
  assert.equal(posted.status, 201);
  const newsId = posted.json.post.id;
  assert.equal((await api('DELETE', `/api/news/${newsId}`)).status, 401);
  assert.equal((await api('DELETE', `/api/news/${newsId}`, { admin: true })).status, 200);
  // Other tests in this file also post to demo-solar; assert this fixture is
  // gone from both the per-campaign and site-wide feeds.
  assert.ok(!(await api('GET', '/api/campaigns/demo-solar/news')).json.news.some((n: any) => n.id === newsId));
  assert.ok(!(await api('GET', '/api/news')).json.news.some((n: any) => n.id === newsId));
  assert.equal((await api('DELETE', `/api/news/${newsId}`, { admin: true })).status, 404);

  // Podcast: same lifecycle.
  const ep = await api('POST', '/api/podcast/episodes', {
    admin: true,
    body: {
      title: 'QA fixture ep',
      description: 'Synthetic fixture to remove.',
      audioUrl: 'https://audio.example.com/qa.mp3',
    },
  });
  assert.equal(ep.status, 201);
  const epId = ep.json.episode.id;
  assert.equal((await api('DELETE', `/api/podcast/episodes/${epId}`)).status, 401);
  assert.equal((await api('DELETE', `/api/podcast/episodes/${epId}`, { admin: true })).status, 200);
  assert.ok(!(await api('GET', '/api/podcast/episodes')).json.episodes.some((e: any) => e.id === epId));
  assert.equal((await api('DELETE', `/api/podcast/episodes/${epId}`, { admin: true })).status, 404);
});

test('issuer application end to end with admin pipeline', async () => {
  const kp = Keypair.random();
  const token = await login(kp);
  const created = await api('POST', '/api/issuer-applications', {
    token,
    body: {
      projectName: 'Fictional Wind Coop',
      country: 'PT',
      instrumentType: 'participation right',
      targetAmount: '250000 EUR',
      description: 'Demo application, fictional project.',
    },
  });
  assert.equal(created.status, 201);
  const id = created.json.application.id;
  assert.equal((await api('GET', '/api/admin/issuer-applications', { admin: true })).json.applications.length, 1);
  assert.equal(
    (
      await api('POST', `/api/admin/issuer-applications/${id}/status`, {
        admin: true,
        body: { status: 'under_review' },
      })
    ).status,
    200,
  );
});

test('owner-scoped lists: applications and comments mine', async () => {
  const kpA = Keypair.random();
  const kpB = Keypair.random();
  const tokenA = await login(kpA);
  const tokenB = await login(kpB);
  await api('POST', '/api/issuer-applications', {
    token: tokenA,
    body: {
      projectName: 'Fictional Solar Coop',
      country: 'PT',
      instrumentType: 'bond',
      targetAmount: '100000 EUR',
      description: 'Demo application, fictional project.',
    },
  });
  await api('POST', '/api/campaigns/demo-solar/comments', { token: tokenA, body: { body: 'First own comment' } });
  await api('POST', '/api/campaigns/demo-solar/comments', { token: tokenB, body: { body: 'Someone else comment' } });

  const ownApps = await api('GET', '/api/issuer-applications', { token: tokenA });
  assert.equal(ownApps.status, 200);
  assert.equal(ownApps.json.applications.length, 1);
  assert.equal(ownApps.json.applications[0].projectName, 'Fictional Solar Coop');
  assert.equal(ownApps.json.applications[0].status, 'received');
  assert.equal((await api('GET', '/api/issuer-applications', { token: tokenB })).json.applications.length, 0);
  assert.equal((await api('GET', '/api/issuer-applications')).status, 401);

  const ownComments = await api('GET', '/api/comments/mine', { token: tokenA });
  assert.equal(ownComments.status, 200);
  assert.equal(ownComments.json.comments.length, 1);
  assert.equal(ownComments.json.comments[0].body, 'First own comment');
  assert.equal(ownComments.json.comments[0].hidden, false);
  assert.equal((await api('GET', '/api/comments/mine')).status, 401);
});

test('appropriateness endpoints require auth and run the full flow', async () => {
  // Hold gate first: with APPROPRIATENESS_COLLECT unset, every endpoint is
  // 503 fail-closed (demo/production posture), authenticated or not.
  assert.equal((await api('GET', '/api/auth/appropriateness')).status, 503);
  assert.equal((await api('POST', '/api/auth/appropriateness/knowledge', { body: {} })).status, 503);
  assert.equal((await api('POST', '/api/auth/appropriateness/simulation-result', { body: {} })).status, 503);
  assert.equal((await api('POST', '/api/auth/appropriateness/acknowledge-warning', { body: {} })).status, 503);
  assert.equal((await api('POST', '/api/auth/appropriateness/sophistication-request', { body: {} })).status, 503);

  process.env.APPROPRIATENESS_COLLECT = '1';
  try {
    assert.equal((await api('GET', '/api/auth/appropriateness')).status, 401);
    assert.equal((await api('POST', '/api/auth/appropriateness/knowledge', { body: {} })).status, 401);
    assert.equal((await api('POST', '/api/auth/appropriateness/simulation-result', { body: {} })).status, 401);
    assert.equal((await api('POST', '/api/auth/appropriateness/acknowledge-warning', { body: {} })).status, 401);
    assert.equal((await api('POST', '/api/auth/appropriateness/sophistication-request', { body: {} })).status, 401);

    const kp = Keypair.random();
    process.env.APPROPRIATENESS_ALLOWLIST = kp.publicKey();
    const token = await login(kp);
    const empty = await api('GET', '/api/auth/appropriateness', { token });
    assert.equal(empty.status, 200);
    assert.equal(empty.json.record, null);

    const fail = await api('POST', '/api/auth/appropriateness/knowledge', {
      token,
      body: { experienceLevel: 'none', objective: 'growth', answers: [1, 1, 1, 1, 1] },
    });
    assert.equal(fail.status, 200);
    assert.equal(fail.json.record.outcome, 'warning_issued');

    const sim = await api('POST', '/api/auth/appropriateness/simulation-result', {
      token,
      body: { netWorthEur: 80000, capacityEur: 8000 },
    });
    assert.equal(sim.status, 200);
    assert.equal(sim.json.record.simulation.capacityEur, 8000);

    const ack = await api('POST', '/api/auth/appropriateness/acknowledge-warning', { token, body: {} });
    assert.equal(ack.status, 200);
    assert.ok(ack.json.record.warningAcknowledgedAt);

    // v2: full Art. 21(2) information set is accepted and returned; an
    // unexpected raw financial field inside it is REJECTED (strict schema).
    const info = {
      familiarInvestmentTypes: ['deposits'],
      pastTransactions: { natures: ['none'], annualFrequencyBand: '0', totalVolumeBandEur: '0', periodYearsBand: 'none' },
      educationLevel: 'none_relevant',
      professionOrFormer: null,
      crowdfundingProfessionalExperience: false,
      holdingPeriod: 'under_1y',
      riskProfile: 'conservative',
      sustainabilityPreference: 'none',
    };
    const v2 = await api('POST', '/api/auth/appropriateness/knowledge', {
      token,
      body: { experienceLevel: 'some', objective: 'income', answers: [1, 1, 1, 1, 1], information: info },
    });
    assert.equal(v2.status, 200);
    assert.equal(v2.json.record.version, 2);
    assert.deepEqual(v2.json.record.information, info);
    assert.deepEqual(v2.json.record.categorisation, { status: 'non_sophisticated', request: null });
    const badInfo = await api('POST', '/api/auth/appropriateness/knowledge', {
      token,
      body: { experienceLevel: 'some', objective: 'income', answers: [1, 1, 1, 1, 1], information: { ...info, annualIncomeEur: 45000 } },
    });
    assert.equal(badInfo.status, 400);

    // Annex II sophistication request (capture-only): stored, status never
    // upgrades; invalid shapes are 400.
    const soph = await api('POST', '/api/auth/appropriateness/sophistication-request', {
      token,
      body: {
        route: 'annex_ii_attestation',
        personType: 'natural',
        attestedCriteria: ['np_income_60k_or_portfolio_over_100k', 'np_financial_sector_1y_or_exec_12m'],
        professionalClientProof: null,
        awarenessStatementAccepted: true,
        liabilityStatementAccepted: true,
      },
    });
    assert.equal(soph.status, 200);
    assert.equal(soph.json.record.categorisation.status, 'sophistication_requested');
    const badSoph = await api('POST', '/api/auth/appropriateness/sophistication-request', {
      token,
      body: {
        route: 'annex_ii_attestation',
        personType: 'natural',
        attestedCriteria: ['np_income_60k_or_portfolio_over_100k'],
        professionalClientProof: null,
        awarenessStatementAccepted: true,
        liabilityStatementAccepted: true,
      },
    });
    assert.equal(badSoph.status, 400);

    // Financial inputs can never be smuggled into the result transmission:
    // .strict() rejects any extra field (income/assets/commitments breakdown).
    const smuggle = await api('POST', '/api/auth/appropriateness/simulation-result', {
      token,
      body: { netWorthEur: 80000, capacityEur: 8000, annualIncome: 45000 },
    });
    assert.equal(smuggle.status, 400);
  } finally {
    delete process.env.APPROPRIATENESS_COLLECT;
    delete process.env.APPROPRIATENESS_ALLOWLIST;
  }
  // Gate closed again after the flag is removed.
  assert.equal((await api('GET', '/api/auth/appropriateness')).status, 503);
});

test('site-wide news feed aggregates campaigns newest first and is public', async () => {
  await api('POST', '/api/campaigns/demo-solar/news', { admin: true, body: { title: 'Feed item one', body: 'Body one' } });
  const res = await api('GET', '/api/news');
  assert.equal(res.status, 200);
  assert.equal(res.json.news.length >= 1, true);
  assert.equal(res.json.news[0].title, 'Feed item one');
  assert.equal(res.json.news[0].authorLabel, 'platform-demo');
});

test('podcast endpoints: public list, per-campaign list, admin-gated publish', async () => {
  // Public reads start empty.
  const empty = await api('GET', '/api/podcast/episodes');
  assert.equal(empty.status, 200);
  assert.equal(empty.json.episodes.length, 0);
  const emptyCampaign = await api('GET', '/api/campaigns/demo-solar/podcast');
  assert.equal(emptyCampaign.status, 200);
  assert.equal(emptyCampaign.json.episodes.length, 0);

  // Publish is admin-gated: no key and bad input are refused.
  assert.equal((await api('POST', '/api/podcast/episodes', { body: { title: 'X', description: 'Y', audioUrl: 'https://a.example.com/x.mp3' } })).status, 401);
  assert.equal(
    (await api('POST', '/api/podcast/episodes', { admin: true, body: { title: 'X', description: 'Y', audioUrl: 'http://a.example.com/x.mp3' } })).status,
    400,
  );

  // Admin publish works and is labeled platform-demo.
  const created = await api('POST', '/api/podcast/episodes', {
    admin: true,
    body: { title: 'QA route episode', description: 'Synthetic QA episode.', audioUrl: 'https://a.example.com/ep.mp3', campaignId: 'demo-solar' },
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.episode.authorLabel, 'platform-demo');

  const list = await api('GET', '/api/podcast/episodes');
  assert.equal(list.json.episodes.length, 1);
  assert.equal(list.json.episodes[0].title, 'QA route episode');
  const perCampaign = await api('GET', '/api/campaigns/demo-solar/podcast');
  assert.equal(perCampaign.json.episodes.length, 1);
  const otherCampaign = await api('GET', '/api/campaigns/staging-load/podcast');
  assert.equal(otherCampaign.json.episodes.length, 0);
});

test('campaign metadata endpoint serves industry and documents', async () => {
  const res = await api('GET', '/api/campaigns/demo-solar/metadata');
  assert.equal(res.status, 200);
  assert.equal(res.json.metadata.industry, 'energy-utilities');
  assert.ok(res.json.metadata.documents.every((d: any) => d.demo === true));
  // Rewards are issuer-authored; demo tiers stay marked fictional end to end.
  assert.ok(Array.isArray(res.json.metadata.rewards));
  assert.ok(res.json.metadata.rewards.every((r: any) => r.demo === true && r.description.includes('[DEMO]')));
  const unknown = await api('GET', '/api/campaigns/unknown-campaign/metadata');
  assert.equal(unknown.json.metadata, null);
});
