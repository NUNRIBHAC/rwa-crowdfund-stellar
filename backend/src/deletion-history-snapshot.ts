import { xdr, scValToNative } from '@stellar/stellar-sdk';
import {
  ARCHIVE_VERSION,
  archiveIdentity,
  archiveIdentityKey,
  verifyArchiveAnchor,
  type ArchiveClient,
  type ArchiveIdentity,
  type ArchivedChainEvent,
  type EventArchiveStore,
} from './event-archive.js';
import type { DeletionHistoryCoverage, DeletionHistorySnapshot } from './deletion-history.js';
import { walletDeletionHistory } from './deletion-history.js';
import { walletDeletionRetention, type WalletDeletionRetentionEvidence } from './deletion-retention.js';
import type { IntentStore } from './journal.js';
import type { PendingContribution } from './pending-contributors.js';
import type { DeploymentManifestStore } from './deployment-manifest.js';

// Builds the runtime evidence snapshot that deletion-history.ts validates,
// from the platform's own sources: the validated campaign registry, the
// verbatim event archive, the durable contract-creation manifest, the intent
// journal, the pending-proof queue and the community contributor registry.
//
// This module COLLECTS evidence; it never decides alone. Every doubt
// resolves to unavailable, never to clear:
//  - the registry is a CLAIMED campaign list, not a proven exhaustive one:
//    any campaign id found in the journal, pending queue, contributor
//    registry or archive that the registry cannot explain marks the
//    manifest incomplete (unknown contracts may hold unknown history);
//  - a contract without a creation record falls back to the conservative
//    bound ledger 1, which only ever makes clearance HARDER (coverage must
//    span from ledger 1); it never compensates for missing contracts,
//    events or roles;
//  - archive coverage counts only with a current-version, gap-free
//    checkpoint; prospective gaps stay unavailable;
//  - participant keys are derived from EVERY topic position and the event
//    value, XDR-decoded and raw-scanned (all roles, not only contributors);
//    any field that cannot be fully decoded or scanned is an unreadable
//    event, not an empty one.

const ACCOUNT_KEY = /^G[A-Z2-7]{55}$/;
const CONTRACT_KEY = /^C[A-Z2-7]{55}$/;
const EMBEDDED_KEY = /G[A-Z2-7]{55}/g;
const BASE64ISH = /^[A-Za-z0-9+/]+={0,2}$/;
const PRINTABLE = /^[\x20-\x7e]*$/;
// A 32-byte address hidden in raw base64 needs at least 43 characters, so a
// shorter undecodable token (a plain symbol name, a short id) cannot conceal
// one and stays scannable as text.
const MIN_HIDDEN_ADDRESS_B64 = 43;

const stringifyNative = (value: unknown): string => JSON.stringify(value, (_key, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)) ?? '';

// One serialized topic/value field: extract every account key it carries,
// or admit it cannot be fully read. Over-collection is safe (a false
// participant only ever yields protected); under-collection is not.
function scanSerializedField(field: unknown): { keys: string[]; readable: boolean } {
  if (typeof field !== 'string' || field.length === 0) return { keys: [], readable: false };
  if (ACCOUNT_KEY.test(field)) return { keys: [field], readable: true };
  if (CONTRACT_KEY.test(field)) return { keys: [], readable: true };
  if (BASE64ISH.test(field) && field.length % 4 === 0) {
    try {
      const scval = xdr.ScVal.fromXDR(field, 'base64');
      const keys = stringifyNative(scValToNative(scval)).match(EMBEDDED_KEY) ?? [];
      return { keys, readable: true };
    } catch {
      // Not (valid) XDR. Long undecodable blobs may conceal an address in an
      // encoding we do not understand: unreadable, never silently empty.
      if (field.length >= MIN_HIDDEN_ADDRESS_B64) return { keys: [], readable: false };
    }
  }
  if (PRINTABLE.test(field)) return { keys: field.match(EMBEDDED_KEY) ?? [], readable: true };
  return { keys: [], readable: false };
}

