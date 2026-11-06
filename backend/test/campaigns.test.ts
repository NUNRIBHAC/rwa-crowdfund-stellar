// Offline unit tests for the backend fix patch. All Stellar network calls are
// replaced by fakes via __setDepsForTests; no testnet access needed.
// The fake Horizon simulates a ledger: applied tx hashes are replayed on
// resubmission (as Horizon does), payments are recorded, and injected
// failures cover crash-before-confirm and response-lost scenarios.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Account, Asset, Keypair, Memo, Networks, Operation, TransactionBuilder, type Transaction } from '@stellar/stellar-sdk';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'crowdfund-test-'));
const storePath = path.join(tmp, 'campaigns.json');
const creatorPath = path.join(tmp, 'creator.json');
const demoPath = path.join(tmp, 'demo-investors.json');
process.env.COMMUNITY_STORE_PATH = path.join(tmp, 'community-store.json');
process.env.EVENT_ARCHIVE_PATH = path.join(tmp, 'event-archive.json');

// Env must be set before importing the modules under test (config reads env at import).
process.env.NODE_ENV = 'test';
process.env.CAMPAIGNS_STORE_PATH = storePath;
process.env.CREATOR_PATH = creatorPath;
process.env.DEMO_INVESTORS_PATH = demoPath;
process.env.USDC_ISSUER = Keypair.random().publicKey();
process.env.PLATFORM_SECRET = Keypair.random().secret();
process.env.ADMIN_SECRET = 'test-admin-key';
process.env.STELLAR_NETWORK = 'testnet';

const platformKp = Keypair.fromSecret(process.env.PLATFORM_SECRET);

const campaigns = await import('../src/campaigns.js');
const { __setDepsForTests, createCampaign, invest, finalize, refund, retryPending, buildInvestXdr, submitSignedInvest, submitSignedTrustline } = campaigns;

// ----- fake ledger -----
const appliedTxHashes = new Set<string>();
const appliedTxRecords = new Map<string, { hash: string; paging_token: string; created_at: string; successful: boolean; ledger?: number }>();
let pagingCounter = 0;
const paymentLog: Array<{ from: string; to: string; code: string; amount: string }> = [];
const submitLog: string[] = []; // XDRs as submitted
const sequences = new Map<string, number>();
let returnedPaymentPages: any[][] = []; // fake paged Horizon payment history
let injectedFailure: { type: 'network' | 'bad_seq'; applyFirst: boolean; times?: number } | null = null;
let forceLookupUnknown = false;

function applyTx(tx: Transaction, hash: string): void {
  appliedTxHashes.add(hash);
  // SEP-0035 total order id: ledger(32 bits) << 32 | txOrder(20 bits) << 12.
  // All fake txs land in ledger 1000 with increasing application order, so
  // same-ledger ordering is exercised by every test.
  pagingCounter++;
  const toid = (1000n << 32n) + (BigInt(pagingCounter) << 12n);
  appliedTxRecords.set(hash, {
    hash,
    paging_token: toid.toString(),
    created_at: new Date().toISOString(),
    successful: true,
    ledger: 1000,
  });
  sequences.set(tx.source, (sequences.get(tx.source) ?? 1) + 1);
  for (const op of tx.operations) {
    const o = op as any;
    if (o?.type === 'payment') {
      paymentLog.push({
        from: tx.source,
        to: o.destination,
        code: o.asset?.code ?? '',
        amount: String(o.amount),
      });
    }
  }
}

__setDepsForTests({
  ensureAccount: async () => {},
  ensureTrustline: async () => {},
  hasTrustline: async () => true,
  loadAccount: async (pub: string) =>
    Object.assign(new Account(pub, String(sequences.get(pub) ?? 1)), {
      signers: [{ key: pub, type: 'ed25519_public_key', weight: 1 }],
      thresholds: { low_threshold: 1, med_threshold: 1 },
      balances: [
        { asset_type: 'native', balance: '100' },
        { asset_code: 'USDC', asset_issuer: process.env.USDC_ISSUER, balance: '1000', selling_liabilities: '0', is_authorized: true },
      ],
    }),
  latestLedger: async () => ({ base_fee_in_stroops: 100, base_reserve_in_stroops: 5000000 }),
  accountPayments: async () => {
    let i = 0;
    const page = (): any => ({
      records: returnedPaymentPages[i] ?? [],
      next: async () => (++i < returnedPaymentPages.length ? page() : { records: [] }),
    });
    return page();
  },
  lookupTransaction: async (hash: string) => {
    if (forceLookupUnknown) throw new Error('horizon unavailable');
    const rec = appliedTxRecords.get(hash);
    if (rec) return rec as any;
    const e: any = new Error('not found');
    e.response = { status: 404 };
    throw e;
  },
  submitTransaction: async (tx: Transaction) => {
    const hash = Buffer.from(tx.hash()).toString('hex');
    submitLog.push(tx.toXDR());
    // Horizon replays the original result for an already-applied transaction.
    if (appliedTxHashes.has(hash)) return { hash } as any;
    if (injectedFailure) {
      const f = injectedFailure;
      if (f.times !== undefined) {
        if (f.times <= 0) injectedFailure = null;
        else f.times -= 1;
      } else {
        injectedFailure = null;
      }
      if (f.applyFirst) applyTx(tx, hash); // applied, but the response is lost
      if (f.type === 'bad_seq') {
        sequences.set(tx.source, (sequences.get(tx.source) ?? 1) + 1); // seq consumed elsewhere
        const e: any = new Error('tx failed');
        e.response = { data: { extras: { result_codes: { transaction: 'tx_bad_seq' } } } };
        throw e;
      }
      throw new Error('network error: response lost');
    }
    applyTx(tx, hash);
    return { hash } as any;
  },
  requirePlatform: () => platformKp,
});

function resetState(): void {
  for (const f of [storePath, creatorPath, demoPath]) fs.rmSync(f, { force: true });
  appliedTxHashes.clear();
  appliedTxRecords.clear();
  pagingCounter = 0;
  paymentLog.length = 0;
  submitLog.length = 0;
  sequences.clear();
  returnedPaymentPages = [];
  injectedFailure = null;
  forceLookupUnknown = false;
}

function addDemoInvestor(): Keypair {
  const kp = Keypair.random();
  const map = fs.existsSync(demoPath) ? JSON.parse(fs.readFileSync(demoPath, 'utf8')) : {};
  map[kp.publicKey()] = kp.secret();
  fs.writeFileSync(demoPath, JSON.stringify(map));
  return kp;
}

