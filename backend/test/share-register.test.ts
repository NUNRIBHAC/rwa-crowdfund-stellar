import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { buildShareRegister, formatUnits, shareRegisterCsv, SHARE_REGISTER_SEMANTICS } from '../src/share-register.js';
import type { Intent } from '../src/journal.js';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';

const kpA = Keypair.random().publicKey();
const kpB = Keypair.random().publicKey();
const hash = (n: number) => n.toString(16).padStart(64, '0');
const intent = (over: Partial<Intent>): Intent => ({
  hash: hash(1),
  campaign: 'qa-demo',
  actor: kpA,
  action: 'contribute',
  xdr: 'x',
  status: 'SUCCESS',
  ...over,
});

test('formatUnits round-trips and trims', () => {
  assert.equal(formatUnits(12345678n), '1.2345678');
  assert.equal(formatUnits(10000000n), '1');
  assert.equal(formatUnits(0n), '0');
  assert.equal(formatUnits(-25000000n), '-2.5');
});

test('registry-only contributor exports with zero journal amounts', () => {
  const p = buildShareRegister('qa-demo', [], [{ campaignId: 'qa-demo', publicKey: kpA, firstConfirmedAt: 1730000000000 }], 'testnet');
  assert.equal(p.contributors.length, 1);
  const row = p.contributors[0];
  assert.equal(row.registered, true);
  assert.equal(row.firstConfirmedAt, new Date(1730000000000).toISOString());
  assert.equal(row.contributedIntended, '0');
  assert.equal(row.netIntended, '0');
  assert.equal(p.totals.contributors, 1);
  assert.equal(p.demo, true);
  assert.equal(p.semantics, SHARE_REGISTER_SEMANTICS);
});

test('journal SUCCESS contributes/refunds sum to intended amounts; other statuses and campaigns ignored', () => {
  const intents: Intent[] = [
    intent({ hash: hash(2), amount: '10' }),
    intent({ hash: hash(3), amount: '2.5' }),
    intent({ hash: hash(4), action: 'refund', amount: '5' }),
    intent({ hash: hash(5), status: 'FAILED', amount: '99' }),
    intent({ hash: hash(6), status: 'PENDING', amount: '99' }),
    intent({ hash: hash(7), campaign: 'other', amount: '99' }),
    intent({ hash: hash(8), actor: kpB, amount: '3' }),
  ];
  const p = buildShareRegister('qa-demo', intents, [{ campaignId: 'qa-demo', publicKey: kpA, firstConfirmedAt: 1730000000000 }], 'testnet');
  const a = p.contributors.find((r) => r.publicKey === kpA)!;
  assert.equal(a.contributedIntended, '12.5');
  assert.equal(a.refundedIntended, '5');
  assert.equal(a.netIntended, '7.5');
  assert.equal(a.contributeCount, 2);
  assert.equal(a.refundCount, 1);
  assert.deepEqual(a.intentHashes, [hash(2), hash(3), hash(4)]);
  const b = p.contributors.find((r) => r.publicKey === kpB)!;
  assert.equal(b.registered, false);
  assert.equal(b.firstConfirmedAt, null);
  assert.equal(b.contributedIntended, '3');
  assert.equal(p.totals.contributedIntended, '15.5');
  assert.ok(p.notes.some((n) => n.includes('not in the durable contributor registry')));
});

test('an amountless refund makes net UNKNOWN (wallet and aggregate), never zero-paid or a partial net', () => {
  const mk = (h: number, actor: string, action: string, status: string, amount?: string) =>
    intent({ hash: hash(h), actor, action, status, ...(amount ? { amount } : {}) });
  const A = kpA;
  const B = kpB;
  const p = buildShareRegister(
    'qa-demo',
    [
      mk(20, A, 'contribute', 'SUCCESS', '100'),
      mk(21, A, 'refund', 'SUCCESS', '40'),
      mk(22, A, 'refund', 'FAILED', '60'),
      mk(23, A, 'refund', 'PENDING', '25'),
      mk(24, B, 'contribute', 'SUCCESS', '50'),
      mk(25, B, 'refund', 'SUCCESS'),
    ],
    [],
    'testnet',
  );
  const a = p.contributors.find((r) => r.publicKey === A)!;
  const b = p.contributors.find((r) => r.publicKey === B)!;
  assert.equal(a.netIntended, '60');
  assert.equal(a.refundedComplete, true);
  assert.equal(a.refundCount, 1, 'failed and pending refunds are not counted');
  assert.equal(b.netIntended, 'UNKNOWN');
  assert.equal(b.refundedComplete, false);
  assert.equal(b.refundedIntended, '0');
  assert.equal(p.totals.netIntended, 'UNKNOWN');
  assert.equal(p.totals.netKnownSubtotal, '110');
  assert.equal(p.totals.refundedComplete, false);
  assert.equal(p.totals.contributedComplete, true);
  assert.ok(p.notes.some((n) => n.includes('UNKNOWN')));
});

