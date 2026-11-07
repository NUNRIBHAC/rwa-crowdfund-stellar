import fs from 'node:fs';
import path from 'node:path';
import { StrKey } from '@stellar/stellar-sdk';
import { createdContractIdsFromMeta } from './soroban.js';

// Durable contract-creation manifest: the record that grounds WHEN each
// campaign contract came into existence, independent of the event archive
// whose coverage is being checked. Without it, "no events found" can never be
// distinguished from "the archive started after this contract already had
// history". A record is written only from a SUCCESSFUL deployment
// transaction fetched from the chain by exact hash (never operator-typed
// data), so the creation ledger is anchored in chain evidence.
//
// Honesty rules:
//  - a record is written once; a conflicting rewrite throws instead of
//    silently replacing creation evidence;
//  - a corrupt stored record throws on read; callers fail closed
//    (unavailable), never treat corruption as "no record";
//  - absence of a record is NOT proof of anything: consumers must use a
//    conservative creation bound (ledger 1), never an optimistic one.
export type ContractCreationRecord = {
  campaignId: string;
  contractId: string;
  createdLedger: number;
  deploymentHash: string;
  networkPassphrase: string;
  recordedAt: number;
};

const ledger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

// Runtime validation is intentional: records came from files/DB, not the TS
// compiler. Returns null for anything malformed instead of an unchecked cast.
export function validateCreationRecord(value: unknown): ContractCreationRecord | null {
  if (!object(value)) return null;
  if (
    typeof value.campaignId !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,48}$/.test(value.campaignId) ||
    typeof value.contractId !== 'string' ||
    !StrKey.isValidContract(value.contractId) ||
    !ledger(value.createdLedger) ||
    typeof value.deploymentHash !== 'string' ||
    !/^[0-9a-f]{64}$/.test(value.deploymentHash) ||
    typeof value.networkPassphrase !== 'string' ||
    value.networkPassphrase.length === 0 ||
    !ledger(value.recordedAt)
  )
    return null;
  return {
    campaignId: value.campaignId,
    contractId: value.contractId,
    createdLedger: value.createdLedger,
    deploymentHash: value.deploymentHash,
    networkPassphrase: value.networkPassphrase,
    recordedAt: value.recordedAt,
  };
}

export type DeploymentManifestStore = {
  // Idempotent for an identical record; a conflicting record for the same
  // contract throws (creation evidence is never silently replaced).
  put(record: ContractCreationRecord): Promise<void>;
  // Undefined when absent; THROWS when the stored row is corrupt so the
  // caller fails closed instead of reading corruption as absence.
  get(contractId: string): Promise<ContractCreationRecord | undefined>;
  list(): Promise<ContractCreationRecord[]>;
};

const sameRecord = (a: ContractCreationRecord, b: ContractCreationRecord): boolean =>
  a.campaignId === b.campaignId &&
  a.contractId === b.contractId &&
  a.createdLedger === b.createdLedger &&
  a.deploymentHash === b.deploymentHash &&
  a.networkPassphrase === b.networkPassphrase;

export class FileDeploymentManifestStore implements DeploymentManifestStore {
  constructor(private filePath: string) {}
  private async readDoc(): Promise<Record<string, unknown>> {
    try {
      const doc: unknown = JSON.parse(await fs.promises.readFile(this.filePath, 'utf8'));
      if (!object(doc)) throw new Error('deployment manifest root is not an object');
      return doc;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw err;
    }
  }
  // Serialized read-modify-write (same discipline as the event archive file
  // backend): concurrent writers must not lose each other's records.
  private writeQueue: Promise<void> = Promise.resolve();
  private tmpCounter = 0;
  private enqueue<T>(op: () => Promise<T>): Promise<T> {
    const run = this.writeQueue.then(op);
    this.writeQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
  private async writeDoc(doc: Record<string, unknown>): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${++this.tmpCounter}.tmp`;
    await fs.promises.writeFile(tmp, JSON.stringify(doc));
    await fs.promises.rename(tmp, this.filePath);
  }
  async put(record: ContractCreationRecord): Promise<void> {
    if (!validateCreationRecord(record)) throw new Error('refusing to store an invalid contract creation record');
    return this.enqueue(async () => {
      const doc = await this.readDoc();
      const existing = doc[record.contractId];
      if (existing !== undefined) {
        const parsed = validateCreationRecord(existing);
        if (!parsed) throw new Error(`stored creation record for ${record.contractId} is corrupt`);
        if (!sameRecord(parsed, record)) throw new Error(`conflicting creation record for ${record.contractId}; reconcile manually, never overwrite`);
        return;
      }
      doc[record.contractId] = record;
      await this.writeDoc(doc);
    });
  }
  async get(contractId: string): Promise<ContractCreationRecord | undefined> {
    const doc = await this.readDoc();
    const existing = doc[contractId];
    if (existing === undefined) return undefined;
    const parsed = validateCreationRecord(existing);
    if (!parsed) throw new Error(`stored creation record for ${contractId} is corrupt`);
    return parsed;
  }
  async list(): Promise<ContractCreationRecord[]> {
    const doc = await this.readDoc();
    return Object.entries(doc).map(([contractId, value]) => {
      const parsed = validateCreationRecord(value);
      if (!parsed) throw new Error(`stored creation record for ${contractId} is corrupt`);
      return parsed;
    });
  }
}

// Ground one contract's creation in chain evidence: fetch the exact
// deployment transaction, require SUCCESS at a conclusive ledger and exactly
// one created contract instance in its metadata, then store the record. The
// caller supplies the campaign id it believes the hash belongs to; a
// mismatch with the chain evidence throws instead of recording a guess.
export async function recordCreationFromTransaction(opts: {
  client: { getTransaction(hash: string): Promise<unknown> };
  hash: string;
  campaignId: string;
  networkPassphrase: string;
  store: DeploymentManifestStore;
  now?: () => number;
}): Promise<ContractCreationRecord> {
  const now = opts.now ?? (() => Date.now());
  if (!/^[0-9a-f]{64}$/.test(opts.hash)) throw new Error('invalid deployment transaction hash');
  if (!/^[a-zA-Z0-9_-]{1,48}$/.test(opts.campaignId)) throw new Error('invalid campaign id');
  if (typeof opts.networkPassphrase !== 'string' || opts.networkPassphrase.length === 0) throw new Error('network passphrase required');
  const result = (await opts.client.getTransaction(opts.hash)) as {
    txHash?: unknown;
    status?: unknown;
    ledger?: unknown;
    resultMetaXdr?: unknown;
  };
  if (!object(result) || result.txHash !== opts.hash) throw new Error('RPC returned mismatched transaction hash');
  if (result.status !== 'SUCCESS') throw new Error(`deployment transaction is not SUCCESS (got ${String(result.status)}); no creation to record`);
  if (!ledger(result.ledger)) throw new Error('RPC result missing conclusive ledger');
  const created = createdContractIdsFromMeta(result.resultMetaXdr);
  if (created.length === 0) throw new Error('no created contract instance in transaction metadata');
  if (created.length > 1) throw new Error('ambiguous contract ids in transaction metadata; reconcile the exact hash manually');
  const record: ContractCreationRecord = {
    campaignId: opts.campaignId,
    contractId: created[0],
    createdLedger: result.ledger,
    deploymentHash: opts.hash,
    networkPassphrase: opts.networkPassphrase,
    recordedAt: now(),
  };
  await opts.store.put(record);
  return record;
}
