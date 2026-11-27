import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StrKey } from '@stellar/stellar-sdk';
import { refundStatusView, runRefundBatch } from '../src/automatic-refund-batch.ts';
import { TESTNET_PASSPHRASE, type RefundChain, type RefundPolicy, type RefundRecord, type RefundStore } from '../src/automatic-refunds.ts';
const payer = StrKey.encodeEd25519PublicKey(new Uint8Array(32).fill(1));
const campaign = StrKey.encodeContract(new Uint8Array(32).fill(2));
const contributor = StrKey.encodeEd25519PublicKey(new Uint8Array(32).fill(3));
function fixture() {
  const rows = new Map<string, RefundRecord>();
  let count = 0;
  const store: RefundStore = {
    exclusive: async (_key, run) => run(),
    read: async (key) => rows.get(key),
    write: async (key, row) => {
      rows.set(key, structuredClone(row));
    },
  };
  const policy: RefundPolicy = {
    enabled: true,
    networkPassphrase: TESTNET_PASSPHRASE,
    reviewedWasmHash: 'a'.repeat(64),
    approvedContracts: [campaign],
    maxFeeStroops: 1000n,
  };
  const chain: RefundChain = {
    inspect: async () => ({
      networkPassphrase: TESTNET_PASSPHRASE,
      wasmHash: policy.reviewedWasmHash,
      deadline: 1,
      ledgerTimestamp: 2,
      goal: 100n,
      raised: 10n,
      balance: 10n,
    }),
    prepare: async (contract, recipient) => {
      count++;
      return {
        hash: 'b'.repeat(64),
        signedXdr: 'signed',
        amount: 10n,
        feeStroops: 100n,
        contract,
        recipient,
        method: 'refund_for',
        networkPassphrase: TESTNET_PASSPHRASE,
      };
    },
    submit: async () => {},
    status: async () => ({ state: 'pending' }),
  };
  return { policy, chain, store, count: () => count };
}
test('bounded batch stops after uncertain submitted sequence, never starts a second envelope', async () => {
  const f = fixture();
  const result = await runRefundBatch(
    {
      payer,
      maxRecipients: 2,
      recipients: [
        { campaign, contributor },
        { campaign, contributor: payer },
      ],
    },
    f.policy,
    f.chain,
    f.store,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].record?.state, 'submitted');
  assert.equal(f.count(), 1);
});
for (const mode of ['too-many', 'duplicate', 'unapproved', 'invalid-wallet', 'no-limit'] as const)
  test('invalid entire batch rejected before first preparation: ' + mode, async () => {
    const f = fixture();
    const recipients = [{ campaign, contributor }];
    if (mode === 'too-many' || mode === 'duplicate') recipients.push({ campaign, contributor });
    if (mode === 'unapproved') f.policy.approvedContracts = [];
    if (mode === 'invalid-wallet') recipients[0].contributor = 'alice';
    await assert.rejects(
      runRefundBatch({ payer, maxRecipients: mode === 'too-many' ? 1 : mode === 'no-limit' ? 0 : 2, recipients }, f.policy, f.chain, f.store),
    );
    assert.equal(f.count(), 0);
  });
test('untrusted error response never becomes UI or operator output', async () => {
  const f = fixture();
  f.chain.inspect = async () => {
    throw Error('private remote response');
  };
  const result = await runRefundBatch({ payer, maxRecipients: 1, recipients: [{ campaign, contributor }] }, f.policy, f.chain, f.store);
  assert.equal(result[0].error, 'AUTO_REFUND_BATCH_BLOCKED');
});
for (const state of ['pending', 'signed', 'submitted', 'blocked', 'confirmed'] as const)
  test('status view does not leak envelope or claim paid without matching evidence: ' + state, () => {
    const view = refundStatusView({ campaign, contributor, state, signedXdr: 'secret envelope', hash: 'private hash', error: 'raw error', amount: '10' });
    assert.notEqual(view.status, 'paid');
    assert.ok(!JSON.stringify(view).includes('secret'));
    assert.ok(!JSON.stringify(view).includes('raw error'));
  });
test('paid view requires exact positive confirmed amount', () => {
  assert.deepEqual(refundStatusView({ campaign, contributor, state: 'confirmed', amount: '10', confirmedAmount: '10' }), {
    status: 'paid',
    amount: '10',
    textKey: 'automaticRefund.status.paid',
  });
  assert.equal(refundStatusView({ campaign, contributor, state: 'confirmed', amount: '10', confirmedAmount: '11' }).status, 'blocked');
});
