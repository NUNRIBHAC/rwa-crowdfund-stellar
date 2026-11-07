import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
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
  Operation,
  scValToNative,
  rpc,
  xdr,
} from '@stellar/stellar-sdk';

// No platform signer, local capacity counter or receipt token. Campaign
// deployment is operator-prepared below (buildCampaignDeploy) and signed by
// the operator wallet, never by a server-held key.
export const sorobanDeps = {
  client: () => new rpc.Server(process.env.RPC_URL ?? 'https://soroban-testnet.stellar.org', { timeout: 15000 }),
};
const passphrase = Networks.TESTNET;
const expectedToken = () => new Asset('USDC', process.env.USDC_ISSUER ?? '').contractId(passphrase);
const WASM_HASH = '202c9d7e59623c06d1eb2f1ade4cbd187a73ccd3f8154673593820c71db1b564';
import { journalBackend, readJournalSummary } from './journal.js';
import type { Intent, IntentStore, IntentSummaryStore } from './journal.js';
// Registry entries come in two shapes. v1 entries point at one reviewed
// crowdfund contract; v2 entries point at the share-token + offering pair
// deployed through the v2 builder chain. The server never edits the
// registry: operators add entries to SOROBAN_CAMPAIGNS_JSON by hand.
export type V1Entry = { id: string; name: string; contractId: string; contractSet?: 'v1' };
export type V2Entry = { id: string; name: string; contractSet: 'v2'; tokenContractId: string; offeringContractId: string };
export type RegistryEntry = V1Entry | V2Entry;
type Entry = RegistryEntry;
export const isV2Entry = (e: RegistryEntry): e is V2Entry => (e as V2Entry).contractSet === 'v2';
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
// Bounded fan-out: at most `limit` items in flight, result order preserved.
// Caps simultaneous public-RPC calls so a listing burst cannot fan out to
// campaigns x per-campaign reads at once on a shared egress IP.
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}
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
async function readSummaryStore(): Promise<IntentSummaryStore> {
  return readJournalSummary(await journalBackend());
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
  const contractAddress = (v: unknown): boolean => {
    try {
      return typeof v === 'string' && Address.fromString(v).toString().startsWith('C');
    } catch {
      return false;
    }
  };
  for (const e of values) {
    if (!e || !/^[a-zA-Z0-9_-]{1,48}$/.test(e.id) || typeof e.name !== 'string' || e.name.length > 120) throw new Error('invalid campaign registry entry');
    if (e.contractSet === 'v2') {
      if (!contractAddress(e.tokenContractId) || !contractAddress(e.offeringContractId)) throw new Error('invalid campaign registry entry');
      if (e.tokenContractId === e.offeringContractId) throw new Error('invalid campaign registry entry');
      if (contracts.has(e.tokenContractId) || contracts.has(e.offeringContractId)) throw new Error('duplicate campaign registry entry');
      contracts.add(e.tokenContractId);
      contracts.add(e.offeringContractId);
    } else {
      if (!contractAddress(e.contractId)) throw new Error('invalid campaign registry entry');
      if (contracts.has(e.contractId)) throw new Error('duplicate campaign registry entry');
      contracts.add(e.contractId);
    }
    if (ids.has(e.id)) throw new Error('duplicate campaign registry entry');
    ids.add(e.id);
  }
  return values;
}
// Registered campaigns for the contributor backfill job: id + contractId
// only, from the same validated registry the build/submit paths use.
// Throws (testnet guard, invalid registry) like every other reader; the
// caller treats that as "backfill unavailable" and moves nothing.
export function sorobanRegisteredCampaigns(): { id: string; contractId: string }[] {
  // v1 only: the contributor backfill job reads v1 crowdfund contribution
  // events; v2 offering events have no backfill consumer yet.
  return v1Entries().map((e) => ({ id: e.id, contractId: e.contractId }));
}
// Contracts the verbatim event archive must cover: v1 crowdfund contracts
// under the bare campaign id, plus every v2 contract-set member under its own
// `${id}:token` / `${id}:offering` key so each contract's checkpoint and
// events are tracked independently (deletion-history coverage needs both).
// Same validation/throw behavior as every other registry reader.
export function sorobanArchiveTargets(): { id: string; contractId: string }[] {
  return entries().flatMap((e) =>
    isV2Entry(e)
      ? [
          { id: `${e.id}:token`, contractId: e.tokenContractId },
          { id: `${e.id}:offering`, contractId: e.offeringContractId },
        ]
      : [{ id: e.id, contractId: e.contractId }],
  );
}
// Validated registry read without any RPC call. Returns null for unknown
// ids; throws on the same registry validation as every other reader.
export function sorobanRegistryEntry(id: string): RegistryEntry | null {
  return entries().find((e) => e.id === id) ?? null;
}
// v1 crowdfund entries only. v1 readers (listing, backfill, lifecycle,
// build/submit) must never silently treat a v2 pair as a crowdfund
// contract, so they all read through this filter.
function v1Entries(): V1Entry[] {
  return entries().filter((e): e is V1Entry => !isV2Entry(e));
}

const entry = (id: string): V1Entry => {
  const e = entries().find((e) => e.id === id);
  if (!e) throw new Error('campaign not registered; deployment and registration are separate operator steps');
  if (isV2Entry(e)) throw new Error('campaign uses the v2 contract set; this v1 crowdfund path does not apply');
  return e;
};
function actorAddress(actor: string): Address {
  const addr = Address.fromString(actor);
  if (!actor.startsWith('G')) throw new Error('ordinary wallet account required');
  return addr;
}
// Inverse of amountUnits: 7-decimal base units to a trimmed decimal string.
export function unitsToAmount(units: bigint): string {
  const whole = units / 10000000n;
  const fraction = (units % 10000000n).toString().padStart(7, '0').replace(/0+$/, '');
  return `${whole.toString()}${fraction ? `.${fraction}` : ''}`;
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
// Per-request code-integrity check without the full Wasm download. The
// contract instance ledger entry carries the live wasm hash, and that hash
// IS the sha256 of the deployed code, so comparing it against the pinned
// reviewed hash is exactly the check getContractWasmByContractId + local
// sha256 performed - a small entry read instead of a full code download
// (the dominant per-campaign cost of listing and read endpoints). The read
// is live on every call: no cached verdict, no TTL, and an upgraded,
// replaced or archived contract fails closed exactly as before.
type LedgerEntryLike = { key?: xdr.LedgerKey; val: xdr.LedgerEntryData };

// Shared refusal checks for a fetched crowdfund instance entry: archived or
// missing state, wrong entry kind, non-Wasm executable and any code other
// than the pinned reviewed hash all fail closed, exactly as the simulation
// read path refused them.
function assertReviewedInstance(found: LedgerEntryLike | undefined): xdr.ScContractInstance {
  if (!found) throw new Error('contract state archived; operator restoration required');
  const data = found.val;
  if (data.type !== 'contractData') throw new Error('contract instance entry missing; refusing');
  const instance = data.value.val;
  if (instance.type !== 'scvContractInstance') throw new Error('contract instance entry malformed; refusing');
  const executable = instance.instance.executable;
  if (executable.type !== 'contractExecutableWasm') throw new Error('contract is not Wasm-executable; refusing');
  if (Buffer.from(executable.wasmHash.value).toString('hex') !== WASM_HASH) throw new Error('contract code does not match reviewed crowdfund Wasm; refusing');
  return instance.instance;
}

async function verifyCode(client: rpc.Server, e: V1Entry): Promise<void> {
  const response = await client.getLedgerEntries(new Contract(e.contractId).getFootprint());
  assertReviewedInstance(response.entries[0]);
}

// Config, Raised and Withdrawn live in instance storage inside the SAME
// ledger entry the code check already reads (contract source: storage()
// .instance().set in constructor/contribute/withdraw). Reading them there is
// the value the view functions return: get_config / total_raised /
// is_withdrawn are pure getters over exactly these keys. Defaults replicate
// the contract's own unwrap_or: missing Raised reads 0, missing Withdrawn
// reads false. A missing Config is the contract's Error(Contract, #2)
// NotInitialized: it fails the read, never defaults.
function campaignInstanceFields(found: LedgerEntryLike | undefined): { config: any; raised: any; withdrawn: any } {
  const instance = assertReviewedInstance(found);
  let config: unknown;
  let raised: unknown = 0n;
  let withdrawn: unknown = false;
  for (const entry of instance.storage ?? []) {
    // contracttype unit variants serialize as vec![symbol "Name"], matching
    // the tuple variant Balance(Address) = vec![symbol, address].
    const name = scValToNative(entry.key);
    const tag = Array.isArray(name) ? name[0] : name;
    if (tag === 'Config') config = scValToNative(entry.val);
    else if (tag === 'Raised') raised = scValToNative(entry.val);
    else if (tag === 'Withdrawn') withdrawn = scValToNative(entry.val);
  }
  if (config === undefined) throw new Error('contract read failed: Error(Contract, #2)');
  return { config, raised, withdrawn };
}

// Persistent per-contributor balance key, matching DataKey::Balance(Address)
// = vec![symbol "Balance", address] under PERSISTENT durability.
function balanceLedgerKey(contractId: string, actor: string): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: new Contract(contractId).address().toScAddress(),
      key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Balance'), actorAddress(actor).toScVal()]),
      durability: xdr.ContractDataDurability.persistent,
    }),
  );
}

