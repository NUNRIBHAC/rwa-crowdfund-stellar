import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processRefund, TESTNET_PASSPHRASE, type RefundPolicy, type RefundRecord, type RefundChain, type RefundStore } from '../src/automatic-refunds.ts';
const hash = 'a'.repeat(64),
  wasm = 'b'.repeat(64);
function fixture() {
  const policy: RefundPolicy = {
    enabled: true,
    networkPassphrase: TESTNET_PASSPHRASE,
    reviewedWasmHash: wasm,
    approvedContracts: ['campaign'],
    maxFeeStroops: 1000n,
  };
  let row: RefundRecord | undefined;
  let prepared = 0,
    submitted = 0;
  let status: Awaited<ReturnType<RefundChain['status']>> = { state: 'pending' };
  const facts = { networkPassphrase: TESTNET_PASSPHRASE, wasmHash: wasm, deadline: 100, ledgerTimestamp: 100, goal: 1000n, raised: 500n, balance: 100n };
  const tx = {
    hash,
    signedXdr: 'signed',
    amount: 100n,
    feeStroops: 200n,
    contract: 'campaign',
    recipient: 'alice',
    method: 'refund_for',
    networkPassphrase: TESTNET_PASSPHRASE,
  };
  let queue = Promise.resolve();
  const store: RefundStore = {
    exclusive: async (_key, fn) => {
      const prior = queue;
      let release!: () => void;
      queue = new Promise((r) => (release = r));
      await prior;
      try {
        return await fn();
      } finally {
        release();
      }
    },
    read: async () => row,
    write: async (_k, r) => {
      row = structuredClone(r);
    },
  };
  const chain: RefundChain = {
    inspect: async () => facts,
    prepare: async () => {
      prepared++;
      return tx;
    },
    submit: async (x) => {
      assert.ok(row?.hash, 'must persist before send');
      assert.equal(x, 'signed');
      submitted++;
    },
    status: async () => status,
  };
  return {
    policy,
    facts,
    tx,
    store,
    chain,
    run: () => processRefund(policy, chain, store, 'campaign', 'alice'),
    setStatus: (s: typeof status) => (status = s),
    counts: () => ({ prepared, submitted }),
    row: () => row,
  };
}
test('persists signed envelope before submit, never marks submission as paid', async () => {
  const f = fixture();
  const r = await f.run();
  assert.equal(r.state, 'submitted');
  assert.equal(r.confirmedAmount, undefined);
  assert.equal(r.hash, hash);
});
test('confirmed amount requires successful chain evidence and matches record', async () => {
  const f = fixture();
  await f.run();
  f.setStatus({ state: 'success', refundedAmount: 100n });
  const r = await f.run();
  assert.equal(r.state, 'confirmed');
  assert.equal(r.confirmedAmount, '100');
  assert.equal(r.signedXdr, undefined);
  await f.run();
  assert.deepEqual(f.counts(), { prepared: 1, submitted: 1 });
});
test('concurrent work does not build a duplicate transaction', async () => {
  const f = fixture();
  await Promise.all([f.run(), f.run(), f.run()]);
  assert.deepEqual(f.counts(), { prepared: 1, submitted: 1 });
});
test('ambiguous submission retries only the exact hash/envelope', async () => {
  const f = fixture();
  f.chain.submit = async () => {
    throw Error('timeout');
  };
  assert.equal((await f.run()).error, 'AUTO_REFUND_SUBMISSION_UNCERTAIN');
  f.setStatus({ state: 'not_found' });
  await f.run();
  assert.equal(f.counts().prepared, 1);
  assert.equal(f.row()?.hash, hash);
  assert.equal(f.row()?.state, 'signed');
});
test('failed transaction is blocked without replacement', async () => {
  const f = fixture();
  await f.run();
  f.setStatus({ state: 'failed' });
  assert.equal((await f.run()).state, 'blocked');
  await f.run();
  assert.equal(f.counts().prepared, 1);
});
for (const [name, change] of [
  [
    'disabled',
    (f: ReturnType<typeof fixture>) => {
      f.policy.enabled = false;
    },
  ],
  [
    'mainnet',
    (f: ReturnType<typeof fixture>) => {
      f.policy.networkPassphrase = 'Public Global Stellar Network ; September 2015';
    },
  ],
  [
    'unapproved',
    (f: ReturnType<typeof fixture>) => {
      f.policy.approvedContracts = [];
    },
  ],
  [
    'no fee cap',
    (f: ReturnType<typeof fixture>) => {
      f.policy.maxFeeStroops = 0n;
    },
  ],
] as const)
  test('fails closed: ' + name, async () => {
    const f = fixture();
    change(f);
    await assert.rejects(f.run());
    assert.deepEqual(f.counts(), { prepared: 0, submitted: 0 });
  });