// Derive the all-role participant set of one contract's archived events.
// Rows belonging to another campaign/contract or with a foreign archive
// version count as unreadable: a mixed store is not evidence.
export function participantsFromArchivedEvents(
  events: ArchivedChainEvent[],
  expected: { campaignId: string; contractId: string; identity?: ArchiveIdentity },
): { participantKeys: string[]; unreadableEvents: boolean } {
  const keys = new Set<string>();
  let unreadable = false;
  for (const ev of events) {
    if (
      ev.campaignId !== expected.campaignId ||
      ev.contractId !== expected.contractId ||
      ev.archiveVersion !== ARCHIVE_VERSION ||
      !ev.identity ||
      archiveIdentityKey(ev.identity) !== archiveIdentityKey(expected.identity ?? archiveIdentity(expected.contractId)) ||
      typeof ev.eventId !== 'string' ||
      ev.eventId.length === 0 ||
      !Number.isSafeInteger(ev.ledger) ||
      ev.ledger <= 0 ||
      !Array.isArray(ev.topics)
    ) {
      unreadable = true;
      continue;
    }
    for (const field of [...ev.topics, ev.value]) {
      const scanned = scanSerializedField(field);
      if (!scanned.readable) unreadable = true;
      for (const key of scanned.keys) keys.add(key);
    }
  }
  return { participantKeys: [...keys].sort(), unreadableEvents: unreadable };
}

export type RegistryLikeEntry = { id: string; contractSet?: string; contractId?: string; tokenContractId?: string; offeringContractId?: string };

export type WalletHistorySources = {
  // Validated registry entries (soroban.ts entries() output shape).
  registry: RegistryLikeEntry[];
  archive: EventArchiveStore;
  manifest: DeploymentManifestStore;
  client: Pick<ArchiveClient, 'getLatestLedger' | 'getLedgers' | 'getNetwork'>;
  archiveEpoch?: string;
  journal: IntentStore;
  pending: PendingContribution[];
  // Campaign ids present in the community contributor registry
  // (`${campaignId}:${publicKey}` keys), collected by the caller.
  communityCampaignIds: string[];
  networkPassphrase: string;
  // Coherence boundary: the caller MUST pass a hook that brings the archive
  // checkpoint of every registry contract as close to the chain tip as the
  // archiver allows BEFORE the latest ledger is read. Without it, activity
  // in the not-yet-archived tail would be invisible to the snapshot.
  refresh?: () => Promise<void>;
};

const CONTRACT_STRKEY = /^C[A-Z2-7]{55}$/;
const unavailable = (networkPassphrase: string): DeletionHistorySnapshot => ({
  networkPassphrase,
  expectedNetworkPassphrase: networkPassphrase,
  targetLedger: 0, // fails the checker's ledger validation: unavailable
  manifestComplete: false,
  coherent: false,
  campaigns: [],
  coverage: [],
});

// Expand one registry entry into its contract rows. v1 campaigns have one
// crowdfund contract; v2 campaigns have a share-token AND an offering
// contract, archived under `${id}:token` / `${id}:offering` keys.
function expandRegistry(registry: RegistryLikeEntry[]): { key: string; entryId: string; contractId: string }[] | null {
  const rows: { key: string; entryId: string; contractId: string }[] = [];
  const keys = new Set<string>();
  const contracts = new Set<string>();
  for (const entry of registry) {
    if (!entry || typeof entry.id !== 'string' || !/^[a-zA-Z0-9_-]{1,48}$/.test(entry.id)) return null;
    const expanded =
      entry.contractSet === 'v2'
        ? [
            { key: `${entry.id}:token`, contractId: entry.tokenContractId },
            { key: `${entry.id}:offering`, contractId: entry.offeringContractId },
          ]
        : [{ key: entry.id, contractId: entry.contractId }];
    for (const row of expanded) {
      if (typeof row.contractId !== 'string' || !CONTRACT_STRKEY.test(row.contractId)) return null;
      if (keys.has(row.key) || contracts.has(row.contractId)) return null; // duplicates: claim is not coherent
      keys.add(row.key);
      contracts.add(row.contractId);
      rows.push({ key: row.key, entryId: entry.id, contractId: row.contractId });
    }
  }
  return rows;
}