test('missing amounts are counted and disclosed, not summed', () => {
  const p = buildShareRegister('qa-demo', [intent({ hash: hash(9) }), intent({ hash: hash(10), amount: 'bogus' })], [], 'testnet');
  assert.equal(p.contributors[0].contributedIntended, '0');
  assert.equal(p.contributors[0].missingAmountIntents, 2);
  assert.equal(p.totals.missingAmountIntents, 2);
  assert.ok(p.notes.some((n) => n.includes('no parseable amount')));
});

test('refund exceeding journal contributions yields negative net and a note', () => {
  const p = buildShareRegister('qa-demo', [intent({ hash: hash(11), action: 'refund', amount: '4' })], [], 'testnet');
  assert.equal(p.contributors[0].netIntended, '-4');
  assert.ok(p.notes.some((n) => n.includes('refund intents exceeding')));
});

test('csv escapes quotes and commas and joins hashes', () => {
  const p = buildShareRegister('qa-demo', [intent({ hash: hash(12), amount: '1' }), intent({ hash: hash(13), amount: '1' })], [], 'testnet');
  const csv = shareRegisterCsv(p);
  const lines = csv.trim().split('\n');
  assert.equal(lines.length, 2);
  assert.match(lines[0], /"public_key"/);
  assert.ok(lines[1].includes(`"${hash(12)} ${hash(13)}"`));
  const tricky = { ...p, contributors: [{ ...p.contributors[0], publicKey: 'G"X,Y' }] };
  assert.ok(shareRegisterCsv(tricky).includes('"G""X,Y"'));
});

