import { createHash } from 'node:crypto';
import {
  Account,
  Address,
  Asset,
  Contract,
  Keypair,
  Networks,
  StrKey,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
} from '@stellar/stellar-sdk';

// No deployment path, platform signer, local capacity counter or receipt token.
export const sorobanDeps = {
  client: () => new rpc.Server(process.env.RPC_URL ?? 'https://soroban-testnet.stellar.org', { timeout: 15000 }),
};
const passphrase = Networks.TESTNET;
const expectedToken = () => new Asset('USDC', process.env.USDC_ISSUER ?? '').contractId(passphrase);
const WASM_HASH = '202c9d7e59623c06d1eb2f1ade4cbd187a73ccd3f8154673593820c71db1b564';
import { journalBackend } from './journal.js';
import type { Intent, IntentStore } from './journal.js';
type Entry = { id: string; name: string; contractId: string };
let queue: Promise<unknown> = Promise.resolve();
const lock = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
};
// Critical sections that read the journal, check for unresolved signed
// intents and save must be mutually exclusive across every process sharing
// the journal (rolling deploys briefly overlap two processes). The in-process
// queue covers one process; a Postgres journal adds a session advisory lock
// so a second process waits instead of racing the check. File backend
// (single developer) has no cross-process guard: single instance only.
// Network I/O (simulation, submission, status polls) runs OUTSIDE the lock:
// only the read-check-save phases hold it, so a slow RPC never stalls every
// other wallet operation behind the advisory lock (finding 5).
const JOURNAL_OPS_LOCK_KEY = 'soroban-journal-ops';
async function guarded<T>(fn: () => Promise<T>): Promise<T> {
  return lock(async () => {
    const j = await journalBackend();
    return j.runExclusive ? j.runExclusive(JOURNAL_OPS_LOCK_KEY, fn) : fn();
  });
}
async function readStore(): Promise<IntentStore> {
  return (await journalBackend()).read();
}
async function save(store: IntentStore): Promise<void> {
  return (await journalBackend()).save(store);
}
// Finding 4: bound per-actor open intents and build/recover request rate.
// The open-intent cap is enforced inside the journal lock against the stored
// state (unsigned intents expire via journal retention pruning). The request
// rate limiter is shared across processes through the Postgres backend
// (per-process fallback on the single-instance file backend).
const TERMINAL = ['SUCCESS', 'FAILED'];
const openIntents = (store: IntentStore, actor: string): Intent[] => store.intents.filter((i) => i.actor === actor && !TERMINAL.includes(i.status));
const openIntentCap = (): number => Number.parseInt(process.env.SOROBAN_MAX_OPEN_INTENTS ?? '25', 10);
const rateHits = new Map<string, number[]>();
// Rate limit is shared across every process on the journal database when the
// Postgres backend is configured (rolling deploys, multi-instance), falling
// back to a per-process window on the single-instance file backend.
async function rateLimit(kind: 'build' | 'recover', actor: string): Promise<void> {
  const limit = Number.parseInt(
    process.env[kind === 'build' ? 'SOROBAN_BUILD_RATE_PER_MIN' : 'SOROBAN_RECOVER_RATE_PER_MIN'] ?? (kind === 'build' ? '10' : '5'),
    10,
  );
  const key = kind + ':' + actor;
  const j = await journalBackend();
  if (j.rateLimit) {
    try {
      await j.rateLimit(key, limit, 60000);
    } catch (err) {
      throw new Error(`rate limit exceeded for ${kind}; wait and retry`, { cause: err });
    }
    return;
  }
  const now = Date.now();
  const hits = (rateHits.get(key) ?? []).filter((t) => now - t < 60000);
  if (hits.length >= limit) throw new Error(`rate limit exceeded for ${kind}; wait and retry`);
  hits.push(now);
  rateHits.set(key, hits);
}
// Quarantined journal rows are excluded from every lookup, so they can never
// satisfy a status check - but a quarantined row that could be an unresolved
// signed intent must also never CLEAR a safety hold by its absence. New
// builds and recoveries fail closed until an operator reconciles the raw
// record (see journal.malformed_rows logs); the row is never auto-deleted.
function quarantineHold(store: IntentStore): void {
  const held = (store.quarantined ?? []).filter((q) => q.possiblySigned);
  if (held.length)
    throw new Error(
      `journal holds ${held.length} quarantined record(s) that may be unresolved signed intents; operator reconciliation required before new transactions (journal.malformed_rows log, raw rows preserved)`,
    );
}
function quarantinedHash(store: IntentStore, hash: string): string | null {
  const q = (store.quarantined ?? []).find((q) => q.hash === hash);
  return q ? `journal record for ${hash} is quarantined (${q.reason}); manual reconciliation required - the raw row is preserved` : null;
}
function guard(): void {
  if ((process.env.STELLAR_NETWORK ?? 'testnet') !== 'testnet') throw new Error('Soroban integration is testnet-only; public network disabled');
}
function entries(): Entry[] {
  guard();
  const values = JSON.parse(process.env.SOROBAN_CAMPAIGNS_JSON ?? '[]');
  if (!Array.isArray(values)) throw new Error('invalid campaign registry');
  const ids = new Set(),
    contracts = new Set();
  for (const e of values) {
    if (
      !e ||
      !/^[a-zA-Z0-9_-]{1,48}$/.test(e.id) ||
      typeof e.name !== 'string' ||
      e.name.length > 120 ||
      !Address.fromString(e.contractId).toString().startsWith('C')
    )
      throw new Error('invalid campaign registry entry');
    if (ids.has(e.id) || contracts.has(e.contractId)) throw new Error('duplicate campaign registry entry');
    ids.add(e.id);
    contracts.add(e.contractId);
  }
  return values;
}
const entry = (id: string) => {
  const e = entries().find((e) => e.id === id);
  if (!e) throw new Error('campaign not registered; deployment and registration are separate operator steps');
  return e;
};
function actorAddress(actor: string): Address {
  const addr = Address.fromString(actor);
  if (!actor.startsWith('G')) throw new Error('ordinary wallet account required');
  return addr;
}
export function amountUnits(amount: string): bigint {
  if (typeof amount !== 'string' || !/^\d+(\.\d{1,7})?$/.test(amount)) throw new Error('amount must be a decimal string with at most 7 places');
  const [whole, fraction = ''] = amount.split('.');
  const units = BigInt(whole) * 10000000n + BigInt(fraction.padEnd(7, '0'));
  if (units <= 0n || units >= 2n ** 127n) throw new Error('amount outside positive i128 range');
  return units;
}
function jsonValue(value: any): any {
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)));
}
async function verifyCode(client: rpc.Server, e: Entry): Promise<void> {
  const wasm = await client.getContractWasmByContractId(e.contractId);
  if (createHash('sha256').update(wasm).digest('hex') !== WASM_HASH) throw new Error('contract code does not match reviewed crowdfund Wasm; refusing');
}
async function view(client: rpc.Server, e: Entry, method: string, args: any[] = [], actor?: string): Promise<any> {
  // Simulation only: this dummy account is never submitted or funded.
  const source = actor ?? Keypair.fromRawEd25519Seed(Buffer.alloc(32, 1)).publicKey();
  const tx = new TransactionBuilder(new Account(source, '0'), { fee: '100', networkPassphrase: passphrase })
    .addOperation(new Contract(e.contractId).call(method, ...args))
    .setTimeout(900)
    .build();
  const result = await client.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) throw new Error(`contract read failed: ${result.error}`);
  if (rpc.Api.isSimulationRestore(result)) throw new Error('contract state archived; operator restoration required');
  if (!result.result) throw new Error('contract read missing result');
  return scValToNative(result.result.retval);
}
export async function sorobanCampaigns(actor?: string): Promise<any[]> {
  if (actor) actorAddress(actor);
  const client = sorobanDeps.client();
  return Promise.all(
    entries().map(async (e) => {
      await verifyCode(client, e);
      const config = await view(client, e, 'get_config');
      if (config.token !== expectedToken()) throw new Error('campaign asset does not match configured testnet USDC');
      const raised = await view(client, e, 'total_raised');
      const withdrawn = await view(client, e, 'is_withdrawn');
      const balance = actor ? await view(client, e, 'balance_of', [actorAddress(actor).toScVal()], actor) : null;
      return jsonValue({ ...e, mode: 'soroban', config, raised, withdrawn, balance, network: 'testnet', productionEligible: false });
    }),
  );
}
function verifySignedTx(actor: string, xdrIn: string): Transaction {
  const tx = TransactionBuilder.fromXDR(xdrIn, passphrase);
  if (
    !(tx instanceof Transaction) ||
    tx.source !== actor ||
    tx.signatures.length !== 1 ||
    !Keypair.fromPublicKey(actor).verify(tx.hash(), tx.signatures[0].signature)
  )
    throw new Error('invalid signed transaction');
  return tx;
}
// Persist a status transition for one intent inside the journal lock. Runs
// after network I/O completes, so the lock is held for a read-update-save
// only, never across an RPC call.
async function recordStatus(hash: string, status: string): Promise<void> {
  return guarded(async () => {
    const store = await readStore();
    const intent = store.intents.find((i) => i.hash === hash);
    if (!intent) throw new Error('signed intent not found');
    intent.status = status;
    await save(store);
  });
}
export async function buildSoroban(id: string, input: { actor: string; action: string; amount?: string }): Promise<any> {
  const e = entry(id),
    actor = actorAddress(input.actor);
  if (process.env.SOROBAN_RECOVERY_MODE === 'true')
    throw new Error(
      'recovery mode: journal was restored from backup and is not yet reconciled; new transactions are disabled until an operator completes reconciliation and disables SOROBAN_RECOVERY_MODE',
    );
  if (!['contribute', 'refund', 'withdraw'].includes(input.action)) throw new Error('unsupported action');
  await rateLimit('build', input.actor);
  // Phase 1 (no journal lock): every network call - code verification,
  // config read, account load, simulation, assembly.
  const client = sorobanDeps.client();
  await verifyCode(client, e);
  const config = await view(client, e, 'get_config');
  if (config.token !== expectedToken()) throw new Error('campaign asset does not match configured testnet USDC');
  if (input.action === 'withdraw' && config.creator !== input.actor) throw new Error('only the creator may prepare withdrawal');
  const account = await client.getAccount(input.actor);
  const args =
    input.action === 'contribute'
      ? [actor.toScVal(), nativeToScVal(amountUnits(input.amount!), { type: 'i128' })]
      : input.action === 'refund'
        ? [actor.toScVal()]
        : [];
  const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: passphrase })
    .addOperation(new Contract(e.contractId).call(input.action, ...args))
    .setTimeout(900)
    .build();
  const simulation = await client.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) {
    // The SDK dump is a multi-hundred-line diagnostic log - keep it in the
    // server log and return one concise, honest reason to the client.
    const raw = simulation.error ?? '';
    console.warn('soroban build simulation failed:', raw);
    const coded = (code: string, reason: string) => {
      const err = new Error(`Transaction preparation failed: ${reason}.`);
      (err as Error & { code?: string }).code = code;
      return err;
    };
    if (/trustline entry is missing/i.test(raw)) throw coded('SIM_TRUSTLINE_MISSING', 'wallet is missing the USDC trustline');
    if (/account not found/i.test(raw)) throw coded('SIM_ACCOUNT_MISSING', 'wallet account does not exist on testnet');
    if (/insufficient|balance/i.test(raw)) throw coded('SIM_INSUFFICIENT_BALANCE', 'wallet does not hold enough testnet USDC');
    throw coded('SIM_REJECTED', 'the network rejected the transaction simulation');
  }
  if (rpc.Api.isSimulationRestore(simulation)) throw new Error('state restoration required; operator must restore before signing');
  if (simulation.result?.auth.some((a) => a.credentials.type !== 'sorobanCredentialsSourceAccount'))
    throw new Error('separate address authorization is unsupported');
  const prepared = rpc.assembleTransaction(tx, simulation).build();
  // Only source-account auth can be signed by signTransaction. Reject
  // address-credential auth instead of pretending Freighter signed it.
  const op = prepared.operations[0] as any;
  if (op.auth?.some((a: any) => a.credentials.type !== 'sorobanCredentialsSourceAccount')) throw new Error('separate address authorization is unsupported');
  const hash = Buffer.from(prepared.hash()).toString('hex');
  // Phase 2 (journal lock): re-read, re-check unresolved signed intents and
  // the per-actor open-intent cap against current state, then persist.
  await guarded(async () => {
    const store = await readStore();
    quarantineHold(store);
    const unresolved = store.intents.find((i) => i.actor === input.actor && i.signedXdr && !TERMINAL.includes(i.status));
    if (unresolved) throw new Error(`prior signed intent ${unresolved.hash} is unresolved; check/retry exact hash, do not build a replacement`);
    const open = openIntents(store, input.actor);
    if (open.length >= openIntentCap()) throw new Error(`too many open intents (${open.length}); resolve signed intents or let unsigned ones expire`);
    store.intents.push({ hash, campaign: id, actor: input.actor, action: input.action, amount: input.amount, xdr: prepared.toXDR(), status: 'BUILT' });
    await save(store);
  });
  return {
    hash,
    xdr: prepared.toXDR(),
    networkPassphrase: passphrase,
    action: input.action,
    amount: input.amount,
    feeStroops: prepared.fee,
    contractId: e.contractId,
    testOnly: true,
  };
}
export async function submitSoroban(id: string, input: { actor: string; xdr: string }): Promise<any> {
  entry(id);
  actorAddress(input.actor);
  // Phase 1 (no lock): parse and cryptographically verify the envelope.
  const tx = verifySignedTx(input.actor, input.xdr);
  const hash = Buffer.from(tx.hash()).toString('hex');
  // Phase 2 (journal lock): match the intent, short-circuit terminal,
  // enforce the one-unresolved-signed-intent rule, record the signature.
  return guarded(async () => {
    const store = await readStore();
    const intent = store.intents.find((i) => i.hash === hash && i.campaign === id && i.actor === input.actor);
    if (!intent) throw new Error(quarantinedHash(store, hash) ?? 'transaction was not prepared by this API');
    if (TERMINAL.includes(intent.status)) return { terminal: true, status: intent.status };
    const other = store.intents.find((i) => i.hash !== hash && i.actor === input.actor && i.signedXdr && !TERMINAL.includes(i.status));
    if (other) throw new Error(`prior signed intent ${other.hash} unresolved`);
    if (!intent.signedXdr) {
      intent.signedXdr = input.xdr;
      intent.status = 'SIGNED';
      await save(store);
    }
    return { terminal: false };
  }).then(async (r: any) => {
    if (r?.terminal) return { hash, status: r.status, confirmed: r.status === 'SUCCESS' };
    // Phase 3 (no lock): broadcast. Phase 4 (lock): persist the outcome.
    const store = await readStore();
    const intent = store.intents.find((i) => i.hash === hash)!;
    const sendTx = TransactionBuilder.fromXDR(intent.signedXdr!, passphrase) as Transaction;
    try {
      const result = await sorobanDeps.client().sendTransaction(sendTx);
      if (result.hash !== hash) throw new Error('RPC returned mismatched transaction hash');
      const status = result.status === 'ERROR' ? 'UNKNOWN' : result.status;
      await recordStatus(hash, status);
      return { hash, status, confirmed: false, message: 'Submission is not confirmation. Check the hash before another action.' };
    } catch (err) {
      await recordStatus(hash, 'UNKNOWN');
      throw err;
    }
  });
}
// Journal-loss recovery: re-register one exact signed envelope whose journal
// entry was lost (e.g. restored from a stale backup). Never builds, replaces
// or submits anything. A recovered unconfirmed intent blocks new builds for
// that wallet (fail-closed) until its exact hash resolves on-chain.
export async function recoverSoroban(input: { actor: string; xdr: string }): Promise<any> {
  guard();
  actorAddress(input.actor);
  await rateLimit('recover', input.actor);
  // Phase 1 (no lock): verify the envelope and poll the network for its hash.
  const tx = verifySignedTx(input.actor, input.xdr);
  const hash = Buffer.from(tx.hash()).toString('hex');
  let contractId = '';
  try {
    const ca = (tx.operations[0] as any).func.invokeContract?.contractAddress;
    if (ca?.type === 'scAddressTypeContract' && ca.contractId?.value) contractId = StrKey.encodeContract(Buffer.from(ca.contractId.value));
  } catch {
    contractId = '';
  }
  const campaign = entries().find((e) => e.contractId === contractId)?.id ?? null;
  const result = await sorobanDeps.client().getTransaction(hash);
  if (result.txHash !== hash) throw new Error('RPC returned mismatched hash');
  const terminal = result.status === 'SUCCESS' || result.status === 'FAILED';
  if (terminal && (!Number.isSafeInteger(result.ledger) || result.ledger <= 0)) throw new Error('RPC result missing conclusive ledger');
  const status = terminal ? result.status : 'NOT_FOUND';
  // Phase 2 (journal lock): idempotent re-registration of the exact hash.
  return guarded(async () => {
    const store = await readStore();
    quarantineHold(store);
    const existing = store.intents.find((i) => i.hash === hash);
    if (existing) return { hash, status: existing.status, recovered: false };
    store.intents.push({ hash, campaign: campaign ?? 'recovered', actor: input.actor, action: 'recovered', xdr: tx.toXDR(), signedXdr: tx.toXDR(), status });
    await save(store);
    return { hash, status, recovered: true, campaign, held: status === 'NOT_FOUND' };
  });
}

