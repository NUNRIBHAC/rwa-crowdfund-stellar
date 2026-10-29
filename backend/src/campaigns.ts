import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Asset, Keypair, Operation, Transaction, TransactionBuilder, xdr } from '@stellar/stellar-sdk';
import { USDC, hasUsdcConfig } from './config.js';
import { requirePlatform, server, networkPassphrase } from './stellar.js';
import { ensureAccount, ensureTrustline, hasTrustline } from './chain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const dataDir = path.join(backendRoot, 'data');

// File locations are env-overridable so tests (and non-demo setups) can keep
// secrets and state outside the repo directory.
const storePath = () => process.env.CAMPAIGNS_STORE_PATH ?? path.join(dataDir, 'campaigns.json');
const creatorPath = () => process.env.CREATOR_PATH ?? path.join(backendRoot, '.creator.json');
const demoInvestorsPath = () =>
  process.env.DEMO_INVESTORS_PATH ?? path.join(backendRoot, '.demo-investors.json');

export type InvestmentStatus =
  | 'pending_usdc' // signed USDC tx persisted, submission not yet confirmed
  | 'pending_token_delivery' // USDC confirmed on-chain; RWA token delivery still owed
  | 'confirmed' // USDC received and tokens delivered
  | 'awaiting_token_return' // refund blocked: investor still holds tokens the platform cannot claw back
  | 'refund_pending' // refund (or clawback) intent persisted, not yet confirmed
  | 'refunded';

export type Investment = {
  id: string;
  investorPub: string;
  amountUsdc: number;
  tokens: number;
  // Per-payment durable intent: the exact signed XDR and its hash are saved
  // BEFORE anything is broadcast, so a crash or a lost response is recovered by
  // re-submitting the identical transaction (Horizon replays the original
  // result for an already-applied tx), never by building a second payment.
  usdcXdr?: string;
  usdcTx: string;
  tokenXdr?: string;
  tokenTx: string;
  clawbackXdr?: string;
  clawbackTx?: string;
  tokenDeliveredAt?: string; // set when token delivery is confirmed (binds on-chain return verification)
  refundXdr?: string;
  refundTx?: string;
  status?: InvestmentStatus;
  error?: string;
};

export type Campaign = {
  id: string;
  code: string;
  name: string;
  goalUsdc: number;
  deadline: string;
  creatorPub: string;
  supply: number;
  state: 'funding' | 'finalized' | 'refunded';
  createdAt: string;
  mintXdr?: string;
  mintTx: string;
  consumedReturnOps?: string[]; // Horizon payment ids of investor token returns already allocated to refunds
  payoutXdr?: string;
  payoutTx?: string;
  finalizedAt?: string;
  refundedAt?: string;
  investments: Investment[];
};

type Store = { campaigns: Campaign[]; nextCode: number };

function loadStore(): Store {
  if (!fs.existsSync(storePath())) {
    return { campaigns: [], nextCode: 1 };
  }
  const store = JSON.parse(fs.readFileSync(storePath(), 'utf8')) as Store;
  // Backfill status for records written before statuses existed.
  for (const c of store.campaigns) {
    for (const i of c.investments) {
      if (!i.status) i.status = i.tokenTx ? 'confirmed' : 'pending_token_delivery';
    }
  }
  return store;
}

function saveStore(store: Store): void {
  const target = storePath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // Durable write: tmp file + fsync + rename + directory fsync, so a crash
  // cannot leave a half-written store and the intent survives the rename.
  const tmp = `${target}.tmp-${process.pid}`;
  const fd = fs.openSync(tmp, 'w');
  fs.writeSync(fd, JSON.stringify(store, null, 2));
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  fs.renameSync(tmp, target);
  try {
    const dfd = fs.openSync(path.dirname(target), 'r');
    fs.fsyncSync(dfd);
    fs.closeSync(dfd);
  } catch {
    // directory fsync unsupported on some platforms; tmp+rename already applied
  }
}

// In-process mutex: serializes every read-modify-write of the store so two
// concurrent requests in this process cannot overshoot the goal or lose each
// other's updates. NOTE: single process only; multiple instances need a shared
// store with real transactions (or the on-chain contract).
let lockQueue: Promise<void> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = lockQueue;
  let release!: () => void;
  lockQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  return prev.then(async () => {
    try {
      return await fn();
    } finally {
      release();
    }
  });
}

// Chain access goes through `deps` so tests can replace the network with fakes.
export const deps = {
  ensureAccount,
  ensureTrustline,
  hasTrustline,
  loadAccount: (pub: string): Promise<any> => server.loadAccount(pub),
  submitTransaction: (tx: Transaction) => server.submitTransaction(tx),
  accountPayments: (pub: string): Promise<any> =>
    (server as any).payments().forAccount(pub).order('desc').limit(200).call(),
  lookupTransaction: (hash: string): Promise<any> =>
    (server as any).transactions().transaction(hash).call(),
  requirePlatform,
};

export function __setDepsForTests(patch: Partial<typeof deps>): void {
  Object.assign(deps, patch);
}