// --- Route wiring (hermetic; provider injected like reconciliation) ---
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'share-register-test-'));
let counter = 0;
const servers: Array<ReturnType<express.Express['listen']>> = [];
after(() => {
  for (const s of servers) s.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

async function makeServer(opts: { provider?: 'absent' | 'null' | 'payload'; denyAdmin?: boolean }) {
  const store = new FileCommunityStore(path.join(dir, `store-${counter++}.json`));
  const service = new CommunityService(store, { retentionDays: 90 });
  const app = express();
  app.use(express.json());
  app.use(
    createCommunityRouter({
      service,
      requireAdmin: (_req, res, next) => {
        if (opts.denyAdmin) {
          res.status(401).json({ error: 'missing or invalid admin key (x-admin-key header)' });
          return;
        }
        next();
      },
      ...(opts.provider === 'payload'
        ? { shareRegister: async () => buildShareRegister('qa-demo', [], [], 'testnet') }
        : opts.provider === 'null'
          ? { shareRegister: async () => null }
          : {}),
    }),
  );
  const srv = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  servers.push(srv);
  const addr = srv.address();
  return `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
}

test('route answers 503 when the provider is not configured', async () => {
  const base = await makeServer({ provider: 'absent' });
  const res = await fetch(`${base}/api/campaigns/qa-demo/share-register.json`);
  assert.equal(res.status, 503);
});

test('route answers 404 for an unknown campaign', async () => {
  const base = await makeServer({ provider: 'null' });
  const res = await fetch(`${base}/api/campaigns/nope/share-register.json`);
  assert.equal(res.status, 404);
});

test('json route returns the payload; csv route returns text/csv with the header', async () => {
  const base = await makeServer({ provider: 'payload' });
  const json = await fetch(`${base}/api/campaigns/qa-demo/share-register.json`);
  assert.equal(json.status, 200);
  const body = (await json.json()) as { campaignId: string; demo: boolean };
  assert.equal(body.campaignId, 'qa-demo');
  assert.equal(body.demo, true);
  const csv = await fetch(`${base}/api/campaigns/qa-demo/share-register.csv`);
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type') ?? '', /text\/csv/);
  assert.match(await csv.text(), /^"public_key"/);
});

test('admin gate applies to the export routes', async () => {
  const base = await makeServer({ provider: 'payload', denyAdmin: true });
  assert.equal((await fetch(`${base}/api/campaigns/qa-demo/share-register.json`)).status, 401);
  assert.equal((await fetch(`${base}/api/campaigns/qa-demo/share-register.csv`)).status, 401);
});

test('v2 on-chain positions annotate rows and payload without touching journal sums', async () => {
  const { V2_ONCHAIN_SEMANTICS } = await import('../src/share-register.js');
  const v2 = {
    tokenContractId: 'CTOKEN',
    offeringContractId: 'COFFER',
    token: { name: 'QA Shares', symbol: 'QSH', decimals: 7, totalSupply: '100000000' },
    offering: { token: 'CTOKEN', issuer: kpB, minPerInvestor: '10000000', maxPerInvestor: '100000000', goal: '1000000000', deadline: '2000000000' },
    holders: [{ publicKey: kpA, balance: '42000000' }],
    holdersTruncated: false,
  };
  const p = buildShareRegister(
    'qa-demo',
    [intent({ hash: hash(2), amount: '10' })],
    [{ campaignId: 'qa-demo', publicKey: kpA, firstConfirmedAt: 1730000000000 }],
    'testnet',
    v2,
  );
  assert.equal(p.contributors[0].onChainBalance, '42000000');
  assert.equal(p.totals.contributedIntended, '10', 'journal sums untouched by on-chain data');
  assert.equal(p.v2OnChain?.semantics, V2_ONCHAIN_SEMANTICS);
  assert.equal(p.v2OnChain?.token.totalSupply, '100000000');
});

test('v2 holder truncation is disclosed and unqueried rows carry no onChainBalance', () => {
  const v2 = {
    tokenContractId: 'CTOKEN',
    offeringContractId: 'COFFER',
    token: { name: 'QA Shares', symbol: 'QSH', decimals: 7, totalSupply: '100000000' },
    offering: { token: 'CTOKEN', issuer: kpB, minPerInvestor: '1', maxPerInvestor: '10', goal: '100', deadline: '2000000000' },
    holders: [{ publicKey: kpA, balance: '42000000' }],
    holdersTruncated: true,
  };
  const p = buildShareRegister(
    'qa-demo',
    [intent({ hash: hash(3), actor: kpB, amount: '5' })],
    [
      { campaignId: 'qa-demo', publicKey: kpA, firstConfirmedAt: 1730000000000 },
      { campaignId: 'qa-demo', publicKey: kpB, firstConfirmedAt: 1730000001000 },
    ],
    'testnet',
    v2,
  );
  const rowA = p.contributors.find((r) => r.publicKey === kpA)!;
  const rowB = p.contributors.find((r) => r.publicKey === kpB)!;
  assert.equal(rowA.onChainBalance, '42000000');
  assert.equal('onChainBalance' in rowB, false, 'unqueried holder is absent, not zero');
  assert.ok(
    p.notes.some((n) => n.includes('exceeded the read cap')),
    'truncation disclosed in notes',
  );
});

test('csv gains the onchain_balance column only for v2 payloads', () => {
  const v1 = buildShareRegister('qa-demo', [], [{ campaignId: 'qa-demo', publicKey: kpA, firstConfirmedAt: 1730000000000 }], 'testnet');
  assert.ok(!shareRegisterCsv(v1).includes('onchain_balance'));
  const v2 = buildShareRegister('qa-demo', [], [{ campaignId: 'qa-demo', publicKey: kpA, firstConfirmedAt: 1730000000000 }], 'testnet', {
    tokenContractId: 'CTOKEN',
    offeringContractId: 'COFFER',
    token: { name: 'QA Shares', symbol: 'QSH', decimals: 7, totalSupply: '100000000' },
    offering: { token: 'CTOKEN', issuer: kpB, minPerInvestor: '1', maxPerInvestor: '10', goal: '100', deadline: '2000000000' },
    holders: [{ publicKey: kpA, balance: '42000000' }],
    holdersTruncated: false,
  });
  const csv = shareRegisterCsv(v2);
  assert.ok(csv.split('\n')[0].includes('"onchain_balance"'));
  assert.ok(csv.includes('"42000000"'));
});

test('corporate-actions: cap table and distribution preview over the register, admin gated', async () => {
  const base = await makeServer({ provider: 'payload' });
  const cap = await fetch(`${base}/api/campaigns/qa-demo/corporate-actions/cap-table.json`);
  assert.equal(cap.status, 200);
  const capBody = (await cap.json()) as { campaignId: string; complete: boolean; rows: unknown[] };
  assert.equal(capBody.campaignId, 'qa-demo');
  assert.equal(capBody.rows.length, 0);
  const post = (b: string) =>
    fetch(`${base}/api/campaigns/qa-demo/corporate-actions/distribution-preview`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: b });
  const ok = await post('{"total":"10"}');
  assert.equal(ok.status, 200);
  assert.equal(((await ok.json()) as { status: string }).status, 'unavailable', 'no known holders: no allocation');
  assert.equal((await post('{"total":"-1"}')).status, 400);
  assert.equal((await post('{}')).status, 400);
  assert.equal((await fetch(`${await makeServer({ provider: 'null' })}/api/campaigns/x/corporate-actions/cap-table.json`)).status, 404);
  assert.equal((await fetch(`${await makeServer({ provider: 'absent' })}/api/campaigns/x/corporate-actions/cap-table.json`)).status, 503);
  const denied = await makeServer({ provider: 'payload', denyAdmin: true });
  assert.equal((await fetch(`${denied}/api/campaigns/qa-demo/corporate-actions/cap-table.json`)).status, 401);
});