// Batched entry fetch, chunked so a large registry stays inside RPC key
// limits. Entries are matched back by their key XDR: response order is never
// assumed. Every entry is read live in this request; nothing is cached.
const LEDGER_ENTRY_CHUNK = 100;
async function ledgerEntriesByKey(client: rpc.Server, keys: xdr.LedgerKey[]): Promise<Map<string, LedgerEntryLike>> {
  const out = new Map<string, LedgerEntryLike>();
  for (let i = 0; i < keys.length; i += LEDGER_ENTRY_CHUNK) {
    const response = await client.getLedgerEntries(...(keys.slice(i, i + LEDGER_ENTRY_CHUNK) as [xdr.LedgerKey, ...xdr.LedgerKey[]]));
    for (const entry of response.entries ?? []) {
      if (entry.key) out.set(entry.key.toXDR('base64'), entry);
    }
  }
  return out;
}
async function viewContract(client: rpc.Server, contractId: string, method: string, args: any[] = [], actor?: string): Promise<any> {
  // Simulation only: this dummy account is never submitted or funded.
  const source = actor ?? Keypair.fromRawEd25519Seed(Buffer.alloc(32, 1)).publicKey();
  const tx = new TransactionBuilder(new Account(source, '0'), { fee: '100', networkPassphrase: passphrase })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(900)
    .build();
  const result = await client.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) throw new Error(`contract read failed: ${result.error}`);
  if (rpc.Api.isSimulationRestore(result)) throw new Error('contract state archived; operator restoration required');
  if (!result.result) throw new Error('contract read missing result');
  return scValToNative(result.result.retval);
}
async function view(client: rpc.Server, e: V1Entry, method: string, args: any[] = [], actor?: string): Promise<any> {
  return viewContract(client, e.contractId, method, args, actor);
}
// v1 listing only: v2 contract-set campaigns are excluded until a v2
// listing view exists; a v2 entry must never be read as a v1 crowdfund.
export async function sorobanCampaigns(actor?: string): Promise<any[]> {
  if (actor) actorAddress(actor);
  const client = sorobanDeps.client();
  const entries = v1Entries();
  // One batched entry read covers every campaign instance (code check plus
  // Config/Raised/Withdrawn from instance storage) and every requested
  // contributor balance key, instead of five RPC round trips per campaign.
  // Every value is still fresh chain state read during this request - one
  // batched snapshot for the instances, possibly a different ledger than a
  // simulation fallback for a missing balance entry, exactly as individual
  // reads were never one atomic snapshot. No cached display data
  // participates in invest/refund or reconciliation decisions.
  const instanceKeys = entries.map((e) => new Contract(e.contractId).getFootprint());
  const balanceKeys = actor ? entries.map((e) => balanceLedgerKey(e.contractId, actor)) : [];
  const fetched = await ledgerEntriesByKey(client, [...instanceKeys, ...balanceKeys]);
  const indexByEntry = new Map(entries.map((e, i) => [e, i] as const));
  return mapLimit(entries, 3, async (e) => {
    const i = indexByEntry.get(e)!;
    const { config, raised, withdrawn } = campaignInstanceFields(fetched.get(instanceKeys[i].toXDR('base64')));
    if (config.token !== expectedToken()) throw new Error('campaign asset does not match configured testnet USDC');
    // A balance entry present in the response is live by definition and used
    // directly. A MISSING entry is ambiguous - never-contributed zero versus
    // archived state - so it falls back to the simulation, which still
    // distinguishes an archived balance (restore error) from a real zero,
    // exactly as before.
    let balance = null;
    if (actor) {
      const bEntry = fetched.get(balanceKeys[i].toXDR('base64'));
      // Anything but a plain contract-data entry falls back to simulation
      // rather than trusting an unexpected shape.
      balance =
        bEntry && bEntry.val.type === 'contractData'
          ? scValToNative(bEntry.val.value.val)
          : await view(client, e, 'balance_of', [actorAddress(actor).toScVal()], actor);
    }
    return jsonValue({ ...e, mode: 'soroban', config, raised, withdrawn, balance, network: 'testnet', productionEligible: false });
  });
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
async function recordStatus(hash: string, status: string, confirmedAmount?: string): Promise<void> {
  return guarded(async () => {
    const store = await readStore();
    const intent = store.intents.find((i) => i.hash === hash);
    if (!intent) throw new Error('signed intent not found');
    intent.status = status;
    // Forward capture only: set once from the confirmed transfer event, never
    // overwritten, never derived from the build-time amount.
    if (confirmedAmount !== undefined && status === 'SUCCESS' && intent.confirmedAmount === undefined) intent.confirmedAmount = confirmedAmount;
    await save(store);
  });
}
export type ConfirmedTransfer = { from: string; to: string; asset: string; units: bigint };
// Token transfer events (SEP-41 shape: topics [transfer, from, to, asset?],
// data i128 amount) from a confirmed getTransaction result. Anything that is
// not a well-formed transfer is ignored; no events means an empty list.
export function transferEventsFromResult(result: unknown): ConfirmedTransfer[] {
  const groups = (result as { events?: { contractEventsXdr?: unknown[] } })?.events?.contractEventsXdr;
  if (!Array.isArray(groups)) return [];
  const out: ConfirmedTransfer[] = [];
  for (const e of groups.flat() as any[]) {
    try {
      const v0 = e?.body?.v0;
      if (!v0) continue;
      const topics = (v0.topics as unknown[]).map((t) => scValToNative(t as never));
      if (topics[0] !== 'transfer' || typeof topics[1] !== 'string' || typeof topics[2] !== 'string') continue;
      const amount = scValToNative(v0.data as never);
      if (typeof amount !== 'bigint' || amount <= 0n) continue;
      out.push({ from: topics[1], to: topics[2], asset: typeof topics[3] === 'string' ? topics[3] : '', units: amount });
    } catch {
      continue;
    }
  }
  return out;
}
// The amount the CONFIRMED transaction actually moved for this wallet: for a
// contribute the transfer wallet -> campaign contract, for a refund the
// transfer campaign contract -> wallet. Exactly one matching transfer is
// required; zero or several means undeterminable (undefined, i.e. UNKNOWN).
export function confirmedAmountFromResult(result: unknown, action: string, actor: string, campaignContract: string): string | undefined {
  if (action !== 'contribute' && action !== 'refund') return undefined;
  const m = transferEventsFromResult(result).filter((t) =>
    action === 'contribute' ? t.from === actor && t.to === campaignContract : t.from === campaignContract && t.to === actor,
  );
  return m.length === 1 ? unitsToAmount(m[0].units) : undefined;
}
// Funding state for one registered campaign, for the post-funding report
// publish gate: reads the same on-chain views as the campaign listing
// (code hash verified, configured asset checked) so a report can only be
// published for a campaign whose funding period has actually ended. Returns
// null for an unregistered campaign id; throws on RPC/verification failure
// so callers fail closed instead of guessing lifecycle.
export async function sorobanCampaignFundingState(
  id: string,
): Promise<{ id: string; goal: string; raised: string; deadlineSeconds: number; withdrawn: boolean } | null> {
  const e = entries().find((x) => x.id === id);
  if (!e) return null;
  if (isV2Entry(e)) throw new Error('v2 contract-set campaigns have no v1 funding-state view');
  const client = sorobanDeps.client();
  const [, config, raised, withdrawn] = await Promise.all([
    verifyCode(client, e),
    view(client, e, 'get_config'),
    view(client, e, 'total_raised'),
    view(client, e, 'is_withdrawn'),
  ]);
  if (config.token !== expectedToken()) throw new Error('campaign asset does not match configured testnet USDC');
  const raw = Number(config.deadline);
  // Contracts store the deadline in unix seconds; tolerate a millisecond value.
  const deadlineSeconds = raw > 1e12 ? Math.floor(raw / 1000) : raw;
  return { id, goal: String(config.goal), raised: String(raised), deadlineSeconds, withdrawn: Boolean(withdrawn) };
}

// Investor entitlement for post-funding report reads: whether the wallet
// holds a contribution balance in the campaign contract. Same code-hash and
// asset verification as the campaign listing. registered=false means the
// campaign id is not in the registry; throws on RPC/verification failure so
// readers fail closed rather than fall back to public access.
export async function sorobanInvestorEntitlement(id: string, actor: string): Promise<{ registered: boolean; balanceUnits: bigint }> {
  actorAddress(actor);
  const e = entries().find((x) => x.id === id);
  if (!e || isV2Entry(e)) return { registered: false, balanceUnits: 0n };
  const client = sorobanDeps.client();
  const [, config, balance] = await Promise.all([
    verifyCode(client, e),
    view(client, e, 'get_config'),
    view(client, e, 'balance_of', [actorAddress(actor).toScVal()], actor),
  ]);
  if (config.token !== expectedToken()) throw new Error('campaign asset does not match configured testnet USDC');
  return { registered: true, balanceUnits: BigInt(balance ?? 0) };
}

// Network-only derivation of a confirmed contribution: the RPC-confirmed
// transaction envelope itself must carry exactly one invokeContract call to
// a REGISTERED campaign contract, function 'contribute', whose contributor
// argument is the envelope source account, and the contract's code hash and
// configured asset must verify. No journal fields are consulted, so this
// works even after the journal prunes the row. Throws when nothing can be
// confirmed right now (RPC outage, missing envelope, archived state) so the
// caller preserves the proof and retries; returns null when the hash is
// definitively not a confirmed contribution to a registered campaign.
export async function deriveContributionFromNetwork(hash: string): Promise<{ campaignId: string; contributor: string } | null> {
  const client = sorobanDeps.client();
  const result = await client.getTransaction(hash);
  if (result.txHash !== hash) throw new Error('RPC returned mismatched hash');
  if (result.status !== 'SUCCESS') throw new Error(`network confirmation unavailable for ${hash} (status ${result.status})`);
  const envXdr: any = (result as any).envelopeXdr;
  if (!envXdr) throw new Error('RPC response carries no transaction envelope; cannot derive contribution facts');
  let tx: Transaction;
  try {
    const parsed = TransactionBuilder.fromXDR(typeof envXdr === 'string' ? envXdr : envXdr.toXDR('base64'), passphrase);
    if (!(parsed instanceof Transaction)) return null;
    tx = parsed;
  } catch {
    throw new Error('could not parse the network-confirmed envelope');
  }
  if (Buffer.from(tx.hash()).toString('hex') !== hash) throw new Error('network envelope hash mismatch');
  if (tx.operations.length !== 1) return null;
  let contractId = '';
  let fnName = '';
  let contributor = '';
  try {
    const ic = (tx.operations[0] as any).func.invokeContract;
    if (ic?.contractAddress?.type === 'scAddressTypeContract' && ic.contractAddress.contractId?.value) {
      contractId = StrKey.encodeContract(Buffer.from(ic.contractAddress.contractId.value));
    }
    fnName = ic?.functionName?.toString?.() ?? '';
    contributor = String(scValToNative(ic?.args?.[0]) ?? '');
  } catch {
    return null;
  }
  const e = v1Entries().find((x) => x.contractId === contractId);
  if (!e || fnName !== 'contribute' || contributor !== tx.source) return null;
  await verifyCode(client, e);
  const config = await view(client, e, 'get_config');
  if (config.token !== expectedToken()) throw new Error('campaign asset does not match configured testnet USDC');
  return { campaignId: e.id, contributor };
}

// Journal-candidate path: the journal supplies candidate hashes (its row
// fields originate from the build request and are never trusted), then the
// network derivation above is authoritative for the registry write.
export async function confirmedContribution(hash: string): Promise<{ campaignId: string; contributor: string } | null> {
  const store = await readStore();
  const intent = store.intents.find((i) => i.hash === hash);
  if (!intent || intent.status !== 'SUCCESS' || intent.action !== 'contribute') return null;
  return deriveContributionFromNetwork(hash);
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
  const account = await client.getAccount(input.actor).catch((e: unknown) => {
    if (/account not found/i.test(e instanceof Error ? e.message : String(e))) {
      const err = new Error('Transaction preparation failed: wallet account does not exist on testnet.');
      (err as Error & { code?: string }).code = 'SIM_ACCOUNT_MISSING';
      throw err;
    }
    throw e;
  });
  // A refund returns the wallet's whole escrowed balance, so the journal
  // (and the share register built from it) records that amount, read from
  // the contract at build time. A client-supplied amount is never trusted
  // for refunds. Zero or unreadable stays unrecorded and is disclosed by the
  // register as "intents without amount".
  let refundAmount: string | undefined;
  if (input.action === 'refund') {
    try {
      const bal = await view(client, e, 'balance_of', [actor.toScVal()], input.actor);
      if (typeof bal === 'bigint' && bal > 0n) refundAmount = unitsToAmount(bal);
    } catch {
      refundAmount = undefined;
    }
  }
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
    store.intents.push({
      hash,
      campaign: id,
      actor: input.actor,
      action: input.action,
      amount: input.action === 'refund' ? refundAmount : input.amount,
      xdr: prepared.toXDR(),
      status: 'BUILT',
    });
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
  const campaign = v1Entries().find((e) => e.contractId === contractId)?.id ?? null;
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
  const store = await readSummaryStore();
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

// Account payout history: the wallet's COMPLETED money-back events only
// (refunds to the contributor, withdrawals by the campaign creator), from
// the platform journal. Contribution records are positions, not payouts;
// return distributions do not exist in this prototype, so they are never
// fabricated here. Only terminal-SUCCESS intents are listed: a prepared or
// failed refund is not a payout.
export async function accountPayouts(actor: string): Promise<any[]> {
  guard();
  actorAddress(actor);
  const store = await readSummaryStore();
  return store.intents
    .filter((i) => i.actor === actor && (i.action === 'refund' || i.action === 'withdraw') && i.status === 'SUCCESS')
    .sort((a, b) => (Date.parse(b.updatedAt ?? b.createdAt ?? '') || 0) - (Date.parse(a.updatedAt ?? a.createdAt ?? '') || 0))
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
  // A terminal intent's signed envelope is scrubbed by the journal's retention
  // policy (purgeTerminalEnvelopes); the terminal status is the durable proof
  // and must remain readable. Check it BEFORE requiring a signed envelope.
  if (intent && TERMINAL.includes(intent.status)) return { hash, status: intent.status, confirmed: intent.status === 'SUCCESS' };
  if (!intent || !intent.signedXdr) throw new Error(quarantinedHash(store, hash) ?? 'signed intent not found');
  const result = await sorobanDeps.client().getTransaction(hash);
  if (result.txHash !== hash) throw new Error('RPC returned mismatched hash');
  // NOT_FOUND is not failure. RPC has bounded history. No new intent,
  // reservation release, expiry inference, or automatic replacement.
  if ((result.status === 'SUCCESS' || result.status === 'FAILED') && (!Number.isSafeInteger(result.ledger) || result.ledger <= 0))
    throw new Error('RPC result missing conclusive ledger');
  // Phase 2 (journal lock): persist a terminal outcome, with the amount the
  // confirmed transfer event shows (v1 campaigns; UNKNOWN when not exactly one).
  if (result.status === 'SUCCESS' || result.status === 'FAILED') {
    const v1 = result.status === 'SUCCESS' ? v1Entries().find((e) => e.id === intent.campaign) : undefined;
    const confirmed = v1 ? confirmedAmountFromResult(result, intent.action, intent.actor, v1.contractId) : undefined;
    await recordStatus(hash, result.status, confirmed);
  }
  return { hash, status: result.status, confirmed: result.status === 'SUCCESS', held: result.status === 'NOT_FOUND' };
}

// --- Campaign deployment (operator-prepared, wallet-signed) ---
// buildCampaignDeploy prepares the unsigned deployment transactions for the
// reviewed crowdfund contract. Two steps, each one single-operation Soroban
// transaction (the SDK assembles single-host-function transactions only):
//   1. 'upload'  - upload the reviewed crowdfund Wasm, skipped automatically
//      once the exact reviewed Wasm hash already exists on the ledger;
//   2. 'create'  - create a campaign instance whose constructor args mirror
//      the campaign-builder preview (creator, token, goal, deadline).
// The operator's OWN wallet is source account, pays the testnet fees and
// authorises the constructor; no server-held key ever signs.
// submitCampaignDeploy broadcasts the signed envelope and polls to a
// terminal status. For 'create' it extracts the created contract id from the
// transaction meta, verifies the deployed code hash against the reviewed
// Wasm pin, and returns a registry entry for the operator to add to
// SOROBAN_CAMPAIGNS_JSON. The server never edits the registry itself:
// listing a new campaign stays an explicit operator configuration step.
const REVIEWED_WASM_URL = new URL('../wasm/reviewed-crowdfund.wasm', import.meta.url);
let reviewedWasmCache: Buffer | null = null;
function loadReviewedWasm(): Buffer {
  if (reviewedWasmCache) return reviewedWasmCache;
  let wasm: Buffer;
  try {
    wasm = readFileSync(REVIEWED_WASM_URL);
  } catch {
    throw new Error('reviewed crowdfund Wasm is not packaged on this deployment');
  }
  if (createHash('sha256').update(wasm).digest('hex') !== WASM_HASH)
    throw new Error('packaged crowdfund Wasm does not match the reviewed hash; refusing to prepare deployment');
  reviewedWasmCache = wasm;
  return wasm;
}
// True when the exact reviewed Wasm hash already exists on the ledger, so
// the upload step can be skipped. RPC failure fails closed to 'not
// uploaded': a redundant upload is harmless, a skipped upload is not.
async function reviewedWasmOnLedger(client: rpc.Server, wasmHash: Buffer): Promise<boolean> {
  try {
    const wasm = await client.getContractWasmByHash(wasmHash);
    return createHash('sha256').update(wasm).digest('hex') === WASM_HASH;
  } catch {
    return false;
  }
}
export async function buildCampaignDeploy(input: { actor: string; id: string; name: string; goal: string; deadline: number }): Promise<any> {
  guard();
  const actor = actorAddress(input.actor);
  if (process.env.SOROBAN_RECOVERY_MODE === 'true')
    throw new Error(
      'recovery mode: journal was restored from backup and is not yet reconciled; new transactions are disabled until an operator completes reconciliation and disables SOROBAN_RECOVERY_MODE',
    );
  if (!/^[a-zA-Z0-9_-]{1,48}$/.test(input.id)) throw new Error('invalid campaign id');
  if (typeof input.name !== 'string' || input.name.length === 0 || input.name.length > 120) throw new Error('invalid campaign name');
  if (entries().some((e) => e.id === input.id)) throw new Error('campaign id is already registered');
  const goalUnits = amountUnits(input.goal);
  const deadline = Math.floor(input.deadline);
  if (!Number.isSafeInteger(deadline) || deadline <= Math.floor(Date.now() / 1000)) throw new Error('deadline must be in the future');
  await rateLimit('build', input.actor);
  const wasm = loadReviewedWasm();
  const wasmHash = createHash('sha256').update(wasm).digest();
  const client = sorobanDeps.client();
  const step = (await reviewedWasmOnLedger(client, wasmHash)) ? 'create' : 'upload';
  const account = await client.getAccount(input.actor).catch((e: unknown) => {
    if (/account not found/i.test(e instanceof Error ? e.message : String(e))) {
      const err = new Error('Transaction preparation failed: wallet account does not exist on testnet.');
      (err as Error & { code?: string }).code = 'SIM_ACCOUNT_MISSING';
      throw err;
    }
    throw e;
  });
  const operation =
    step === 'upload'
      ? Operation.uploadContractWasm({ wasm })
      : Operation.createCustomContract({
          address: actor,
          wasmHash,
          salt: randomBytes(32),
          constructorArgs: [
            actor.toScVal(),
            Address.fromString(expectedToken()).toScVal(),
            nativeToScVal(goalUnits, { type: 'i128' }),
            nativeToScVal(deadline, { type: 'u64' }),
          ],
        });
  const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: passphrase }).addOperation(operation).setTimeout(900).build();
  const simulation = await client.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) {
    console.warn('soroban deploy simulation failed:', simulation.error ?? '');
    const err = new Error('Transaction preparation failed: the network rejected the transaction simulation.');
    (err as Error & { code?: string }).code = 'SIM_REJECTED';
    throw err;
  }
  if (rpc.Api.isSimulationRestore(simulation)) throw new Error('state restoration required; operator must restore before signing');
  if (simulation.result?.auth.some((a) => a.credentials.type !== 'sorobanCredentialsSourceAccount'))
    throw new Error('separate address authorization is unsupported');
  const prepared = rpc.assembleTransaction(tx, simulation).build();
  const op = prepared.operations[0] as any;
  if (op.auth?.some((a: any) => a.credentials.type !== 'sorobanCredentialsSourceAccount')) throw new Error('separate address authorization is unsupported');
  const hash = Buffer.from(prepared.hash()).toString('hex');
  await guarded(async () => {
    const store = await readStore();
    quarantineHold(store);
    const unresolved = store.intents.find((i) => i.actor === input.actor && i.signedXdr && !TERMINAL.includes(i.status));
    if (unresolved) throw new Error(`prior signed intent ${unresolved.hash} is unresolved; check/retry exact hash, do not build a replacement`);
    const open = openIntents(store, input.actor);
    if (open.length >= openIntentCap()) throw new Error(`too many open intents (${open.length}); resolve signed intents or let unsigned ones expire`);
    store.intents.push({ hash, campaign: input.id, actor: input.actor, action: `deploy-${step}`, xdr: prepared.toXDR(), status: 'BUILT' });
    await save(store);
  });
  return {
    hash,
    xdr: prepared.toXDR(),
    networkPassphrase: passphrase,
    action: 'deploy',
    step,
    id: input.id,
    name: input.name,
    feeStroops: prepared.fee,
    testOnly: true,
  };
}
// Poll the RPC for a terminal status, then extract the created contract id
// from the transaction meta and verify the deployed code against the
// reviewed Wasm pin before a registry entry is returned. Bounded polling:
// a still-pending deployment is reported, never guessed.
// Created contract ids from the transaction meta: the RPC does not always
// populate returnValue for createContract operations (observed on testnet,
// where SUCCESS create txs return no returnValue), so the created contract
// instance is recovered from the meta's created contractData entries. Upload
// transactions create contractCode, not an instance, and yield nothing here.
// Plain-object shape: change arm created, ledger-entry data type 6
// (contractData), ScVal key type 20 (ledgerKeyContractInstance).
export function createdContractIdsFromMeta(resultMetaXdr: unknown): string[] {
  if (!resultMetaXdr) return [];
  let plain: unknown;
  try {
    // The typed RPC response carries an already-parsed TransactionMeta; a raw
    // JSON-RPC payload carries the base64 XDR string. Accept both.
    plain =
      typeof resultMetaXdr === 'string'
        ? (xdr.TransactionMeta.fromXDR(resultMetaXdr, 'base64') as any).toXdrObject()
        : typeof (resultMetaXdr as { toXdrObject?: unknown })?.toXdrObject === 'function'
          ? (resultMetaXdr as { toXdrObject: () => unknown }).toXdrObject()
          : resultMetaXdr;
  } catch {
    return [];
  }
  const out: string[] = [];
  const visit = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const data = node.created?.data;
    if (data?.type === 6 && data.contractData?.key?.type === 20) {
      const raw = data.contractData.contract?.contractId;
      const bytes = typeof raw === 'string' ? Buffer.from(raw, 'hex') : raw ? Buffer.from(Object.values(raw) as number[]) : null;
      if (bytes && bytes.length === 32) {
        out.push(StrKey.encodeContract(bytes));
        return;
      }
    }
    for (const v of Object.values(node)) visit(v);
  };
  visit(plain);
  return [...new Set(out)];
}
async function awaitDeployResult(hash: string): Promise<{ status: string; contractId: string | null }> {
  const client = sorobanDeps.client();
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = await client.getTransaction(hash);
    if (result.txHash !== hash) throw new Error('RPC returned mismatched transaction hash');
    if (result.status === 'SUCCESS' || result.status === 'FAILED') {
      if (!Number.isSafeInteger(result.ledger) || result.ledger <= 0) throw new Error('RPC result missing conclusive ledger');
      if (result.status === 'FAILED') return { status: 'FAILED', contractId: null };
      const rv = result.returnValue;
      if (rv) {
        try {
          const contractId = Address.fromScVal(rv).toString();
          if (contractId.startsWith('C')) return { status: 'SUCCESS', contractId };
        } catch {
          // Not an address (e.g. an upload's Wasm hash bytes): fall through
          // to the transaction meta below.
        }
      }
      const fromMeta = createdContractIdsFromMeta((result as { resultMetaXdr?: unknown }).resultMetaXdr);
      if (fromMeta.length === 1) return { status: 'SUCCESS', contractId: fromMeta[0] };
      if (fromMeta.length > 1) throw new Error(`ambiguous contract id in transaction meta for ${hash}; reconcile the exact hash manually`);
      return { status: 'SUCCESS', contractId: null };
    }
    await new Promise((r) => setTimeout(r, Number(process.env.SOROBAN_DEPLOY_POLL_MS ?? '1000')));
  }
  return { status: 'PENDING', contractId: null };
}
// Record a successfully deployed contract in the durable creation manifest
// (the deletion-history coverage checker's independent creation-ledger
// grounding). Best-effort beside the deploy confirmation: a recording
// failure is logged, never fails the deploy, and deletion evidence stays
// fail-closed without the record. Dynamic import avoids a module cycle
// (deployment-manifest reuses createdContractIdsFromMeta from this module).
async function recordContractCreation(hash: string, campaignId: string): Promise<void> {
  try {
    const { deploymentManifestBackend, recordCreationFromTransaction } = await import('./deployment-manifest.js');
    await recordCreationFromTransaction({
      client: sorobanDeps.client(),
      hash,
      campaignId,
      networkPassphrase: passphrase,
      store: await deploymentManifestBackend(),
    });
  } catch (err) {
    console.error('deployment manifest record failed:', campaignId, err instanceof Error ? err.message : err);
  }
}
export async function submitCampaignDeploy(input: { actor: string; xdr: string; name?: string }): Promise<any> {
  guard();
  actorAddress(input.actor);
  const displayName = typeof input.name === 'string' && input.name.length > 0 && input.name.length <= 120 ? input.name : null;
  if (input.name !== undefined && displayName === null) throw new Error('invalid campaign name');
  const tx = verifySignedTx(input.actor, input.xdr);
  const hash = Buffer.from(tx.hash()).toString('hex');
  const phase = await guarded(async () => {
    const store = await readStore();
    const intent = store.intents.find((i) => i.hash === hash && i.actor === input.actor && (i.action === 'deploy-upload' || i.action === 'deploy-create'));
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
  });
  if (!phase.terminal) {
    const store = await readStore();
    const intent = store.intents.find((i) => i.hash === hash)!;
    const sendTx = TransactionBuilder.fromXDR(intent.signedXdr!, passphrase) as Transaction;
    try {
      const result = await sorobanDeps.client().sendTransaction(sendTx);
      if (result.hash !== hash) throw new Error('RPC returned mismatched transaction hash');
      const status = result.status === 'ERROR' ? 'UNKNOWN' : result.status;
      await recordStatus(hash, status);
    } catch (err) {
      await recordStatus(hash, 'UNKNOWN');
      throw err;
    }
  }
  const outcome = await awaitDeployResult(hash);
  await recordStatus(hash, outcome.status);
  if (outcome.status === 'FAILED') throw new Error(`deployment transaction failed on-chain (hash ${hash}); no campaign was created`);
  const intent = (await readStore()).intents.find((i) => i.hash === hash)!;
  const step = intent.action === 'deploy-upload' ? 'upload' : 'create';
  if (!outcome.contractId) {
    if (step === 'upload' && outcome.status === 'SUCCESS')
      return {
        hash,
        status: 'SUCCESS',
        confirmed: true,
        step,
        message: 'Reviewed contract code uploaded; build again to create the campaign instance.',
        testOnly: true,
      };
    return { hash, status: outcome.status, confirmed: false, step, message: 'Submission is not confirmation. Check the hash before another action.' };
  }
  // Fail closed on the created instance itself: the registry entry is only
  // returned when the deployed code IS the reviewed crowdfund contract.
  const deployedWasm = await sorobanDeps.client().getContractWasmByContractId(outcome.contractId);
  if (createHash('sha256').update(deployedWasm).digest('hex') !== WASM_HASH)
    throw new Error('deployed contract code does not match the reviewed crowdfund Wasm; refusing to produce a registry entry');
  await recordContractCreation(hash, intent.campaign);
  return {
    hash,
    status: 'SUCCESS',
    confirmed: true,
    step,
    contractId: outcome.contractId,
    registryEntry: { id: intent.campaign, name: displayName ?? intent.campaign, contractId: outcome.contractId },
    note: 'Add registryEntry to SOROBAN_CAMPAIGNS_JSON to list the campaign; the server never edits the registry itself.',
    testOnly: true,
  };
}