// Read-only dashboard feed: one wallet's recorded intents, newest first.
// Returns only non-sensitive, on-chain-public fields (hash, campaign, action,
// amount, status, timestamps) - signed envelopes never leave the journal.
// The journal holds at most one platform's demo intents, so an in-memory
// filter over the validated read path is correct at this scale and inherits
// the malformed-row quarantine handling for free.
export async function accountActivity(actor: string): Promise<any[]> {
  guard();
  actorAddress(actor);
  const store = await readStore();
  return store.intents
    .filter((i) => i.actor === actor)
    .sort((a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0))
    .slice(0, 50)
    .map((i) => ({
      hash: i.hash,
      campaign: i.campaign,
      action: i.action,
      amount: i.amount ?? null,
      status: i.status,
      createdAt: i.createdAt ?? null,
      updatedAt: i.updatedAt ?? null,
    }));
}

export async function statusSoroban(hash: string): Promise<any> {
  guard();
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('invalid hash');
  // Phase 1 (no lock): read the journal and poll the network.
  const store = await readStore(),
    intent = store.intents.find((i) => i.hash === hash);
  if (!intent || !intent.signedXdr) throw new Error(quarantinedHash(store, hash) ?? 'signed intent not found');
  if (TERMINAL.includes(intent.status)) return { hash, status: intent.status, confirmed: intent.status === 'SUCCESS' };
  const result = await sorobanDeps.client().getTransaction(hash);
  if (result.txHash !== hash) throw new Error('RPC returned mismatched hash');
  // NOT_FOUND is not failure. RPC has bounded history. No new intent,
  // reservation release, expiry inference, or automatic replacement.
  if ((result.status === 'SUCCESS' || result.status === 'FAILED') && (!Number.isSafeInteger(result.ledger) || result.ledger <= 0))
    throw new Error('RPC result missing conclusive ledger');
  // Phase 2 (journal lock): persist a terminal outcome.
  if (result.status === 'SUCCESS' || result.status === 'FAILED') await recordStatus(hash, result.status);
  return { hash, status: result.status, confirmed: result.status === 'SUCCESS', held: result.status === 'NOT_FOUND' };
}