// Money is handled in integer cents everywhere; floats never accumulate.
// An amount with more than 2 decimals is REJECTED, never rounded into credit.
const toCents = (usdc: number): number => {
  const cents = Math.round(usdc * 100);
  if (!Number.isFinite(usdc) || Math.abs(usdc * 100 - cents) > 1e-6) {
    throw new Error('amountUsdc supports at most 2 decimal places (cents)');
  }
  return cents;
};
const centsToAmountString = (cents: number): string =>
  `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}00000`;
const centsToUsdc = (cents: number): number => cents / 100;

const usdcAsset = () => new Asset(USDC.code, USDC.issuer);
const rwaAsset = (code: string, issuer: string) => new Asset(code, issuer);

// USDC that counts toward the goal: everything whose intent was persisted and
// not refunded. Pending (unconfirmed) intents count too: it is safe to
// over-reject contributions, never to overshoot the cap.
function investedCents(c: Campaign): number {
  return c.investments
    .filter((i) => i.status !== 'refunded')
    .reduce((sum, i) => sum + toCents(i.amountUsdc), 0);
}

// Integer token math (no float rounding drift).
function tokensFor(amountCents: number, goalCents: number, supply: number): number {
  return Number((BigInt(amountCents) * BigInt(supply)) / BigInt(goalCents));
}

function ensureFunding(campaign: Campaign): void {
  if (campaign.state !== 'funding') throw new Error(`campaign is in state ${campaign.state}`);
}

function ensureBeforeDeadline(campaign: Campaign): void {
  if (Date.now() > Date.parse(campaign.deadline)) throw new Error('campaign deadline has passed');
}

function ensureAfterDeadline(campaign: Campaign): void {
  if (Date.now() <= Date.parse(campaign.deadline)) {
    throw new Error(
      `campaign deadline has not passed yet (deadline ${campaign.deadline}); ` +
        'all-or-nothing: finalize/refund are only allowed after the deadline',
    );
  }
}

// Validates the contribution against the all-or-nothing cap. Rejects (never
// trims) a contribution above the remaining goal; exact fill is allowed.
function checkContribution(
  campaign: Campaign,
  amountUsdc: number,
): { amountCents: number; tokens: number } {
  if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) throw new Error('amountUsdc must be > 0');
  const amountCents = toCents(amountUsdc);
  if (amountCents <= 0) throw new Error('amountUsdc too small (below 1 cent)');
  const goalCents = toCents(campaign.goalUsdc);
  const remainingCents = goalCents - investedCents(campaign);
  if (remainingCents <= 0) throw new Error('goal already reached');
  if (amountCents > remainingCents) {
    throw new Error(
      `contribution exceeds the remaining goal (${centsToUsdc(remainingCents)} USDC left); ` +
        'this campaign is capped at the target',
    );
  }
  const tokens = tokensFor(amountCents, goalCents, campaign.supply);
  if (tokens <= 0) throw new Error('amount too small: does not generate tokens');
  return { amountCents, tokens };
}

function loadCreatorKp(): Keypair {
  if (fs.existsSync(creatorPath())) {
    const data = JSON.parse(fs.readFileSync(creatorPath(), 'utf8'));
    return Keypair.fromSecret(data.secret);
  }
  const kp = Keypair.random();
  fs.mkdirSync(path.dirname(creatorPath()), { recursive: true });
  fs.writeFileSync(
    creatorPath(),
    JSON.stringify({ secret: kp.secret(), publicKey: kp.publicKey() }, null, 2),
    { encoding: 'utf8', mode: 0o600 },
  );
  return kp;
}

function demoSecretOf(pub: string): string | null {
  if (!fs.existsSync(demoInvestorsPath())) return null;
  const map = JSON.parse(fs.readFileSync(demoInvestorsPath(), 'utf8'));
  const secret = map[pub];
  return typeof secret === 'string' ? secret : null;
}

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const txResultCode = (e: any): string | null =>
  e?.response?.data?.extras?.result_codes?.transaction ?? null;

// Reconcile a persisted intent hash against the ledger before trusting or
// discarding it:
//  - 'applied': found AND successful === true;
//  - 'failed': found but recorded as failed - its operations did not execute,
//    but mere presence must never release anything: hold for manual
//    reconciliation like every other non-applied outcome;
//  - 'not_found': absent in queried history (a 404 is NOT proof the tx can
//    never execute: the node may lag or have pruned);
//  - 'unknown': lookup failed.
// Only 'applied' is trusted; every other outcome holds the intent.
async function reconcileTx(hash: string): Promise<'applied' | 'failed' | 'not_found' | 'unknown'> {
  try {
    const tx = await deps.lookupTransaction(hash);
    if (tx?.successful === false) return 'failed';
    return 'applied';
  } catch (e: any) {
    const status = e?.response?.status ?? e?.status;
    if (status === 404) return 'not_found';
    return 'unknown';
  }
}

// Build and sign a payment offline; nothing is broadcast here.
function buildSignedPayment(
  account: any,
  from: Keypair,
  toPub: string,
  asset: Asset,
  amountStr: string,
): { xdr: string; hash: string } {
  const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase })
    .addOperation(Operation.payment({ destination: toPub, asset, amount: amountStr }))
    .setTimeout(180)
    .build();
  tx.sign(from);
  return { xdr: tx.toXDR(), hash: Buffer.from(tx.hash()).toString('hex') };
}

