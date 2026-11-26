import type { Intent } from './types';

export type PaymentPathState = 'prepared' | 'signed' | 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'uncertain';
export type PaymentPath = {
  state: PaymentPathState;
  direction: 'escrow' | 'wallet' | 'unknown';
  preparedAmount: string | null;
  maximumFeeStroops: string | null;
  // A build simulation is not proof of the fee charged or the final transfer.
  chargedFeeStroops: null;
  confirmedTransferAmount: string | null;
};

const STATES: Record<string, PaymentPathState> = {
  BUILT: 'prepared',
  SIGNED: 'signed',
  PENDING: 'pending',
  SUCCESS: 'confirmed',
  FAILED: 'failed',
  CANCELLED_UNSIGNED: 'cancelled',
  NOT_FOUND: 'uncertain',
};
const MAX_I128 = (1n << 127n) - 1n;
function amount(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{1,32}(?:\.\d{1,7})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const units = BigInt(whole) * 10000000n + BigInt(fraction.padEnd(7, '0'));
  return units > 0n && units <= MAX_I128 ? value : null;
}
function maximumFee(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{1,10}$/.test(value)) return null;
  return BigInt(value) <= 4294967295n ? value : null;
}

/** Display-only view of the retained exact transaction. No network or storage. */
export function paymentPath(intent: Intent): PaymentPath {
  const direction = intent.action === 'contribute' ? 'escrow' : intent.action === 'refund' ? 'wallet' : 'unknown';
  const known = Object.prototype.hasOwnProperty.call(STATES, intent.status);
  return {
    state: known ? STATES[intent.status] : 'uncertain',
    direction,
    preparedAmount: direction === 'unknown' ? null : amount(intent.amount),
    maximumFeeStroops: maximumFee(intent.feeStroops),
    chargedFeeStroops: null,
    confirmedTransferAmount:
      /^[a-f0-9]{64}$/.test(intent.hash) &&
      intent.status === 'SUCCESS' &&
      intent.paymentEvidence?.hash === intent.hash &&
      Number.isSafeInteger(intent.paymentEvidence.ledger) &&
      intent.paymentEvidence.ledger > 0
        ? amount(intent.paymentEvidence.confirmedAmount)
        : null,
  };
}
