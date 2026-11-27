import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileRefundStore } from '../src/automatic-refund-store.ts';
import { recoverExpiredRefundForPayer } from '../src/automatic-refund-recovery.ts';
import { processRefundForPayer } from '../src/automatic-refund-payer.ts';
import { TESTNET_PASSPHRASE, type RefundChain, type RefundPolicy, type RefundRecord, type RefundStore } from '../src/automatic-refunds.ts';
const payer = 'G' + 'A'.repeat(55),
  campaign = 'c';
const policy: RefundPolicy = {
  enabled: true,
  networkPassphrase: TESTNET_PASSPHRASE,
  reviewedWasmHash: 'a'.repeat(64),
  approvedContracts: [campaign],
  maxFeeStroops: 1000n,
};
const key = JSON.stringify([campaign, 'alice']);
const payerKey = JSON.stringify(['automatic-refund-payer', TESTNET_PASSPHRASE, payer]);
async function fixture(
  run: (f: {
    store: FileRefundStore;
    chain: RefundChain;
    recover: (s?: RefundStore) => Promise<RefundRecord | undefined>;
    run: (who: string, s?: RefundStore) => Promise<RefundRecord>;
    counts: () => { signs: number; sends: number };
  }) => Promise<void>,
) {
  const dir = await mkdtemp(join(tmpdir(), 'expiry-recovery-'));
  const store = new FileRefundStore(dir);
  let signs = 0,
    sends = 0;
  const chain: RefundChain = {
    inspect: async () => ({
      networkPassphrase: TESTNET_PASSPHRASE,
      wasmHash: policy.reviewedWasmHash,
      deadline: 1,
      ledgerTimestamp: 200,
      goal: 100n,
      raised: 10n,
      balance: 10n,
    }),
    prepare: async (contract, recipient) => {
      signs++;
      return {
        hash: String(signs).repeat(64),
        signedXdr: 'signed' + signs,
        amount: 10n,
        feeStroops: 200n,
        contract,
        recipient,
        method: 'refund_for',
        networkPassphrase: TESTNET_PASSPHRASE,
      };
    },
    submit: async () => {
      sends++;
    },
    status: async () => ({ state: 'not_found' }),
    expiry: async (r) => ({
      hash: r.hash!,
      outcome: 'absent',
      minTime: 100,
      maxTime: 220,
      oldestLedger: 1,
      oldestCloseTime: 90,
      latestLedger: 30,
      latestCloseTime: 221,
    }),
  };
  try {
    await run({
      store,
      chain,
      recover: (s = store) => recoverExpiredRefundForPayer(payer, policy, chain, s),
      run: (who, s = store) => processRefundForPayer(payer, policy, chain, s, campaign, who),
      counts: () => ({ signs, sends }),
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
test('recovery only expires, preserves XDR/proof and releases payer, later invocation archives before replacement', () =>
  fixture(async (f) => {
    await f.run('alice');
    const old = await f.store.read(key);
    const recovered = await f.recover();
    assert.equal(recovered?.state, 'expired');
    assert.equal(recovered?.signedXdr, old?.signedXdr);
    assert.deepEqual(f.counts(), { signs: 1, sends: 1 });
    assert.equal((await f.store.read(payerKey))?.hash, undefined);
    const next = await f.run('alice');
    assert.equal(next.hash, '2'.repeat(64));
    assert.equal(next.attempts?.[0].signedXdr, old?.signedXdr);
    assert.equal(next.attempts?.[0].hash, old?.hash);
  }));
test('unknown history never retries original recipient but releases unrelated recipient', () =>
  fixture(async (f) => {
    await f.run('alice');
    const base = f.chain.expiry!;
    f.chain.expiry = async (r) => ({ ...(await base(r))!, outcome: 'history_unknown' });
    await f.recover();
    assert.equal((await f.run('alice')).error, 'AUTO_REFUND_HISTORY_UNKNOWN');
    assert.deepEqual(f.counts(), { signs: 1, sends: 1 });
    await f.run('bob');
    assert.equal(f.counts().signs, 2);
  }));
for (const point of [1, 2, 3, 4])
  test('recovery crash at durable write ' + point + ' keeps exact old reservation recoverable', () =>
    fixture(async (f) => {
      await f.run('alice');
      let count = 0;
      const broken: RefundStore = {
        exclusive: (k, fn) => f.store.exclusive(k, fn),
        read: (k) => f.store.read(k),
        write: async (k, r) => {
          if (++count === point) throw Error('disk');
          await f.store.write(k, r);
        },
      };
      await assert.rejects(f.recover(broken), /disk/);
      assert.deepEqual(f.counts(), { signs: 1, sends: 1 });
      await f.recover();
      await f.run('alice');
      assert.equal(f.counts().signs, 2);
      assert.equal((await f.store.read(key))?.attempts?.[0].hash, '1'.repeat(64));
    }),
  );
test('new attempt crash after payer write and before recipient write restores successor with immutable predecessor link', () =>
  fixture(async (f) => {
    await f.run('alice');
    await f.recover();
    let brokenOnce = false;
    const broken: RefundStore = {
      exclusive: (k, fn) => f.store.exclusive(k, fn),
      read: (k) => f.store.read(k),
      write: async (k, r) => {
        if (!brokenOnce && k === key && r.hash === '2'.repeat(64)) {
          brokenOnce = true;
          throw Error('disk');
        }
        await f.store.write(k, r);
      },
    };
    await assert.rejects(f.run('alice', broken), /disk/);
    await f.run('alice');
    assert.equal(f.counts().signs, 2);
    assert.equal((await f.store.read(key))?.attempts?.[0].hash, '1'.repeat(64));
  }));
test('late success after absent proof halts before any new signer or submission', () =>
  fixture(async (f) => {
    await f.run('alice');
    await f.recover();
    f.chain.status = async () => ({ state: 'success', refundedAmount: 10n });
    await assert.rejects(f.run('alice'), /STREAM_HALTED/);
    assert.deepEqual(f.counts(), { signs: 1, sends: 1 });
  }));
test('not-yet-expired proof and status disagreement cannot clear the payer', () =>
  fixture(async (f) => {
    await f.run('alice');
    f.chain.expiry = async () => undefined;
    await f.recover();
    await assert.rejects(f.run('bob'), /SEQUENCE_BUSY/);
    f.chain.status = async () => ({ state: 'success', refundedAmount: 10n });
    await assert.rejects(f.recover(), /RECONCILE_REQUIRED/);
    assert.equal((await f.store.read(payerKey))?.hash, '1'.repeat(64));
  }));

test('late success poisons entire stream durably before another recipient can sign', () =>
  fixture(async (f) => {
    await f.run('alice');
    await f.recover();
    f.chain.status = async () => ({ state: 'success', refundedAmount: 10n });
    await assert.rejects(f.run('bob'), /STREAM_HALTED/);
    f.chain.status = async () => ({ state: 'not_found' });
    await assert.rejects(f.run('bob'), /STREAM_HALTED/);
    assert.equal(f.counts().signs, 1);
  }));
test('unknown history continues reconciliation and can show exact positive historical payment', () =>
  fixture(async (f) => {
    await f.run('alice');
    const base = f.chain.expiry!;
    f.chain.expiry = async (r) => ({ ...(await base(r))!, outcome: 'history_unknown' });
    await f.recover();
    f.chain.status = async (hash) => (hash === '1'.repeat(64) ? { state: 'success', refundedAmount: 10n } : { state: 'not_found' });
    const row = await f.run('alice');
    assert.equal(row.state, 'confirmed');
    assert.equal(row.confirmedAmount, '10');
    assert.equal(f.counts().signs, 1);
  }));
test('unknown-history success with wrong amount poisons stream, never paid', () =>
  fixture(async (f) => {
    await f.run('alice');
    const base = f.chain.expiry!;
    f.chain.expiry = async (r) => ({ ...(await base(r))!, outcome: 'history_unknown' });
    await f.recover();
    f.chain.status = async () => ({ state: 'success', refundedAmount: 11n });
    await assert.rejects(f.run('bob'), /STREAM_HALTED/);
    assert.notEqual((await f.store.read(key))?.state, 'confirmed');
    assert.equal(f.counts().signs, 1);
  }));
for (const outcome of ['absent', 'history_unknown'] as const)
  test('other recipient repairs leftover terminal reservation: ' + outcome, () =>
    fixture(async (f) => {
      await f.run('alice');
      let writes = 0;
      const broken: RefundStore = {
        exclusive: (k, fn) => f.store.exclusive(k, fn),
        read: (k) => f.store.read(k),
        write: async (k, r) => {
          if (++writes === 3) throw Error('disk');
          await f.store.write(k, r);
        },
      };
      await assert.rejects(f.recover(broken), /disk/);
      const base = f.chain.expiry!;
      f.chain.expiry = async (r) => ({ ...(await base(r))!, outcome });
      await f.run('bob');
      assert.equal(f.counts().signs, 2);
      assert.equal((await f.store.read(key))?.state, 'expired');
    }),
  );
test('ten archived attempts cap stops a replacement without shrinking journal', () =>
  fixture(async (f) => {
    await f.run('alice');
    const old = (await f.store.read(key))!;
    const proof = (await f.chain.expiry!(old))!;
    const attempts = Array.from({ length: 10 }, () => ({
      hash: old.hash!,
      signedXdr: old.signedXdr!,
      amount: old.amount!,
      feeStroops: old.feeStroops!,
      proof,
    }));
    await f.store.write(payerKey, { campaign: '', contributor: '', state: 'pending' });
    await f.store.write(key, { ...old, state: 'expired', expiryProof: proof, attempts });
    await assert.rejects(f.run('alice'), /ATTEMPT_LIMIT/);
    assert.equal((await f.store.read(key))?.attempts?.length, 10);
    assert.equal(f.counts().signs, 1);
  }));
test('attempts survive signed, submitted, confirmed state transitions', () =>
  fixture(async (f) => {
    await f.run('alice');
    await f.recover();
    await f.run('alice');
    const attempts = (await f.store.read(key))!.attempts;
    f.chain.status = async (hash) => (hash === '2'.repeat(64) ? { state: 'success', refundedAmount: 10n } : { state: 'not_found' });
    const row = await f.run('alice');
    assert.equal(row.state, 'confirmed');
    assert.deepEqual(row.attempts, attempts);
  }));

test('durable attempt archive cannot shrink or be rewritten by store callers', () =>
  fixture(async (f) => {
    await f.run('alice');
    await f.recover();
    await f.run('alice');
    const row = (await f.store.read(key))!;
    await assert.rejects(f.store.write(key, { ...row, attempts: [] }), /HISTORY_IMMUTABLE/);
    await assert.rejects(f.store.write(key, { ...row, attempts: [{ ...row.attempts![0], signedXdr: 'other' }] }), /HISTORY_IMMUTABLE/);
    assert.equal((await f.store.read(key))?.attempts?.length, 1);
  }));

for (const mode of ['pending', 'rpc-error'] as const)
  test('watch contradiction/error fail closed: ' + mode, () =>
    fixture(async (f) => {
      await f.run('alice');
      await f.recover();
      f.chain.status = async () => {
        if (mode === 'rpc-error') throw Error('offline');
        return { state: 'pending' };
      };
      await assert.rejects(f.run('bob'), mode === 'rpc-error' ? /OBSERVATION_UNAVAILABLE/ : /STREAM_HALTED/);
      assert.equal(f.counts().signs, 1);
    }),
  );
test('250 active hashes stops recovery without clearing a reservation', () =>
  fixture(async (f) => {
    await f.run('alice');
    const row = (await f.store.read(key))!;
    const watchKey = JSON.stringify(['refund-history-watch', payerKey]);
    await f.store.write(watchKey, {
      campaign: '',
      contributor: '',
      state: 'pending',
      watched: Array.from({ length: 250 }, (_, i) => ({ ...row, hash: i.toString(16).padStart(64, '0') })),
    });
    await assert.rejects(f.recover(), /WATCH_LIMIT/);
    assert.equal((await f.store.read(payerKey))?.hash, row.hash);
  }));
for (const failure of [false, true])
  test('retention retirement archives without resetting unknown recipient; disk failure=' + failure, () =>
    fixture(async (f) => {
      await f.run('alice');
      const base = f.chain.expiry!;
      f.chain.expiry = async (r) => ({ ...(await base(r))!, outcome: 'history_unknown' });
      await f.recover();
      f.chain.status = async () => ({ state: 'not_found', oldestCloseTime: 221 });
      if (failure) {
        const broken: RefundStore = {
          exclusive: (k, fn) => f.store.exclusive(k, fn),
          read: (k) => f.store.read(k),
          write: async (k, r) => {
            if (k.includes('retired-history')) throw Error('disk');
            await f.store.write(k, r);
          },
        };
        await assert.rejects(f.run('bob', broken), /disk/);
        assert.equal(f.counts().signs, 1);
      }
      await f.run('bob');
      assert.equal(f.counts().signs, 2);
      const unknown = await f.store.read(key);
      assert.equal(unknown?.error, 'AUTO_REFUND_HISTORY_UNKNOWN');
      assert.equal(unknown?.hash, '1'.repeat(64));
      const archiveKey = JSON.stringify(['refund-retired-history', payerKey, '1'.repeat(64)]);
      assert.equal((await f.store.read(archiveKey))?.signedXdr, 'signed1');
      assert.equal((await f.store.read(JSON.stringify(['refund-history-watch', payerKey])))?.watched?.length, 0);
    }),
  );

test('absent-proof retirement preserves absence audit and original attempt', () =>
  fixture(async (f) => {
    await f.run('alice');
    await f.recover();
    f.chain.status = async () => ({
      state: 'not_found',
      oldestCloseTime: 221,
      oldestLedger: 40,
      latestLedger: 50,
      latestCloseTime: 300,
      source: 'https://soroban-testnet.stellar.org/',
    });
    await f.run('bob');
    const archiveKey = JSON.stringify(['refund-retired-history', payerKey, '1'.repeat(64)]);
    const archived = (await f.store.read(archiveKey))!;
    assert.equal(archived.retirement?.reason, 'outside_rpc_retention');
    assert.equal(archived.retirement?.oldestLedger, 40);
    assert.equal(archived.retirement?.source, 'https://soroban-testnet.stellar.org/');
    await assert.rejects(f.store.write(archiveKey, { ...archived, error: 'overwrite' }), /RETIREMENT_IMMUTABLE/);
    assert.equal((await f.store.read(key))?.state, 'expired');
  }));
for (const stage of ['recipient', 'archive', 'watch'] as const)
  test('terminal unknown reconciliation crash and retry: ' + stage, () =>
    fixture(async (f) => {
      await f.run('alice');
      const base = f.chain.expiry!;
      f.chain.expiry = async (r) => ({ ...(await base(r))!, outcome: 'history_unknown' });
      await f.recover();
      f.chain.status = async () => ({ state: 'success', refundedAmount: 10n });
      let once = false;
      const broken: RefundStore = {
        exclusive: (k, fn) => f.store.exclusive(k, fn),
        read: (k) => f.store.read(k),
        write: async (k, r) => {
          if (
            !once &&
            ((stage === 'recipient' && k === key) ||
              (stage === 'archive' && k.includes('retired-history')) ||
              (stage === 'watch' && k.includes('history-watch')))
          ) {
            once = true;
            throw Error('disk');
          }
          await f.store.write(k, r);
        },
      };
      await assert.rejects(f.run('alice', broken), /disk/);
      const row = await f.run('alice');
      assert.equal(row.state, 'confirmed');
      assert.equal(f.counts().signs, 1);
    }),
  );

test('endpoint change from saved expiry proof poisons stream before retirement', () =>
  fixture(async (f) => {
    await f.run('alice');
    const base = f.chain.expiry!;
    f.chain.expiry = async (r) => ({ ...(await base(r)!), source: 'official' });
    await f.recover();
    f.chain.status = async () => ({ state: 'not_found', oldestCloseTime: 999, source: 'different' });
    await assert.rejects(f.run('bob'), /STREAM_HALTED/);
    assert.equal(f.counts().signs, 1);
  }));

test('equivalent saved source spellings do not poison the payer stream', () =>
  fixture(async (f) => {
    await f.run('alice');
    const base = f.chain.expiry!;
    f.chain.expiry = async (r) => ({ ...(await base(r)!), source: 'https://soroban-testnet.stellar.org' });
    await f.recover();
    f.chain.status = async () => ({ state: 'not_found', source: 'https://soroban-testnet.stellar.org/' });
    await f.run('bob');
    assert.equal(f.counts().signs, 2);
  }));
