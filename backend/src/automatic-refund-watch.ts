import { observeRefundHashes } from './automatic-refund-observe.js';
import type { RefundChain, RefundRecord, RefundStore } from './automatic-refunds.js';
// Kept separately from the single active reservation, so clearing that
// reservation never drops reconciliation or a durable stream-wide halt.
export function refundWatchKey(payerKey: string): string {
  return JSON.stringify(['refund-history-watch', payerKey]);
}
export async function watchExpiredRefund(store: RefundStore, payerKey: string, row: RefundRecord): Promise<void> {
  const key = refundWatchKey(payerKey);
  const watch = (await store.read(key)) ?? { campaign: '', contributor: '', state: 'pending' as const, watched: [] };
  if (watch.error) throw new Error('AUTO_REFUND_STREAM_HALTED');
  const watched = watch.watched ?? [];
  if (watched.some((r) => r.hash === row.hash)) return;
  if (watched.length >= 250) throw new Error('AUTO_REFUND_WATCH_LIMIT');
  await store.write(key, { ...watch, watched: [...watched, row] });
}
async function archiveRetired(
  store: RefundStore,
  payerKey: string,
  row: RefundRecord,
  status: Awaited<ReturnType<RefundChain['status']>>,
  recipientState: string,
): Promise<void> {
  const key = JSON.stringify(['refund-retired-history', payerKey, row.hash]);
  if (await store.read(key)) return; // first evidence is immutable and crash-idempotent
  await store.write(key, {
    ...row,
    retirement: {
      reason: status.state === 'not_found' ? 'outside_rpc_retention' : 'terminal_reconciled',
      status: status.state,
      source: status.source ?? row.expiryProof?.source ?? 'adapter',
      oldestLedger: status.oldestLedger,
      latestLedger: status.latestLedger,
      oldestCloseTime: status.oldestCloseTime,
      latestCloseTime: status.latestCloseTime,
      recipientState,
      recordedAt: Math.floor(Date.now() / 1000),
    },
  });
}
export async function reconcileRefundWatch(store: RefundStore, payerKey: string, chain: RefundChain): Promise<void> {
  const key = refundWatchKey(payerKey),
    watch = await store.read(key);
  if (!watch) return;
  if (watch.error) throw new Error('AUTO_REFUND_STREAM_HALTED');
  const observations = await observeRefundHashes(watch.watched ?? [], chain);
  // No state changes or signing can follow a partial read set. All four
  // workers have settled, so no status read remains racing a journal write.
  if (observations.some((r) => r.error || !r.status)) throw new Error('AUTO_REFUND_OBSERVATION_UNAVAILABLE');
  for (const { row, status: observed } of observations) {
    if (!row.hash) throw new Error('AUTO_REFUND_WATCH_IDENTITY');
    const status = observed!;
    const canonicalSource = (source: string) => {
      try {
        return new URL(source).href;
      } catch {
        return source;
      }
    };
    if (row.expiryProof?.source && status.source && canonicalSource(row.expiryProof.source) !== canonicalSource(status.source)) {
      await store.write(key, { ...watch, state: 'blocked', error: 'AUTO_REFUND_STREAM_SOURCE_CHANGED' });
      throw new Error('AUTO_REFUND_STREAM_HALTED');
    }
    if (status.state === 'not_found') {
      if (row.expiryProof && status.oldestCloseTime && status.oldestCloseTime > row.expiryProof.maxTime) {
        // Beyond retained history this endpoint cannot add historical evidence.
        // Archive before removing from the active watch. Never reset recipient.
        await archiveRetired(store, payerKey, row, status, row.state);
        watch.watched = (watch.watched ?? []).filter((r) => r.hash !== row.hash);
        await store.write(key, watch);
      }
      continue;
    }
    if (
      row.expiryProof?.outcome === 'absent' ||
      status.state === 'pending' ||
      (status.state === 'success' && (status.refundedAmount?.toString() !== row.amount || !status.refundedAmount || status.refundedAmount <= 0n))
    ) {
      await store.write(key, { ...watch, state: 'blocked', error: 'AUTO_REFUND_STREAM_DISAGREEMENT' });
      throw new Error('AUTO_REFUND_STREAM_HALTED');
    }
    const recipientKey = JSON.stringify([row.campaign, row.contributor]);
    const current = await store.read(recipientKey);
    if (current?.hash !== row.hash) {
      await store.write(key, { ...watch, state: 'blocked', error: 'AUTO_REFUND_STREAM_DISAGREEMENT' });
      throw new Error('AUTO_REFUND_STREAM_HALTED');
    }
    if (status.state === 'success')
      await store.write(recipientKey, {
        ...current,
        state: 'confirmed',
        confirmedAmount: status.refundedAmount!.toString(),
        error: undefined,
        signedXdr: undefined,
      });
    else if (status.state === 'failed') await store.write(recipientKey, { ...current, state: 'blocked', error: 'AUTO_REFUND_TRANSACTION_FAILED' });
    await archiveRetired(store, payerKey, row, status, status.state === 'success' ? 'confirmed' : 'blocked');
    watch.watched = (watch.watched ?? []).filter((r) => r.hash !== row.hash);
    await store.write(key, watch);
  }
}
