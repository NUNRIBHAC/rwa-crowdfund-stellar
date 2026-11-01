import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService, KNOWLEDGE_QUESTIONS } from '../src/community.js';
import { createChallenge, verifyChallenge, authenticate, logout, setDisplayName, AuthError } from '../src/accounts.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'community-test-'));
let counter = 0;
const newStore = () => new FileCommunityStore(path.join(dir, `store-${counter++}.json`));

async function login(store: FileCommunityStore, kp: Keypair) {
  const { message } = await createChallenge(store, kp.publicKey());
  const sig = Buffer.from(kp.signMessage(message)).toString('base64');
  return verifyChallenge(store, kp.publicKey(), sig);
}

test('wallet challenge login issues a session and authenticates', async () => {
  const store = newStore();
  const kp = Keypair.random();
  const { token, account } = await login(store, kp);
  assert.match(token, /^bls_[0-9a-f]{48}$/);
  assert.equal(account.publicKey, kp.publicKey());
  const authed = await authenticate(store, `Bearer ${token}`);
  assert.equal(authed.publicKey, kp.publicKey());
});

test('challenge is single-use: replaying the same signature fails', async () => {
  const store = newStore();
  const kp = Keypair.random();
  const { message } = await createChallenge(store, kp.publicKey());
  const sig = Buffer.from(kp.signMessage(message)).toString('base64');
  await verifyChallenge(store, kp.publicKey(), sig);
  await assert.rejects(() => verifyChallenge(store, kp.publicKey(), sig), AuthError);
});

test('expired challenge and wrong signature are rejected', async () => {
  const store = newStore();
  const kp = Keypair.random();
  const past = Date.now() - 10 * 60 * 1000;
  const { message } = await createChallenge(store, kp.publicKey(), past);
  const sig = Buffer.from(kp.signMessage(message)).toString('base64');
  await assert.rejects(() => verifyChallenge(store, kp.publicKey(), sig), AuthError);
  const fresh = await createChallenge(store, kp.publicKey());
  const wrong = Buffer.from(Keypair.random().signMessage(fresh.message)).toString('base64');
  await assert.rejects(() => verifyChallenge(store, kp.publicKey(), wrong), AuthError);
});

test('raw non-SEP-53 signatures are rejected (native Freighter signs SEP-53)', async () => {
  const store = newStore();
  const kp = Keypair.random();
  const { message } = await createChallenge(store, kp.publicKey());
  // Legacy clients signed the raw message bytes; Freighter v5+ signs per
  // SEP-53. A raw signature must not verify.
  const raw = Buffer.from(kp.sign(Buffer.from(message, 'utf8'))).toString('base64');
  await assert.rejects(() => verifyChallenge(store, kp.publicKey(), raw), /no matching login challenge/);
});

test('invalid public keys and malformed signatures are 400s', async () => {
  const store = newStore();
  await assert.rejects(
    () => createChallenge(store, 'not-a-key'),
    (e: any) => e.status === 400,
  );
  const kp = Keypair.random();
  await createChallenge(store, kp.publicKey());
  await assert.rejects(
    () => verifyChallenge(store, kp.publicKey(), '!!!'),
    (e: any) => e.status === 400,
  );
});

test('display name validation caps length, strips links and control chars', async () => {
  const store = newStore();
  const kp = Keypair.random();
  await login(store, kp);
  const a = await setDisplayName(store, kp.publicKey(), 'Nuno');
  assert.equal(a.displayName, 'Nuno');
  await assert.rejects(() => setDisplayName(store, kp.publicKey(), 'x'.repeat(41)), AuthError);
  await assert.rejects(() => setDisplayName(store, kp.publicKey(), 'see https://evil.example'), AuthError);
  const cleared = await setDisplayName(store, kp.publicKey(), '');
  assert.equal(cleared.displayName, null);
});

test('logout revokes the session', async () => {
  const store = newStore();
  const kp = Keypair.random();
  const { token } = await login(store, kp);
  await logout(store, `Bearer ${token}`);
  await assert.rejects(() => authenticate(store, `Bearer ${token}`), AuthError);
});

