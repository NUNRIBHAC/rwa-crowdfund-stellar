import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Account, Address, Keypair, Memo, Networks, Operation, SorobanDataBuilder, StrKey, Transaction, TransactionBuilder, xdr } from '@stellar/stellar-sdk';
import { verifyRefundEnvelope, verifyUnsignedRefundEnvelope, type EnvelopeExpectation } from '../src/automatic-refund-envelope.ts';

// Ephemeral in-memory fixture keys only, never funded or sent to a network.
function fixture(
  change: {
    network?: string;
    method?: string;
    count?: number;
    fee?: string;
    resourceFee?: bigint;
    maxTime?: number;
    minTime?: number;
    sign?: boolean;
    otherSigner?: boolean;
    memo?: boolean;
    source?: string;
    arg?: string;
    omitData?: boolean;
  } = {},
) {
  const payer = Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(7));
  const other = Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(8));
  const contract = StrKey.encodeContract(new Uint8Array(32).fill(9));
  const contributor = other.publicKey();
  const now = 1800000000;
  const builder = new TransactionBuilder(new Account(payer.publicKey(), '11'), {
    fee: change.fee ?? '300',
    networkPassphrase: change.network ?? Networks.TESTNET,
    timebounds: { minTime: change.minTime ?? 0, maxTime: change.maxTime ?? now + 60 },
  });
  for (let n = 0; n < (change.count ?? 1); n++)
    builder.addOperation(
      Operation.invokeContractFunction({
        contract,
        function: change.method ?? 'refund_for',
        args: [new Address(change.arg ?? contributor).toScVal()],
        source: change.source,
      }),
    );
  if (!change.omitData)
    builder.setSorobanData(
      new SorobanDataBuilder()
        .setResourceFee(change.resourceFee !== undefined && change.resourceFee >= 0n && change.resourceFee <= 300n ? change.resourceFee : 100n)
        .build(),
    );
  let tx = builder.build();
  // Construct hostile envelopes below the builder's safety checks, so the
  // verifier, rather than the fixture builder, must reject them.
  if (change.memo || (change.resourceFee !== undefined && (change.resourceFee < 0n || change.resourceFee > 300n))) {
    const wire = tx.toEnvelope().toXdrObject();
    if (wire.type !== 2 || wire.v1.tx.ext.v !== 1) throw Error('fixture');
    if (change.memo) wire.v1.tx.memo = Memo.text('unexpected').toXDRObject().toXdrObject();
    if (change.resourceFee !== undefined) {
      wire.v1.tx.ext.sorobanData.resourceFee = change.resourceFee;
      wire.v1.tx.fee = 300;
    }
    tx = new Transaction(xdr.TransactionEnvelope.fromXdrObject(wire), change.network ?? Networks.TESTNET);
  }
  if (change.sign !== false) tx.sign(change.otherSigner ? other : payer);
  const expected: EnvelopeExpectation = {
    payer: payer.publicKey(),
    contract,
    contributor,
    sequence: '12',
    hash: Buffer.from(tx.hash()).toString('hex'),
    maxFeeStroops: 1000n,
    now,
    maxLifetimeSeconds: 120,
  };
  return { xdr: tx.toXDR(), expected };
}
test('decodes final signed testnet envelope, validates local hash/signature and total fee', () => {
  const f = fixture();
  assert.deepEqual(verifyRefundEnvelope(f.xdr, f.expected), { hash: f.expected.hash, feeStroops: 400n, expiresAt: f.expected.now + 60 });
});
for (const [name, change] of [
  ['mainnet signature', { network: Networks.PUBLIC }],
  ['wrong method', { method: 'withdraw' }],
  ['extra operation', { count: 2 }],
  ['no operation', { count: 0 }],
  ['full fee above ceiling', { fee: '1001' }],
  ['resource fee greater than total', { resourceFee: 301n }],
  ['negative resource fee', { resourceFee: -1n }],
  ['expired', { maxTime: 1800000000 }],
  ['infinite expiration', { maxTime: 0 }],
  ['unbounded lifetime', { maxTime: 1800000301 }],
  ['future valid-from', { minTime: 1800000001 }],
  ['unsigned', { sign: false }],
  ['wrong signer', { otherSigner: true }],
  ['memo', { memo: true }],
  ['no Soroban resources', { omitData: true }],
] as const)
  test('rejects ' + name, () => {
    const f = fixture(change);
    assert.throws(() => verifyRefundEnvelope(f.xdr, f.expected));
  });
for (const [name, change] of [
  ['hash', { hash: 'a'.repeat(64) }],
  ['sequence', { sequence: '13' }],
  ['contract', { contract: StrKey.encodeContract(new Uint8Array(32).fill(10)) }],
  ['recipient', { contributor: StrKey.encodeEd25519PublicKey(new Uint8Array(32).fill(11)) }],
  ['fee cap disabled', { maxFeeStroops: 0n }],
  ['unsafe clock', { now: NaN }],
  ['policy lifetime too long', { maxLifetimeSeconds: 301 }],
] as const)
  test('rejects wrong expected ' + name, () => {
    const f = fixture();
    assert.throws(() => verifyRefundEnvelope(f.xdr, { ...f.expected, ...change }));
  });
test('rejects operation source override', () => {
  const f = fixture({ source: StrKey.encodeEd25519PublicKey(new Uint8Array(32).fill(12)) });
  assert.throws(() => verifyRefundEnvelope(f.xdr, f.expected));
});
test('rejects malformed serialization', () => {
  assert.throws(() => verifyRefundEnvelope('not xdr', fixture().expected));
});

test('unsigned preparation is checked before any signer is called', () => {
  const f = fixture({ sign: false });
  assert.equal(verifyUnsignedRefundEnvelope(f.xdr, f.expected).feeStroops, 400n);
  const bad = fixture({ sign: false, method: 'withdraw' });
  assert.throws(() => verifyUnsignedRefundEnvelope(bad.xdr, bad.expected));
});
test('unsigned preparation cannot contain a preexisting signature', () => {
  const f = fixture();
  assert.throws(() => verifyUnsignedRefundEnvelope(f.xdr, f.expected));
});
