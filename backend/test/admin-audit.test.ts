import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createChallenge, verifyChallenge } from '../src/accounts.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-test-'));
let counter = 0;
const newStore = () => new FileCommunityStore(path.join(dir, `store-${counter++}.json`));
const newService = (store: FileCommunityStore) => new CommunityService(store, { retentionDays: 90 });

async function login(store: FileCommunityStore, kp: Keypair) {
  const { message } = await createChallenge(store, kp.publicKey());
  const sig = Buffer.from(kp.sign(Buffer.from(message, 'utf8'))).toString('base64');
  return verifyChallenge(store, kp.publicKey(), sig);
}

test('gated mutations append audit entries with gate actor, action and target', async () => {
  const store = newStore();
  const service = newService(store);
  const kp = Keypair.random();
  const { account } = await login(store, kp);

  const ticket = await service.createTicket(account, { kind: 'support', subject: 'x', body: 'help' });
  await service.adminCloseTicket(ticket.id, 'admin-key');

  await service.applyForCompany(account, { companyName: 'Acme', legalForm: 'Lda', registrationNumber: '1', country: 'PT' });
  const [company] = await service.adminListCompanies();
  await service.adminSetCompanyStatus(company.id, 'approved', 'operator:GABC');

  const log = await service.adminAuditLog();
  const close = log.find((e) => e.action === 'ticket.close');
  const comp = log.find((e) => e.action === 'company.status');
  assert.ok(close, 'ticket.close recorded');
  assert.equal(close!.actor, 'admin-key');
  assert.equal(close!.target, ticket.id);
  assert.ok(comp, 'company.status recorded');
  assert.equal(comp!.actor, 'operator:GABC');
  assert.equal(comp!.detail, 'approved');
  // newest first
  for (let i = 1; i < log.length; i++) assert.ok(log[i - 1].at >= log[i].at);
});

test('audit log caps at 500 entries, dropping oldest', async () => {
  const store = newStore();
  const service = newService(store);
  for (let i = 0; i < 505; i++) await service.recordAudit('admin-key', 'test.action', `t-${i}`);
  const log = await service.adminAuditLog(500);
  assert.equal(log.length, 500);
  assert.ok(!log.some((e) => e.target === 't-0'), 'oldest entry pruned');
  assert.ok(log.some((e) => e.target === 't-504'));
});

test('state documents written before the audit log still validate', async () => {
  const file = path.join(dir, 'legacy.json');
  fs.writeFileSync(file, JSON.stringify({
    version: 1, accounts: {}, challenges: {}, sessions: {}, comments: {},
    news: {}, tickets: {}, applications: {}, companies: {}, notifications: {},
  }));
  const store = new FileCommunityStore(file);
  const state = await store.read();
  assert.deepEqual(state.audit, []);
});