test('comments: authed create, public list masks author, hidden excluded', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kp = Keypair.random();
  const { account } = await login(store, kp);
  const c = await service.addComment('demo-solar', account, {
    body: 'Testnet only, but promising.',
  });
  assert.equal(c.author, `${kp.publicKey().slice(0, 4)}…${kp.publicKey().slice(-4)}`);
  const listed = await service.listComments('demo-solar');
  assert.equal(listed.length, 1);
  assert.ok(!JSON.stringify(listed).includes(kp.publicKey()));
  await service.adminSetCommentHidden(c.id, true, 'spam');
  assert.equal((await service.listComments('demo-solar')).length, 0);
  await service.adminSetCommentHidden(c.id, false);
  assert.equal((await service.listComments('demo-solar')).length, 1);
});

test('comments: rate limit after 10 per hour per account', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kp = Keypair.random();
  const { account } = await login(store, kp);
  for (let i = 0; i < 10; i++) await service.addComment('demo-solar', account, { body: `n${i}` });
  await assert.rejects(
    () => service.addComment('demo-solar', account, { body: 'too much' }),
    (e: any) => e.status === 429,
  );
});

test('comments: input validation', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kp = Keypair.random();
  const { account } = await login(store, kp);
  await assert.rejects(() => service.addComment('demo-solar', account, { body: '' }));
  await assert.rejects(() => service.addComment('demo-solar', account, { body: 'x'.repeat(1001) }));
  await assert.rejects(() => service.addComment('Bad ID!', account, { body: 'hi' }));
});

test('tickets: owner-only listing, admin sees all, close works', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const a = Keypair.random();
  const b = Keypair.random();
  const { account: accA } = await login(store, a);
  const { account: accB } = await login(store, b);
  const t = await service.createTicket(accA, {
    kind: 'support',
    subject: 'Question',
    body: 'How do testnet refunds work?',
  });
  assert.equal((await service.listOwnTickets(accA)).length, 1);
  assert.equal((await service.listOwnTickets(accB)).length, 0);
  assert.equal((await service.adminListTickets()).length, 1);
  await service.adminCloseTicket(t.id);
  const [closed] = await service.listOwnTickets(accA);
  assert.equal(closed.status, 'closed');
});

test('issuer applications: validation, rate limit, admin status flow', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kp = Keypair.random();
  const { account } = await login(store, kp);
  const input = {
    projectName: 'Alentejo Solar Cooperative',
    country: 'PT',
    instrumentType: 'subordinated loan',
    targetAmount: '500000 EUR',
    description: 'Fictional demo application for a cooperative solar project.',
    contactEmail: 'issuer@example.org',
  };
  const app1 = await service.submitApplication(account, input);
  assert.equal(app1.status, 'received');
  await assert.rejects(() =>
    service.submitApplication(account, {
      ...input,
      contactEmail: 'not-an-email',
    }),
  );
  await service.submitApplication(account, input);
  await service.submitApplication(account, input);
  await assert.rejects(
    () => service.submitApplication(account, input),
    (e: any) => e.status === 429,
  );
  await service.adminSetApplicationStatus(app1.id, 'under_review');
  await assert.rejects(
    () => service.adminSetApplicationStatus(app1.id, 'bogus'),
    (e: any) => e.status === 400,
  );
  const all = await service.adminListApplications();
  assert.equal(all.find((a) => a.id === app1.id)?.status, 'under_review');
});

test('news: admin posts are labeled platform-demo and listed publicly', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const post = await service.addNews('demo-solar', {
    title: 'Panel delivery update',
    body: 'Fictional update for the demo campaign.',
  });
  assert.equal(post.authorLabel, 'platform-demo');
  const listed = await service.listNews('demo-solar');
  assert.equal(listed.length, 1);
  assert.equal(listed[0].authorLabel, 'platform-demo');
});

test('reports: operator-submitted reports are labeled platform-demo, listed per campaign, schema-enforced', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  // The post-close on-chain gate lives at the router; the service stores
  // exactly what it is given and never generates content.
  const report = await service.addReport(
    'demo-solar',
    {
      kind: 'funding_outcome',
      title: 'Funding outcome report',
      body: 'Fictional post-funding outcome for the demo campaign.',
    },
    'operator:test',
  );
  assert.equal(report.authorLabel, 'platform-demo');
  assert.equal(report.kind, 'funding_outcome');
  await service.addReport('other-campaign', {
    kind: 'milestone',
    title: 'Other campaign report',
    body: 'Belongs to another campaign.',
  });
  const listed = await service.listReports('demo-solar');
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, report.id);
  assert.equal(listed[0].authorLabel, 'platform-demo');
  // Unknown kind and empty body are rejected by the schema.
  await assert.rejects(() => service.addReport('demo-solar', { kind: 'audit', title: 'x', body: 'y' }));
  await assert.rejects(() => service.addReport('demo-solar', { kind: 'milestone', title: 'x', body: ' ' }));
  // Invalid campaign ids are rejected.
  await assert.rejects(() => service.listReports('Bad Id'));
  // Publish was audit-logged.
  const audit = (await store.read()).audit;
  assert.ok(audit.some((e) => e.action === 'report.publish' && e.actor === 'operator:test'));
});