async function submitSignedXdr(xdrStr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(xdrStr, networkPassphrase);
  if (!(tx instanceof Transaction)) throw new Error('unexpected fee-bump transaction');
  try {
    const resp = await deps.submitTransaction(tx);
    return String(resp.hash ?? Buffer.from(tx.hash()).toString('hex'));
  } catch (e: any) {
    const rcs = e?.response?.data?.extras?.result_codes;
    if (rcs) console.error('SUBMIT_FAIL result_codes=', JSON.stringify(rcs, null, 2));
    throw e;
  }
}

// Intent-first payment executor.
//
// slot holds the durable intent ({ xdr, hash }) on a record that is saved by
// persist(). Rules:
//  - the intent (signed XDR + hash) is persisted before the first broadcast;
//  - on an uncertain failure (timeout, network error, 5xx) the SAME signed tx
//    is re-submitted on retry: Horizon replays the original result if the tx
//    was already applied, so an uncertain broadcast cannot duplicate a payment;
//  - a submission failure (tx_bad_seq / tx_too_late) is never trusted on its
//    own: the persisted hash is reconciled against Horizon first. Only an
//    authoritative applied (successful === true) result confirms; every other
//    outcome - 404, found-but-failed, inconclusive lookup - holds the exact
//    intent. A broadcast intent is never discarded or rebuilt automatically;
//    clearing one requires manual reconciliation.
async function executePayment(
  slot: { xdr?: string; hash?: string; error?: string },
  build: () => Promise<{ xdr: string; hash: string }>,
  persist: () => void,
): Promise<string> {
  for (;;) {
    if (!slot.xdr) {
      if (slot.hash) {
        // Never discard a previously broadcast intent: reconcile its fate, and
        // hold on anything but an authoritative applied result. A Horizon 404
        // is absence in queried history, not proof the tx can never execute
        // (the node may lag or have pruned), so it is never rebuilt here.
        const outcome = await reconcileTx(slot.hash);
        if (outcome === 'applied') {
          slot.error = undefined;
          return slot.hash;
        }
        slot.error =
          outcome === 'unknown'
            ? `could not reconcile payment intent ${slot.hash} with Horizon; holding it for a later retry`
            : outcome === 'failed'
              ? `payment intent ${slot.hash} is recorded on the ledger as failed; holding it for manual reconciliation`
              : `payment intent ${slot.hash} is not on the ledger in queried history, which is not proof it cannot execute; holding it for manual reconciliation`;
        persist();
        throw new Error(slot.error);
      }
      const intent = await build();
      slot.xdr = intent.xdr;
      slot.hash = intent.hash;
      persist(); // durable intent before any network send
    }
    try {
      const hash = await submitSignedXdr(slot.xdr);
      slot.error = undefined;
      return hash;
    } catch (e: any) {
      const code = txResultCode(e);
      if (code === 'tx_bad_seq' || code === 'tx_too_late') {
        const outcome = slot.hash ? await reconcileTx(slot.hash) : 'unknown';
        if (outcome === 'applied') {
          slot.error = undefined;
          return slot.hash!;
        }
        slot.error =
          outcome === 'unknown'
            ? `submission failed (${code}) and reconciliation of ${slot.hash} was inconclusive; holding the intent for retry`
            : outcome === 'failed'
              ? `submission failed (${code}) and ${slot.hash} is recorded on the ledger as failed; holding the intent for manual reconciliation`
              : `submission failed (${code}) and ${slot.hash} is not on the ledger in queried history, which is not proof it cannot execute; holding the intent for manual reconciliation`;
        persist();
        throw new Error(slot.error);
      }
      slot.error = `submission uncertain: ${errMsg(e)} (safe to retry: the identical signed tx is resubmitted)`;
      persist();
      throw new Error(slot.error);
    }
  }
}

// Fetch the investor's payment history from Horizon, following pages.
async function fetchPayments(pub: string, maxPages = 10): Promise<any[]> {
  const out: any[] = [];
  let page = await deps.accountPayments(pub);
  for (let i = 0; i < maxPages && page; i++) {
    const records: any[] = page?.records ?? [];
    out.push(...records);
    if (records.length === 0 || typeof page?.next !== 'function') break;
    page = await page.next();
  }
  return out;
}

