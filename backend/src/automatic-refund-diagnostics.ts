import { observeRefundHashes } from './automatic-refund-observe.js';
import { refundWatchKey } from './automatic-refund-watch.js';
import { TESTNET_PASSPHRASE, type RefundChain, type RefundStore } from './automatic-refunds.js';
// Evidence-only. No journal writes, clear operation, signer, inspect, prepare or
// submit. A poisoned stream stays poisoned regardless of the returned evidence.
export async function diagnoseRefundPayer(payer: string, store: RefundStore, chain: RefundChain) {
  if (!/^G[A-Z2-7]{55}$/.test(payer)) throw new Error('AUTO_REFUND_PAYER_REQUIRED');
  const key = JSON.stringify(['automatic-refund-payer', TESTNET_PASSPHRASE, payer]);
  {
    const watch = await store.read(refundWatchKey(key));
    const active = await store.read(key);
    const rows = [...(watch?.watched ?? [])];
    if (active?.hash && !rows.some((r) => r.hash === active.hash)) rows.push(active);
    if (rows.length > 250) throw new Error('AUTO_REFUND_DIAGNOSTIC_LIMIT');
    const observations = await observeRefundHashes(rows, chain);
    return {
      network: TESTNET_PASSPHRASE,
      payer,
      streamHalted: !!watch?.error,
      haltCode: watch?.error,
      activeHash: active?.hash,
      observations: observations.map(({ row, status, error }) => ({
        hash: row.hash,
        campaign: row.campaign,
        contributor: row.contributor,
        recordedState: row.state,
        recordedAmount: row.amount,
        expiryProof: row.expiryProof,
        status: status ? { ...status, refundedAmount: status.refundedAmount?.toString() } : undefined,
        error,
      })),
      snapshotUnchanged:
        JSON.stringify(watch) === JSON.stringify(await store.read(refundWatchKey(key))) && JSON.stringify(active) === JSON.stringify(await store.read(key)),
      disposition: 'UNLOCKED_OBSERVATIONS_ONLY_NO_RESET_NO_RETRY_NO_PAYMENT_INFERENCE',
    };
  }
}