function readStore(): any {
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RETURN_PT = (2000n << 32n).toString(); // ledger 2000: after any fake delivery (ledger 1000)
const OLD_PT = (500n << 32n).toString(); // ledger 500: before any fake delivery
const mkReturn = (id: string, from: string, code: string, amount: string, pagingToken = RETURN_PT) => ({
  id,
  type: 'payment',
  from,
  to: platformKp.publicKey(),
  asset_code: code,
  asset_issuer: platformKp.publicKey(),
  amount,
  created_at: new Date().toISOString(),
  paging_token: pagingToken,
  transaction_successful: true,
});
const soonDeadline = (ms = 1500) => new Date(Date.now() + ms).toISOString();
const GOAL = 100;

before(() => resetState());

test('cap: rejects contribution above the remaining goal, accepts exact fill', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'cap', goalUsdc: GOAL });

  await invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 60 });
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 50 }), /exceeds the remaining goal \(40 USDC left\)/);
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 0 }), /amountUsdc must be > 0/);
  await invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 40 }); // exact fill
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 1 }), /goal already reached/);
});

test('crash/response lost after USDC broadcast: retry confirms once, tokens delivered once', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'pending', goalUsdc: GOAL });

  // The USDC payment is applied on-chain but the response is lost.
  injectedFailure = { type: 'network', applyFirst: true };
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 60 }), /submission uncertain/);

  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(stored.investments.length, 1);
  assert.equal(stored.investments[0].status, 'pending_usdc');
  assert.ok(stored.investments[0].usdcXdr, 'signed intent persisted before broadcast');
  assert.ok(stored.investments[0].usdcTx, 'intent hash persisted before broadcast');
  const usdcPayments = () => paymentLog.filter((p) => p.code === 'USDC' && p.from === investor.publicKey());
  assert.equal(usdcPayments().length, 1, 'payment was applied despite the lost response');

  const firstXdr = stored.investments[0].usdcXdr;

  // Retry via the same entrypoint: resumes the persisted intent, resubmits the
  // identical XDR, Horizon replays the result; no second payment, tokens once.
  const after = await invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 60 });
  assert.equal(after.investments.length, 1);
  assert.equal(after.investments[0].status, 'confirmed');
  assert.ok(after.investments[0].tokenTx);
  assert.equal(usdcPayments().length, 1, 'USDC must not be charged twice');
  const resubmits = submitLog.filter((x) => x === firstXdr);
  assert.equal(resubmits.length, 2, 'the identical signed tx was resubmitted');
  const tokenPayments = paymentLog.filter((p) => p.to === investor.publicKey() && p.code.startsWith('CRWD'));
  assert.equal(tokenPayments.length, 1, 'tokens must be delivered exactly once');
});

test('tx_bad_seq with a 404 lookup holds the intent, never rebuilds it', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'badseq', goalUsdc: GOAL });

  injectedFailure = { type: 'network', applyFirst: false }; // token delivery loses response
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 60 }), /uncertain/);

  injectedFailure = { type: 'bad_seq', applyFirst: false };
  // A 404 on the broadcast intent is not proof it cannot execute: hold, keep
  // the exact intent, do not rebuild or duplicate.
  const held = await retryPending(c.id);
  assert.equal(held.investments[0].status, 'pending_usdc');
  assert.match(held.investments[0].error ?? '', /not proof it cannot execute/);
  const heldStore = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.ok(heldStore.investments[0].usdcXdr, 'original intent retained');

  // A later retry resubmits the identical intent; it applies exactly once.
  const after = await retryPending(c.id);
  assert.equal(after.investments[0].status, 'confirmed');
  const tokenPayments = paymentLog.filter((p) => p.to === investor.publicKey() && p.code.startsWith('CRWD'));
  assert.equal(tokenPayments.length, 1, 'exactly one token payment applied');
  const usdcPayments = paymentLog.filter((p) => p.code === 'USDC');
  assert.equal(usdcPayments.length, 1);
});

test('signed submit: replay of the same XDR does not duplicate tokens or records', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'replay', goalUsdc: GOAL });

  const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: 25 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(investor);
  const signedXdr = tx.toXDR();

  const first = await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: signedXdr });
  assert.equal(first.investments.length, 1);

  const replay = await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: signedXdr });
  assert.equal(replay.duplicate, true);
  assert.equal(replay.investments.length, 1, 'no second investment record');

  const tokenPayments = paymentLog.filter((p) => p.to === investor.publicKey() && p.code.startsWith('CRWD'));
  assert.equal(tokenPayments.length, 1, 'no second token payment');
  const usdcPayments = paymentLog.filter((p) => p.code === 'USDC');
  assert.equal(usdcPayments.length, 1, 'no second USDC payment');
});

test('signed submit: crash after broadcast, replay resumes and settles once', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'replay2', goalUsdc: GOAL });

  const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: 25 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(investor);
  const signedXdr = tx.toXDR();

  injectedFailure = { type: 'network', applyFirst: true }; // applied, response lost
  await assert.rejects(submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: signedXdr }), /submission uncertain/);
  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(stored.investments[0].status, 'pending_usdc');

  const resumed = await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: signedXdr });
  assert.equal(resumed.investments.length, 1);
  assert.equal(resumed.investments[0].status, 'confirmed');
  const usdcPayments = paymentLog.filter((p) => p.code === 'USDC');
  assert.equal(usdcPayments.length, 1, 'USDC applied exactly once');
});

test('signed precision: an XDR paying 10.001 USDC is rejected, not rounded into credit', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'prec', goalUsdc: GOAL });

  // Build a valid XDR for 10, then tamper the amount path via a fresh build:
  // easiest is to craft the payment directly.
  const account = new Account(investor.publicKey(), '7');
  const { Operation, TransactionBuilder: TB, Asset } = await import('@stellar/stellar-sdk');
  const tx = new TB(account, { fee: '100', networkPassphrase: built0(c.id) })
    .addOperation(
      Operation.payment({
        destination: platformKp.publicKey(),
        asset: new Asset('USDC', process.env.USDC_ISSUER!),
        amount: '10.0010000',
      }),
    )
    .setTimeout(60)
    .build();
  tx.sign(investor);
  await assert.rejects(submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: tx.toXDR() }), /at most 2 decimal places/);
  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(stored.investments.length, 0, 'no record created for the rejected payment');

  function built0(_id: string): string {
    return 'Test SDF Network ; September 2015' as any;
  }
});