// Verifies on-chain that `inv` got its tokens back before the USDC refund.
// Conservative allocation rules (fail closed):
//  - a return counts only as a single payment of EXACTLY this investment's
//    token amount from the investor to the platform (partial or oversized
//    returns are not credited; they need manual reconciliation);
//  - each return operation id can fund at most one refund per campaign;
//  - the return must come AFTER the token delivery in ledger order (paging
//    tokens), never by local wall clock.
// Returns 'verified' | 'not_returned' | 'unknown' (lookup failed: hold).
async function verifyTokenReturn(
  store: Store,
  campaign: Campaign,
  inv: Investment,
  rwa: Asset,
  platformPub: string,
): Promise<'verified' | 'not_returned' | 'unknown'> {
  let deliveryOrder: string;
  try {
    const dtx = await deps.lookupTransaction(inv.tokenTx);
    deliveryOrder = String(dtx?.paging_token ?? '');
    if (!deliveryOrder || dtx?.successful === false) return 'unknown';
  } catch {
    return 'unknown'; // cannot establish ledger order: hold
  }
  let records: any[];
  try {
    records = await fetchPayments(inv.investorPub);
  } catch {
    return 'unknown';
  }
  const consumed = new Set(campaign.consumedReturnOps ?? []);
  for (const r of records) {
    if (r?.type !== 'payment' || r?.from !== inv.investorPub || r?.to !== platformPub) continue;
    if (r?.asset_code !== rwa.code || r?.asset_issuer !== rwa.issuer) continue;
    if (!r?.id || consumed.has(r.id)) continue;
    if (r?.transaction_successful === false) continue; // failed tx ops never qualify
    if (Number(r?.amount) !== inv.tokens) continue; // exact amount only
    // Ledger-order binding via SEP-0035 total-order ids: a payment op id is
    // numerically greater than its containing tx id and than any earlier tx,
    // so a BigInt comparison against the delivery tx paging token is sound.
    if (!r?.paging_token || BigInt(r.paging_token) <= BigInt(deliveryOrder)) continue;
    campaign.consumedReturnOps = [...consumed, r.id];
    inv.clawbackTx = `verified-onchain:${r.id}`;
    saveStore(store);
    return 'verified';
  }
  return 'not_returned';
}

export function listDemoInvestors(): string[] {
  if (!fs.existsSync(demoInvestorsPath())) return [];
  const map = JSON.parse(fs.readFileSync(demoInvestorsPath(), 'utf8'));
  return Object.keys(map);
}

export async function seedDemoInvestors(amounts?: number[]): Promise<{ investors: string[] }> {
  return withLock(async () => {
    const map = fs.existsSync(demoInvestorsPath())
      ? JSON.parse(fs.readFileSync(demoInvestorsPath(), 'utf8'))
      : {};
    const plat = deps.requirePlatform();
    const usdc = usdcAsset();
    for (let n = Object.keys(map).length; n < 3; n++) {
      const kp = Keypair.random();
      const pub = kp.publicKey();
      const amt = amounts && amounts.length > n ? amounts[n] : 100;
      await deps.ensureAccount(pub);
      await deps.ensureTrustline(kp, usdc);
      const account = await deps.loadAccount(plat.publicKey());
      const slot: { xdr?: string; hash?: string } = {};
      map[pub] = kp.secret();
      fs.mkdirSync(path.dirname(demoInvestorsPath()), { recursive: true });
      fs.writeFileSync(demoInvestorsPath(), JSON.stringify(map, null, 2), {
        encoding: 'utf8',
        mode: 0o600,
      });
      await executePayment(
        slot,
        async () => buildSignedPayment(account, plat, pub, usdc, Number(amt).toFixed(7)),
        () => {},
      );
    }
    return { investors: Object.keys(map) };
  });
}

export async function listCampaigns(): Promise<Campaign[]> {
  return loadStore().campaigns;
}

export async function createCampaign(input: {
  name: string;
  goalUsdc: number;
  deadline?: string;
  supply?: number;
}): Promise<Campaign> {
  return withLock(async () => {
    const name = (input.name ?? '').trim();
    const goalCents = toCents(Number(input.goalUsdc));
    const supply = Math.floor(Number(input.supply ?? 1000));
    if (!name) throw new Error('name is required');
    if (goalCents <= 0) throw new Error('goalUsdc must be > 0');
    if (supply <= 0) throw new Error('supply must be > 0');
    if (!hasUsdcConfig) throw new Error('USDC_ISSUER not configured (backend/.env)');

    const deadline = input.deadline
      ? new Date(input.deadline).toISOString()
      : new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    if (Number.isNaN(Date.parse(deadline))) throw new Error('invalid deadline');
    if (Date.parse(deadline) <= Date.now()) throw new Error('deadline must be in the future');

    const plat = deps.requirePlatform();
    const store = loadStore();
    const creator = loadCreatorKp();

    await deps.ensureAccount(creator.publicKey());
    await deps.ensureTrustline(creator, usdcAsset());

    const code = `CRWD${String(store.nextCode).padStart(3, '0')}`;
    const id = `c${store.nextCode}`;
    store.nextCode += 1;

    const campaign: Campaign = {
      id,
      code,
      name,
      goalUsdc: centsToUsdc(goalCents),
      deadline,
      creatorPub: creator.publicKey(),
      supply,
      state: 'funding',
      createdAt: new Date().toISOString(),
      mintTx: '',
      investments: [],
    };
    store.campaigns.push(campaign);

    // Mint the supply into escrow on the platform account, intent-first.
    const mintSlot: { xdr?: string; hash?: string } = {};
    campaign.mintTx = await executePayment(
      mintSlot,
      async () => {
        const account = await deps.loadAccount(plat.publicKey());
        return buildSignedPayment(account, plat, plat.publicKey(), rwaAsset(code, plat.publicKey()), String(supply));
      },
      () => {
        campaign.mintXdr = mintSlot.xdr; // intent only; mintTx is set after confirmation
        saveStore(store);
      },
    );
    campaign.mintXdr = undefined;
    saveStore(store);
    return campaign;
  });
}

