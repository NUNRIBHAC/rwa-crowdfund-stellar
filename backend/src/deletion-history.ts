import { StrKey } from '@stellar/stellar-sdk';

// A policy input, not a live adapter: collect under the same exclusion boundary
// as journal/pending/community writes. Never infer a lifetime start from RPC's
// current retention floor, or complete history from a zero current balance.
export type DeletionHistoryCampaign = {
  campaignId: string;
  contractId: string;
  createdLedger: number;
};
export type DeletionHistoryCoverage = {
  campaignId: string;
  contractId: string;
  fromLedger: number;
  throughLedger: number;
  // Covers ALL contract events and all participant roles, not only contributed.
  allEventsVerified: boolean;
  gap: boolean;
  unreadableEvents: boolean;
  participantKeys: string[];
};
export type DeletionHistorySnapshot = {
  networkPassphrase: string;
  expectedNetworkPassphrase: string;
  targetLedger: number;
  manifestComplete: boolean;
  coherent: boolean;
  campaigns: DeletionHistoryCampaign[];
  coverage: DeletionHistoryCoverage[];
};
const ledger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

// Runtime validation is intentional: data came from files/DB/RPC, not the TS
// compiler. An unchecked cast or missing property must not approve deletion.
export function walletDeletionHistory(value: unknown, publicKey: string): 'clear' | 'protected' | 'unavailable' {
  if (!StrKey.isValidEd25519PublicKey(publicKey) || !object(value)) return 'unavailable';
  if (
    value.coherent !== true ||
    value.manifestComplete !== true ||
    typeof value.expectedNetworkPassphrase !== 'string' ||
    value.expectedNetworkPassphrase.length === 0 ||
    value.networkPassphrase !== value.expectedNetworkPassphrase ||
    !ledger(value.targetLedger) ||
    !Array.isArray(value.campaigns) ||
    !Array.isArray(value.coverage)
  )
    return 'unavailable';
  const ids = new Set<string>();
  const contracts = new Set<string>();
  for (const campaign of value.campaigns) {
    if (
      !object(campaign) ||
      typeof campaign.campaignId !== 'string' ||
      campaign.campaignId.length === 0 ||
      typeof campaign.contractId !== 'string' ||
      !StrKey.isValidContract(campaign.contractId) ||
      !ledger(campaign.createdLedger) ||
      campaign.createdLedger > value.targetLedger ||
      ids.has(campaign.campaignId) ||
      contracts.has(campaign.contractId)
    )
      return 'unavailable';
    ids.add(campaign.campaignId);
    contracts.add(campaign.contractId);
  }
  if (value.coverage.length !== value.campaigns.length) return 'unavailable';
  const covered = new Set<string>();
  let hasRecords = false;
  for (const record of value.coverage) {
    if (!object(record) || typeof record.campaignId !== 'string' || covered.has(record.campaignId)) return 'unavailable';
    const campaign = value.campaigns.find((c) => c.campaignId === record.campaignId);
    if (
      !campaign ||
      record.contractId !== campaign.contractId ||
      !ledger(record.fromLedger) ||
      record.fromLedger > campaign.createdLedger ||
      !ledger(record.throughLedger) ||
      record.throughLedger !== value.targetLedger ||
      record.allEventsVerified !== true ||
      record.gap !== false ||
      record.unreadableEvents !== false ||
      !Array.isArray(record.participantKeys) ||
      record.participantKeys.some((key) => typeof key !== 'string' || !StrKey.isValidEd25519PublicKey(key))
    )
      return 'unavailable';
    covered.add(record.campaignId);
    if (record.participantKeys.includes(publicKey)) hasRecords = true;
  }
  return hasRecords ? 'protected' : 'clear';
}