test('race: two concurrent invests cannot overshoot the capped goal', async () => {
  resetState();
  const a = addDemoInvestor();
  const b = addDemoInvestor();
  const c = await createCampaign({ name: 'race', goalUsdc: GOAL });

  const results = await Promise.allSettled([
    invest(c.id, { investorPub: a.publicKey(), amountUsdc: 60 }),
    invest(c.id, { investorPub: b.publicKey(), amountUsdc: 60 }),
  ]);
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.match((rejected[0] as PromiseRejectedResult).reason.message, /exceeds the remaining goal/);

  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  const total = stored.investments.reduce((s: number, i: any) => s + i.amountUsdc, 0);
  assert.equal(total, 60, 'goal must not be overshot');
});

test('finalize: time gate, goal gate, crash-safe idempotent payout', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'fin', goalUsdc: GOAL, deadline: soonDeadline() });
  await invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 100 });

  await assert.rejects(finalize(c.id), /deadline has not passed/);
  await sleep(1600);

  // Payout applied on-chain but the response is lost before the confirm write.
  injectedFailure = { type: 'network', applyFirst: true };
  await assert.rejects(finalize(c.id), /submission uncertain/);
  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(stored.state, 'funding');
  assert.ok(stored.payoutXdr, 'payout intent persisted');
  assert.equal(stored.payoutTx, undefined, 'payout not marked confirmed');
  const payouts = () => paymentLog.filter((p) => p.to === c.creatorPub && p.code === 'USDC');
  assert.equal(payouts().length, 1, 'payout was applied despite the lost response');

  // Retry: resubmits the identical payout tx, replays the result, no double pay.
  const done = await finalize(c.id);
  assert.equal(done.state, 'finalized');
  assert.ok(done.payoutTx);
  assert.equal(payouts().length, 1, 'creator must not be paid twice');
  assert.equal(payouts()[0].amount, '100.0000000');
  await assert.rejects(finalize(c.id), /state finalized/);
});

test('refund: time gate, per-investment retry, verified non-demo token return', async () => {
  resetState();
  const demoInvestor = addDemoInvestor();
  const freighterInvestor = Keypair.random();
  const c = await createCampaign({ name: 'ref', goalUsdc: GOAL, deadline: soonDeadline() });

  await invest(c.id, { investorPub: demoInvestor.publicKey(), amountUsdc: 30 });
  const built = await buildInvestXdr(c.id, { investorPub: freighterInvestor.publicKey(), amountUsdc: 20 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(freighterInvestor);
  await submitSignedInvest(c.id, { investorPub: freighterInvestor.publicKey(), xdr: tx.toXDR() });

  await assert.rejects(refund(c.id), /deadline has not passed/);
  await sleep(1600);

  // First refund: the demo investor's clawback is applied but the response is lost.
  injectedFailure = { type: 'network', applyFirst: true };
  const r1 = await refund(c.id);
  assert.equal(r1.state, 'funding');
  assert.deepEqual([...(r1.refundBlocked ?? [])].sort(), ['i1', 'i2']);
  assert.equal(r1.investments[0].status, 'refund_pending');
  assert.match(r1.investments[0].error ?? '', /clawback failed/);
  assert.equal(r1.investments[1].status, 'awaiting_token_return');
  const clawbacks = () => paymentLog.filter((p) => p.from === demoInvestor.publicKey() && p.code.startsWith('CRWD'));
  assert.equal(clawbacks().length, 1, 'clawback was applied despite the lost response');

  // Retry: the identical clawback tx is resubmitted and replayed (not applied
  // twice), then the USDC refund is paid exactly once.
  const r2 = await refund(c.id);
  assert.equal(r2.investments[0].status, 'refunded');
  assert.equal(clawbacks().length, 1, 'clawback must not be applied twice');
  const refundsToDemo = () => paymentLog.filter((p) => p.to === demoInvestor.publicKey() && p.code === 'USDC');
  assert.equal(refundsToDemo().length, 1, 'USDC refund must be paid exactly once');
  assert.equal(refundsToDemo()[0].amount, '30.0000000');
  assert.equal(r2.state, 'funding', 'still blocked by the non-demo investor');
  // Non-demo investor returns tokens on-chain; Horizon history verifies it.
  returnedPaymentPages = [[mkReturn('op-return-1', freighterInvestor.publicKey(), c.code, '200')]]; // 40 USDC at 5 tokens/USDC
  const r3 = await refund(c.id);
  assert.match(r3.investments[1].clawbackTx ?? '', /^verified-onchain:op-return-1/);
  assert.equal(r3.investments[1].status, 'refunded');
  assert.equal(r3.state, 'refunded');
  const refundsToFreighter = paymentLog.filter((p) => p.to === freighterInvestor.publicKey() && p.code === 'USDC');
  assert.deepEqual(
    refundsToFreighter.map((p) => p.amount),
    ['20.0000000'],
  );
});

test('signed submit enforces the campaign deadline', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'late', goalUsdc: GOAL, deadline: soonDeadline(1200) });
  const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: 10 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(investor);
  await sleep(1300);
  await assert.rejects(submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: tx.toXDR() }), /deadline has passed/);
});

test('integer cents: 0.1 + 0.2 fills a 0.3 goal exactly', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'cents', goalUsdc: 0.3 });
  await invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 0.1 });
  const after = await invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 0.2 });
  // Cap math is integer cents; stored dollar floats can drift when summed.
  const totalCents = after.investments.reduce((s, i) => s + Math.round(i.amountUsdc * 100), 0);
  assert.equal(totalCents, 30);
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 0.01 }), /goal already reached/);
});