// Confirms the persisted USDC intent (if still pending), then delivers tokens,
// intent-first. Shared by invest(), submitSignedInvest() and retryPending().
async function settleInvestment(
  store: Store,
  campaign: Campaign,
  inv: Investment,
): Promise<void> {
  const plat = deps.requirePlatform();
  const rwa = rwaAsset(campaign.code, plat.publicKey());

  if (inv.status === 'pending_usdc') {
    const slot = { xdr: inv.usdcXdr, hash: inv.usdcTx || undefined };
    inv.usdcTx = await executePayment(
      slot,
      async () => {
        // Rebuild is only possible for demo accounts (the platform holds their
        // secrets). A Freighter-signed intent that can never apply must be
        // re-signed by the investor: keep the record pending with an error.
        const secret = demoSecretOf(inv.investorPub);
        if (!secret) {
          throw new Error(
            'USDC intent expired or invalid and cannot be rebuilt without the investor signature; ' +
              'the investor must submit a new signed XDR',
          );
        }
        const kp = Keypair.fromSecret(secret);
        const account = await deps.loadAccount(kp.publicKey());
        return buildSignedPayment(
          account,
          kp,
          deps.requirePlatform().publicKey(),
          usdcAsset(),
          centsToAmountString(toCents(inv.amountUsdc)),
        );
      },
      () => {
        inv.usdcXdr = slot.xdr;
        inv.usdcTx = slot.hash ?? inv.usdcTx;
        saveStore(store);
      },
    );
    inv.usdcXdr = undefined;
    inv.status = 'pending_token_delivery';
    inv.error = undefined;
    saveStore(store);
  }

  if (inv.status === 'pending_token_delivery') {
    const slot = { xdr: inv.tokenXdr, hash: inv.tokenTx || undefined };
    inv.tokenTx = await executePayment(
      slot,
      async () => {
        const account = await deps.loadAccount(plat.publicKey());
        return buildSignedPayment(account, plat, inv.investorPub, rwa, String(inv.tokens));
      },
      () => {
        inv.tokenXdr = slot.xdr;
        inv.tokenTx = slot.hash ?? inv.tokenTx;
        saveStore(store);
      },
    );
    inv.tokenXdr = undefined;
    inv.status = 'confirmed';
    inv.error = undefined;
    inv.tokenDeliveredAt = new Date().toISOString();
    saveStore(store);
  }
}

export async function invest(
  id: string,
  input: { investorPub: string; amountUsdc: number },
): Promise<Campaign> {
  return withLock(async () => {
    const store = loadStore();
    const campaign = store.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error(`campaign ${id} not found`);
    ensureFunding(campaign);
    ensureBeforeDeadline(campaign);
    if (!campaign.mintTx) throw new Error('campaign mint not confirmed; run retry-pending first');

    const investorPub = (input.investorPub ?? '').trim();
    if (!investorPub.startsWith('G')) throw new Error('invalid investorPub');

    const secret = demoSecretOf(investorPub);
    if (!secret) {
      throw new Error(
        'Non-demo account: sign with Freighter in the next step. ' +
          `Use an account from backend/.demo-investors.json for the E2E: ${listDemoInvestors().join(', ')}`,
      );
    }
    const investor = Keypair.fromSecret(secret);

    // Resume an identical persisted intent instead of charging again (e.g. the
    // user clicked twice, or a previous attempt crashed before confirming).
    const amountCents = toCents(Number(input.amountUsdc));
    let inv = campaign.investments.find(
      (i) =>
        i.investorPub === investorPub &&
        i.status === 'pending_usdc' &&
        toCents(i.amountUsdc) === amountCents,
    );

    if (!inv) {
      const { tokens } = checkContribution(campaign, Number(input.amountUsdc));
      const plat = deps.requirePlatform();
      const usdc = usdcAsset();
      const rwa = rwaAsset(campaign.code, plat.publicKey());

      await deps.ensureAccount(investorPub);
      await deps.ensureTrustline(investor, usdc);
      await deps.ensureTrustline(investor, rwa);

      inv = {
        id: `i${campaign.investments.length + 1}`,
        investorPub,
        amountUsdc: centsToUsdc(amountCents),
        tokens,
        usdcTx: '',
        tokenTx: '',
        status: 'pending_usdc',
      };
      campaign.investments.push(inv);

      // Build and persist the signed USDC payment intent before broadcasting.
      const account = await deps.loadAccount(investorPub);
      const intent = buildSignedPayment(
        account,
        investor,
        plat.publicKey(),
        usdc,
        centsToAmountString(amountCents),
      );
      inv.usdcXdr = intent.xdr;
      inv.usdcTx = intent.hash;
      saveStore(store);
    }

    await settleInvestment(store, campaign, inv);
    return campaign;
  });
}

