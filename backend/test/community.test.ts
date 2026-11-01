import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
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
