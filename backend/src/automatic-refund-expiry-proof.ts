import { Transaction } from '@stellar/stellar-sdk';
import { verifyRefundEnvelope } from './automatic-refund-envelope.js';
import { TESTNET_PASSPHRASE, type RefundRecord } from './automatic-refunds.js';
import type { RefundRpc, TestnetRefundAdapterOptions } from './automatic-refund-rpc.js';
export type ExpiryProof = {
  source?: string;
  hash: string;
  outcome: 'absent' | 'history_unknown';
  minTime: number;
  maxTime: number;
  oldestLedger: number;
  oldestCloseTime: number;
  latestLedger: number;
  latestCloseTime: number;
};
// This function never signs, simulates, submits or infers a payment.
export async function proveRefundExpiry(
  row: RefundRecord,
  options: TestnetRefundAdapterOptions,
  server: RefundRpc,
  now: number,
): Promise<ExpiryProof | undefined> {
  if (!row.hash || !row.signedXdr || !options.contracts[row.campaign]) throw new Error('AUTO_REFUND_RECOVERY_ENVELOPE_MISSING');
  const tx = new Transaction(row.signedXdr, TESTNET_PASSPHRASE);
  const maxTime = Number(tx.timeBounds?.maxTime ?? 0);
  const minTime = Number(tx.timeBounds?.minTime ?? 0);
  if (!Number.isSafeInteger(maxTime) || maxTime < 2 || !Number.isSafeInteger(minTime) || minTime < 0 || minTime >= maxTime)
    throw new Error('AUTO_REFUND_RECOVERY_BOUNDS');
  const checked = verifyRefundEnvelope(row.signedXdr, {
    payer: options.payer,
    contract: row.campaign,
    contributor: row.contributor,
    sequence: tx.sequence,
    hash: row.hash,
    maxFeeStroops: options.maxFeeStroops,
    // Historical verification must not reject an authentic expired envelope.
    // This does NOT establish expiry; only the RPC close time below does.
    now: maxTime - 1,
    maxLifetimeSeconds: 1,
  });
  if (checked.feeStroops.toString() !== row.feeStroops || !row.amount || !/^[1-9][0-9]*$/.test(row.amount))
    throw new Error('AUTO_REFUND_RECOVERY_RECORD_MISMATCH');
  if ((await server.getNetwork()).passphrase !== TESTNET_PASSPHRASE) throw new Error('AUTO_REFUND_NETWORK_MISMATCH');
  const result = await server.getTransaction(row.hash);
  if (result.txHash !== row.hash) throw new Error('AUTO_REFUND_RECOVERY_HASH_MISMATCH');
  if (result.status !== 'NOT_FOUND') return undefined;
  const oldestCloseTime = Number(result.oldestLedgerCloseTime);
  const latestCloseTime = Number(result.latestLedgerCloseTime);
  if (
    ![now, oldestCloseTime, latestCloseTime, result.oldestLedger, result.latestLedger].every(Number.isSafeInteger) ||
    oldestCloseTime <= 0 ||
    latestCloseTime < oldestCloseTime ||
    result.oldestLedger < 1 ||
    result.latestLedger < result.oldestLedger ||
    Math.abs(now - latestCloseTime) > 60
  )
    throw new Error('AUTO_REFUND_RECOVERY_STALE_HISTORY');
  if (latestCloseTime <= maxTime) return undefined;
  return {
    source: options.rpcUrl,
    hash: row.hash,
    outcome: minTime > 0 && oldestCloseTime < minTime ? 'absent' : 'history_unknown',
    minTime,
    maxTime,
    oldestLedger: result.oldestLedger,
    oldestCloseTime,
    latestLedger: result.latestLedger,
    latestCloseTime,
  };
}
