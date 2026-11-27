import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Account, Address, Keypair, SorobanDataBuilder, StrKey, Transaction, nativeToScVal, rpc, xdr } from '@stellar/stellar-sdk';
import { TestnetRefundAdapter, type RefundRpc, type TestnetRefundAdapterOptions } from '../src/automatic-refund-rpc.ts';
import { TESTNET_PASSPHRASE } from '../src/automatic-refunds.ts';
const payer = Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(1));
const contributor = Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(2)).publicKey();
const contract = StrKey.encodeContract(new Uint8Array(32).fill(3));
const token = StrKey.encodeContract(new Uint8Array(32).fill(4));
const wasm = new Uint8Array([1, 2, 3]);
function fixture() {
  let signCount = 0;
  let sent = 0;
  let network = TESTNET_PASSPHRASE;
  let changedWasm = false;
  let changedConfig = false;
  let resources = 100n;
  let mutateSigner = false;
  let recipient = contributor;
  const options: TestnetRefundAdapterOptions = {
    rpcUrl: 'https://soroban-testnet.stellar.org/',
    payer: payer.publicKey(),
    maxFeeStroops: 1000n,
    contracts: { [contract]: { wasmHash: createHash('sha256').update(wasm).digest('hex'), creator: payer.publicKey(), token, goal: 1000n, deadline: 100 } },
    sign: async (unsigned) => {
      signCount++;
      const tx = new Transaction(unsigned, TESTNET_PASSPHRASE);
      tx.sign(mutateSigner ? Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(5)) : payer);
      return tx.toXDR();
    },
  };
  const fake: RefundRpc = {
    getNetwork: async () => ({ passphrase: network, protocolVersion: '23' }),
    getAccount: async () => new Account(payer.publicKey(), '10'),
    getContractWasmByContractId: async () => (changedWasm ? new Uint8Array([0]) : wasm),
    getLatestLedger: async () => ({ closeTime: String(Math.floor(Date.now() / 1000)) }) as Awaited<ReturnType<RefundRpc['getLatestLedger']>>,
    simulateTransaction: async (tx) => {
      if (!(tx instanceof Transaction)) throw Error('fixture');
      const op = tx.operations[0];
      if (op.type !== 'invokeHostFunction' || op.func.type !== 'hostFunctionTypeInvokeContract') throw Error('fixture');
      const call = op.func.invokeContract;
      const name = call.functionName.toString();
      let retval: xdr.ScVal;
      if (name === 'get_config')
        retval = nativeToScVal({
          creator: new Address(payer.publicKey()).toScVal(),
          token: new Address(changedConfig ? contract : token).toScVal(),
          goal: 1000n,
          deadline: nativeToScVal(100n, { type: 'u64' }),
        });
      else if (name === 'total_raised') retval = nativeToScVal(500n);
      else if (name === 'balance_of') {
        recipient = Address.fromScVal(call.args[0]).toString();
        retval = nativeToScVal(100n);
      } else throw Error('fixture method');
      return {
        id: 'mock',
        latestLedger: 1,
        events: [],
        _parsed: true,
        transactionData: new SorobanDataBuilder(),
        minResourceFee: '100',
        result: { auth: [], retval },
      };
    },
    prepareTransaction: async (tx) => {
      if (!(tx instanceof Transaction)) throw Error('fixture');
      const wire = tx.toEnvelope().toXdrObject();
      if (wire.type !== 2) throw Error('fixture');
      const { xdr } = await import('@stellar/stellar-sdk');
      wire.v1.tx.ext = { v: 1, sorobanData: new SorobanDataBuilder().setResourceFee(resources).build().toXdrObject() };
      wire.v1.tx.fee = Number(resources + 100n);
      return new Transaction(xdr.TransactionEnvelope.fromXdrObject(wire), TESTNET_PASSPHRASE);
    },
    sendTransaction: async (tx) => {
      sent++;
      return { status: 'PENDING', hash: Buffer.from(tx.hash()).toString('hex'), latestLedger: 1, latestLedgerCloseTime: 1 };
    },
    getTransaction: async (hash) => ({
      status: rpc.Api.GetTransactionStatus.NOT_FOUND,
      txHash: hash,
      latestLedger: 1,
      latestLedgerCloseTime: 1,
      oldestLedger: 1,
      oldestLedgerCloseTime: 1,
    }),
  };
  return {
    adapter: new TestnetRefundAdapter(options, fake),
    options,
    fake,
    counts: () => ({ signCount, sent, recipient }),
    wrongNetwork: () => {
      network = 'mainnet';
    },
    wrongWasm: () => {
      changedWasm = true;
    },
    wrongConfig: () => {
      changedConfig = true;
    },
    costly: () => {
      resources = 1001n;
    },
    badSigner: () => {
      mutateSigner = true;
    },
  };
}
test('concrete adapter inspects WASM/config, prepares independently checked signed XDR and submits exact hash', async () => {
  const f = fixture();
  const tx = await f.adapter.prepare(contract, contributor);
  assert.equal(tx.amount, 100n);
  assert.equal(tx.feeStroops, 200n);
  await f.adapter.submit(tx.signedXdr);
  assert.deepEqual(f.counts(), { signCount: 1, sent: 1, recipient: contributor });
  assert.equal((await f.adapter.status(tx.hash)).state, 'not_found');
  assert.equal((await f.adapter.status(tx.hash)).oldestCloseTime, 1);
});
for (const change of ['wrongNetwork', 'wrongWasm', 'wrongConfig', 'costly', 'badSigner'] as const)
  test('RPC adapter fails closed: ' + change, async () => {
    const f = fixture();
    f[change]();
    await assert.rejects(f.adapter.prepare(contract, contributor));
    assert.equal(f.counts().sent, 0);
    if (change !== 'badSigner') assert.equal(f.counts().signCount, 0);
  });
