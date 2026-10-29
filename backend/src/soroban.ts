import { createHash } from 'node:crypto';
import { Account, Address, Asset, Contract, Keypair, Networks, StrKey, Transaction, TransactionBuilder, nativeToScVal, scValToNative, rpc } from '@stellar/stellar-sdk';

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
const lock = <T>(fn: () => Promise<T>): Promise<T> => { const next = queue.then(fn, fn); queue = next.catch(() => {}); return next; };
async function readStore(): Promise<IntentStore> { return (await journalBackend()).read(); }
async function save(store: IntentStore): Promise<void> { return (await journalBackend()).save(store); }
function guard(): void {
  if ((process.env.STELLAR_NETWORK ?? 'testnet') !== 'testnet') throw new Error('Soroban integration is testnet-only; public network disabled');
}
function entries(): Entry[] {
  guard();
  const values = JSON.parse(process.env.SOROBAN_CAMPAIGNS_JSON ?? '[]');
  if (!Array.isArray(values)) throw new Error('invalid campaign registry');
  const ids = new Set(), contracts = new Set();
  for (const e of values) {
    if (!e || !/^[a-zA-Z0-9_-]{1,48}$/.test(e.id) || typeof e.name !== 'string' || e.name.length > 120 || !Address.fromString(e.contractId).toString().startsWith('C')) throw new Error('invalid campaign registry entry');
    if (ids.has(e.id) || contracts.has(e.contractId)) throw new Error('duplicate campaign registry entry');
    ids.add(e.id); contracts.add(e.contractId);
  }
  return values;
}
const entry = (id: string) => { const e = entries().find(e => e.id === id); if (!e) throw new Error('campaign not registered; deployment and registration are separate operator steps'); return e; };
function actorAddress(actor: string): Address {
  const addr = Address.fromString(actor); if (!actor.startsWith('G')) throw new Error('ordinary wallet account required'); return addr;
}
export function amountUnits(amount: string): bigint {
  if (typeof amount !== 'string' || !/^\d+(\.\d{1,7})?$/.test(amount)) throw new Error('amount must be a decimal string with at most 7 places');
  const [whole, fraction = ''] = amount.split('.');
  const units = BigInt(whole) * 10000000n + BigInt(fraction.padEnd(7, '0'));
  if (units <= 0n || units >= 2n ** 127n) throw new Error('amount outside positive i128 range');
  return units;
}
function jsonValue(value: any): any { return JSON.parse(JSON.stringify(value, (_k, v) => typeof v === 'bigint' ? v.toString() : v)); }
async function verifyCode(client: rpc.Server, e: Entry): Promise<void> {
  const wasm = await client.getContractWasmByContractId(e.contractId);
  if (createHash('sha256').update(wasm).digest('hex') !== WASM_HASH) throw new Error('contract code does not match reviewed crowdfund Wasm; refusing');
}
async function view(client: rpc.Server, e: Entry, method: string, args: any[] = [], actor?: string): Promise<any> {
  // Simulation only: this dummy account is never submitted or funded.
  const source = actor ?? Keypair.fromRawEd25519Seed(Buffer.alloc(32, 1)).publicKey();
  const tx = new TransactionBuilder(new Account(source, '0'), { fee: '100', networkPassphrase: passphrase }).addOperation(new Contract(e.contractId).call(method, ...args)).setTimeout(900).build();
  const result = await client.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) throw new Error(`contract read failed: ${result.error}`);
  if (rpc.Api.isSimulationRestore(result)) throw new Error('contract state archived; operator restoration required');
  if (!result.result) throw new Error('contract read missing result');
  return scValToNative(result.result.retval);
}
export async function sorobanCampaigns(actor?: string): Promise<any[]> {
  if (actor) actorAddress(actor);
  const client = sorobanDeps.client();
  return Promise.all(entries().map(async e => {
    await verifyCode(client, e);
    const config = await view(client, e, 'get_config');
    if (config.token !== expectedToken()) throw new Error('campaign asset does not match configured testnet USDC');
    const raised = await view(client, e, 'total_raised');
    const withdrawn = await view(client, e, 'is_withdrawn');
    const balance = actor ? await view(client, e, 'balance_of', [actorAddress(actor).toScVal()], actor) : null;
    return jsonValue({ ...e, mode: 'soroban', config, raised, withdrawn, balance, network: 'testnet', productionEligible: false });
  }));
}
export async function buildSoroban(id: string, input: { actor: string; action: string; amount?: string }): Promise<any> {
  return lock(async () => {
    const e = entry(id), actor = actorAddress(input.actor);
    if (process.env.SOROBAN_RECOVERY_MODE === 'true') throw new Error('recovery mode: journal was restored from backup and is not yet reconciled; new transactions are disabled until an operator completes reconciliation and disables SOROBAN_RECOVERY_MODE');
    if (!['contribute', 'refund', 'withdraw'].includes(input.action)) throw new Error('unsupported action');
    const store = await readStore();
    const unresolved = store.intents.find(i => i.actor === input.actor && i.signedXdr && !['SUCCESS', 'FAILED'].includes(i.status));
    if (unresolved) throw new Error(`prior signed intent ${unresolved.hash} is unresolved; check/retry exact hash, do not build a replacement`);
    const client = sorobanDeps.client(); await verifyCode(client, e);
    const config = await view(client, e, 'get_config');
    if (config.token !== expectedToken()) throw new Error('campaign asset does not match configured testnet USDC');
    if (input.action === 'withdraw' && config.creator !== input.actor) throw new Error('only the creator may prepare withdrawal');
    const account = await client.getAccount(input.actor);
    const args = input.action === 'contribute' ? [actor.toScVal(), nativeToScVal(amountUnits(input.amount!), { type: 'i128' })] : input.action === 'refund' ? [actor.toScVal()] : [];
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: passphrase }).addOperation(new Contract(e.contractId).call(input.action, ...args)).setTimeout(900).build();
    const simulation = await client.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) throw new Error(`simulation failed: ${simulation.error}`);
    if (rpc.Api.isSimulationRestore(simulation)) throw new Error('state restoration required; operator must restore before signing');
    if (simulation.result?.auth.some(a => a.credentials.type !== 'sorobanCredentialsSourceAccount')) throw new Error('separate address authorization is unsupported');
    const prepared = rpc.assembleTransaction(tx, simulation).build();
    // Only source-account auth can be signed by signTransaction. Reject
    // address-credential auth instead of pretending Freighter signed it.
    const op = prepared.operations[0] as any;
    if (op.auth?.some((a: any) => a.credentials.type !== 'sorobanCredentialsSourceAccount')) throw new Error('separate address authorization is unsupported');
    const hash = Buffer.from(prepared.hash()).toString('hex');
    store.intents.push({ hash, campaign: id, actor: input.actor, action: input.action, amount: input.amount, xdr: prepared.toXDR(), status: 'BUILT' }); await save(store);
    return { hash, xdr: prepared.toXDR(), networkPassphrase: passphrase, action: input.action, amount: input.amount, feeStroops: prepared.fee, contractId: e.contractId, testOnly: true };
  });
}
async function submitIntent(client: rpc.Server, store: IntentStore, intent: Intent): Promise<any> {
  const tx = TransactionBuilder.fromXDR(intent.signedXdr!, passphrase) as Transaction;
  try {
    const result = await client.sendTransaction(tx);
    if (result.hash !== intent.hash) throw new Error('RPC returned mismatched transaction hash');
    intent.status = result.status === 'ERROR' ? 'UNKNOWN' : result.status;
    await save(store);
    return { hash: intent.hash, status: intent.status, confirmed: false, message: 'Submission is not confirmation. Check the hash before another action.' };
  } catch (err) { intent.status = 'UNKNOWN'; await save(store); throw err; }
}
export async function submitSoroban(id: string, input: { actor: string; xdr: string }): Promise<any> {
  return lock(async () => {
    entry(id); actorAddress(input.actor);
    const tx = TransactionBuilder.fromXDR(input.xdr, passphrase);
    if (!(tx instanceof Transaction) || tx.source !== input.actor || tx.signatures.length !== 1 || !Keypair.fromPublicKey(input.actor).verify(tx.hash(), tx.signatures[0].signature)) throw new Error('invalid signed transaction');
    const hash = Buffer.from(tx.hash()).toString('hex'); const store = await readStore();
    const intent = store.intents.find(i => i.hash === hash && i.campaign === id && i.actor === input.actor);
    if (!intent) throw new Error('transaction was not prepared by this API');
    if (['SUCCESS', 'FAILED'].includes(intent.status)) return { hash, status: intent.status, confirmed: intent.status === 'SUCCESS' };
    const other = store.intents.find(i => i.hash !== hash && i.actor === input.actor && i.signedXdr && !['SUCCESS','FAILED'].includes(i.status));
    if (other) throw new Error(`prior signed intent ${other.hash} unresolved`);
    if (!intent.signedXdr) { intent.signedXdr = input.xdr; intent.status = 'SIGNED'; await save(store); }
    return submitIntent(sorobanDeps.client(), store, intent);
  });
}
// Journal-loss recovery: re-register one exact signed envelope whose journal
// entry was lost (e.g. restored from a stale backup). Never builds, replaces
// or submits anything. A recovered unconfirmed intent blocks new builds for
// that wallet (fail-closed) until its exact hash resolves on-chain.
export async function recoverSoroban(input: { actor: string; xdr: string }): Promise<any> {
  return lock(async () => {
    guard(); actorAddress(input.actor);
    const tx = TransactionBuilder.fromXDR(input.xdr, passphrase);
    if (!(tx instanceof Transaction) || tx.source !== input.actor || tx.signatures.length !== 1 || !Keypair.fromPublicKey(input.actor).verify(tx.hash(), tx.signatures[0].signature)) throw new Error('invalid signed transaction');
    const hash = Buffer.from(tx.hash()).toString('hex');
    const store = await readStore();
    const existing = store.intents.find(i => i.hash === hash);
    if (existing) return { hash, status: existing.status, recovered: false };
    let contractId = '';
    try {
      const ca = (tx.operations[0] as any).func.invokeContract?.contractAddress;
      if (ca?.type === 'scAddressTypeContract' && ca.contractId?.value) contractId = StrKey.encodeContract(Buffer.from(ca.contractId.value));
    } catch { contractId = ''; }
    const campaign = entries().find(e => e.contractId === contractId)?.id ?? null;
    const result = await sorobanDeps.client().getTransaction(hash);
    if (result.txHash !== hash) throw new Error('RPC returned mismatched hash');
    const terminal = result.status === 'SUCCESS' || result.status === 'FAILED';
    if (terminal && (!Number.isSafeInteger(result.ledger) || result.ledger <= 0)) throw new Error('RPC result missing conclusive ledger');
    const status = terminal ? result.status : 'NOT_FOUND';
    store.intents.push({ hash, campaign: campaign ?? 'recovered', actor: input.actor, action: 'recovered', xdr: tx.toXDR(), signedXdr: tx.toXDR(), status });
    await save(store);
    return { hash, status, recovered: true, campaign, held: status === 'NOT_FOUND' };
  });
}

export async function statusSoroban(hash: string): Promise<any> {
  return lock(async () => {
    guard(); if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('invalid hash');
    const store = await readStore(), intent = store.intents.find(i => i.hash === hash);
    if (!intent || !intent.signedXdr) throw new Error('signed intent not found');
    if (['SUCCESS', 'FAILED'].includes(intent.status)) return { hash, status: intent.status, confirmed: intent.status === 'SUCCESS' };
    const result = await sorobanDeps.client().getTransaction(hash);
    if (result.txHash !== hash) throw new Error('RPC returned mismatched hash');
    // NOT_FOUND is not failure. RPC has bounded history. No new intent,
    // reservation release, expiry inference, or automatic replacement.
    if ((result.status === 'SUCCESS' || result.status === 'FAILED') && (!Number.isSafeInteger(result.ledger) || result.ledger <= 0)) throw new Error('RPC result missing conclusive ledger');
    if (result.status === 'SUCCESS' || result.status === 'FAILED') { intent.status = result.status; await save(store); }
    return { hash, status: result.status, confirmed: result.status === 'SUCCESS', held: result.status === 'NOT_FOUND' };
  });
}