export async function finalize(id: string): Promise<Campaign> {
  return withLock(async () => {
    const store = loadStore();
    const campaign = store.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error(`campaign ${id} not found`);
    ensureFunding(campaign);
    // All-or-nothing: payout only after the deadline and only if the goal was met.
    ensureAfterDeadline(campaign);

    const totalCents = investedCents(campaign);
    if (totalCents <= 0) throw new Error('no investments; cannot finalize');
    if (totalCents < toCents(campaign.goalUsdc)) {
      throw new Error(
        `goal not reached (${centsToUsdc(totalCents)}/${campaign.goalUsdc}); refund instead`,
      );
    }
    const unsettled = campaign.investments.filter((i) => i.status !== 'confirmed' && i.status !== 'refunded');
    if (unsettled.length > 0) {
      throw new Error(
        `investments not fully settled (${unsettled.map((i) => i.id).join(', ')}); run retry-pending first`,
      );
    }

    // Idempotent payout, intent-first: the signed payout tx is persisted before
    // broadcast; retries resubmit the identical tx, so the creator cannot be
    // paid twice even if the process crashes after a successful broadcast.
    if (!campaign.payoutTx || campaign.payoutXdr) {
      const plat = deps.requirePlatform();
      const creator = loadCreatorKp();
      await deps.ensureTrustline(creator, usdcAsset());
      const slot = { xdr: campaign.payoutXdr, hash: campaign.payoutTx || undefined };
      campaign.payoutTx = await executePayment(
        slot,
        async () => {
          const account = await deps.loadAccount(plat.publicKey());
          return buildSignedPayment(
            account,
            plat,
            campaign.creatorPub,
            usdcAsset(),
            centsToAmountString(totalCents),
          );
        },
        () => {
          campaign.payoutXdr = slot.xdr; // intent only; payoutTx is set after confirmation
          saveStore(store);
        },
      );
      campaign.payoutXdr = undefined;
      saveStore(store);
    }

    campaign.state = 'finalized';
    campaign.finalizedAt = new Date().toISOString();
    saveStore(store);
    return campaign;
  });
}

export async function refund(id: string): Promise<Campaign & { refundBlocked?: string[] }> {
  return withLock(async () => {
    const store = loadStore();
    const campaign = store.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error(`campaign ${id} not found`);
    ensureFunding(campaign);
    // All-or-nothing: refunds only after the deadline and only if the goal was missed.
    ensureAfterDeadline(campaign);
    if (investedCents(campaign) >= toCents(campaign.goalUsdc)) {
      throw new Error('goal reached; refund not allowed, finalize instead');
    }

    const plat = deps.requirePlatform();
    const rwa = rwaAsset(campaign.code, plat.publicKey());
    const blocked: string[] = [];

    for (const inv of campaign.investments) {
      if (inv.status === 'refunded') continue;

      if (inv.status === 'pending_usdc') {
        inv.error = 'USDC payment not confirmed; run retry-pending before refunding';
        blocked.push(inv.id);
        saveStore(store);
        continue;
      }

      // A pending token delivery may already have succeeded, or its signed
      // intent may still execute later: reconcile before refunding, and never
      // discard a broadcast intent on a bare 404 - hold for manual
      // reconciliation instead.
      if (inv.status === 'pending_token_delivery' && inv.tokenXdr && inv.tokenTx) {
        const outcome = await reconcileTx(inv.tokenTx);
        if (outcome === 'applied') {
          inv.tokenXdr = undefined;
          inv.status = 'confirmed';
          inv.error = undefined;
          inv.tokenDeliveredAt = inv.tokenDeliveredAt ?? new Date().toISOString();
          saveStore(store);
        } else {
          // A Horizon 404 is absence in queried history, not proof the intent
          // did not execute (the node may lag or have pruned it; expiry only
          // proves it cannot execute in the future). Fail closed: hold for
          // manual reconciliation instead of discarding the intent.
          inv.error =
            outcome === 'unknown'
              ? `cannot reconcile token delivery ${inv.tokenTx}; refund blocked, retry later`
              : outcome === 'failed'
                ? `token delivery ${inv.tokenTx} is recorded on the ledger as failed; ` +
                  'refund held for manual reconciliation'
                : `token delivery intent ${inv.tokenTx} is not on the ledger in queried history, ` +
                  'which is not proof it cannot execute; refund held for manual reconciliation';
          blocked.push(inv.id);
          saveStore(store);
          continue;
        }
      }

      // If tokens were delivered, they must verifiably come back before the
      // USDC refund; otherwise the investor keeps free tokens. For demo
      // accounts the platform signs the clawback itself. For non-demo accounts
      // it verifies on-chain that the investor returned the tokens.
      if (inv.tokenTx && !inv.clawbackTx) {
        const secret = demoSecretOf(inv.investorPub);
        if (secret) {
          try {
            const kp = Keypair.fromSecret(secret);
            const slot = { xdr: inv.clawbackXdr, hash: undefined as string | undefined };
            inv.clawbackTx = await executePayment(
              slot,
              async () => {
                const account = await deps.loadAccount(kp.publicKey());
                return buildSignedPayment(account, kp, plat.publicKey(), rwa, String(inv.tokens));
              },
              () => {
                inv.clawbackXdr = slot.xdr;
                saveStore(store);
              },
            );
            inv.clawbackXdr = undefined;
            inv.error = undefined;
            saveStore(store);
          } catch (e) {
            inv.status = 'refund_pending';
            inv.error = `token clawback failed: ${errMsg(e)}`;
            blocked.push(inv.id);
            saveStore(store);
            continue;
          }
        } else {
          const outcome = await verifyTokenReturn(store, campaign, inv, rwa, plat.publicKey());
          if (outcome === 'verified') {
            inv.error = undefined;
            saveStore(store);
          } else if (outcome === 'unknown') {
            inv.error = `cannot verify the token return for delivery ${inv.tokenTx} on-chain; refund held`;
            blocked.push(inv.id);
            saveStore(store);
            continue;
          } else {
            inv.status = 'awaiting_token_return';
            inv.error =
              'refund blocked: investor still holds tokens the platform cannot claw back ' +
              '(non-demo account); the refund is released after an on-chain verified return ' +
              'of the exact token amount to the platform';
            blocked.push(inv.id);
            saveStore(store);
            continue;
          }
        }
      }

      // Per-investment idempotent refund, intent-first.
      inv.status = 'refund_pending';
      try {
        const slot = { xdr: inv.refundXdr, hash: inv.refundTx || undefined };
        inv.refundTx = await executePayment(
          slot,
          async () => {
            const account = await deps.loadAccount(plat.publicKey());
            return buildSignedPayment(
              account,
              plat,
              inv.investorPub,
              usdcAsset(),
              centsToAmountString(toCents(inv.amountUsdc)),
            );
          },
          () => {
            inv.refundXdr = slot.xdr; // intent only; refundTx is set after confirmation
            saveStore(store);
          },
        );
        inv.refundXdr = undefined;
        inv.error = undefined;
      } catch (e) {
        inv.error = `refund payment uncertain: ${errMsg(e)} (safe to retry: the identical signed tx is resubmitted)`;
        blocked.push(inv.id);
        saveStore(store);
        continue;
      }
      inv.status = 'refunded';
      saveStore(store);
    }

    if (campaign.investments.every((i) => i.status === 'refunded')) {
      campaign.state = 'refunded';
      campaign.refundedAt = new Date().toISOString();
    }
    saveStore(store);
    return { ...campaign, refundBlocked: blocked.length > 0 ? blocked : undefined };
  });
}