test('resubmission revalidates deployed WASM rather than trusting a stored envelope alone', async () => {
  const f = fixture();
  const tx = await f.adapter.prepare(contract, contributor);
  f.wrongWasm();
  await assert.rejects(f.adapter.submit(tx.signedXdr));
  assert.equal(f.counts().sent, 0);
});
for (const rpcUrl of [
  'http://soroban-testnet.stellar.org/',
  'https://soroban.stellar.org/',
  'https://soroban-testnet.stellar.org/?redirect=1',
  'https://user:pass@soroban-testnet.stellar.org/',
])
  test('rejects unapproved RPC ' + rpcUrl.replace('user:pass@', ''), () => {
    const f = fixture();
    assert.throws(() => new TestnetRefundAdapter({ ...f.options, rpcUrl }, f.fake));
  });

function refundEvent() {
  return new xdr.ContractEvent({
    ext: xdr.ExtensionPoint.v0(),
    contractId: xdr.ContractId.fromXdrObject(StrKey.decodeContract(contract)),
    type: xdr.ContractEventType.contract,
    body: xdr.ContractEventBody.v0(
      new xdr.ContractEventV0({
        topics: [nativeToScVal('refunded', { type: 'symbol' }), new Address(contributor).toScVal()],
        data: nativeToScVal({ amount: 100n }),
      }),
    ),
  });
}
for (const mode of ['valid', 'missing-event', 'wrong-return', 'wrong-hash', 'fee-bump'] as const)
  test('confirmed transaction verification: ' + mode, async () => {
    const f = fixture();
    const tx = await f.adapter.prepare(contract, contributor);
    f.fake.getTransaction = async (hash) => ({
      status: rpc.Api.GetTransactionStatus.SUCCESS,
      txHash: mode === 'wrong-hash' ? 'b'.repeat(64) : hash,
      envelopeXdr: new Transaction(tx.signedXdr, TESTNET_PASSPHRASE).toEnvelope(),
      resultXdr: new xdr.TransactionResult({ feeCharged: 200n, result: xdr.TransactionResultResult.txSuccess([]), ext: xdr.TransactionResultExt.v0() }),
      resultMetaXdr: undefined as unknown as xdr.TransactionMeta,
      returnValue: nativeToScVal(mode === 'wrong-return' ? 101n : 100n),
      events: { transactionEventsXdr: [], contractEventsXdr: mode === 'missing-event' ? [] : [[refundEvent()]] },
      feeBump: mode === 'fee-bump',
      ledger: 1,
      createdAt: 1,
      applicationOrder: 1,
      latestLedger: 1,
      latestLedgerCloseTime: 1,
      oldestLedger: 1,
      oldestLedgerCloseTime: 1,
    });
    if (mode === 'valid') assert.deepEqual(await f.adapter.status(tx.hash), { state: 'success', refundedAmount: 100n });
    else await assert.rejects(f.adapter.status(tx.hash));
  });