test('active server disables every classic write and protects read-only migration evidence', async () => {
  const { app } = await import('../src/server.js');
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  const base = `http://127.0.0.1:${(srv.address() as any).port}`;
  try {
    for (const route of [
      '/api/campaigns',
      '/api/campaigns/c1/invest',
      '/api/campaigns/c1/invest/submit',
      '/api/campaigns/c1/finalize',
      '/api/campaigns/c1/refund',
      '/api/campaigns/c1/retry-pending',
      '/api/demo/seed-investors',
      '/api/wallet/trustline/submit',
    ]) {
      assert.equal((await fetch(base + route, { method: 'POST', headers: { 'x-admin-key': 'test-admin-key' } })).status, 410);
    }
    const legacy = base + '/api/legacy/campaigns';
    assert.equal((await fetch(legacy)).status, 401);
    assert.equal((await fetch(legacy, { headers: { 'x-admin-key': 'wrong' } })).status, 401);
    assert.equal((await fetch(legacy, { headers: { 'x-admin-key': 'test-admin-key' } })).status, 200);
    delete process.env.ADMIN_SECRET;
    assert.equal((await fetch(legacy)).status, 503);
    process.env.ADMIN_SECRET = 'test-admin-key';
  } finally {
    srv.close();
  }
});

test('reconcile: bad_seq with an actually-applied hash confirms without rebuilding', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'recon', goalUsdc: GOAL });

  // Token delivery: applied on-chain, but Horizon answers tx_bad_seq (the
  // hash lookup must reveal the payment instead of rebuilding it).
  injectedFailure = { type: 'bad_seq', applyFirst: true };
  const after = await invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 60 });
  assert.equal(after.investments[0].status, 'confirmed');
  const tokenPayments = paymentLog.filter((p) => p.to === investor.publicKey() && p.code.startsWith('CRWD'));
  assert.equal(tokenPayments.length, 1, 'exactly one token payment applied');
});

test('reconcile: persistent bad_seq with 404 holds the intent, never rebuilds', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'rebuild', goalUsdc: GOAL });

  // USDC intent cannot apply (bad_seq, not applied), and the 404 lookup is
  // not proof of non-execution: hold for manual reconciliation, keep intent.
  injectedFailure = { type: 'bad_seq', applyFirst: false, times: 10 };
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 60 }), /not proof it cannot execute/);
  const usdcPayments = paymentLog.filter((p) => p.code === 'USDC');
  assert.equal(usdcPayments.length, 0, 'nothing applied');
  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(stored.investments[0].status, 'pending_usdc', 'intent held, not silently duplicated');
  assert.ok(stored.investments[0].usdcXdr, 'original intent retained, never rebuilt');
});

test('reconcile: inconclusive lookup holds the intent instead of rebuilding', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'unknown', goalUsdc: GOAL });

  injectedFailure = { type: 'bad_seq', applyFirst: false };
  forceLookupUnknown = true;
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 60 }), /inconclusive/);
  const usdcPayments = paymentLog.filter((p) => p.code === 'USDC');
  assert.equal(usdcPayments.length, 0, 'no payment made while reconciliation is inconclusive');
});

test('refund reconciles a pending token delivery before refunding', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'recrefund', goalUsdc: GOAL, deadline: soonDeadline() });

  // Phase 1: USDC applied, response lost -> pending_usdc.
  injectedFailure = { type: 'network', applyFirst: true };
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 30 }), /uncertain/);
  // Phase 2: retry confirms the USDC (replay), then the token delivery is
  // applied on-chain but the response is lost -> pending_token_delivery.
  injectedFailure = { type: 'network', applyFirst: true };
  await retryPending(c.id); // per-investment errors are recorded, not thrown
  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(stored.investments[0].status, 'pending_token_delivery');
  assert.ok(stored.investments[0].tokenXdr, 'token intent persisted');

  await sleep(1600);
  // Refund must first reconcile the token intent (applied), then claw back,
  // and only then refund the USDC.
  const r = await refund(c.id);
  assert.equal(r.state, 'refunded');
  const clawbacks = paymentLog.filter((p) => p.from === investor.publicKey() && p.code.startsWith('CRWD'));
  assert.equal(clawbacks.length, 1, 'delivered tokens clawed back before refund');
  const refunds = paymentLog.filter((p) => p.to === investor.publicKey() && p.code === 'USDC');
  assert.deepEqual(
    refunds.map((p) => p.amount),
    ['30.0000000'],
  );
  const tokenPayments = paymentLog.filter((p) => p.to === investor.publicKey() && p.code.startsWith('CRWD'));
  assert.equal(tokenPayments.length, 1, 'no duplicate token delivery during reconciliation');
});

test('refund of a never-applied but unexpired token intent holds', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'recrefund2', goalUsdc: GOAL, deadline: soonDeadline() });

  // Phase 1: USDC applied, response lost -> pending_usdc.
  injectedFailure = { type: 'network', applyFirst: true };
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 30 }), /uncertain/);
  // Phase 2: USDC replay confirms; token delivery is never applied (response
  // lost before broadcast reached the ledger).
  injectedFailure = { type: 'network', applyFirst: false };
  await retryPending(c.id); // per-investment errors are recorded, not thrown
  const mid = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(mid.investments[0].status, 'pending_token_delivery');

  await sleep(1600);
  // 404 on the intent, but the signed XDR is still within its timebounds: HOLD.
  const r = await refund(c.id);
  assert.equal(r.state, 'funding');
  assert.match(r.investments[0].error ?? '', /not proof it cannot execute/);
  const refunds = paymentLog.filter((p) => p.to === investor.publicKey() && p.code === 'USDC');
  assert.equal(refunds.length, 0, 'no refund while the intent could still execute');
  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.ok(stored.investments[0].tokenXdr, 'intent retained for a later retry');
});

test('one on-chain return funds only one refund for the same investor', async () => {
  resetState();
  const investor = Keypair.random(); // non-demo
  const c = await createCampaign({ name: 'alloc', goalUsdc: 200, deadline: soonDeadline() });

  for (const amount of [20, 30]) {
    const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: amount });
    const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
    tx.sign(investor);
    await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: tx.toXDR() });
  }
  await sleep(1600);

  // Investor returns only the first investment's tokens (100 for 20 USDC).
  returnedPaymentPages = [[mkReturn('op-return-1', investor.publicKey(), c.code, '100')]];

  const r1 = await refund(c.id);
  assert.equal(r1.investments[0].status, 'refunded', 'first refund covered by the return');
  assert.equal(r1.investments[1].status, 'awaiting_token_return', 'same return cannot fund a second refund');
  assert.equal(r1.state, 'funding');
  const refunds = paymentLog.filter((p) => p.to === investor.publicKey() && p.code === 'USDC');
  assert.deepEqual(
    refunds.map((p) => p.amount),
    ['20.0000000'],
  );

  // A second, separate return (paginated history) covers the second refund.
  returnedPaymentPages = [[mkReturn('op-return-2', investor.publicKey(), c.code, '150')], [mkReturn('op-return-1', investor.publicKey(), c.code, '100')]];
  const r2 = await refund(c.id);
  assert.equal(r2.investments[1].status, 'refunded');
  assert.equal(r2.state, 'refunded');
  const refunds2 = paymentLog.filter((p) => p.to === investor.publicKey() && p.code === 'USDC');
  assert.deepEqual(refunds2.map((p) => p.amount).sort(), ['20.0000000', '30.0000000']);
});