test('contributors: durable registry records confirmed contributors idempotently', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kp = Keypair.random();
  assert.equal(await service.hasContributed('demo-solar', kp.publicKey()), false);
  await service.recordContributor('demo-solar', kp.publicKey());
  const first = (await store.read()).contributors[`demo-solar:${kp.publicKey()}`].firstConfirmedAt;
  // Idempotent: a repeat confirmation keeps the original timestamp and does
  // not duplicate the audit entry.
  await service.recordContributor('demo-solar', kp.publicKey());
  const state = await store.read();
  assert.equal(state.contributors[`demo-solar:${kp.publicKey()}`].firstConfirmedAt, first);
  assert.equal(state.audit.filter((e) => e.action === 'contributor.record').length, 1);
  assert.equal(await service.hasContributed('demo-solar', kp.publicKey()), true);
  assert.equal(await service.hasContributed('other-campaign', kp.publicKey()), false);
  await assert.rejects(() => service.recordContributor('demo-solar', 'not-a-key'));
});

test('reports: stored state written before reports existed gains the collection on read', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  await service.addNews('demo-solar', { title: 't', body: 'b' });
  // Simulate a legacy document by removing the reports collection, then read
  // through a fresh store: the forward-compatible default must apply.
  const legacyPath = path.join(dir, `store-legacy-${counter++}.json`);
  const doc = (await store.read()) as unknown as Record<string, unknown>;
  delete doc.reports;
  delete doc.contributors;
  fs.writeFileSync(legacyPath, JSON.stringify(doc));
  const legacyService = new CommunityService(new FileCommunityStore(legacyPath));
  assert.deepEqual(await legacyService.listReports('demo-solar'), []);
});

test('appropriateness: knowledge test, warning path, simulation result, review cycles', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kp = Keypair.random();
  const { account } = await login(store, kp);

  // Nothing on record initially; simulation before assessment is refused.
  assert.equal(await service.getAppropriateness(account), null);
  await assert.rejects(
    () => service.transmitSimulationResult(account, { netWorthEur: 50000, capacityEur: 5000 }),
    (e: any) => e.status === 409,
  );

  // Passing knowledge test (all correct) -> 'knowledge_check_passed' (never
  // an Art. 21(1) determination), review on the calendar 2-year anniversary.
  const allRight = KNOWLEDGE_QUESTIONS.map((q) => q.correct);
  const rec1 = await service.submitKnowledgeAssessment(account, {
    experienceLevel: 'some',
    objective: 'growth',
    answers: allRight,
  });
  assert.equal(rec1.knowledgeScore, KNOWLEDGE_QUESTIONS.length);
  assert.equal(rec1.outcome, 'knowledge_check_passed');
  assert.ok(rec1.reviewAssessmentDueAt > Date.now() + 700 * 24 * 60 * 60 * 1000);
  // Calendar anniversary, not a fixed 730-day span (leap years must not
  // shift the review date off the legal anniversary).
  assert.equal(new Date(rec1.reviewAssessmentDueAt).getFullYear(), new Date(rec1.completedAt).getFullYear() + 2);
  assert.equal(new Date(rec1.reviewAssessmentDueAt).getMonth(), new Date(rec1.completedAt).getMonth());
  // Acknowledging a warning on the appropriate path is a no-op error.
  await assert.rejects(
    () => service.acknowledgeWarning(account),
    (e: any) => e.status === 409,
  );

  // Transmitted result: ONLY the two result figures; 10% rule enforced.
  await assert.rejects(
    () => service.transmitSimulationResult(account, { netWorthEur: 50000, capacityEur: 6000 }),
    (e: any) => e.status === 400,
  );
  const rec2 = await service.transmitSimulationResult(account, { netWorthEur: 50000, capacityEur: 5000 });
  assert.equal(rec2.simulation?.netWorthEur, 50000);
  assert.equal(rec2.simulation?.capacityEur, 5000);
  assert.ok(rec2.reviewSimulationDueAt && rec2.reviewSimulationDueAt < rec2.reviewAssessmentDueAt);

  // Failing knowledge test (2 wrong) -> warning path; ack required, single-use.
  const twoWrong = KNOWLEDGE_QUESTIONS.map((q, i) => (i < 2 ? (q.correct + 1) % 3 : q.correct));
  const rec3 = await service.submitKnowledgeAssessment(account, {
    experienceLevel: 'none',
    objective: 'income',
    answers: twoWrong,
  });
  assert.equal(rec3.outcome, 'warning_issued');
  assert.equal(rec3.warningAcknowledgedAt, null);
  // Retake preserves the transmitted simulation and its review date.
  assert.equal(rec3.simulation?.netWorthEur, 50000);
  assert.equal(rec3.reviewSimulationDueAt, rec2.reviewSimulationDueAt);

  const rec4 = await service.acknowledgeWarning(account);
  assert.ok(rec4.warningAcknowledgedAt);
  await assert.rejects(
    () => service.acknowledgeWarning(account),
    (e: any) => e.status === 409,
  );

  // Legacy records written with outcome 'appropriate' (pre-rename) are
  // normalized on read: the wire never presents quiz completion as an
  // appropriateness determination.
  await store.change((state) => {
    (state.appropriateness[account.publicKey]!.outcome as string) = 'appropriate';
  });
  assert.equal((await service.getAppropriateness(account))!.outcome, 'knowledge_check_passed');

  // A retake resets the acknowledgment (new warning cycle).
  const rec5 = await service.submitKnowledgeAssessment(account, {
    experienceLevel: 'none',
    objective: 'income',
    answers: twoWrong,
  });
  assert.equal(rec5.outcome, 'warning_issued');
  assert.equal(rec5.warningAcknowledgedAt, null);
});