// --- v2 contract-set deployment (share-token + offering, wired) ---
// The campaign builder's v2 path deploys the two v2 scaffolds merged in
// PRs #76/#77 as a wired set, in up to five single-operation steps (SDK v17
// assembles single-host-function transactions only):
//   1. deploy-v2-upload-token     upload the share-token Wasm (skipped when
//                                 the exact pinned hash is on the ledger)
//   2. deploy-v2-upload-offering  upload the offering Wasm (same skip rule)
//   3. deploy-v2-create-token     create the share-token instance
//                                 (admin = operator wallet)
//   4. deploy-v2-create-offering  create the offering instance configured
//                                 with the created token address
//   5. deploy-v2-set-minter       designate the offering as the token's
//                                 minter, completing the wiring
// Progress is derived from the journaled intents themselves (SUCCESS rows
// carry the created contract ids); no separate session collection exists.
// The pins below are build-integrity pins of the merged scaffolds built with
// the repo toolchain - they pin exactly what was built and reviewed in-repo.
// They are NOT an external security review: the v2 contracts are demo-grade
// testnet scaffolds and the registry entry below says so.
const V2_SHARE_TOKEN_WASM_HASH = '3fc3d4b74f69fcfb2e0b86878b5b0f3d89a73050e6a049da4dd789dd7a27eaa1';
const V2_OFFERING_WASM_HASH = '84d254abbc46f5aaf8305734510d66123b4cc9d800992cd11c23da88eb1be622';
const V2_WASMS: Record<string, { url: URL; hash: string; cache: Buffer | null }> = {
  token: {
    url: new URL('../wasm/v2-share-token.wasm', import.meta.url),
    hash: V2_SHARE_TOKEN_WASM_HASH,
    cache: null,
  },
  offering: {
    url: new URL('../wasm/v2-offering.wasm', import.meta.url),
    hash: V2_OFFERING_WASM_HASH,
    cache: null,
  },
};
function loadV2Wasm(kind: 'token' | 'offering'): Buffer {
  const entry = V2_WASMS[kind];
  if (entry.cache) return entry.cache;
  let wasm: Buffer;
  try {
    wasm = readFileSync(entry.url);
  } catch {
    throw new Error(`v2 ${kind} Wasm is not packaged on this deployment`);
  }
  if (createHash('sha256').update(wasm).digest('hex') !== entry.hash)
    throw new Error(`packaged v2 ${kind} Wasm does not match its pin; refusing to prepare deployment`);
  entry.cache = wasm;
  return wasm;
}
async function v2WasmOnLedger(client: rpc.Server, kind: 'token' | 'offering'): Promise<boolean> {
  const entry = V2_WASMS[kind];
  try {
    const wasm = await client.getContractWasmByHash(Buffer.from(entry.hash, 'hex'));
    return createHash('sha256').update(wasm).digest('hex') === entry.hash;
  } catch {
    return false;
  }
}