for (const [name, change, error] of [
  [
    'before deadline',
    (f: ReturnType<typeof fixture>) => {
      f.facts.ledgerTimestamp = 99;
    },
    'AUTO_REFUND_NOT_ELIGIBLE',
  ],
  [
    'goal met',
    (f: ReturnType<typeof fixture>) => {
      f.facts.raised = 1000n;
    },
    'AUTO_REFUND_NOT_ELIGIBLE',
  ],
  [
    'zero balance',
    (f: ReturnType<typeof fixture>) => {
      f.facts.balance = 0n;
    },
    'AUTO_REFUND_NO_BALANCE',
  ],
  [
    'unreviewed WASM',
    (f: ReturnType<typeof fixture>) => {
      f.facts.wasmHash = 'c'.repeat(64);
    },
    'AUTO_REFUND_CHAIN_IDENTITY_MISMATCH',
  ],
  [
    'wrong recipient',
    (f: ReturnType<typeof fixture>) => {
      f.tx.recipient = 'bob';
    },
    'AUTO_REFUND_ENVELOPE_MISMATCH',
  ],
  [
    'wrong amount',
    (f: ReturnType<typeof fixture>) => {
      f.tx.amount = 101n;
    },
    'AUTO_REFUND_ENVELOPE_MISMATCH',
  ],
  [
    'wrong method',
    (f: ReturnType<typeof fixture>) => {
      f.tx.method = 'withdraw';
    },
    'AUTO_REFUND_ENVELOPE_MISMATCH',
  ],
  [
    'fee ceiling',
    (f: ReturnType<typeof fixture>) => {
      f.tx.feeStroops = 1001n;
    },
    'AUTO_REFUND_FEE_LIMIT',
  ],
] as const)
  test(name, async () => {
    const f = fixture();
    change(f);
    const r = await f.run();
    assert.equal(r.error, error);
    assert.equal(r.confirmedAmount, undefined);
    assert.equal(f.counts().submitted, 0);
  });
test('success without confirmed event amount is not payment proof', async () => {
  const f = fixture();
  await f.run();
  f.setStatus({ state: 'success' });
  assert.equal((await f.run()).error, 'AUTO_REFUND_CONFIRMATION_MISMATCH');
});
test('mismatched confirmed amount remains blocked', async () => {
  const f = fixture();
  await f.run();
  f.setStatus({ state: 'success', refundedAmount: 99n });
  assert.equal((await f.run()).state, 'blocked');
});
test('storage failure prevents any send', async () => {
  const f = fixture();
  f.store.write = async () => {
    throw Error('disk');
  };
  await assert.rejects(f.run());
  assert.equal(f.counts().submitted, 0);
});

test('a definitively failed transaction remains blocked even when RPC later loses its history', async () => {
  const f = fixture();
  await f.run();
  f.setStatus({ state: 'failed' });
  assert.equal((await f.run()).state, 'blocked');
  f.setStatus({ state: 'not_found' });
  assert.equal((await f.run()).error, 'AUTO_REFUND_TRANSACTION_FAILED');
  assert.deepEqual(f.counts(), { prepared: 1, submitted: 1 });
});
