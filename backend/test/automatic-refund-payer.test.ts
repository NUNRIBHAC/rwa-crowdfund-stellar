import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileRefundStore } from '../src/automatic-refund-store.ts';
import { processRefundForPayer } from '../src/automatic-refund-payer.ts';
import { TESTNET_PASSPHRASE, type RefundChain, type RefundPolicy, type RefundStore } from '../src/automatic-refunds.ts';
const payer = 'G' + 'A'.repeat(55);
const policy: RefundPolicy = {
  enabled: true,
  networkPassphrase: TESTNET_PASSPHRASE,
  reviewedWasmHash: 'a'.repeat(64),
  approvedContracts: ['c'],
  maxFeeStroops: 1000n,
};
async function fixture(
  run: (f: {
    store: FileRefundStore;
    chain: RefundChain;
    run: (who: string, store?: RefundStore) => ReturnType<typeof processRefundForPayer>;
    status: (s: Awaited<ReturnType<RefundChain['status']>>) => void;
    prepared: () => number;
  }) => Promise<void>,
) {
  const dir = await mkdtemp(join(tmpdir(), 'refund-payer-'));
  try {
    const store = new FileRefundStore(dir);
    let count = 0;
    let status: Awaited<ReturnType<RefundChain['status']>> = { state: 'pending' };
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
          hash: String(count).repeat(64),
          signedXdr: 'signed' + count,
          amount: 10n,
          feeStroops: 200n,
          contract,
          recipient,
          method: 'refund_for',
          networkPassphrase: TESTNET_PASSPHRASE,
        };
      },
      submit: async () => {},
      status: async () => status,
    };
    await run({
      store,
      chain,
      run: (who, s = store) => processRefundForPayer(payer, policy, chain, s, 'c', who),
      status: (s) => {
        status = s;
      },
      prepared: () => count,
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
test('global payer blocks another recipient until prior transaction is confirmed', () =>
  fixture(async (f) => {
    await f.run('alice');
    await assert.rejects(f.run('bob'), /SEQUENCE_BUSY/);
    assert.equal(f.prepared(), 1);
    f.status({ state: 'success', refundedAmount: 10n });
    await f.run('bob');
    assert.equal(f.prepared(), 2);
    assert.equal((await f.store.read(JSON.stringify(['c', 'alice'])))?.state, 'confirmed');
  }));
test('missing transaction does not authorize a new sequence or replacement', () =>
  fixture(async (f) => {
    await f.run('alice');
    f.status({ state: 'not_found' });
    await assert.rejects(f.run('bob'), /SEQUENCE_BUSY/);
    assert.equal(f.prepared(), 1);
    await f.run('alice');
    assert.equal(f.prepared(), 1);
  }));
test('failed prior transaction releases sequence but does not count as a refund', () =>
  fixture(async (f) => {
    await f.run('alice');
    f.status({ state: 'failed' });
    await f.run('bob');
    assert.equal((await f.store.read(JSON.stringify(['c', 'alice'])))?.state, 'blocked');
    assert.equal(f.prepared(), 2);
  }));
test('confirmation mismatch blocks all new envelopes', () =>
  fixture(async (f) => {
    await f.run('alice');
    f.status({ state: 'success', refundedAmount: 11n });
    await assert.rejects(f.run('bob'), /CONFIRMATION_MISMATCH/);
    assert.equal(f.prepared(), 1);
  }));
test('crash after payer journal but before recipient write recovers exact signed envelope', () =>
  fixture(async (f) => {
    let fail = true;
    const broken: RefundStore = {
      exclusive: (k, fn) => f.store.exclusive(k, fn),
      read: (k) => f.store.read(k),
      write: async (k, r) => {
        if (fail && k === JSON.stringify(['c', 'alice'])) {
          fail = false;
          throw Error('disk failure');
        }
        await f.store.write(k, r);
      },
    };
    await assert.rejects(f.run('alice', broken), /disk failure/);
    f.status({ state: 'not_found' });
    const recovered = await f.run('alice');
    assert.equal(recovered.hash, '1'.repeat(64));
    assert.equal(recovered.signedXdr, 'signed1');
    assert.equal(f.prepared(), 1);
  }));
test('conflicting recipient hash fails closed', () =>
  fixture(async (f) => {
    await f.run('alice');
    await f.store.write(JSON.stringify(['c', 'alice']), { campaign: 'c', contributor: 'alice', state: 'signed', hash: 'f'.repeat(64) });
    await assert.rejects(f.run('alice'), /JOURNAL_CONFLICT/);
    assert.equal(f.prepared(), 1);
  }));
test('concurrent recipients cannot both enter the shared payer sequence stream', () =>
  fixture(async (f) => {
    const results = await Promise.allSettled([f.run('alice'), f.run('bob')]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(f.prepared(), 1);
  }));

test('manual refund of contributor does not clear an unresolved payer hash', () =>
  fixture(async (f) => {
    await f.run('alice');
    f.status({ state: 'not_found' });
    f.chain.inspect = async () => ({
      networkPassphrase: TESTNET_PASSPHRASE,
      wasmHash: policy.reviewedWasmHash,
      deadline: 1,
      ledgerTimestamp: 200,
      goal: 100n,
      raised: 10n,
      balance: 0n,
    });
    await assert.rejects(f.run('bob'), /SEQUENCE_BUSY/);
    await f.run('alice');
    assert.equal(f.prepared(), 1);
    const row = await f.store.read(JSON.stringify(['c', 'alice']));
    assert.equal(row?.hash, '1'.repeat(64));
    assert.notEqual(row?.state, 'confirmed');
  }));