// --- v2 on-chain position reads (share-register consumption) ---
// Holders are never enumerable on the share-token contract, so positions
// are read for app-known addresses only (contributor registry + journal
// actors, supplied by the caller). A hard cap bounds the simulation reads
// one export may issue; truncation is disclosed, never silent.
export const V2_HOLDER_READ_CAP = 500;
export type V2SharePositions = {
  campaignId: string;
  tokenContractId: string;
  offeringContractId: string;
  token: { name: string; symbol: string; decimals: number; totalSupply: string };
  offering: { token: string; issuer: string; minPerInvestor: string; maxPerInvestor: string; goal: string; deadline: string };
  holders: { publicKey: string; balance: string }[];
  holdersTruncated: boolean;
};
async function verifyV2Code(client: rpc.Server, e: V2Entry): Promise<void> {
  const [tokenWasm, offeringWasm] = await Promise.all([
    client.getContractWasmByContractId(e.tokenContractId),
    client.getContractWasmByContractId(e.offeringContractId),
  ]);
  if (createHash('sha256').update(tokenWasm).digest('hex') !== V2_SHARE_TOKEN_WASM_HASH)
    throw new Error('share-token contract code does not match the pinned v2 Wasm; refusing to read positions');
  if (createHash('sha256').update(offeringWasm).digest('hex') !== V2_OFFERING_WASM_HASH)
    throw new Error('offering contract code does not match the pinned v2 Wasm; refusing to read positions');
}
export async function readV2SharePositions(campaignId: string, holders: string[]): Promise<V2SharePositions> {
  const e = sorobanRegistryEntry(campaignId);
  if (!e) throw new Error('campaign not registered');
  if (!isV2Entry(e)) throw new Error('campaign is not a v2 contract-set entry');
  const valid = [...new Set(holders)].filter((h) => {
    try {
      return Address.fromString(h).toString().startsWith('G');
    } catch {
      return false;
    }
  });
  const queried = valid.slice(0, V2_HOLDER_READ_CAP);
  const client = sorobanDeps.client();
  await verifyV2Code(client, e);
  const [name, symbol, decimals, totalSupply, config] = await Promise.all([
    viewContract(client, e.tokenContractId, 'name'),
    viewContract(client, e.tokenContractId, 'symbol'),
    viewContract(client, e.tokenContractId, 'decimals'),
    viewContract(client, e.tokenContractId, 'total_supply'),
    viewContract(client, e.offeringContractId, 'get_config'),
  ]);
  const balances: { publicKey: string; balance: string }[] = [];
  for (const h of queried) {
    const bal = await viewContract(client, e.tokenContractId, 'balance', [Address.fromString(h).toScVal()]);
    balances.push({ publicKey: h, balance: String(bal) });
  }
  return jsonValue({
    campaignId,
    tokenContractId: e.tokenContractId,
    offeringContractId: e.offeringContractId,
    token: { name: String(name), symbol: String(symbol), decimals: Number(decimals), totalSupply: String(totalSupply) },
    offering: {
      token: String(config.token),
      issuer: String(config.issuer),
      minPerInvestor: String(config.min_per_investor),
      maxPerInvestor: String(config.max_per_investor),
      goal: String(config.goal),
      deadline: String(config.deadline),
    },
    holders: balances,
    holdersTruncated: valid.length > queried.length,
  });
}

