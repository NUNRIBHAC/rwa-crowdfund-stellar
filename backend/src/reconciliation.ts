import type { Intent } from './journal.js';

// Operator reconciliation aid (read-only). Compares what THIS deployment's
// intent journal records against each campaign's on-chain cumulative
// contribution counter (total_raised).
//
// Contract semantics, verified live on testnet 2026-10-31: total_raised is a
// cumulative counter of accepted contributions. It is NOT reduced by refunds
// (e2e-refund: contributors refunded, counter intact) and NOT reduced by the
// creator withdraw (e2e-success: withdrawn=true, counter intact). So the
// expected relationship is:
//   total_raised == sum of SUCCESS contribute amounts (from any source)
// On-chain amounts above the journal-covered sum mean contributions happened
// outside this app's journal (CLI contract tests, other tooling, pre-journal
// history). That is reported as not-journal-covered volume - never as
// missing, lost or misappropriated funds. A negative difference means
// journal rows reference a different deployment/registry history. This view
// makes no accounting, custody, audit-opinion or compliance claim; it is an
// operator debugging aid.
export const RECONCILIATION_SEMANTICS =
  'total_raised is the contract cumulative contribution counter (not reduced by refunds or withdraw). ' +
  'journalCovered sums SUCCESS contribute intents recorded by THIS app only. ' +
  'notJournalCovered is on-chain volume from outside this app journal (CLI tests, other tooling, pre-journal history), not missing funds.';

export type ReconciliationCampaignInput = { id: string; raised: string | null };

export type CampaignReconciliation = {
  campaignId: string;
  onChainRaised: string | null;
  journalCovered: string;
  notJournalCovered: string | null;
  successContributes: number;
  successRefunds: number;
  successWithdraws: number;
  openIntentHashes: string[];
  failedIntents: number;
  notes: string[];
};

const TERMINAL = new Set(['SUCCESS', 'FAILED']);

export function reconcileCampaigns(
  campaigns: ReconciliationCampaignInput[],
  intents: Intent[],
  quarantinedCount: number,
): { campaigns: CampaignReconciliation[]; quarantinedIntents: number } {
  const rows = campaigns.map((c) => {
    const mine = intents.filter((i) => i.campaign === c.id);
    const notes: string[] = [];
    let covered = 0n;
    let missingAmount = 0;
    let successContributes = 0;
    let successRefunds = 0;
    let successWithdraws = 0;
    let failedIntents = 0;
    const openIntentHashes: string[] = [];
    for (const i of mine) {
      if (!TERMINAL.has(i.status)) {
        openIntentHashes.push(i.hash);
        continue;
      }
      if (i.status === 'FAILED') {
        failedIntents += 1;
        continue;
      }
      if (i.action === 'contribute') {
        successContributes += 1;
        if (i.amount === undefined || i.amount === '') {
          // Rows written before the journal captured amounts: counted as
          // contributions but excluded from the covered sum, and disclosed.
          missingAmount += 1;
        } else {
          try {
            covered += BigInt(i.amount);
          } catch {
            notes.push(`intent ${i.hash} has an unparseable amount and is excluded from the covered sum`);
          }
        }
      } else if (i.action === 'refund') {
        successRefunds += 1;
      } else if (i.action === 'withdraw') {
        successWithdraws += 1;
      }
    }
    if (missingAmount > 0) {
      notes.push(`${missingAmount} SUCCESS contribute intent(s) carry no amount field (recorded before amount capture) and are excluded from the covered sum`);
    }
    let notJournalCovered: string | null = null;
    if (c.raised === null) {
      notes.push('on-chain read unavailable for this campaign');
    } else {
      try {
        const diff = BigInt(c.raised) - covered;
        notJournalCovered = diff.toString();
        if (diff > 0n) notes.push('on-chain volume exceeds this app journal: contributions came from outside this app (CLI tests, other tooling or pre-journal history)');
        if (diff < 0n) notes.push('journal-covered sum exceeds the on-chain counter: journal rows reference different deployment or registry history');
      } catch {
        notes.push('on-chain raised value is unparseable');
      }
    }
    return {
      campaignId: c.id,
      onChainRaised: c.raised,
      journalCovered: covered.toString(),
      notJournalCovered,
      successContributes,
      successRefunds,
      successWithdraws,
      openIntentHashes,
      failedIntents,
      notes,
    };
  });
  return { campaigns: rows, quarantinedIntents: quarantinedCount };
}
