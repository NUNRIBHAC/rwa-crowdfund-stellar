import type { IntentStore } from './journal.js';
import type { PendingContribution } from './pending-contributors.js';

// Evidence, not a claim that absence from a pruned journal proves no history.
// The caller must collect this under a coherent safety boundary before it can
// ever enable wallet deletion. No production adapter supplies this yet.
export type WalletDeletionRetentionEvidence = {
  journal: IntentStore;
  pending: PendingContribution[];
  history: { complete: boolean; hasRecords: boolean };
  campaignCreatorKeys: string[];
  coherent: boolean;
};
export function walletDeletionRetention(evidence: WalletDeletionRetentionEvidence, publicKey: string): 'clear' | 'protected' | 'unavailable' {
  if (!evidence.coherent || !evidence.history.complete || (evidence.journal.quarantined?.length ?? 0) > 0) return 'unavailable';
  // Hash-only pending proofs cannot be assigned to a wallet, so they block
  // all clear verdicts until derived and durably reconciled.
  if (evidence.pending.some((record) => !record.contributor)) return 'unavailable';
  if (
    evidence.history.hasRecords ||
    evidence.campaignCreatorKeys.includes(publicKey) ||
    evidence.journal.intents.some((record) => record.actor === publicKey) ||
    evidence.pending.some((record) => record.contributor === publicKey)
  )
    return 'protected';
  return 'clear';
}