test('a return ordered before the token delivery does not count', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'oldreturn', goalUsdc: GOAL, deadline: soonDeadline() });

  const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: 20 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(investor);
  await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: tx.toXDR() });
  await sleep(1600);

  returnedPaymentPages = [[mkReturn('op-old-1', investor.publicKey(), c.code, '200', OLD_PT)]];
  const r = await refund(c.id);
  assert.equal(r.investments[0].status, 'awaiting_token_return', 'pre-delivery return must not count');
  assert.equal(r.state, 'funding');
});

test('ledger-order binding uses TOIDs: same-ledger later op counts, earlier does not', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'toidorder', goalUsdc: GOAL, deadline: soonDeadline() });

  const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: 20 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(investor);
  await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: tx.toXDR() });
  await sleep(1600);

  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  const deliveryPt = BigInt(appliedTxRecords.get(stored.investments[0].tokenTx).paging_token);

  // A return ordered EARLIER in the same ledger (lower tx application order)
  // must not count.
  const ledgerBits = (deliveryPt >> 32n) << 32n;
  const earlier = (ledgerBits + (((deliveryPt >> 12n) & 0xfffffn) - 1n) * 4096n + 1n).toString();
  returnedPaymentPages = [[mkReturn('op-earlier', investor.publicKey(), c.code, '200', earlier)]];
  const r1 = await refund(c.id);
  assert.equal(r1.investments[0].status, 'awaiting_token_return', 'same-ledger earlier op must not count');

  // A return ordered LATER in the same ledger counts.
  const later = (ledgerBits + (((deliveryPt >> 12n) & 0xfffffn) + 1n) * 4096n + 1n).toString();
  returnedPaymentPages = [[mkReturn('op-later', investor.publicKey(), c.code, '200', later)]];
  const r2 = await refund(c.id);
  assert.equal(r2.investments[0].status, 'refunded', 'same-ledger later op counts');
  assert.equal(r2.state, 'refunded');
});

test('an oversized return is not credited; an exact return is', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'oversize', goalUsdc: GOAL, deadline: soonDeadline() });

  const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: 20 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(investor);
  await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: tx.toXDR() });
  await sleep(1600);

  // 300 returned while 200 owed: not credited (no silent partial allocation).
  returnedPaymentPages = [[mkReturn('op-big', investor.publicKey(), c.code, '300')]];
  const r1 = await refund(c.id);
  assert.equal(r1.investments[0].status, 'awaiting_token_return');
  const refunds1 = paymentLog.filter((p) => p.to === investor.publicKey() && p.code === 'USDC');
  assert.equal(refunds1.length, 0);

  // Exact return credits the refund.
  returnedPaymentPages = [[mkReturn('op-exact', investor.publicKey(), c.code, '200')], [mkReturn('op-big', investor.publicKey(), c.code, '300')]];
  const r2 = await refund(c.id);
  assert.equal(r2.investments[0].status, 'refunded');
  assert.equal(r2.state, 'refunded');
});

test('refund holds while an undelivered token intent could still execute', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'hold', goalUsdc: GOAL, deadline: soonDeadline() });

  // USDC applied, response lost; then token intent never applied.
  injectedFailure = { type: 'network', applyFirst: true };
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 30 }), /uncertain/);
  injectedFailure = { type: 'network', applyFirst: false };
  await retryPending(c.id);
  let stored = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(stored.investments[0].status, 'pending_token_delivery');

  await sleep(1600);
  // 404 on the intent, but the signed XDR is still within its timebounds: HOLD.
  const r1 = await refund(c.id);
  assert.equal(r1.state, 'funding');
  assert.match(r1.investments[0].error ?? '', /not proof it cannot execute/);
  const refunds1 = paymentLog.filter((p) => p.to === investor.publicKey() && p.code === 'USDC');
  assert.equal(refunds1.length, 0, 'no refund while the intent could still execute');
  stored = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.ok(stored.investments[0].tokenXdr, 'intent retained');

  // Even after the intent has expired the refund must still hold: expiry
  // proves the tx cannot execute in the FUTURE, not that it did not already
  // execute before expiry. Only manual reconciliation can clear it.
  const { Operation, TransactionBuilder: TB, Asset } = await import('@stellar/stellar-sdk');
  const expiredTx = new TB(new Account(platformKp.publicKey(), '9'), {
    fee: '100',
    networkPassphrase: 'Test SDF Network ; September 2015',
    timebounds: { minTime: '0', maxTime: '1' },
  } as any)
    .addOperation(
      Operation.payment({
        destination: investor.publicKey(),
        asset: new Asset(c.code, platformKp.publicKey()),
        amount: '300',
      }),
    )
    .build();
  expiredTx.sign(platformKp);
  const patched = readStore();
  patched.campaigns.find((x: any) => x.id === c.id).investments[0].tokenXdr = expiredTx.toXDR();
  fs.writeFileSync(storePath, JSON.stringify(patched, null, 2));
  const r2 = await refund(c.id);
  assert.equal(r2.state, 'funding', 'still held after expiry');
  assert.match(r2.investments[0].error ?? '', /not proof it cannot execute/);
  const clawbacks = paymentLog.filter((p) => p.from === investor.publicKey() && p.code.startsWith('CRWD'));
  assert.equal(clawbacks.length, 0, 'no clawback while held');
  const refunds2 = paymentLog.filter((p) => p.to === investor.publicKey() && p.code === 'USDC');
  assert.equal(refunds2.length, 0, 'no refund after expiry without manual reconciliation');
  const afterStore = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.ok(afterStore.investments[0].tokenXdr, 'intent retained for manual reconciliation');
});

