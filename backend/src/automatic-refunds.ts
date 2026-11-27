import type { ExpiryProof } from './automatic-refund-expiry-proof.js';
// Automatic refunds are opt-in and testnet-only. This module never accepts a
// caller-selected payee or amount: the chain adapter derives both from balances.
export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
export type RefundState = 'pending' | 'signed' | 'submitted' | 'confirmed' | 'blocked' | 'expired';
export type RefundAttempt = { hash: string; signedXdr: string; amount: string; feeStroops: string; proof: ExpiryProof };
export type RefundRecord = {
  campaign: string;
  contributor: string;
  state: RefundState;
  hash?: string;
  signedXdr?: string;
  amount?: string;
  feeStroops?: string;
  confirmedAmount?: string;
  error?: string;
  expiryProof?: ExpiryProof;
  attempts?: RefundAttempt[];
  watched?: RefundRecord[];
  retirement?: {
    reason: string;
    status: string;
    source?: string;
    oldestLedger?: number;
    latestLedger?: number;
    oldestCloseTime?: number;
    latestCloseTime?: number;
    recipientState: string;
    recordedAt: number;
  };
};
export type RefundPolicy = {
  enabled: boolean;
  networkPassphrase: string;
  reviewedWasmHash: string;
  approvedContracts: readonly string[];
  maxFeeStroops: bigint;
};
export type Inspection = {
  networkPassphrase: string;
  wasmHash: string;
  deadline: number;
  ledgerTimestamp: number;
  goal: bigint;
  raised: bigint;
  balance: bigint;
};
export interface RefundChain {
  expiry?(record: RefundRecord): Promise<ExpiryProof | undefined>;
  inspect(campaign: string, contributor: string): Promise<Inspection>;
  prepare(
    campaign: string,
    contributor: string,
  ): Promise<{
    hash: string;
    signedXdr: string;
    amount: bigint;
    feeStroops: bigint;
    // The adapter must decode its final signed envelope and establish these.
    contract: string;
    recipient: string;
    method: string;
    networkPassphrase: string;
  }>;
  submit(signedXdr: string): Promise<void>;
  status(hash: string): Promise<{
    state: 'pending' | 'not_found' | 'failed' | 'success';
    refundedAmount?: bigint;
    oldestCloseTime?: number;
    oldestLedger?: number;
    latestLedger?: number;
    latestCloseTime?: number;
    source?: string;
  }>;
}
export interface RefundStore {
  // Must be cross-process exclusive and durable. Callback writes must be
  // committed before resolving, especially before submit is invoked.
  exclusive<T>(key: string, run: () => Promise<T>): Promise<T>;
  read(key: string): Promise<RefundRecord | undefined>;
  write(key: string, record: RefundRecord): Promise<void>;
}
export async function processRefund(
  policy: RefundPolicy,
  chain: RefundChain,
  store: RefundStore,
  campaign: string,
  contributor: string,
): Promise<RefundRecord> {
  if (!policy.enabled) throw new Error('AUTO_REFUND_DISABLED');
  if (policy.networkPassphrase !== TESTNET_PASSPHRASE) throw new Error('AUTO_REFUND_TESTNET_ONLY');
  if (!/^[a-f0-9]{64}$/.test(policy.reviewedWasmHash) || !policy.approvedContracts.includes(campaign)) throw new Error('AUTO_REFUND_CONTRACT_NOT_APPROVED');
  if (policy.maxFeeStroops <= 0n) throw new Error('AUTO_REFUND_FEE_LIMIT_REQUIRED');
  const key = JSON.stringify([campaign, contributor]);
  return store.exclusive(key, async () => {
    let row = (await store.read(key)) ?? { campaign, contributor, state: 'pending' as const };
    if (row.campaign !== campaign || row.contributor !== contributor) throw new Error('AUTO_REFUND_STORE_IDENTITY_MISMATCH');
    if (row.error === 'AUTO_REFUND_HISTORY_UNKNOWN') return row;
    if (row.state === 'confirmed' || (row.state === 'blocked' && row.error === 'AUTO_REFUND_TRANSACTION_FAILED')) return row;
    const save = async (next: RefundRecord): Promise<RefundRecord> => {
      await store.write(key, next);
      row = next;
      return next;
    };
    if (row.state === 'expired') {
      if (row.expiryProof?.outcome !== 'absent' || row.expiryProof.hash !== row.hash || !row.hash || !row.signedXdr || !row.amount || !row.feeStroops)
        return row;
      if ((row.attempts?.length ?? 0) >= 10) throw new Error('AUTO_REFUND_RECOVERY_ATTEMPT_LIMIT');
      // A later disagreement must stop replacement, even after a saved proof.
      if ((await chain.status(row.hash)).state !== 'not_found') throw new Error('AUTO_REFUND_RECOVERY_DISAGREEMENT');
      await save({
        campaign,
        contributor,
        state: 'pending',
        attempts: [
          ...(row.attempts ?? []),
          {
            hash: row.hash,
            signedXdr: row.signedXdr,
            amount: row.amount,
            feeStroops: row.feeStroops,
            proof: row.expiryProof,
          },
        ],
      });
    }
    for (const attempt of row.attempts ?? []) {
      if ((await chain.status(attempt.hash)).state !== 'not_found') throw new Error('AUTO_REFUND_RECOVERY_DISAGREEMENT');
    }
    // A stored signed hash is never replaced on a timeout, missing history or
    // an ambiguous submission. Reconcile it, or retry the exact same envelope.
    if (row.hash) {
      const status = await chain.status(row.hash);
      if (status.state === 'success') {
        if (status.refundedAmount === undefined || status.refundedAmount <= 0n || status.refundedAmount.toString() !== row.amount)
          return save({ ...row, state: 'blocked', error: 'AUTO_REFUND_CONFIRMATION_MISMATCH' });
        return save({ ...row, state: 'confirmed', confirmedAmount: status.refundedAmount.toString(), error: undefined, signedXdr: undefined });
      }
      if (status.state === 'failed') return save({ ...row, state: 'blocked', error: 'AUTO_REFUND_TRANSACTION_FAILED' });
      if (status.state === 'pending') return row;
      if (!row.signedXdr) return save({ ...row, state: 'blocked', error: 'AUTO_REFUND_SIGNED_ENVELOPE_MISSING' });
      try {
        await chain.submit(row.signedXdr);
        return save({ ...row, state: 'submitted', error: undefined });
      } catch {
        return save({ ...row, error: 'AUTO_REFUND_SUBMISSION_UNCERTAIN' });
      }
    }
    const facts = await chain.inspect(campaign, contributor);
    if (facts.networkPassphrase !== TESTNET_PASSPHRASE || facts.wasmHash !== policy.reviewedWasmHash)
      return save({ ...row, state: 'blocked', error: 'AUTO_REFUND_CHAIN_IDENTITY_MISMATCH' });
    if (facts.ledgerTimestamp < facts.deadline || facts.raised >= facts.goal) return save({ ...row, state: 'pending', error: 'AUTO_REFUND_NOT_ELIGIBLE' });
    // A zero balance alone proves no payment. It may have been refunded
    // manually, or never contributed. Do not invent a confirmed refund.
    if (facts.balance <= 0n) return save({ ...row, state: 'pending', error: 'AUTO_REFUND_NO_BALANCE' });
    const tx = await chain.prepare(campaign, contributor);
    if (
      tx.networkPassphrase !== TESTNET_PASSPHRASE ||
      tx.contract !== campaign ||
      tx.recipient !== contributor ||
      tx.method !== 'refund_for' ||
      tx.amount !== facts.balance
    )
      return save({ ...row, state: 'blocked', error: 'AUTO_REFUND_ENVELOPE_MISMATCH' });
    if (tx.feeStroops <= 0n || tx.feeStroops > policy.maxFeeStroops) return save({ ...row, state: 'blocked', error: 'AUTO_REFUND_FEE_LIMIT' });
    if (!/^[a-f0-9]{64}$/.test(tx.hash) || !tx.signedXdr) return save({ ...row, state: 'blocked', error: 'AUTO_REFUND_INVALID_ENVELOPE' });
    await save({
      attempts: row.attempts,
      campaign,
      contributor,
      state: 'signed',
      hash: tx.hash,
      signedXdr: tx.signedXdr,
      amount: tx.amount.toString(),
      feeStroops: tx.feeStroops.toString(),
    });
    try {
      await chain.submit(tx.signedXdr);
      return save({ ...row, state: 'submitted' });
    } catch {
      return save({ ...row, error: 'AUTO_REFUND_SUBMISSION_UNCERTAIN' });
    }
  });
}