test('appropriateness v2: full Art. 21(2) information capture + Annex II categorisation request (capture-only)', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kp = Keypair.random();
  const { account } = await login(store, kp);
  const allRight = KNOWLEDGE_QUESTIONS.map((q) => q.correct);

  const info = {
    familiarInvestmentTypes: ['deposits', 'listed_shares'],
    pastTransactions: {
      natures: ['transferable_securities', 'early_expansion_stage_businesses'],
      annualFrequencyBand: '1_5',
      totalVolumeBandEur: '10k_50k',
      periodYearsBand: '1_3',
    },
    educationLevel: 'bachelor',
    professionOrFormer: 'Accountant',
    crowdfundingProfessionalExperience: false,
    holdingPeriod: '3_5y',
    riskProfile: 'balanced',
    sustainabilityPreference: 'esg_important',
  };

  // v1-shaped submission still works: version 1, information null, default
  // categorisation (legacy state preserved, never silently promoted).
  const rec1 = await service.submitKnowledgeAssessment(account, {
    experienceLevel: 'some',
    objective: 'growth',
    answers: allRight,
  });
  assert.equal(rec1.version, 1);
  assert.equal(rec1.information, null);
  assert.deepEqual(rec1.categorisation, { status: 'non_sophisticated', request: null });

  // v2 submission stores the full information set verbatim.
  const rec2 = await service.submitKnowledgeAssessment(account, {
    experienceLevel: 'experienced',
    objective: 'income',
    answers: allRight,
    information: info,
  });
  assert.equal(rec2.version, 2);
  assert.deepEqual(rec2.information, info);

  // 'none' answers are valid standalone but cannot be mixed with real types.
  const recNone = await service.submitKnowledgeAssessment(account, {
    experienceLevel: 'none',
    objective: 'other',
    answers: allRight,
    information: {
      ...info,
      familiarInvestmentTypes: ['none'],
      pastTransactions: { natures: ['none'], annualFrequencyBand: '0', totalVolumeBandEur: '0', periodYearsBand: 'none' },
      educationLevel: 'none_relevant',
      professionOrFormer: null,
    },
  });
  assert.deepEqual(recNone.information?.familiarInvestmentTypes, ['none']);
  await assert.rejects(
    () =>
      service.submitKnowledgeAssessment(account, {
        experienceLevel: 'some',
        objective: 'growth',
        answers: allRight,
        information: { ...info, familiarInvestmentTypes: ['none', 'deposits'] },
      }),
    (e: any) => e?.name === 'ZodError' || e?.status === 400,
  );
  await assert.rejects(
    () =>
      service.submitKnowledgeAssessment(account, {
        experienceLevel: 'some',
        objective: 'growth',
        answers: allRight,
        information: { ...info, pastTransactions: { ...info.pastTransactions, natures: ['none', 'loans'] } },
      }),
    (e: any) => e?.name === 'ZodError' || e?.status === 400,
  );

  // Strict schema: unexpected raw financial inputs (e.g. an income figure)
  // are REJECTED, never silently stripped and stored.
  await assert.rejects(
    () =>
      service.submitKnowledgeAssessment(account, {
        experienceLevel: 'some',
        objective: 'growth',
        answers: allRight,
        information: { ...info, annualIncomeEur: 45000 },
      }),
    (e: any) => e?.name === 'ZodError' || e?.status === 400,
  );

  // Sophistication request requires an assessment record first.
  const kp2 = Keypair.random();
  const { account: account2 } = await login(store, kp2);
  await assert.rejects(
    () =>
      service.requestSophistication(account2, {
        route: 'annex_ii_attestation',
        personType: 'natural',
        attestedCriteria: ['np_income_60k_or_portfolio_over_100k', 'np_10_significant_transactions_per_quarter_4q'],
        professionalClientProof: null,
        awarenessStatementAccepted: true,
        liabilityStatementAccepted: true,
      }),
    (e: any) => e.status === 409,
  );

  // Natural persons must attest at least TWO of the three Section I(2)
  // criteria; legal-person criteria are refused on a natural-person request.
  await assert.rejects(
    () =>
      service.requestSophistication(account, {
        route: 'annex_ii_attestation',
        personType: 'natural',
        attestedCriteria: ['np_income_60k_or_portfolio_over_100k'],
        professionalClientProof: null,
        awarenessStatementAccepted: true,
        liabilityStatementAccepted: true,
      }),
    (e: any) => e?.name === 'ZodError' || e?.status === 400,
  );
  await assert.rejects(
    () =>
      service.requestSophistication(account, {
        route: 'annex_ii_attestation',
        personType: 'natural',
        attestedCriteria: ['np_income_60k_or_portfolio_over_100k', 'lp_own_funds_100k'],
        professionalClientProof: null,
        awarenessStatementAccepted: true,
        liabilityStatementAccepted: true,
      }),
    (e: any) => e?.name === 'ZodError' || e?.status === 400,
  );
  const soph = await service.requestSophistication(account, {
    route: 'annex_ii_attestation',
    personType: 'natural',
    attestedCriteria: ['np_income_60k_or_portfolio_over_100k', 'np_financial_sector_1y_or_exec_12m'],
    professionalClientProof: null,
    awarenessStatementAccepted: true,
    liabilityStatementAccepted: true,
  });
  assert.equal(soph.categorisation?.status, 'sophistication_requested');
  assert.equal(soph.categorisation?.request?.personType, 'natural');
  assert.equal(soph.categorisation?.request?.attestedCriteria.length, 2);

  // Legal persons need at least ONE Section I(1) criterion.
  await assert.rejects(
    () =>
      service.requestSophistication(account, {
        route: 'annex_ii_attestation',
        personType: 'legal',
        attestedCriteria: [],
        professionalClientProof: null,
        awarenessStatementAccepted: true,
        liabilityStatementAccepted: true,
      }),
    (e: any) => e?.name === 'ZodError' || e?.status === 400,
  );

  // Both mandated Annex II statements must be expressly accepted.
  await assert.rejects(
    () =>
      service.requestSophistication(account, {
        route: 'annex_ii_attestation',
        personType: 'legal',
        attestedCriteria: ['lp_net_turnover_2m'],
        professionalClientProof: null,
        awarenessStatementAccepted: false,
        liabilityStatementAccepted: true,
      }),
    (e: any) => e?.name === 'ZodError' || e?.status === 400,
  );

  // MiFID professional-client route (Annex II Section III): no criteria, no
  // person type, but a reference to the proof of professional status.
  await assert.rejects(
    () =>
      service.requestSophistication(account, {
        route: 'mifid_professional_client',
        personType: null,
        attestedCriteria: ['lp_own_funds_100k'],
        professionalClientProof: 'LEI 1234',
        awarenessStatementAccepted: true,
        liabilityStatementAccepted: true,
      }),
    (e: any) => e?.name === 'ZodError' || e?.status === 400,
  );
  await assert.rejects(
    () =>
      service.requestSophistication(account, {
        route: 'mifid_professional_client',
        personType: null,
        attestedCriteria: [],
        professionalClientProof: null,
        awarenessStatementAccepted: true,
        liabilityStatementAccepted: true,
      }),
    (e: any) => e?.name === 'ZodError' || e?.status === 400,
  );
  const mifid = await service.requestSophistication(account, {
    route: 'mifid_professional_client',
    personType: null,
    attestedCriteria: [],
    professionalClientProof: 'Proof of MiFID II Annex II Section I status (synthetic QA reference)',
    awarenessStatementAccepted: true,
    liabilityStatementAccepted: true,
  });
  assert.equal(mifid.categorisation?.request?.route, 'mifid_professional_client');

  // A knowledge retake never erases or upgrades a captured request.
  const recAfter = await service.submitKnowledgeAssessment(account, {
    experienceLevel: 'some',
    objective: 'growth',
    answers: allRight,
  });
  assert.equal(recAfter.categorisation?.status, 'sophistication_requested');
  assert.equal(recAfter.categorisation?.request?.route, 'mifid_professional_client');

  // Legacy v1 record read: defaults filled transparently on read.
  const kp3 = Keypair.random();
  const { account: account3 } = await login(store, kp3);
  await store.change((state) => {
    state.appropriateness[account3.publicKey] = {
      publicKey: account3.publicKey,
      version: 1,
      experienceLevel: 'some',
      objective: 'growth',
      knowledgeScore: 5,
      knowledgeTotal: 5,
      outcome: 'knowledge_check_passed',
      warningAcknowledgedAt: null,
      simulation: null,
      completedAt: Date.now(),
      reviewAssessmentDueAt: Date.now() + 63072000000,
      reviewSimulationDueAt: null,
    } as any;
  });
  const legacy = await service.getAppropriateness(account3);
  assert.equal(legacy?.information, null);
  assert.deepEqual(legacy?.categorisation, { status: 'non_sophisticated', request: null });
});