test('a conclusively failed USDC intent releases reservation without rebuilding', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'failedtx', goalUsdc: GOAL });

  injectedFailure = { type: 'bad_seq', applyFirst: false };
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 60 }), /not proof/);

  // Horizon now has positive, hash-bound failed ledger evidence: release the USDC reservation.
  const stored = readStore().campaigns.find((x: any) => x.id === c.id);
  const intentHash = stored.investments[0].usdcTx;
  appliedTxRecords.set(intentHash, {
    hash: intentHash,
    paging_token: (1001n << 32n).toString(),
    created_at: new Date().toISOString(),
    successful: false,
    ledger: 1000,
  });
  injectedFailure = { type: 'bad_seq', applyFirst: false }; // force the reconcile path
  await retryPending(c.id); // per-investment errors are recorded, not thrown
  const held = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(held.investments[0].status, 'failed_usdc', 'failed intent releases reservation');
  assert.match(held.investments[0].error ?? '', /conclusively failed on ledger/);
  const usdcPayments = paymentLog.filter((p) => p.code === 'USDC');
  assert.equal(usdcPayments.length, 0, 'a failed tx applied nothing');
});

test('refund holds when the token delivery is recorded as failed', async () => {
  resetState();
  const investor = addDemoInvestor();
  const c = await createCampaign({ name: 'failedtoken', goalUsdc: GOAL, deadline: soonDeadline() });

  injectedFailure = { type: 'network', applyFirst: true };
  await assert.rejects(invest(c.id, { investorPub: investor.publicKey(), amountUsdc: 30 }), /uncertain/);
  injectedFailure = { type: 'network', applyFirst: false };
  await retryPending(c.id);
  const mid = readStore().campaigns.find((x: any) => x.id === c.id);
  assert.equal(mid.investments[0].status, 'pending_token_delivery');

  // The delivery hash is found on the ledger but recorded as failed.
  appliedTxRecords.set(mid.investments[0].tokenTx, {
    hash: mid.investments[0].tokenTx,
    paging_token: (1002n << 32n).toString(),
    created_at: new Date().toISOString(),
    successful: false,
    ledger: 1000,
  });
  await sleep(1600);
  const r = await refund(c.id);
  assert.equal(r.state, 'funding');
  assert.match(r.investments[0].error ?? '', /recorded on the ledger as failed/);
  const refunds = paymentLog.filter((p) => p.to === investor.publicKey() && p.code === 'USDC');
  assert.equal(refunds.length, 0, 'no refund based on a failed delivery record');
});

test('a return payment from a failed transaction does not qualify', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'failedreturn', goalUsdc: GOAL, deadline: soonDeadline() });

  const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: 20 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(investor);
  await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: tx.toXDR() });
  await sleep(1600);

  const failedReturn = { ...mkReturn('op-failed', investor.publicKey(), c.code, '200'), transaction_successful: false };
  returnedPaymentPages = [[failedReturn]];
  const r1 = await refund(c.id);
  assert.equal(r1.investments[0].status, 'awaiting_token_return', 'failed tx op must not qualify');

  returnedPaymentPages = [[mkReturn('op-ok', investor.publicKey(), c.code, '200')], [failedReturn]];
  const r2 = await refund(c.id);
  assert.equal(r2.investments[0].status, 'refunded');
});

test('refund holds when the delivery ledger position cannot be established', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'unknownorder', goalUsdc: GOAL, deadline: soonDeadline() });
  const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: 20 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(investor);
  await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: tx.toXDR() });
  await sleep(1600);

  returnedPaymentPages = [[mkReturn('op-r', investor.publicKey(), c.code, '200')]];
  forceLookupUnknown = true;
  const r = await refund(c.id);
  assert.equal(r.state, 'funding');
  assert.match(r.investments[0].error ?? '', /cannot verify/);
  const refunds = paymentLog.filter((p) => p.to === investor.publicKey() && p.code === 'USDC');
  assert.equal(refunds.length, 0, 'no refund while verification is inconclusive');
});

// Regression tests: public envelope validation happens before a reservation.
async function signedInvestment(c: any, investor: Keypair, amount = 100): Promise<string> {
  const built = await buildInvestXdr(c.id, { investorPub: investor.publicKey(), amountUsdc: amount });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(investor);
  return tx.toXDR();
}

test('lockup: unsigned and wrong-signature full-goal envelopes create no reservation', async () => {
  resetState();
  const c = await createCampaign({ name: 'unsigned', goalUsdc: GOAL });
  const a = Keypair.random();
  const built = await buildInvestXdr(c.id, { investorPub: a.publicKey(), amountUsdc: 100 });
  await assert.rejects(submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: built.xdr }), /invalid investor signature/);
  const wrong = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  wrong.sign(Keypair.random());
  await assert.rejects(submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: wrong.toXDR() }), /invalid investor signature/);
  assert.equal(readStore().campaigns[0].investments.length, 0);
  const done = await submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: await signedInvestment(c, a) });
  assert.equal(done.investments[0].status, 'confirmed');
});

test('lockup: unfunded, insufficient-USDC and fee-reserve failures never reserve cap', async () => {
  resetState();
  const c = await createCampaign({ name: 'unpayable', goalUsdc: GOAL });
  const a = Keypair.random();
  const xdr = await signedInvestment(c, a);
  const original = campaigns.deps.loadAccount;
  try {
    for (const mode of ['unfunded', 'usdc', 'native', 'sequence', 'threshold']) {
      __setDepsForTests({
        loadAccount: async (pub) => {
          if (mode === 'unfunded') throw new Error('source account not found');
          const account = await original(pub);
          if (mode === 'usdc') account.balances[1].balance = '1';
          if (mode === 'native') account.balances[0].balance = '0';
          if (mode === 'threshold') account.thresholds.med_threshold = 2;
          if (mode === 'sequence') account.incrementSequenceNumber();
          return account;
        },
      });
      await assert.rejects(submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr }), /not found|insufficient|sequence|signing/);
      assert.equal(readStore().campaigns[0].investments.length, 0, mode);
    }
  } finally {
    __setDepsForTests({ loadAccount: original });
  }
  assert.equal((await submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr })).investments[0].status, 'confirmed');
});

