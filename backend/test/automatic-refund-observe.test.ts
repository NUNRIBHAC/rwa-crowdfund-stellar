import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeRefundHashes } from '../src/automatic-refund-observe.ts';
import { diagnoseRefundPayer } from '../src/automatic-refund-diagnostics.ts';
import { reconcileRefundWatch, refundWatchKey } from '../src/automatic-refund-watch.ts';
import { TESTNET_PASSPHRASE, type RefundChain, type RefundRecord, type RefundStore } from '../src/automatic-refunds.ts';
const rows = Array.from({ length: 250 }, (_, i) => ({
  campaign: 'c',
  contributor: String(i),
  state: 'expired' as const,
  hash: i.toString(16).padStart(64, '0'),
}));
test('250 reads are complete and ordered with at most four in flight, no retry', async () => {
  let active = 0,
    max = 0,
    calls = 0;
  const chain = {
    status: async () => {
      calls++;
      active++;
      max = Math.max(max, active);
      await new Promise((r) => setImmediate(r));
      active--;
      return { state: 'not_found' };
    },
  } as RefundChain;
  const observed = await observeRefundHashes(rows, chain);
  assert.equal(calls, 250);
  assert.equal(max, 4);
  assert.equal(active, 0);
  assert.equal(observed.length, 250);
  assert.deepEqual(
    observed.map((r) => r.row.hash),
    rows.map((r) => r.hash),
  );
});
test('one failed read waits for all launched reads then blocks reconciliation before state writes', async () => {
  let active = 0,
    calls = 0,
    writes = 0;
  const chain = {
    status: async (hash: string) => {
      calls++;
      active++;
      await new Promise((r) => setImmediate(r));
      active--;
      if (hash === rows[1].hash) throw Error('network private detail');
      return { state: 'not_found' };
    },
  } as RefundChain;
  const store = {
    read: async () => ({ campaign: '', contributor: '', state: 'pending', watched: rows }),
    write: async () => {
      writes++;
    },
  } as unknown as RefundStore;
  await assert.rejects(reconcileRefundWatch(store, 'payer', chain), /OBSERVATION_UNAVAILABLE/);
  assert.equal(active, 0);
  assert.equal(calls, 250);
  assert.equal(writes, 0);
});
test('evidence-only diagnostics reads poisoned state without clearing it, never invokes execution methods', async () => {
  const payer = 'G' + 'A'.repeat(55),
    key = JSON.stringify(['automatic-refund-payer', TESTNET_PASSPHRASE, payer]);
  let writes = 0,
    reads = 0;
  const watch: RefundRecord = { campaign: '', contributor: '', state: 'blocked', error: 'AUTO_REFUND_STREAM_DISAGREEMENT', watched: rows.slice(0, 2) };
  const chain = {
    status: async () => {
      reads++;
      return { state: 'success', refundedAmount: 10n };
    },
    prepare: async () => {
      throw Error('forbidden');
    },
    submit: async () => {
      throw Error('forbidden');
    },
  } as unknown as RefundChain;
  const store: RefundStore = {
    exclusive: async (_k, fn) => fn(),
    read: async (k) => (k === refundWatchKey(key) ? watch : undefined),
    write: async () => {
      writes++;
    },
  };
  const report = await diagnoseRefundPayer(payer, store, chain);
  assert.equal(report.streamHalted, true);
  assert.equal(report.observations[0].status?.refundedAmount, '10');
  assert.equal(writes, 0);
  assert.equal(reads, 2);
  assert.equal(watch.error, 'AUTO_REFUND_STREAM_DISAGREEMENT');
  assert.equal(JSON.stringify(report).includes('signedXdr'), false);
});
test('invalid watch size/hash never starts network reads', async () => {
  let calls = 0;
  const chain = {
    status: async () => {
      calls++;
      return { state: 'not_found' };
    },
  } as RefundChain;
  await assert.rejects(observeRefundHashes([...rows, rows[0]], chain));
  await assert.rejects(observeRefundHashes([{ campaign: 'c', contributor: 'a', state: 'expired' }], chain));
  assert.equal(calls, 0);
});