test('podcast: episodes are labeled platform-demo, listed publicly, and require https audio', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const ep = await service.addEpisode({
    title: 'QA episode one',
    description: 'Synthetic QA episode, not real content.',
    audioUrl: 'https://audio.example.com/qa-episode-one.mp3',
    campaignId: 'demo-solar',
  });
  assert.equal(ep.authorLabel, 'platform-demo');
  assert.equal(ep.campaignId, 'demo-solar');

  // Platform-wide listing is newest first and includes the episode.
  const all = await service.listEpisodes();
  assert.equal(all.length, 1);
  assert.equal(all[0].id, ep.id);

  // Campaign-scoped listing filters by campaignId.
  const forCampaign = await service.listCampaignEpisodes('demo-solar');
  assert.equal(forCampaign.length, 1);
  const other = await service.listCampaignEpisodes('staging-load');
  assert.equal(other.length, 0);

  // Platform-wide episode (no campaignId) appears in the global list only.
  await service.addEpisode({
    title: 'QA platform episode',
    description: 'Synthetic QA episode, not real content.',
    audioUrl: 'https://audio.example.com/qa-platform.mp3',
  });
  assert.equal((await service.listEpisodes()).length, 2);
  assert.equal((await service.listCampaignEpisodes('demo-solar')).length, 1);

  // Metadata-only entries are refused: no audioUrl, no episode.
  await assert.rejects(
    () => service.addEpisode({ title: 'No audio', description: 'Should fail' }),
    () => true,
  );
  // Non-https audio URLs are refused.
  await assert.rejects(
    () =>
      service.addEpisode({
        title: 'Insecure audio',
        description: 'Should fail',
        audioUrl: 'http://audio.example.com/insecure.mp3',
      }),
    () => true,
  );
  // Junk URLs are refused.
  await assert.rejects(
    () =>
      service.addEpisode({
        title: 'Junk audio',
        description: 'Should fail',
        audioUrl: 'not-a-url',
      }),
    () => true,
  );
  assert.equal((await service.listEpisodes()).length, 2);
});

