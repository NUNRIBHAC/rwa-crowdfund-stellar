import { reconcileRefundWatch, watchExpiredRefund } from './automatic-refund-watch.js';
import { processRefund, TESTNET_PASSPHRASE, type RefundChain, type RefundPolicy, type RefundRecord, type RefundStore } from './automatic-refunds.js';

// One payer sequence stream across all recipients/campaigns. Persist the active
// envelope before the recipient row so a crash cannot leave an undiscoverable
// sequence reservation. Callers must share the same private durable directory.
// Pending/unknown transactions block NEW envelopes, even for other recipients.
export async function processRefundForPayer(
  payer: string,
  policy: RefundPolicy,
  chain: RefundChain,
  store: RefundStore,
  campaign: string,
  contributor: string,
): Promise<RefundRecord> {
  if (
    !policy.enabled ||
    policy.networkPassphrase !== TESTNET_PASSPHRASE ||
    policy.maxFeeStroops <= 0n ||
    !/^[a-f0-9]{64}$/.test(policy.reviewedWasmHash) ||
    !policy.approvedContracts.includes(campaign)
  )
    throw new Error('AUTO_REFUND_PAYER_POLICY');
  if (!/^G[A-Z2-7]{55}$/.test(payer)) throw new Error('AUTO_REFUND_PAYER_REQUIRED');
  const payerKey = JSON.stringify(['automatic-refund-payer', policy.networkPassphrase, payer]);
  const recipientKey = JSON.stringify([campaign, contributor]);
  return store.exclusive(payerKey, async () => {
    await reconcileRefundWatch(store, payerKey, chain);
    let active = await store.read(payerKey);
    if (active?.hash) {
      const activeKey = JSON.stringify([active.campaign, active.contributor]);
      const terminalRecipient = await store.read(activeKey);
      if (
        active.state === 'expired' &&
        terminalRecipient?.hash === active.hash &&
        (terminalRecipient.state === 'confirmed' || terminalRecipient.error === 'AUTO_REFUND_TRANSACTION_FAILED')
      ) {
        await store.write(payerKey, { campaign: '', contributor: '', state: 'pending' });
        active = undefined;
      }
      if (active?.hash) {
        // Reservation is a recovery journal. Recreate the recipient row after a
        // crash between reservation fsync and recipient fsync, without re-signing.
        const existing = await store.read(activeKey);
        if (existing?.hash && existing.hash !== active.hash) {
          const archived = active.attempts?.find((a) => a.hash === existing.hash);
          if (
            existing.state !== 'expired' ||
            existing.expiryProof?.outcome !== 'absent' ||
            !archived ||
            archived.signedXdr !== existing.signedXdr ||
            JSON.stringify(archived.proof) !== JSON.stringify(existing.expiryProof)
          )
            throw new Error('AUTO_REFUND_PAYER_JOURNAL_CONFLICT');
          await store.write(activeKey, active);
        }
        if (!existing?.hash || active.state === 'expired') await store.write(activeKey, active);
        if (active.state === 'expired') {
          await watchExpiredRefund(store, payerKey, active);
          if (!chain.expiry || !active.expiryProof || (await chain.status(active.hash)).state !== 'not_found')
            throw new Error('AUTO_REFUND_RECOVERY_DISAGREEMENT');
          const checked = await chain.expiry(active);
          if (!checked || checked.hash !== active.hash) throw new Error('AUTO_REFUND_RECOVERY_PROOF_MISMATCH');
          await store.write(payerKey, { campaign: '', contributor: '', state: 'pending' });
        } else if (activeKey !== recipientKey) {
          const status = await chain.status(active.hash);
          if (status.state === 'success') {
            if (status.refundedAmount === undefined || status.refundedAmount <= 0n || status.refundedAmount.toString() !== active.amount)
              throw new Error('AUTO_REFUND_PAYER_CONFIRMATION_MISMATCH');
            active = { ...active, state: 'confirmed', confirmedAmount: status.refundedAmount.toString(), signedXdr: undefined, error: undefined };
            await store.write(activeKey, active);
          } else if (status.state === 'failed') {
            active = { ...active, state: 'blocked', error: 'AUTO_REFUND_TRANSACTION_FAILED', signedXdr: undefined };
            await store.write(activeKey, active);
          } else {
            // No blind retry of another recipient in this bounded invocation.
            throw new Error('AUTO_REFUND_PAYER_SEQUENCE_BUSY');
          }
          await store.write(payerKey, { campaign: '', contributor: '', state: 'pending' });
        }
      }
    }
    const journal: RefundStore = {
      exclusive: (key, run) => store.exclusive(key, run),
      read: (key) => store.read(key),
      write: async (key, record) => {
        if (key !== recipientKey) throw new Error('AUTO_REFUND_PAYER_JOURNAL_KEY');
        if (record.hash && record.state !== 'expired' && record.state !== 'confirmed' && record.error !== 'AUTO_REFUND_TRANSACTION_FAILED')
          await store.write(payerKey, record);
        await store.write(key, record);
        if (record.state === 'expired' || record.state === 'confirmed' || record.error === 'AUTO_REFUND_TRANSACTION_FAILED')
          await store.write(payerKey, { campaign: '', contributor: '', state: 'pending' });
      },
    };
    return processRefund(policy, chain, journal, campaign, contributor);
  });
}
