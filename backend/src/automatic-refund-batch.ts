import { processRefundForPayer } from './automatic-refund-payer.js';
import { TESTNET_PASSPHRASE, type RefundChain, type RefundPolicy, type RefundRecord, type RefundStore } from './automatic-refunds.js';
import { StrKey } from '@stellar/stellar-sdk';
export type RefundBatch = {
  payer: string;
  recipients: readonly { campaign: string; contributor: string }[];
  maxRecipients: number;
};
export type RefundBatchResult = { campaign: string; contributor: string; record?: RefundRecord; error?: string };

// Explicit single invocation, no timer, background daemon or discovery scan.
// New refunds stop at the first uncertain payer sequence; later invocations
// reconcile that same envelope before creating another one.
export async function runRefundBatch(batch: RefundBatch, policy: RefundPolicy, chain: RefundChain, store: RefundStore): Promise<RefundBatchResult[]> {
  if (!policy.enabled || policy.networkPassphrase !== TESTNET_PASSPHRASE || policy.maxFeeStroops <= 0n) throw new Error('AUTO_REFUND_BATCH_POLICY');
  if (
    !StrKey.isValidEd25519PublicKey(batch.payer) ||
    !Number.isInteger(batch.maxRecipients) ||
    batch.maxRecipients < 1 ||
    batch.maxRecipients > 25 ||
    batch.recipients.length > batch.maxRecipients
  )
    throw new Error('AUTO_REFUND_BATCH_LIMIT');
  const seen = new Set<string>();
  for (const recipient of batch.recipients) {
    if (
      !StrKey.isValidContract(recipient.campaign) ||
      (!StrKey.isValidEd25519PublicKey(recipient.contributor) && !StrKey.isValidContract(recipient.contributor)) ||
      !policy.approvedContracts.includes(recipient.campaign)
    )
      throw new Error('AUTO_REFUND_BATCH_RECIPIENT');
    const key = JSON.stringify([recipient.campaign, recipient.contributor]);
    if (seen.has(key)) throw new Error('AUTO_REFUND_BATCH_DUPLICATE');
    seen.add(key);
  }
  const results: RefundBatchResult[] = [];
  for (const recipient of batch.recipients) {
    try {
      const record = await processRefundForPayer(batch.payer, policy, chain, store, recipient.campaign, recipient.contributor);
      results.push({ ...recipient, record });
      if (record.hash && record.state !== 'confirmed' && record.error !== 'AUTO_REFUND_TRANSACTION_FAILED') break;
    } catch (error) {
      // Do not expose RPC responses or errors from a signer to a public read
      // model. Expected domain codes remain private operator diagnostics.
      const message = error instanceof Error ? error.message : '';
      results.push({ ...recipient, error: /^AUTO_REFUND_[A-Z_]+$/.test(message) ? message : 'AUTO_REFUND_BATCH_BLOCKED' });
      break;
    }
  }
  return results;
}

// Only payment evidence can set paid. No XDR, payer, chain internals or raw
// errors enter the view model. Text keys must be translated at the UI boundary.
export function refundStatusView(record?: RefundRecord): { status: 'pending' | 'submitted' | 'paid' | 'blocked'; amount?: string; textKey: string } {
  if (record?.state === 'confirmed' && record.amount && /^[1-9][0-9]*$/.test(record.amount) && record.confirmedAmount === record.amount)
    return { status: 'paid', amount: record.confirmedAmount, textKey: 'automaticRefund.status.paid' };
  if (record?.state === 'expired' && record.expiryProof?.outcome === 'absent') return { status: 'pending', textKey: 'automaticRefund.status.pending' };
  if (record?.state === 'expired' || record?.state === 'blocked' || record?.state === 'confirmed')
    return { status: 'blocked', textKey: 'automaticRefund.status.blocked' };
  if (record?.state === 'submitted' || record?.state === 'signed') return { status: 'submitted', textKey: 'automaticRefund.status.submitted' };
  return { status: 'pending', textKey: 'automaticRefund.status.pending' };
}
