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
  const sig = Buffer.from(kp.sign(Buffer.from(message, 'utf8'))).toString('base64');
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
  const sig = Buffer.from(kp.sign(Buffer.from(message, 'utf8'))).toString('base64');
  await verifyChallenge(store, kp.publicKey(), sig);
  await assert.rejects(() => verifyChallenge(store, kp.publicKey(), sig), AuthError);
});

test('expired challenge and wrong signature are rejected', async () => {
  const store = newStore();
  const kp = Keypair.random();
  const past = Date.now() - 10 * 60 * 1000;
  const { message } = await createChallenge(store, kp.publicKey(), past);
  const sig = Buffer.from(kp.sign(Buffer.from(message, 'utf8'))).toString('base64');
  await assert.rejects(() => verifyChallenge(store, kp.publicKey(), sig), AuthError);
  const fresh = await createChallenge(store, kp.publicKey());
  const wrong = Buffer.from(Keypair.random().sign(Buffer.from(fresh.message, 'utf8'))).toString('base64');
  await assert.rejects(() => verifyChallenge(store, kp.publicKey(), wrong), AuthError);
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