test('synchronous status throw is contained and all other hash reads settle', async () => {
  let calls = 0;
  const chain = {
    status: () => {
      if (++calls === 1) throw Error('sync');
      return Promise.resolve({ state: 'not_found' });
    },
  } as RefundChain;
  const report = await observeRefundHashes(rows, chain);
  assert.equal(calls, 250);
  assert.equal(report[0].error, 'AUTO_REFUND_OBSERVATION_UNAVAILABLE');
  assert.equal(report.length, 250);
});
test('real FileRefundStore diagnostics leave bytes and modes unchanged, work under held payer lock, and redact signed fixtures', async () => {
  const { FileRefundStore } = await import('../src/automatic-refund-store.ts');
  const fs = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const dir = await fs.mkdtemp(join(tmpdir(), 'diagnostic-readonly-'));
  const store = new FileRefundStore(dir);
  const payer = 'G' + 'A'.repeat(55),
    key = JSON.stringify(['automatic-refund-payer', TESTNET_PASSPHRASE, payer]);
  const privateRow = { ...rows[0], signedXdr: 'PRIVATE_SIGNED_FIXTURE', attempts: [{ hash: 'old', signedXdr: 'PRIVATE_ATTEMPT_FIXTURE' }] };
  try {
    await store.write(refundWatchKey(key), {
      campaign: '',
      contributor: '',
      state: 'blocked',
      error: 'AUTO_REFUND_STREAM_DISAGREEMENT',
      watched: [privateRow as RefundRecord],
    });
    const before = await fs.readdir(dir);
    const snapshot = await Promise.all(before.map(async (n) => [n, await fs.readFile(join(dir, n), 'utf8'), (await fs.stat(join(dir, n))).mode]));
    await store.exclusive(key, async () => {
      const during = await fs.readdir(dir);
      const chain = { status: async () => ({ state: 'not_found' }) } as RefundChain;
      const report = await diagnoseRefundPayer(payer, store, chain);
      assert.equal(report.snapshotUnchanged, true);
      assert.equal(report.streamHalted, true);
      const text = JSON.stringify(report);
      assert.equal(text.includes('PRIVATE_SIGNED_FIXTURE'), false);
      assert.equal(text.includes('PRIVATE_ATTEMPT_FIXTURE'), false);
      assert.deepEqual(await fs.readdir(dir), during);
    });
    const after = await Promise.all(before.map(async (n) => [n, await fs.readFile(join(dir, n), 'utf8'), (await fs.stat(join(dir, n))).mode]));
    assert.deepEqual(after, snapshot);
    assert.deepEqual(await fs.readdir(dir), before);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test('diagnostic detects a changing snapshot without claiming authoritative reconciliation', async () => {
  const payer = 'G' + 'A'.repeat(55);
  let n = 0;
  const store = { read: async () => (++n < 3 ? undefined : { campaign: 'changed', contributor: '', state: 'pending' }) } as unknown as RefundStore;
  const report = await diagnoseRefundPayer(payer, store, {} as RefundChain);
  assert.equal(report.snapshotUnchanged, false);
});

test('payer integration waits for complete 250-hash observation before any prepare or journal write', async () => {
  const { processRefundForPayer } = await import('../src/automatic-refund-payer.ts');
  const payer = 'G' + 'A'.repeat(55),
    key = JSON.stringify(['automatic-refund-payer', TESTNET_PASSPHRASE, payer]);
  let calls = 0,
    signs = 0;
  const records = new Map<string, RefundRecord>();
  records.set(refundWatchKey(key), { campaign: '', contributor: '', state: 'pending', watched: rows });
  const store: RefundStore = {
    exclusive: async (_k, fn) => fn(),
    read: async (k) => records.get(k),
    write: async (k, r) => {
      assert.equal(calls, 250);
      records.set(k, r);
    },
  };
  const chain: RefundChain = {
    status: async () => {
      calls++;
      await new Promise((r) => setImmediate(r));
      return { state: 'not_found' };
    },
    inspect: async () => ({
      networkPassphrase: TESTNET_PASSPHRASE,
      wasmHash: 'a'.repeat(64),
      deadline: 1,
      ledgerTimestamp: 2,
      goal: 100n,
      raised: 1n,
      balance: 10n,
    }),
    prepare: async (contract, recipient) => {
      assert.equal(calls, 250);
      signs++;
      return {
        contract,
        recipient,
        method: 'refund_for',
        networkPassphrase: TESTNET_PASSPHRASE,
        hash: 'f'.repeat(64),
        signedXdr: 'fixture',
        amount: 10n,
        feeStroops: 200n,
      };
    },
    submit: async () => {},
  };
  const result = await processRefundForPayer(
    payer,
    { enabled: true, networkPassphrase: TESTNET_PASSPHRASE, reviewedWasmHash: 'a'.repeat(64), approvedContracts: ['new'], maxFeeStroops: 1000n },
    chain,
    store,
    'new',
    'bob',
  );
  assert.equal(result.state, 'submitted');
  assert.equal(signs, 1);
  assert.equal(calls, 250);
});