test('notifications: application submit notifies only the owner; mark read works', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const a = Keypair.random();
  const b = Keypair.random();
  const { account: accA } = await login(store, a);
  const { account: accB } = await login(store, b);
  const app = await service.submitApplication(accA, {
    projectName: 'Alentejo Solar Cooperative',
    country: 'PT',
    instrumentType: 'subordinated loan',
    targetAmount: '500000 EUR',
    description: 'Fictional demo application for a cooperative solar project.',
  });
  const mineA = await service.listNotifications(accA);
  assert.equal(mineA.notifications.length, 1);
  assert.equal(mineA.unreadCount, 1);
  assert.equal(mineA.notifications[0].kind, 'application_received');
  assert.equal(mineA.notifications[0].refId, app.id);
  assert.match(mineA.notifications[0].body, /not an approval/);
  assert.deepEqual(mineA.notifications[0].vars, { projectName: 'Alentejo Solar Cooperative' });
  // Other accounts see nothing and cannot mark it read.
  assert.equal((await service.listNotifications(accB)).notifications.length, 0);
  await assert.rejects(() => service.markNotificationRead(accB, mineA.notifications[0].id), /not found/);
  await service.markNotificationRead(accA, mineA.notifications[0].id);
  const after = await service.listNotifications(accA);
  assert.equal(after.unreadCount, 0);
  assert.ok(after.notifications[0].readAt !== null);
});