// Campaign ids a store row may reference for one registry entry: the bare id
// plus the v2 archive keys.
const acceptableKeys = (rows: { key: string; entryId: string }[]): Set<string> => {
  const set = new Set<string>();
  for (const row of rows) {
    set.add(row.entryId);
    set.add(row.key);
  }
  return set;
};

export async function buildWalletHistorySnapshot(sources: WalletHistorySources): Promise<DeletionHistorySnapshot> {
  const network = sources.networkPassphrase;
  if (typeof network !== 'string' || network.length === 0) return unavailable('');
  if (sources.refresh) {
    try {
      await sources.refresh();
    } catch {
      return unavailable(network); // a failed refresh leaves the tail unknown
    }
  }
  const rows = expandRegistry(sources.registry);
  if (!rows) return unavailable(network);
  let latest: number;
  try {
    const head = await sources.client.getLatestLedger();
    latest = head?.sequence;
    if (!Number.isSafeInteger(latest) || latest <= 0) return unavailable(network);
  } catch {
    return unavailable(network);
  }

  // Cross-store completeness: every campaign reference found anywhere must be
  // explained by the registry, otherwise unknown contracts may hold unknown
  // history and the manifest claim is incomplete.
  const known = acceptableKeys(rows);
  const referenced = new Set<string>();
  for (const intent of sources.journal.intents ?? []) if (typeof intent?.campaign === 'string') referenced.add(intent.campaign);
  for (const record of sources.pending ?? []) if (typeof record?.campaignId === 'string') referenced.add(record.campaignId);
  for (const id of sources.communityCampaignIds ?? []) if (typeof id === 'string') referenced.add(id);
  let archiveCampaigns: string[] = [];
  let archiveListingFailed = false;
  try {
    archiveCampaigns = await sources.archive.campaigns();
  } catch {
    archiveListingFailed = true; // cannot prove completeness: fail closed
  }
  for (const id of archiveCampaigns) referenced.add(id);
  const unexplained = [...referenced].filter((id) => !known.has(id));
  const manifestComplete = unexplained.length === 0 && !archiveListingFailed;

  // One target ledger for every contract: the highest ledger ALL valid
  // archive checkpoints have fully processed, capped by the chain tip. A
  // contract without a valid gap-free checkpoint drags its own coverage row
  // to unavailable; the shared target keeps the snapshot at one ledger.
  type RowState = { checkpointOk: boolean; processedThrough: number };
  const states = new Map<string, RowState>();
  let readsFailed = false;
  for (const row of rows) {
    try {
      const identity = archiveIdentity(row.contractId, network, sources.archiveEpoch);
      const checkpoint = await sources.archive.readCheckpoint(row.key, identity);
      const ok =
        checkpoint !== undefined &&
        checkpoint.version === ARCHIVE_VERSION &&
        checkpoint.identity !== undefined &&
        archiveIdentityKey(checkpoint.identity) === archiveIdentityKey(identity) &&
        checkpoint.anchor !== undefined &&
        checkpoint.gap === undefined &&
        Number.isSafeInteger(checkpoint.processedThroughLedger) &&
        checkpoint.processedThroughLedger > 0;
      if (ok) await verifyArchiveAnchor(sources.client, checkpoint!.anchor!, identity);
      states.set(row.key, {
        checkpointOk: ok,
        processedThrough: ok ? checkpoint.processedThroughLedger : 0,
      });
    } catch {
      readsFailed = true;
      states.set(row.key, { checkpointOk: false, processedThrough: 0 });
    }
  }
  const processedValues = rows.map((row) => states.get(row.key)!.processedThrough);
  const covered = processedValues.length > 0 ? Math.min(...processedValues) : 0;
  const target = Math.min(covered, latest);
  if (!Number.isSafeInteger(target) || target <= 0) return { ...unavailable(network), manifestComplete };

  const campaigns: DeletionHistorySnapshot['campaigns'] = [];
  const coverage: DeletionHistoryCoverage[] = [];
  for (const row of rows) {
    // Creation ledger, independently grounded by the deployment manifest.
    // A missing, corrupt or mismatched record falls back to ledger 1, which
    // only ever widens the span coverage must prove.
    let createdLedger = 1;
    try {
      const record = await sources.manifest.get(row.contractId);
      if (
        record &&
        record.campaignId === row.entryId &&
        record.contractId === row.contractId &&
        record.networkPassphrase === network &&
        record.createdLedger <= latest
      )
        createdLedger = record.createdLedger;
    } catch {
      readsFailed = true; // corrupt manifest: keep the conservative bound
    }
    campaigns.push({ campaignId: row.key, contractId: row.contractId, createdLedger });

    const state = states.get(row.key)!;
    let participantKeys: string[] = [];
    let unreadableEvents = false;
    try {
      // Over-inclusion is the safe direction: events archived BEYOND the
      // shared target ledger are still checked for participation (a late
      // participant only ever turns clear into protected, never the
      // reverse). The not-yet-archived tail above every checkpoint is the
      // refresh hook's responsibility, documented on WalletHistorySources.
      const events = await sources.archive.list(row.key);
      const parsed = participantsFromArchivedEvents(events, {
        campaignId: row.key,
        contractId: row.contractId,
        identity: archiveIdentity(row.contractId, network, sources.archiveEpoch),
      });
      participantKeys = parsed.participantKeys;
      unreadableEvents = parsed.unreadableEvents;
    } catch {
      readsFailed = true;
      unreadableEvents = true;
    }
    coverage.push({
      campaignId: row.key,
      contractId: row.contractId,
      fromLedger: 1,
      throughLedger: target,
      allEventsVerified: state.checkpointOk && !unreadableEvents,
      gap: !state.checkpointOk,
      unreadableEvents,
      participantKeys,
    });
  }
  return {
    networkPassphrase: network,
    expectedNetworkPassphrase: network,
    targetLedger: target,
    manifestComplete,
    coherent: !readsFailed,
    campaigns,
    coverage,
  };
}