test('signed envelope rejects two payments and unrelated/source-override operations without broadcasting', async () => {
  resetState();
  const c = await createCampaign({ name: 'multi', goalUsdc: GOAL });
  const a = Keypair.random();
  const { Asset, Operation, Memo } = await import('@stellar/stellar-sdk');
  for (const ops of [
    [
      Operation.payment({ destination: platformKp.publicKey(), asset: new Asset('USDC', process.env.USDC_ISSUER!), amount: '10' }),
      Operation.payment({ destination: platformKp.publicKey(), asset: new Asset('USDC', process.env.USDC_ISSUER!), amount: '10' }),
    ],
    [
      Operation.payment({
        destination: platformKp.publicKey(),
        asset: new Asset('USDC', process.env.USDC_ISSUER!),
        amount: '10',
        source: Keypair.random().publicKey(),
      }),
    ],
    [
      Operation.payment({ destination: platformKp.publicKey(), asset: new Asset('USDC', process.env.USDC_ISSUER!), amount: '10' }),
      Operation.manageData({ name: 'bad', value: 'x' }),
    ],
  ]) {
    const builder = new TransactionBuilder(new Account(a.publicKey(), '1'), { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' })
      .addMemo(Memo.text(c.id))
      .setTimeout(900);
    ops.forEach((op) => builder.addOperation(op));
    const tx = builder.build();
    tx.sign(a);
    const broadcasts = submitLog.length;
    await assert.rejects(submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: tx.toXDR() }), /exactly one|operation source|unsupported/);
    assert.equal(submitLog.length, broadcasts);
    assert.equal(readStore().campaigns[0].investments.length, 0);
  }
});

test('wallet build gives 15 minutes; expired signed envelopes reserve nothing', async () => {
  resetState();
  const a = Keypair.random();
  const c = await createCampaign({ name: 'window', goalUsdc: GOAL });
  const built = await buildInvestXdr(c.id, { investorPub: a.publicKey(), amountUsdc: 10 });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase) as Transaction;
  assert.ok(Number(tx.timeBounds!.maxTime) - Date.now() / 1000 > 895);
  const { Asset, Operation, Memo } = await import('@stellar/stellar-sdk');
  const expired = new TransactionBuilder(new Account(a.publicKey(), '1'), {
    fee: '100',
    networkPassphrase: built.networkPassphrase,
    timebounds: { minTime: '0', maxTime: '1' },
  })
    .addMemo(Memo.text(c.id))
    .addOperation(Operation.payment({ destination: platformKp.publicKey(), asset: new Asset('USDC', process.env.USDC_ISSUER!), amount: '10' }))
    .build();
  expired.sign(a);
  await assert.rejects(submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: expired.toXDR() }), /time bounds/);
  assert.equal(readStore().campaigns[0].investments.length, 0);
});

test('signed pending reservations stay atomic; a post-preflight race remains held on 404', async () => {
  resetState();
  const a = Keypair.random(),
    b = Keypair.random();
  const c = await createCampaign({ name: 'signedrace', goalUsdc: GOAL });
  const x = await signedInvestment(c, a, 60),
    y = await signedInvestment(c, b, 60);
  injectedFailure = { type: 'bad_seq', applyFirst: false, times: 5 };
  const result = await Promise.allSettled([
    submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: x }),
    submitSignedInvest(c.id, { investorPub: b.publicKey(), xdr: y }),
  ]);
  assert.ok(result.every((r) => r.status === 'rejected'));
  assert.equal(readStore().campaigns[0].investments.length, 1);
  assert.equal(readStore().campaigns[0].investments[0].status, 'pending_usdc');
  assert.match(readStore().campaigns[0].investments[0].error, /not proof/);
});

test('partial token returns combine across pages; retries and duplicate IDs cannot double refund', async () => {
  resetState();
  const a = Keypair.random();
  const c = await createCampaign({ name: 'partials', goalUsdc: GOAL });
  await submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: await signedInvestment(c, a, 20) });
  const store = readStore();
  store.campaigns[0].deadline = new Date(0).toISOString();
  fs.writeFileSync(storePath, JSON.stringify(store));
  returnedPaymentPages = [[mkReturn('part-a', a.publicKey(), c.code, '75.0000000')]];
  const r1 = await refund(c.id);
  assert.equal(r1.investments[0].status, 'awaiting_token_return');
  assert.equal(r1.investments[0].returnedTokens, '75.0000000');
  returnedPaymentPages = [
    [mkReturn('part-b', a.publicKey(), c.code, '125')],
    [mkReturn('part-a', a.publicKey(), c.code, '75'), mkReturn('part-a', a.publicKey(), c.code, '75')],
  ];
  const r2 = await refund(c.id);
  assert.equal(r2.state, 'refunded');
  assert.deepEqual(new Set(r2.consumedReturnOps), new Set(['part-a', 'part-b']));
  assert.equal(paymentLog.filter((p) => p.to === a.publicKey() && p.code === 'USDC').length, 1);
});

test('CORS allowlist rejects untrusted POSTs and preflights, permits configured origins', async () => {
  const { app } = await import('../src/server.js');
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  const url = `http://127.0.0.1:${(srv.address() as any).port}/api/campaigns`;
  try {
    for (const method of ['POST', 'OPTIONS']) {
      const bad = await fetch(url, { method, headers: { origin: 'https://evil.invalid', 'x-admin-key': 'test-admin-key' } });
      assert.equal(bad.status, 403);
      assert.equal(bad.headers.get('access-control-allow-origin'), null);
    }
    const allowed = await fetch(url, { headers: { origin: 'http://localhost:5173' } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.equal(allowed.headers.get('cache-control'), 'no-store');
  } finally {
    srv.close();
  }
});

test('conclusive failed USDC payment releases full goal for another investor; no rebroadcast', async () => {
  resetState();
  const a = Keypair.random(),
    b = Keypair.random();
  const c = await createCampaign({ name: 'failedrelease', goalUsdc: GOAL });
  injectedFailure = { type: 'network', applyFirst: false };
  await assert.rejects(submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: await signedInvestment(c, a) }), /uncertain/);
  const hash = readStore().campaigns[0].investments[0].usdcTx;
  appliedTxRecords.set(hash, { hash, ledger: 1001, successful: false, paging_token: RETURN_PT, created_at: new Date().toISOString() });
  const before = submitLog.length;
  const cleared = await retryPending(c.id);
  assert.equal(cleared.investments[0].status, 'failed_usdc');
  assert.equal(submitLog.length, before, 'known failed transaction never resubmitted');
  const done = await submitSignedInvest(c.id, { investorPub: b.publicKey(), xdr: await signedInvestment(c, b) });
  assert.equal(done.investments[1].status, 'confirmed');
  const store = readStore();
  store.campaigns[0].deadline = new Date(0).toISOString();
  fs.writeFileSync(storePath, JSON.stringify(store));
  assert.equal((await finalize(c.id)).state, 'finalized');
  assert.equal(paymentLog.filter((p) => p.from === a.publicKey() && p.code === 'USDC').length, 0);
});