test('notifications: admin status change, comment hide and ticket close each notify the owner', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kp = Keypair.random();
  const { account } = await login(store, kp);
  const app = await service.submitApplication(account, {
    projectName: 'Demo Project',
    country: 'PT',
    instrumentType: 'equity',
    targetAmount: '1000 EUR',
    description: 'Fictional demo application.',
  });
  const comment = await service.addComment('demo-solar', account, { body: 'Testnet question' });
  const ticket = await service.createTicket(account, { kind: 'feedback', subject: 'Tour idea', body: 'Add a guided tour.' });
  await service.adminSetApplicationStatus(app.id, 'under_review');
  await service.adminSetCommentHidden(comment.id, true, 'off-topic');
  await service.adminCloseTicket(ticket.id);
  const { notifications } = await service.listNotifications(account);
  const kinds = notifications.map((n) => n.kind).sort();
  assert.deepEqual(kinds, ['application_received', 'application_status', 'comment_moderated', 'ticket_closed'].sort());
  const moderated = notifications.find((n) => n.kind === 'comment_moderated');
  assert.match(moderated?.body ?? '', /off-topic/);
  assert.deepEqual(moderated?.vars, { campaignId: 'demo-solar', reason: 'off-topic' });
  assert.deepEqual(notifications.find((n) => n.kind === 'application_status')?.vars, { projectName: 'Demo Project', status: 'under_review' });
  assert.deepEqual(notifications.find((n) => n.kind === 'ticket_closed')?.vars, { ticketKind: 'feedback', subject: 'Tour idea' });
  // Unhide does not notify again.
  await service.adminSetCommentHidden(comment.id, false);
  assert.equal((await service.listNotifications(account)).notifications.length, 4);
  // read-all clears the unread count.
  const { marked } = await service.markAllNotificationsRead(account);
  assert.equal(marked, 4);
  assert.equal((await service.listNotifications(account)).unreadCount, 0);
});

test('notifications: per-account growth is bounded', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kp = Keypair.random();
  const { account } = await login(store, kp);
  // Bypass the per-day application rate limit by calling the admin path:
  // each status flip notifies once.
  const app = await service.submitApplication(account, {
    projectName: 'Demo Project',
    country: 'PT',
    instrumentType: 'equity',
    targetAmount: '1000 EUR',
    description: 'Fictional demo application.',
  });
  for (let i = 0; i < 130; i++) {
    await service.adminSetApplicationStatus(app.id, i % 2 === 0 ? 'under_review' : 'received');
  }
  const { notifications } = await service.listNotifications(account);
  assert.ok(notifications.length <= 50);
  const state = await store.read();
  const total = Object.values(state.notifications).filter((n) => n.publicKey === account.publicKey).length;
  assert.ok(total <= 100, `expected <= 100 stored, got ${total}`);
});

test('retention prune removes old tickets, applications, sessions and challenges', async () => {
  const store = newStore();
  const service = new CommunityService(store, { retentionDays: 90 });
  const kp = Keypair.random();
  const { account } = await login(store, kp);
  await service.createTicket(account, {
    kind: 'feedback',
    subject: 'Old',
    body: 'old ticket',
  });
  // Age everything artificially past retention.
  await store.change((state) => {
    for (const t of Object.values(state.tickets)) t.createdAt = Date.now() - 91 * 86400000;
    for (const s of Object.values(state.sessions)) s.expiresAt = Date.now() - 1000;
    for (const c of Object.values(state.challenges)) c.expiresAt = Date.now() - 1000;
  });
  const { removed } = await service.prune();
  assert.ok(removed >= 3);
  assert.equal((await service.listOwnTickets(account)).length, 0);
});