export type V2DeployParams = { symbol: string; decimals: number; minPerInvestor: string; maxPerInvestor: string };
function validateV2Params(p: V2DeployParams): void {
  if (!/^[A-Za-z0-9]{1,12}$/.test(p.symbol)) throw new Error('invalid share-token symbol');
  if (!Number.isSafeInteger(p.decimals) || p.decimals < 0 || p.decimals > 18) throw new Error('invalid share-token decimals');
  // amountUnits already enforces a positive decimal string in i128 range.
  const min = amountUnits(p.minPerInvestor);
  const max = amountUnits(p.maxPerInvestor);
  if (max < min) throw new Error('max per investor must be at least the min');
}
// Next pending v2 step for a campaign, derived from its journaled intents.
// A FAILED step is retried by building the same step again; a SIGNED/
// broadcast step blocks via the unresolved-intent guard below, exactly like
// the v1 path.
function v2NextStep(
  campaignIntents: { action: string; status: string; contractId?: string }[],
  tokenOnLedger: boolean,
  offeringOnLedger: boolean,
): { action: string; tokenContractId?: string; offeringContractId?: string } {
  const ok = (action: string) => campaignIntents.some((i) => i.action === action && i.status === 'SUCCESS');
  const cid = (action: string) => campaignIntents.find((i) => i.action === action && i.status === 'SUCCESS')?.contractId;
  if (!ok('deploy-v2-upload-token') && !tokenOnLedger) return { action: 'deploy-v2-upload-token' };
  if (!ok('deploy-v2-upload-offering') && !offeringOnLedger) return { action: 'deploy-v2-upload-offering' };
  const tokenContractId = cid('deploy-v2-create-token');
  if (!tokenContractId) return { action: 'deploy-v2-create-token' };
  const offeringContractId = cid('deploy-v2-create-offering');
  if (!offeringContractId) return { action: 'deploy-v2-create-offering', tokenContractId };
  if (!ok('deploy-v2-set-minter')) return { action: 'deploy-v2-set-minter', tokenContractId, offeringContractId };
  return { action: 'complete', tokenContractId, offeringContractId };
}
export async function buildCampaignDeployV2(input: {
  actor: string;
  id: string;
  name: string;
  goal: string;
  deadline: number;
  v2: V2DeployParams;
}): Promise<any> {
  guard();
  const actor = actorAddress(input.actor);
  if (process.env.SOROBAN_RECOVERY_MODE === 'true')
    throw new Error(
      'recovery mode: journal was restored from backup and is not yet reconciled; new transactions are disabled until an operator completes reconciliation and disables SOROBAN_RECOVERY_MODE',
    );
  if (!/^[a-zA-Z0-9_-]{1,48}$/.test(input.id)) throw new Error('invalid campaign id');
  if (typeof input.name !== 'string' || input.name.length === 0 || input.name.length > 120) throw new Error('invalid campaign name');
  if (entries().some((e) => e.id === input.id)) throw new Error('campaign id is already registered');
  const goalUnits = amountUnits(input.goal);
  const deadline = Math.floor(input.deadline);
  if (!Number.isSafeInteger(deadline) || deadline <= Math.floor(Date.now() / 1000)) throw new Error('deadline must be in the future');
  validateV2Params(input.v2);
  await rateLimit('build', input.actor);
  const client = sorobanDeps.client();
  const [tokenOnLedger, offeringOnLedger] = await Promise.all([v2WasmOnLedger(client, 'token'), v2WasmOnLedger(client, 'offering')]);
  const store0 = await readStore();
  const mine = store0.intents.filter((i) => i.campaign === input.id && i.actor === input.actor && i.action.startsWith('deploy-v2-'));
  const next = v2NextStep(mine, tokenOnLedger, offeringOnLedger);
  if (next.action === 'complete')
    return {
      complete: true,
      contractSet: 'v2',
      id: input.id,
      name: input.name,
      tokenContractId: next.tokenContractId,
      offeringContractId: next.offeringContractId,
      testOnly: true,
    };
  const account = await client.getAccount(input.actor).catch((e: unknown) => {
    if (/account not found/i.test(e instanceof Error ? e.message : String(e))) {
      const err = new Error('Transaction preparation failed: wallet account does not exist on testnet.');
      (err as Error & { code?: string }).code = 'SIM_ACCOUNT_MISSING';
      throw err;
    }
    throw e;
  });
  let operation:
    ReturnType<typeof Operation.uploadContractWasm> | ReturnType<typeof Operation.createCustomContract> | ReturnType<typeof Operation.invokeContractFunction>;
  switch (next.action) {
    case 'deploy-v2-upload-token':
      operation = Operation.uploadContractWasm({ wasm: loadV2Wasm('token') });
      break;
    case 'deploy-v2-upload-offering':
      operation = Operation.uploadContractWasm({ wasm: loadV2Wasm('offering') });
      break;
    case 'deploy-v2-create-token':
      operation = Operation.createCustomContract({
        address: actor,
        wasmHash: Buffer.from(V2_SHARE_TOKEN_WASM_HASH, 'hex'),
        salt: randomBytes(32),
        constructorArgs: [
          actor.toScVal(),
          nativeToScVal(input.name, { type: 'string' }),
          nativeToScVal(input.v2.symbol, { type: 'string' }),
          nativeToScVal(input.v2.decimals, { type: 'u32' }),
        ],
      });
      break;
    case 'deploy-v2-create-offering':
      // token/issuer: token is the created share-token instance; the
      // operator wallet is the issuer in this demo-grade configuration.
      operation = Operation.createCustomContract({
        address: actor,
        wasmHash: Buffer.from(V2_OFFERING_WASM_HASH, 'hex'),
        salt: randomBytes(32),
        constructorArgs: [
          actor.toScVal(),
          Address.fromString(next.tokenContractId!).toScVal(),
          actor.toScVal(),
          nativeToScVal(amountUnits(input.v2.minPerInvestor), { type: 'i128' }),
          nativeToScVal(amountUnits(input.v2.maxPerInvestor), { type: 'i128' }),
          nativeToScVal(goalUnits, { type: 'i128' }),
          nativeToScVal(deadline, { type: 'u64' }),
        ],
      });
      break;
    case 'deploy-v2-set-minter':
      operation = Operation.invokeContractFunction({
        contract: next.tokenContractId!,
        function: 'set_minter',
        args: [Address.fromString(next.offeringContractId!).toScVal()],
      });
      break;
    default:
      throw new Error(`unknown v2 deploy step ${next.action}`);
  }
  const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: passphrase }).addOperation(operation).setTimeout(900).build();
  const simulation = await client.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) {
    console.warn('soroban v2 deploy simulation failed:', simulation.error ?? '');
    const err = new Error('Transaction preparation failed: the network rejected the transaction simulation.');
    (err as Error & { code?: string }).code = 'SIM_REJECTED';
    throw err;
  }
  if (rpc.Api.isSimulationRestore(simulation)) throw new Error('state restoration required; operator must restore before signing');
  if (simulation.result?.auth.some((a) => a.credentials.type !== 'sorobanCredentialsSourceAccount'))
    throw new Error('separate address authorization is unsupported');
  const prepared = rpc.assembleTransaction(tx, simulation).build();
  const op = prepared.operations[0] as any;
  if (op.auth?.some((a: any) => a.credentials.type !== 'sorobanCredentialsSourceAccount')) throw new Error('separate address authorization is unsupported');
  const hash = Buffer.from(prepared.hash()).toString('hex');
  await guarded(async () => {
    const store = await readStore();
    quarantineHold(store);
    const unresolved = store.intents.find((i) => i.actor === input.actor && i.signedXdr && !TERMINAL.includes(i.status));
    if (unresolved) throw new Error(`prior signed intent ${unresolved.hash} is unresolved; check/retry exact hash, do not build a replacement`);
    const open = openIntents(store, input.actor);
    if (open.length >= openIntentCap()) throw new Error(`too many open intents (${open.length}); resolve signed intents or let unsigned ones expire`);
    store.intents.push({ hash, campaign: input.id, actor: input.actor, action: next.action, xdr: prepared.toXDR(), status: 'BUILT' });
    await save(store);
  });
  return {
    hash,
    xdr: prepared.toXDR(),
    networkPassphrase: passphrase,
    action: 'deploy',
    contractSet: 'v2',
    step: next.action.replace(/^deploy-v2-/, ''),
    id: input.id,
    name: input.name,
    feeStroops: prepared.fee,
    testOnly: true,
  };
}
export async function submitCampaignDeployV2(input: { actor: string; xdr: string; name?: string }): Promise<any> {
  guard();
  actorAddress(input.actor);
  const displayName = typeof input.name === 'string' && input.name.length > 0 && input.name.length <= 120 ? input.name : null;
  if (input.name !== undefined && displayName === null) throw new Error('invalid campaign name');
  const tx = verifySignedTx(input.actor, input.xdr);
  const hash = Buffer.from(tx.hash()).toString('hex');
  const V2_ACTIONS = ['deploy-v2-upload-token', 'deploy-v2-upload-offering', 'deploy-v2-create-token', 'deploy-v2-create-offering', 'deploy-v2-set-minter'];
  const phase = await guarded(async () => {
    const store = await readStore();
    const intent = store.intents.find((i) => i.hash === hash && i.actor === input.actor && V2_ACTIONS.includes(i.action));
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
  });
  if (!phase.terminal) {
    const store = await readStore();
    const intent = store.intents.find((i) => i.hash === hash)!;
    const sendTx = TransactionBuilder.fromXDR(intent.signedXdr!, passphrase) as Transaction;
    try {
      const result = await sorobanDeps.client().sendTransaction(sendTx);
      if (result.hash !== hash) throw new Error('RPC returned mismatched transaction hash');
      const status = result.status === 'ERROR' ? 'UNKNOWN' : result.status;
      await recordStatus(hash, status);
    } catch (err) {
      await recordStatus(hash, 'UNKNOWN');
      throw err;
    }
  }
  const outcome = await awaitDeployResult(hash);
  await recordStatus(hash, outcome.status);
  if (outcome.status === 'FAILED') throw new Error(`deployment transaction failed on-chain (hash ${hash}); no contract was created`);
  const intent = (await readStore()).intents.find((i) => i.hash === hash)!;
  const step = intent.action.replace(/^deploy-v2-/, '');
  if (step.startsWith('upload') && outcome.status === 'SUCCESS')
    return {
      hash,
      status: 'SUCCESS',
      confirmed: true,
      contractSet: 'v2',
      step,
      message: 'v2 contract code uploaded; build again for the next step.',
      testOnly: true,
    };
  if (step.startsWith('create')) {
    // Fail closed on the created instance: its deployed code must match the
    // pinned scaffold Wasm before the contract id is journaled.
    if (!outcome.contractId)
      return {
        hash,
        status: outcome.status,
        confirmed: false,
        contractSet: 'v2',
        step,
        message: 'Submission is not confirmation. Check the hash before another action.',
      };
    const pin = step === 'create-token' ? V2_SHARE_TOKEN_WASM_HASH : V2_OFFERING_WASM_HASH;
    const deployedWasm = await sorobanDeps.client().getContractWasmByContractId(outcome.contractId);
    if (createHash('sha256').update(deployedWasm).digest('hex') !== pin)
      throw new Error(`deployed v2 ${step} code does not match its pin; refusing to journal the contract id`);
    await guarded(async () => {
      const store = await readStore();
      const row = store.intents.find((i) => i.hash === hash);
      if (row && !row.contractId) {
        row.contractId = outcome.contractId!;
        await save(store);
      }
    });
    // Fail closed on journal persistence: confirming a create whose id was
    // not retained would make the next build repeat the create step (the
    // Postgres journal dropped the column before contract_id was added).
    const persisted = (await readStore()).intents.find((i) => i.hash === hash)?.contractId;
    if (persisted !== outcome.contractId)
      throw new Error(`journal did not retain the contract id for ${hash}; refusing to confirm - reconcile the exact hash manually before any retry`);
    await recordContractCreation(hash, intent.campaign);
    return {
      hash,
      status: 'SUCCESS',
      confirmed: true,
      contractSet: 'v2',
      step,
      contractId: outcome.contractId,
      message: `v2 ${step} confirmed; build again for the next step.`,
      testOnly: true,
    };
  }
  if (step === 'set-minter') {
    if (outcome.status !== 'SUCCESS')
      return {
        hash,
        status: outcome.status,
        confirmed: false,
        contractSet: 'v2',
        step,
        message: 'Submission is not confirmation. Check the hash before another action.',
      };
    const store = await readStore();
    const mine = store.intents.filter((i) => i.campaign === intent.campaign && i.actor === input.actor && i.action.startsWith('deploy-v2-'));
    const tokenContractId = mine.find((i) => i.action === 'deploy-v2-create-token' && i.status === 'SUCCESS')?.contractId;
    const offeringContractId = mine.find((i) => i.action === 'deploy-v2-create-offering' && i.status === 'SUCCESS')?.contractId;
    if (!tokenContractId || !offeringContractId)
      throw new Error('set-minter confirmed but the journaled contract ids are incomplete; reconcile before building again');
    return {
      hash,
      status: 'SUCCESS',
      confirmed: true,
      contractSet: 'v2',
      step,
      complete: true,
      tokenContractId,
      offeringContractId,
      registryEntry: {
        id: intent.campaign,
        name: displayName ?? intent.campaign,
        contractSet: 'v2',
        tokenContractId,
        offeringContractId,
      },
      note: 'Add registryEntry to SOROBAN_CAMPAIGNS_JSON to list the campaign; the server never edits the registry itself. v2 registry entries are demo-grade testnet scaffolds without external security review.',
      testOnly: true,
    };
  }
  return {
    hash,
    status: outcome.status,
    confirmed: false,
    contractSet: 'v2',
    step,
    message: 'Submission is not confirmation. Check the hash before another action.',
  };
}
