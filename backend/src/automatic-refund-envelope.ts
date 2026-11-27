import { Address, Keypair, Transaction } from '@stellar/stellar-sdk';
import { TESTNET_PASSPHRASE } from './automatic-refunds.js';

export type EnvelopeExpectation = {
  payer: string;
  contract: string;
  contributor: string;
  sequence: string;
  hash: string;
  maxFeeStroops: bigint;
  now: number;
  maxLifetimeSeconds: number;
};

// Decode the serialized final envelope, never trust the preparation adapter's
// own summary. Network is bound by both the local hash and payer signature.
// The sole supported authority shape is a normal single-key payer transaction.
export function verifyRefundEnvelope(signedXdr: string, expected: EnvelopeExpectation): { hash: string; feeStroops: bigint; expiresAt: number } {
  return verifyEnvelope(signedXdr, expected, true);
}
export function verifyUnsignedRefundEnvelope(unsignedXdr: string, expected: EnvelopeExpectation): { hash: string; feeStroops: bigint; expiresAt: number } {
  return verifyEnvelope(unsignedXdr, expected, false);
}
function verifyEnvelope(signedXdr: string, expected: EnvelopeExpectation, signed: boolean): { hash: string; feeStroops: bigint; expiresAt: number } {
  if (
    !Number.isSafeInteger(expected.now) ||
    expected.now < 0 ||
    !Number.isSafeInteger(expected.maxLifetimeSeconds) ||
    expected.maxLifetimeSeconds < 1 ||
    expected.maxLifetimeSeconds > 300
  )
    throw new Error('AUTO_REFUND_INVALID_CLOCK_POLICY');
  if (expected.maxFeeStroops <= 0n) throw new Error('AUTO_REFUND_FEE_LIMIT_REQUIRED');
  const tx = new Transaction(signedXdr, TESTNET_PASSPHRASE);
  if (tx.toEnvelope().type !== 'envelopeTypeTx') throw new Error('AUTO_REFUND_ENVELOPE_TYPE');
  if (tx.source !== expected.payer || tx.sequence !== expected.sequence || !/^[1-9][0-9]*$/.test(expected.sequence))
    throw new Error('AUTO_REFUND_PAYER_SEQUENCE');
  if (
    tx.memo.type !== 'none' ||
    tx.extraSigners?.length ||
    tx.ledgerBounds ||
    tx.minAccountSequence ||
    tx.minAccountSequenceAge ||
    tx.minAccountSequenceLedgerGap
  )
    throw new Error('AUTO_REFUND_EXTRA_CONDITIONS');
  const bounds = tx.timeBounds;
  if (
    !bounds ||
    BigInt(bounds.minTime) > BigInt(expected.now) ||
    BigInt(bounds.maxTime) <= BigInt(expected.now) ||
    BigInt(bounds.maxTime) > BigInt(expected.now + expected.maxLifetimeSeconds)
  )
    throw new Error('AUTO_REFUND_EXPIRATION');
  const feeStroops = BigInt(tx.fee);
  const ext = tx.tx.ext;
  if (ext.type !== 'sorobanData' || ext.sorobanData.resourceFee < 0n || feeStroops <= ext.sorobanData.resourceFee || feeStroops > expected.maxFeeStroops)
    throw new Error('AUTO_REFUND_FULL_FEE_LIMIT');
  if (tx.operations.length !== 1) throw new Error('AUTO_REFUND_OPERATION_COUNT');
  const op = tx.operations[0];
  if (op.type !== 'invokeHostFunction' || (op.source && op.source !== expected.payer) || op.func.type !== 'hostFunctionTypeInvokeContract' || op.auth?.length)
    throw new Error('AUTO_REFUND_OPERATION_AUTH');
  const call = op.func.invokeContract;
  if (
    Address.fromScAddress(call.contractAddress).toString() !== expected.contract ||
    call.functionName.toString() !== 'refund_for' ||
    call.args.length !== 1 ||
    Address.fromScVal(call.args[0]).toString() !== expected.contributor
  )
    throw new Error('AUTO_REFUND_CALL_MISMATCH');
  const hash = Buffer.from(tx.hash()).toString('hex');
  if (hash !== expected.hash || !/^[a-f0-9]{64}$/.test(expected.hash)) throw new Error('AUTO_REFUND_HASH_MISMATCH');
  const signer = Keypair.fromPublicKey(expected.payer);
  if (!signed) {
    if (tx.signatures.length) throw new Error('AUTO_REFUND_UNEXPECTED_PREPARATION_SIGNATURE');
    return { hash, feeStroops, expiresAt: Number(bounds.maxTime) };
  }
  if (
    tx.signatures.length !== 1 ||
    !Buffer.from(tx.signatures[0].hint.toXdrObject()).equals(Buffer.from(signer.signatureHint())) ||
    !signer.verify(tx.hash(), tx.signatures[0].signature)
  )
    throw new Error('AUTO_REFUND_SIGNATURE_MISMATCH');
  return { hash, feeStroops, expiresAt: Number(bounds.maxTime) };
}