// Retries unsettled intents: campaign mint, pending USDC submissions and
// pending token deliveries. Always resubmits the persisted signed tx, so no
// payment can be duplicated by a retry.
export async function retryPending(id: string): Promise<Campaign> {
  return withLock(async () => {
    const store = loadStore();
    const campaign = store.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error(`campaign ${id} not found`);
    ensureFunding(campaign);

    if (!campaign.mintTx && campaign.mintXdr) {
      const plat = deps.requirePlatform();
      const slot = { xdr: campaign.mintXdr, hash: undefined as string | undefined };
      campaign.mintTx = await executePayment(
        slot,
        async () => {
          const account = await deps.loadAccount(plat.publicKey());
          return buildSignedPayment(
            account,
            plat,
            plat.publicKey(),
            rwaAsset(campaign.code, plat.publicKey()),
            String(campaign.supply),
          );
        },
        () => {
          campaign.mintXdr = slot.xdr;
          campaign.mintTx = slot.hash ?? campaign.mintTx;
          saveStore(store);
        },
      );
      campaign.mintXdr = undefined;
      saveStore(store);
    }

    for (const inv of campaign.investments) {
      if (inv.status !== 'pending_usdc' && inv.status !== 'pending_token_delivery') continue;
      try {
        await settleInvestment(store, campaign, inv);
      } catch (e) {
        inv.error = errMsg(e);
        saveStore(store);
      }
    }
    return campaign;
  });
}

export async function buildInvestXdr(
  id: string,
  input: { investorPub: string; amountUsdc: number },
): Promise<{ xdr: string; networkPassphrase: string; amountUsdc: number; tokens: number }> {
  return withLock(async () => {
    const store = loadStore();
    const campaign = store.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error(`campaign ${id} not found`);
    ensureFunding(campaign);
    ensureBeforeDeadline(campaign);
    if (!campaign.mintTx) throw new Error('campaign mint not confirmed; run retry-pending first');

    const investorPub = (input.investorPub ?? '').trim();
    if (!investorPub.startsWith('G')) throw new Error('invalid investorPub');
    const { amountCents, tokens } = checkContribution(campaign, Number(input.amountUsdc));

    const plat = deps.requirePlatform();
    const usdc = usdcAsset();
    const rwa = rwaAsset(campaign.code, plat.publicKey());

    await deps.ensureAccount(investorPub);

    const account = await deps.loadAccount(investorPub);
    const ops: xdr.Operation[] = [];
    if (!(await deps.hasTrustline(investorPub, usdc))) {
      ops.push(Operation.changeTrust({ asset: usdc }));
    }
    if (!(await deps.hasTrustline(investorPub, rwa))) {
      ops.push(Operation.changeTrust({ asset: rwa }));
    }
    ops.push(
      Operation.payment({
        destination: plat.publicKey(),
        asset: usdc,
        amount: centsToAmountString(amountCents),
      }),
    );

    const builder = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    }).setTimeout(60);
    for (const op of ops) builder.addOperation(op);
    const tx = builder.build();

    return { xdr: tx.toXDR(), networkPassphrase, amountUsdc: centsToUsdc(amountCents), tokens };
  });
}

