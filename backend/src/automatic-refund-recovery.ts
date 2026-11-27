import { reconcileRefundWatch, watchExpiredRefund } from './automatic-refund-watch.js';
import { TESTNET_PASSPHRASE, type RefundChain, type RefundPolicy, type RefundRecord, type RefundStore } from './automatic-refunds.js';
// Explicit operator recovery only. Does not sign or send. A later normal batch
// may replace only a proved-absent attempt. Unknown history stays blocked.
export async function recoverExpiredRefundForPayer(
  payer: string,
  policy: RefundPolicy,
  chain: RefundChain,
  store: RefundStore,
): Promise<RefundRecord | undefined> {
  if (!policy.enabled || policy.networkPassphrase !== TESTNET_PASSPHRASE || policy.maxFeeStroops <= 0n || !/^G[A-Z2-7]{55}$/.test(payer) || !chain.expiry)
    throw new Error('AUTO_REFUND_RECOVERY_POLICY');
  const payerKey = JSON.stringify(['automatic-refund-payer', policy.networkPassphrase, payer]);
  return store.exclusive(payerKey, async () => {
    await reconcileRefundWatch(store, payerKey, chain);
    const active = await store.read(payerKey);
    if (!active?.hash) return undefined;
    if (!policy.approvedContracts.includes(active.campaign)) throw new Error('AUTO_REFUND_CONTRACT_NOT_APPROVED');
    const key = JSON.stringify([active.campaign, active.contributor]);
    const prior = await store.read(key);
    if (prior?.hash && prior.hash !== active.hash) throw new Error('AUTO_REFUND_PAYER_JOURNAL_CONFLICT');
    if (prior?.state === 'confirmed' || prior?.error === 'AUTO_REFUND_TRANSACTION_FAILED') {
      await store.write(payerKey, { campaign: '', contributor: '', state: 'pending' });
      return prior;
    }
    // After a crash, re-query proof instead of trusting a stored expiry flag.
    const status = await chain.status(active.hash);
    if (status.state !== 'not_found') throw new Error('AUTO_REFUND_RECOVERY_RECONCILE_REQUIRED');
    const proof = await chain.expiry!(active);
    if (!proof) return active;
    if (proof.hash !== active.hash || proof.latestCloseTime <= proof.maxTime) throw new Error('AUTO_REFUND_RECOVERY_PROOF_MISMATCH');
    const terminal: RefundRecord = {
      ...active,
      state: 'expired',
      expiryProof: proof,
      error: proof.outcome === 'absent' ? 'AUTO_REFUND_EXPIRED_ABSENT' : 'AUTO_REFUND_HISTORY_UNKNOWN',
    };
    // Payer first makes the transition recoverable if the recipient fsync fails.
    await watchExpiredRefund(store, payerKey, terminal);
    await store.write(payerKey, terminal);
    await store.write(key, terminal);
    await store.write(payerKey, { campaign: '', contributor: '', state: 'pending' });
    return terminal;
  });
}
