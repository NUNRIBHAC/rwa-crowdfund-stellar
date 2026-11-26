import { describe, expect, test } from 'vitest';
import type { Intent } from './types';
import { paymentPath } from './payment-path';

const base: Intent = {
  hash: 'a'.repeat(64),
  campaign: 's1',
  actor: 'fixture',
  xdr: 'fixture',
  action: 'contribute',
  status: 'BUILT',
  amount: '10.1234567',
  feeStroops: '10100',
};

describe('testnet payment path display model', () => {
  test.each([
    ['BUILT', 'prepared'],
    ['SIGNED', 'signed'],
    ['PENDING', 'pending'],
    ['SUCCESS', 'confirmed'],
    ['FAILED', 'failed'],
    ['CANCELLED_UNSIGNED', 'cancelled'],
    ['NOT_FOUND', 'uncertain'],
    ['UNKNOWN', 'uncertain'],
    ['__proto__', 'uncertain'],
    ['constructor', 'uncertain'],
  ])('%s maps to %s without treating unknown history as failure', (status, expected) => {
    expect(paymentPath({ ...base, status }).state).toBe(expected);
  });
  test('contribution amount and maximum fee remain separate assets and exact strings', () => {
    expect(paymentPath(base)).toEqual({
      state: 'prepared',
      direction: 'escrow',
      preparedAmount: '10.1234567',
      maximumFeeStroops: '10100',
      chargedFeeStroops: null,
      confirmedTransferAmount: null,
    });
  });
  test('refund snapshot is a prepared amount, not proof of final receipt', () => {
    const view = paymentPath({ ...base, action: 'refund', status: 'SUCCESS' });
    expect(view.direction).toBe('wallet');
    expect(view.preparedAmount).toBe(base.amount);
    expect(view.confirmedTransferAmount).toBeNull();
    expect(view.chargedFeeStroops).toBeNull();
  });
  test.each(['0', '-1', '1e6', 'NaN', 'Infinity', '1.12345678', '<script>', '9'.repeat(1000), '170141183460469231731687303715884.105728'])(
    'invalid amount %s remains unknown',
    (amount) => {
      expect(paymentPath({ ...base, amount }).preparedAmount).toBeNull();
    },
  );
  test.each(['0.1', '-1', '1e5', 'NaN', '4294967296', '9'.repeat(1000)])('invalid fee %s remains unknown', (feeStroops) => {
    expect(paymentPath({ ...base, feeStroops }).maximumFeeStroops).toBeNull();
  });
  test('missing amount and fee are not fabricated as zero', () => {
    const view = paymentPath({ ...base, amount: undefined, feeStroops: undefined });
    expect(view.preparedAmount).toBeNull();
    expect(view.maximumFeeStroops).toBeNull();
  });
  test.each(['withdraw', 'unsupported', '__proto__'])('%s has no invented contribution/refund amount', (action) => {
    expect(paymentPath({ ...base, action }).preparedAmount).toBeNull();
    expect(paymentPath({ ...base, action }).direction).toBe('unknown');
  });
  test('does not mutate retained transaction or expose envelope fields', () => {
    const intent = Object.freeze({ ...base, signedXdr: 'retained' });
    const view = paymentPath(intent);
    expect(view).not.toHaveProperty('xdr');
    expect(view).not.toHaveProperty('signedXdr');
    expect(intent.status).toBe('BUILT');
  });
});

test('confirmed amount requires exact hash, conclusive ledger and SUCCESS, never a prepared amount', () => {
  const evidence = { hash: base.hash, ledger: 123, confirmedAmount: '9.5' };
  expect(paymentPath({ ...base, status: 'SUCCESS', paymentEvidence: evidence }).confirmedTransferAmount).toBe('9.5');
  for (const status of ['BUILT', 'PENDING', 'NOT_FOUND', 'FAILED'])
    expect(paymentPath({ ...base, status, paymentEvidence: evidence }).confirmedTransferAmount).toBeNull();
  for (const paymentEvidence of [
    { ...evidence, hash: 'b'.repeat(64) },
    { ...evidence, ledger: 0 },
    { ...evidence, ledger: NaN },
    { ...evidence, confirmedAmount: null },
  ]) {
    expect(paymentPath({ ...base, status: 'SUCCESS', paymentEvidence }).confirmedTransferAmount).toBeNull();
  }
});

test.each(['', 'fixture', 'A'.repeat(64), 'a'.repeat(63), 'a'.repeat(65)])('invalid transaction identity %s cannot establish confirmed amount', (hash) => {
  expect(paymentPath({ ...base, hash, status: 'SUCCESS', paymentEvidence: { hash, ledger: 123, confirmedAmount: '1' } }).confirmedTransferAmount).toBeNull();
});