test('company application: validate, scope, review status and notifications', async () => {
  const store = newStore();
  const service = new CommunityService(store);
  const kpA = Keypair.random();
  const kpB = Keypair.random();
  const { account: accA } = await login(store, kpA);
  const { account: accB } = await login(store, kpB);

  await assert.rejects(
    () => service.applyForCompany(accA, { companyName: '', legalForm: 'Lda', registrationNumber: '123', country: 'Portugal' }),
    /companyName/,
  );

  const company = await service.applyForCompany(accA, {
    companyName: 'QA Holdings [DEMO]',
    legalForm: 'Lda',
    registrationNumber: 'PT-123456',
    country: 'Portugal',
  });
  assert.match(company.id, /^co_[0-9a-f]{24}$/);
  assert.equal(company.status, 'pending');

  // owner scoping
  assert.equal((await service.myCompanies(accA.publicKey)).length, 1);
  assert.equal((await service.myCompanies(accB.publicKey)).length, 0);
  assert.equal((await service.adminListCompanies()).length, 1);

  // receipt notification to the applicant only
  const stateAfterApply = await store.read();
  const receiptNotifs = Object.values(stateAfterApply.notifications).filter((n) => n.kind === 'company_received');
  assert.equal(receiptNotifs.length, 1);
  assert.equal(receiptNotifs[0].publicKey, accA.publicKey);
  assert.deepEqual(receiptNotifs[0].vars, { companyName: 'QA Holdings [DEMO]' });

  // review decision updates status and notifies with structured vars
  await assert.rejects(() => service.adminSetCompanyStatus(company.id, 'maybe'), /approved or rejected/);
  await assert.rejects(() => service.adminSetCompanyStatus('co_missing', 'approved'), /not found/);
  await service.adminSetCompanyStatus(company.id, 'approved');
  const after = await store.read();
  assert.equal(after.companies[company.id].status, 'approved');
  assert.ok(after.companies[company.id].decidedAt);
  const statusNotifs = Object.values(after.notifications).filter((n) => n.kind === 'company_status');
  assert.equal(statusNotifs.length, 1);
  assert.deepEqual(statusNotifs[0].vars, { companyName: 'QA Holdings [DEMO]', status: 'approved' });

  // rate limit: 3 per day
  await service.applyForCompany(accA, { companyName: 'Two', legalForm: 'Lda', registrationNumber: '2', country: 'Portugal' });
  await service.applyForCompany(accA, { companyName: 'Three', legalForm: 'Lda', registrationNumber: '3', country: 'Portugal' });
  await assert.rejects(
    () => service.applyForCompany(accA, { companyName: 'Four', legalForm: 'Lda', registrationNumber: '4', country: 'Portugal' }),
    /rate limit/i,
  );
});

test('session management: list, revoke by short id, logout others keeps current', async () => {
  const store = newStore();
  const kp = Keypair.random();
  const first = await login(store, kp);
  const second = await login(store, kp);
  const third = await login(store, kp);

  const { listSessions, revokeSession, logoutOtherSessions } = await import('../src/accounts.js');

  const sessions = await listSessions(store, kp.publicKey(), `Bearer ${second.token}`);
  assert.equal(sessions.length, 3);
  assert.equal(sessions.filter((s) => s.current).length, 1);
  const current = sessions.find((s) => s.current)!;
  assert.match(current.id, /^[0-9a-f]{12}$/);

  // revoke one specific other session
  const target = sessions.find((s) => !s.current)!;
  assert.equal(await revokeSession(store, kp.publicKey(), target.id), true);
  assert.equal((await listSessions(store, kp.publicKey(), `Bearer ${second.token}`)).length, 2);
  assert.equal(await revokeSession(store, kp.publicKey(), target.id), false);
  await assert.rejects(() => revokeSession(store, kp.publicKey(), 'nope'), AuthError);

  // logout others removes all but the caller's own session
  const removed = await logoutOtherSessions(store, kp.publicKey(), `Bearer ${second.token}`);
  assert.equal(removed, 1);
  const remaining = await listSessions(store, kp.publicKey(), `Bearer ${second.token}`);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].current, true);

  // the kept session still authenticates; revoked ones do not
  await authenticate(store, `Bearer ${second.token}`);
  await assert.rejects(() => authenticate(store, `Bearer ${first.token}`), AuthError);
  await assert.rejects(() => authenticate(store, `Bearer ${third.token}`), AuthError);
});