// Deploy-intent actors are this app's durable record of campaign creators
// (buildCampaignDeploy records deploy-upload/deploy-create intents). Only
// valid account keys are kept; anything malformed is ignored here because
// the journal-side retention check already fails closed on quarantine.
function creatorKeysFromJournal(journal: IntentStore): string[] {
  const keys = new Set<string>();
  for (const intent of journal.intents ?? []) {
    if (typeof intent?.action === 'string' && intent.action.startsWith('deploy-') && ACCOUNT_KEY.test(intent?.actor)) keys.add(intent.actor);
  }
  return [...keys].sort();
}

// Compose the lifetime-history snapshot with the local retention evidence
// (journal, pending proofs, creator links). Any unavailable input makes the
// whole verdict unavailable; protected anywhere stays protected. This is
// still a policy composition: no hosted route injects it, and wiring it in
// requires the final deletion mutation to re-check under its own lock.
export async function walletDeletionEvidenceVerdict(publicKey: string, sources: WalletHistorySources): Promise<'clear' | 'protected' | 'unavailable'> {
  const snapshot = await buildWalletHistorySnapshot(sources);
  const history = walletDeletionHistory(snapshot, publicKey);
  const evidence: WalletDeletionRetentionEvidence = {
    journal: sources.journal,
    pending: sources.pending,
    history: { complete: history !== 'unavailable', hasRecords: history === 'protected' },
    campaignCreatorKeys: creatorKeysFromJournal(sources.journal),
    coherent: snapshot.coherent === true && snapshot.manifestComplete === true,
  };
  return walletDeletionRetention(evidence, publicKey);
}
