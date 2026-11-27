import type { RefundChain, RefundRecord } from './automatic-refunds.js';
export type RefundObservation = { row: RefundRecord; status?: Awaited<ReturnType<RefundChain['status']>>; error?: string };
// Fixed small fan-out, no retries, timers or unbounded RPC work. The payer lock
// stays held by the caller. Every launched read is awaited before returning.
export async function observeRefundHashes(rows: readonly RefundRecord[], chain: RefundChain): Promise<RefundObservation[]> {
  if (rows.length > 250 || rows.some((r) => !r.hash)) throw new Error('AUTO_REFUND_WATCH_IDENTITY');
  const results: RefundObservation[] = new Array(rows.length);
  let next = 0;
  async function worker() {
    while (next < rows.length) {
      const index = next++,
        row = rows[index];
      try {
        results[index] = { row, status: await chain.status(row.hash!) };
      } catch {
        results[index] = { row, error: 'AUTO_REFUND_OBSERVATION_UNAVAILABLE' };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, rows.length) }, worker));
  return results;
}