for (const mode of ['absent', 'equal', 'oldest-equal', 'gap', 'legacy', 'stale', 'wrong-hash', 'bad-signature', 'unbounded'] as const)
  test('expiry proof exact XDR and retained history: ' + mode, async () => {
    const f = fixture();
    const prepared = await f.adapter.prepare(contract, contributor);
    const original = new Transaction(prepared.signedXdr, TESTNET_PASSPHRASE);
    const max = Number(original.timeBounds!.maxTime);
    const now = max + (mode === 'stale' ? 100 : 1);
    f.options.now = () => now;
    let signedXdr = prepared.signedXdr;
    if (mode === 'legacy' || mode === 'unbounded' || mode === 'bad-signature') {
      const wire = original.toEnvelope().toXdrObject();
      if (wire.type !== 2) throw Error('fixture');
      if (mode !== 'bad-signature') {
        const cond = wire.v1.tx.cond;
        if (cond.type !== 1) throw Error('fixture');
        if (mode === 'legacy') cond.timeBounds.minTime = 0n;
        else cond.timeBounds.maxTime = 0n;
      }
      wire.v1.signatures = [];
      const changed = new Transaction(xdr.TransactionEnvelope.fromXdrObject(wire), TESTNET_PASSPHRASE);
      changed.sign(mode === 'bad-signature' ? Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(6)) : payer);
      signedXdr = changed.toXDR();
    }
    const hash = Buffer.from(new Transaction(signedXdr, TESTNET_PASSPHRASE).hash()).toString('hex');
    f.fake.getTransaction = async () => ({
      status: rpc.Api.GetTransactionStatus.NOT_FOUND,
      txHash: mode === 'wrong-hash' ? 'f'.repeat(64) : hash,
      oldestLedger: 1,
      latestLedger: 30,
      oldestLedgerCloseTime: mode === 'oldest-equal' ? Number(original.timeBounds!.minTime) : max - (mode === 'gap' ? 1 : 200),
      latestLedgerCloseTime: mode === 'equal' ? max : max + 1,
    });
    const adapter = new TestnetRefundAdapter(f.options, f.fake);
    const row = { campaign: contract, contributor, state: 'submitted' as const, hash, signedXdr, amount: '100', feeStroops: '200' };
    if (['stale', 'wrong-hash', 'bad-signature', 'unbounded'].includes(mode)) await assert.rejects(adapter.expiry(row));
    else {
      const proof = await adapter.expiry(row);
      if (mode === 'equal') assert.equal(proof, undefined);
      else assert.equal(proof?.outcome, mode === 'absent' ? 'absent' : 'history_unknown');
    }
    assert.equal(f.counts().sent, 0);
    assert.equal(f.counts().signCount, 1);
  });

test('exact real read-only rehearsal RPC JSON passes SDK parse and adapter amount/event verification', async () => {
  const { readFile } = await import('node:fs/promises');
  const captured = JSON.parse(await readFile(new URL('./fixtures/automatic-refund-known-success.json', import.meta.url), 'utf8')).result;
  const server = new rpc.Server('https://soroban-testnet.stellar.org/');
  // Replay raw transport through the SDK public parser, no network or signer.
  (server as unknown as { _getTransaction: () => Promise<unknown> })._getTransaction = async () => captured;
  const parsed = await server.getTransaction(captured.txHash);
  const tx = new Transaction(parsed.envelopeXdr!, TESTNET_PASSPHRASE);
  const adapter = new TestnetRefundAdapter(
    {
      rpcUrl: 'https://soroban-testnet.stellar.org/',
      payer: tx.source,
      maxFeeStroops: 1000000n,
      contracts: { CAWYL4NUIPHQOSZUVKT3S5IX77ZFG6UPYMHDRNO5EAERAZAHJ65B73M7: { wasmHash: 'a'.repeat(64), token, creator: tx.source, goal: 1n, deadline: 1 } },
      sign: async () => {
        throw Error('no signer');
      },
    },
    { getNetwork: async () => ({ passphrase: TESTNET_PASSPHRASE, protocolVersion: '23' }), getTransaction: async () => parsed } as RefundRpc,
  );
  assert.deepEqual(await adapter.status(captured.txHash), { state: 'success', refundedAmount: 10000000n });
});