test('missing/mismatched ledger evidence cannot release a reservation', async () => {
  resetState();
  const a = Keypair.random();
  const c = await createCampaign({ name: 'unproven', goalUsdc: GOAL });
  injectedFailure = { type: 'bad_seq', applyFirst: false, times: 20 };
  await assert.rejects(submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: await signedInvestment(c, a) }), /not proof/);
  const hash = readStore().campaigns[0].investments[0].usdcTx;
  for (const evidence of [
    { hash, successful: false },
    { hash: 'wrong', ledger: 1000, successful: false },
    { hash, ledger: 1000 },
  ]) {
    appliedTxRecords.set(hash, evidence as any);
    assert.equal((await retryPending(c.id)).investments[0].status, 'pending_usdc');
  }
});

test('campaign binding prevents crediting one signed payment twice across campaigns', async () => {
  resetState();
  const a = Keypair.random();
  const c = await createCampaign({ name: 'one', goalUsdc: GOAL });
  const other = await createCampaign({ name: 'two', goalUsdc: GOAL });
  const xdr = await signedInvestment(c, a, 20);
  await assert.rejects(submitSignedInvest(other.id, { investorPub: a.publicKey(), xdr }), /memo must bind/);
  await submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr });
  await assert.rejects(submitSignedInvest(other.id, { investorPub: a.publicKey(), xdr }), /already assigned/);
  assert.equal(readStore().campaigns[1].investments.length, 0);
});

test('legacy no-memo pending intents resume unchanged; new no-memo submissions fail', async () => {
  resetState();
  const a = Keypair.random();
  const c = await createCampaign({ name: 'legacy', goalUsdc: GOAL });
  const { Asset, Operation } = await import('@stellar/stellar-sdk');
  const tx = new TransactionBuilder(new Account(a.publicKey(), '1'), { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' })
    .addOperation(Operation.payment({ destination: platformKp.publicKey(), asset: new Asset('USDC', process.env.USDC_ISSUER!), amount: '20' }))
    .setTimeout(900)
    .build();
  tx.sign(a);
  const input = { investorPub: a.publicKey(), xdr: tx.toXDR() };
  await assert.rejects(submitSignedInvest(c.id, input), /memo must bind/);
  // Simulate a durable intent persisted by the previous branch version.
  const store = readStore();
  store.campaigns[0].investments.push({
    id: 'i1',
    investorPub: a.publicKey(),
    amountUsdc: 20,
    tokens: 200,
    usdcXdr: input.xdr,
    usdcTx: Buffer.from(tx.hash()).toString('hex'),
    tokenTx: '',
    status: 'pending_usdc',
  });
  fs.writeFileSync(storePath, JSON.stringify(store));
  const done = await submitSignedInvest(c.id, input);
  assert.equal(done.investments.length, 1);
  assert.equal(done.investments[0].status, 'confirmed');
  assert.equal(submitLog[1], input.xdr, 'exact legacy XDR resubmitted, not rebuilt');
});

test('wallet build with missing trustlines produces an accepted narrow envelope', async () => {
  resetState();
  const a = Keypair.random();
  const c = await createCampaign({ name: 'trustlines', goalUsdc: GOAL });
  const original = campaigns.deps.hasTrustline;
  __setDepsForTests({ hasTrustline: async () => false });
  try {
    const done = await submitSignedInvest(c.id, { investorPub: a.publicKey(), xdr: await signedInvestment(c, a, 20) });
    assert.equal(done.investments[0].status, 'confirmed');
  } finally {
    __setDepsForTests({ hasTrustline: original });
  }
});

test('signed submit: sub-cent and out-of-range payment amounts rejected exactly', async () => {
  resetState();
  const investor = Keypair.random();
  const c = await createCampaign({ name: 'exactamt', goalUsdc: GOAL });

  const mkTx = async (amount: string) => {
    const account: any = await (campaigns as any).deps.loadAccount(investor.publicKey());
    const plat = (campaigns as any).deps.requirePlatform();
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.payment({ destination: plat.publicKey(), asset: new Asset('USDC', process.env.USDC_ISSUER!), amount }))
      .addMemo(Memo.text(c.id))
      .setTimeout(900)
      .build();
    tx.sign(investor);
    return tx.toXDR();
  };

  // Three decimals must never round into credit (exact parse, not float tolerance).
  await assert.rejects(submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: await mkTx('25.005') }), /2 decimal places/);
  // Exact two-decimal amounts still work.
  const good = await submitSignedInvest(c.id, { investorPub: investor.publicKey(), xdr: await mkTx('25.05') });
  assert.equal(good.investments[0].amountUsdc, 25.05);
});

test('trustline submit: ambiguous broadcast resolves by exact hash; failure reports the hash', async () => {
  resetState();
  const investor = Keypair.random();
  const account: any = await (campaigns as any).deps.loadAccount(investor.publicKey());
  const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: new Asset('USDC', process.env.USDC_ISSUER!) }))
    .setTimeout(900)
    .build();
  tx.sign(investor);
  const xdr = tx.toXDR();
  const expectedHash = Buffer.from(tx.hash()).toString('hex');

  // Applied on the ledger but the response was lost: must resolve, not report failure.
  injectedFailure = { type: 'network', applyFirst: true };
  const resolved = await submitSignedTrustline({ investorPub: investor.publicKey(), xdr });
  assert.equal(resolved.hash, expectedHash);
  assert.equal(resolved.assetCode, 'USDC');

  // Not applied: the error must carry the exact hash for manual reconciliation.
  const account2: any = await (campaigns as any).deps.loadAccount(investor.publicKey());
  const tx2 = new TransactionBuilder(account2, { fee: '100', networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: new Asset('EURT', process.env.USDC_ISSUER!) }))
    .setTimeout(900)
    .build();
  tx2.sign(investor);
  const expectedHash2 = Buffer.from(tx2.hash()).toString('hex');
  injectedFailure = { type: 'network', applyFirst: false };
  await assert.rejects(submitSignedTrustline({ investorPub: investor.publicKey(), xdr: tx2.toXDR() }), (e: any) => e.message.includes(expectedHash2));
});