export async function submitSignedInvest(
  id: string,
  input: { investorPub: string; xdr: string },
): Promise<Campaign & { duplicate?: boolean }> {
  return withLock(async () => {
    const store = loadStore();
    const campaign = store.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error(`campaign ${id} not found`);
    ensureFunding(campaign);
    ensureBeforeDeadline(campaign);
    if (!campaign.mintTx) throw new Error('campaign mint not confirmed; run retry-pending first');

    const investorPub = (input.investorPub ?? '').trim();
    if (!investorPub.startsWith('G')) throw new Error('invalid investorPub');
    if (typeof input.xdr !== 'string' || input.xdr.length === 0) throw new Error('xdr is required');

    const plat = deps.requirePlatform();
    const tx = TransactionBuilder.fromXDR(input.xdr, networkPassphrase);
    if (!(tx instanceof Transaction)) {
      throw new Error('FeeBump transactions are not supported');
    }
    if (tx.source !== investorPub) {
      throw new Error('XDR signed by a different account');
    }

    // Idempotency: the tx hash is computed before submission. A replay of an
    // already-recorded tx never pays tokens or records twice; a still-pending
    // record is resumed instead.
    const txHash = Buffer.from(tx.hash()).toString('hex');
    const existing = campaign.investments.find((i) => i.usdcTx === txHash);
    if (existing) {
      if (existing.status === 'pending_usdc' || existing.status === 'pending_token_delivery') {
        await settleInvestment(store, campaign, existing);
        return campaign;
      }
      return { ...campaign, duplicate: true };
    }

    let paidCents: number | null = null;
    for (const op of tx.operations) {
      const o = op as any;
      const asset = o?.asset ?? o?.line;
      if (
        o?.type === 'payment' &&
        (o?.destination ?? o?.to) === plat.publicKey() &&
        asset?.code === USDC.code &&
        asset?.issuer === USDC.issuer
      ) {
        paidCents = toCents(Number(o.amount));
        break;
      }
    }
    if (paidCents === null || !Number.isFinite(paidCents) || paidCents <= 0) {
      throw new Error('XDR without a USDC payment to the platform');
    }

    // Re-validate the signed amount against the current cap inside the lock:
    // another investor may have filled the remaining goal after the XDR was built.
    const goalCents = toCents(campaign.goalUsdc);
    const remainingCents = goalCents - investedCents(campaign);
    if (remainingCents <= 0) throw new Error('goal already reached');
    if (paidCents > remainingCents) {
      throw new Error(
        `XDR pays more than the remaining goal (${centsToUsdc(remainingCents)} USDC left); ` +
          'this campaign is capped at the target',
      );
    }
    const tokens = tokensFor(paidCents, goalCents, campaign.supply);
    if (tokens <= 0) throw new Error('amount too small: does not generate tokens');

    // Persist the investor-signed intent (the exact XDR + its hash) BEFORE
    // broadcasting; on any uncertainty the identical tx is resubmitted.
    const inv: Investment = {
      id: `i${campaign.investments.length + 1}`,
      investorPub,
      amountUsdc: centsToUsdc(paidCents),
      tokens,
      usdcXdr: input.xdr,
      usdcTx: txHash,
      tokenTx: '',
      status: 'pending_usdc',
    };
    campaign.investments.push(inv);
    saveStore(store);

    await settleInvestment(store, campaign, inv);
    return campaign;
  });
}

export async function buildTrustlineXdr(input: {
  investorPub: string;
  assetCode?: string;
  assetIssuer?: string;
}): Promise<{ xdr: string; networkPassphrase: string; assetCode: string }> {
  const investorPub = (input.investorPub ?? '').trim();
  if (!investorPub.startsWith('G')) throw new Error('invalid investorPub');

  const code = (input.assetCode ?? USDC.code).trim();
  const issuer = (input.assetIssuer ?? USDC.issuer).trim();

  const account = await deps.loadAccount(investorPub);
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation(Operation.changeTrust({ asset: new Asset(code, issuer) }))
    .setTimeout(60)
    .build();

  return { xdr: tx.toXDR(), networkPassphrase, assetCode: code };
}

export async function submitSignedTrustline(input: {
  investorPub: string;
  xdr: string;
}): Promise<{ hash: string; assetCode: string }> {
  const investorPub = (input.investorPub ?? '').trim();
  if (!investorPub.startsWith('G')) throw new Error('invalid investorPub');
  if (typeof input.xdr !== 'string' || input.xdr.length === 0) throw new Error('xdr is required');

  const tx = TransactionBuilder.fromXDR(input.xdr, networkPassphrase);
  if (!(tx instanceof Transaction)) {
    throw new Error('FeeBump transactions are not supported');
  }
  if (tx.source !== investorPub) {
    throw new Error('XDR signed by a different account');
  }

  let assetCode: string | null = null;
  for (const op of tx.operations) {
    const o = op as any;
    if (o?.type === 'changeTrust') {
      const asset = o?.asset ?? o?.line;
      assetCode = typeof asset?.code === 'string' ? asset.code : null;
      break;
    }
  }
  if (!assetCode) {
    throw new Error('XDR without a changeTrust operation');
  }

  let hash: string;
  try {
    const resp = await deps.submitTransaction(tx);
    hash = String(resp.hash ?? Buffer.from(tx.hash()).toString('hex'));
  } catch (e: any) {
    const rcs = e?.response?.data?.extras?.result_codes;
    if (rcs) console.error('SUBMIT_TRUSTLINE_FAIL result_codes=', JSON.stringify(rcs, null, 2));
    throw e;
  }

  return { hash, assetCode };
}
