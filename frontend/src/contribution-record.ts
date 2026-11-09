// Local export of one visible platform journal entry. No network calls,
// signing, legal receipt, current-balance or independent confirmation claim.
export type ContributionActivity = {
  hash: string;
  campaign: string;
  action: string;
  amount: string | null;
  status: string;
  createdAt: string | null;
  updatedAt?: string | null;
};
const stamp = (value: unknown): value is string | null | undefined => {
  if (value == null) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
};

export function contributionRecord(row: ContributionActivity, actor: string, network: unknown, productionEligible: unknown, exportedAt: string) {
  if (!row || typeof row !== 'object' || network !== 'testnet' || productionEligible !== false) return null;
  if (typeof actor !== 'string' || !/^G[A-Z2-7]{55}$/.test(actor) || row.action !== 'contribute' || row.status !== 'SUCCESS') return null;
  if (typeof row.hash !== 'string' || !/^[a-f0-9]{64}$/.test(row.hash) || typeof row.campaign !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(row.campaign))
    return null;
  if (!stamp(row.createdAt) || !stamp(row.updatedAt) || !exportedAt || !stamp(exportedAt)) return null;
  if (row.amount !== null && row.amount !== 'UNKNOWN') {
    if (typeof row.amount !== 'string' || row.amount.length > 40 || !/^\d+(\.\d{1,7})?$/.test(row.amount)) return null;
    const [whole, fraction = ''] = row.amount.split('.');
    const units = BigInt(whole) * 10000000n + BigInt(fraction.padEnd(7, '0'));
    if (units <= 0n || units >= 2n ** 127n) return null;
  }
  return {
    schema: 'blockallisto.testnet-contribution-journal-record.v1',
    network: 'testnet',
    productionEligible: false,
    source: 'platform-journal',
    actor,
    campaign: row.campaign,
    transactionHash: row.hash,
    action: row.action,
    recordedStatus: row.status,
    recordedAmount: row.amount,
    amountBasis: 'journal-reported; not independently verified by this export',
    amountUnit: 'testnet USDC as labelled by the platform; asset issuer is not provided by the activity API',
    recordedCreatedAt: row.createdAt ?? null,
    recordedUpdatedAt: row.updatedAt ?? null,
    exportedAt,
    limitations: [
      'Testnet platform journal record only. Not a legal receipt, investment document, security, ownership right or tax document.',
      'SUCCESS is the platform journal status. This export does not independently query or verify the blockchain.',
      'The recorded amount may be intended or unknown. It is not proof of the amount transferred or current balance.',
      'This is one entry from a feed limited to the latest 50 platform records, not a complete account statement.',
      'Recorded timestamps are journal timestamps, not certified ledger close times. Export time is not transaction time.',
    ],
  };
}
