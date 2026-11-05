import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Address, Asset, Contract, Keypair, Networks, StrKey, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { sorobanDeps, sorobanCampaigns } from '../src/soroban.js';

process.env.STELLAR_NETWORK = 'testnet';

// Fixture truth: two v1 campaigns, one actor with a balance only in campA.
const WASM_HASH = '202c9d7e59623c06d1eb2f1ade4cbd187a73ccd3f8154673593820c71db1b564';
const issuer = Keypair.random().publicKey();
process.env.USDC_ISSUER = issuer;
const tokenId = new Asset('USDC', issuer).contractId(Networks.TESTNET);
const campA = { id: 'camp-a', name: 'Campaign A', contractId: StrKey.encodeContract(Buffer.alloc(32, 11)) };
const campB = { id: 'camp-b', name: 'Campaign B', contractId: StrKey.encodeContract(Buffer.alloc(32, 12)) };
const creator = Keypair.random().publicKey();
const actor = Keypair.random().publicKey();
const configNative = { creator, token: tokenId, goal: 5000000000n, deadline: 2000000000n };

function configScVal() {
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('creator'), val: Address.account(StrKey.decodeEd25519PublicKey(creator)).toScVal() }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('deadline'), val: nativeToScVal(configNative.deadline, { type: 'u64' }) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('goal'), val: nativeToScVal(configNative.goal, { type: 'i128' }) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('token'), val: new Contract(tokenId).address().toScVal() }),
  ]);
}

function instanceEntry(contractId: string, opts: { wasmHash?: Buffer; storage?: xdr.ScMapEntry[] | 'full' | 'empty' } = {}) {
  const storage =
    opts.storage === 'empty'
      ? []
      : [
          new xdr.ScMapEntry({ key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Config')]), val: configScVal() }),
          new xdr.ScMapEntry({ key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Raised')]), val: nativeToScVal(1234567n, { type: 'i128' }) }),
          new xdr.ScMapEntry({ key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Withdrawn')]), val: xdr.ScVal.scvBool(false) }),
        ];
  const val = xdr.LedgerEntryData.contractData(
    new xdr.ContractDataEntry({
      ext: xdr.ExtensionPoint.v0(),
      contract: new Contract(contractId).address().toScAddress(),
      durability: xdr.ContractDataDurability.persistent,
      val: xdr.ScVal.scvContractInstance(
        new xdr.ScContractInstance({
          executable: xdr.ContractExecutable.contractExecutableWasm(opts.wasmHash ?? Buffer.from(WASM_HASH, 'hex')),
          storage,
        }),
      ),
    }),
  );
  return { key: new Contract(contractId).getFootprint(), val };
}

function balanceEntry(contractId: string, who: string, units: bigint) {
  return {
    key: xdr.LedgerKey.contractData(
      new xdr.LedgerKeyContractData({
        contract: new Contract(contractId).address().toScAddress(),
        key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Balance'), Address.account(StrKey.decodeEd25519PublicKey(who)).toScVal()]),
        durability: xdr.ContractDataDurability.persistent,
      }),
    ),
    val: xdr.LedgerEntryData.contractData(
      new xdr.ContractDataEntry({
        ext: xdr.ExtensionPoint.v0(),
        contract: new Contract(contractId).address().toScAddress(),
        durability: xdr.ContractDataDurability.persistent,
        val: nativeToScVal(units, { type: 'i128' }),
      }),
    ),
  };
}

const ik = (contractId: string) => new Contract(contractId).getFootprint().toXDR('base64');

// Fake RPC serving entries from a fixture map keyed by LedgerKey XDR.
// Adapter evidence only, not evidence of a deployment.
let entries: Map<string, { key: xdr.LedgerKey; val: xdr.LedgerEntryData }>;
let getLedgerCalls: string[][];
let simulateCalls: string[];
let simulateHandler: (tx: any) => any;
let failGetLedger: Error | null;
const client: any = {
  getLedgerEntries: async (...keys: xdr.LedgerKey[]) => {
    if (failGetLedger) throw failGetLedger;
    getLedgerCalls.push(keys.map((k) => k.toXDR('base64')));
    return { latestLedger: 1, entries: keys.map((k) => entries.get(k.toXDR('base64'))).filter(Boolean) };
  },
  simulateTransaction: async (tx: any) => {
    const invoke = (tx.operations[0] as any).func.invokeContract;
    simulateCalls.push(invoke.functionName.toString());
    return simulateHandler(tx);
  },
};
sorobanDeps.client = () => client;

beforeEach(() => {
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify([campA, campB]);
  entries = new Map();
  for (const e of [instanceEntry(campA.contractId), instanceEntry(campB.contractId), balanceEntry(campA.contractId, actor, 7654321n)])
    entries.set(e.key.toXDR('base64'), e);
  getLedgerCalls = [];
  simulateCalls = [];
  failGetLedger = null;
  simulateHandler = () => ({ _parsed: true, latestLedger: 1, result: { retval: nativeToScVal(0n, { type: 'i128' }) }, events: [] });
});

test('listing reads one batched entry call, direct balance when live, simulation only for missing balance', async () => {
  const out = await sorobanCampaigns(actor);
  assert.equal(getLedgerCalls.length, 1);
  assert.equal(getLedgerCalls[0].length, 4); // 2 instances + 2 balance keys
  assert.equal(simulateCalls.length, 1); // only campB balance (missing entry)
  assert.equal(simulateCalls[0], 'balance_of');
  assert.equal(out.length, 2);
  const a = out.find((c) => c.id === 'camp-a');
  assert.equal(a.config.creator, creator);
  assert.equal(a.config.token, tokenId);
  assert.equal(a.config.goal, configNative.goal.toString());
  assert.equal(a.config.deadline, configNative.deadline.toString());
  assert.equal(a.raised, '1234567');
  assert.equal(a.withdrawn, false);
  assert.equal(a.balance, '7654321');
  const b = out.find((c) => c.id === 'camp-b');
  assert.equal(b.balance, '0');
});

test('listing without actor makes no simulation calls and defaults match contract unwrap_or', async () => {
  const bare = instanceEntry(campB.contractId, { storage: 'empty' });
  entries.set(ik(campB.contractId), bare);
  await assert.rejects(sorobanCampaigns(), /Error\(Contract, #2\)/); // missing Config never defaults
  entries.set(ik(campB.contractId), instanceEntry(campB.contractId));
  const out = await sorobanCampaigns();
  assert.equal(simulateCalls.length, 0);
  assert.equal(out.length, 2);
  assert.equal(out[0].balance, null);
});

test('missing Raised/Withdrawn default like the contract; present values win', async () => {
  const onlyConfig = {
    key: new Contract(campB.contractId).getFootprint(),
    val: xdr.LedgerEntryData.contractData(
      new xdr.ContractDataEntry({
        ext: xdr.ExtensionPoint.v0(),
        contract: new Contract(campB.contractId).address().toScAddress(),
        durability: xdr.ContractDataDurability.persistent,
        val: xdr.ScVal.scvContractInstance(
          new xdr.ScContractInstance({
            executable: xdr.ContractExecutable.contractExecutableWasm(Buffer.from(WASM_HASH, 'hex')),
            storage: [new xdr.ScMapEntry({ key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Config')]), val: configScVal() })],
          }),
        ),
      }),
    ),
  };
  entries.set(ik(campB.contractId), onlyConfig as never);
  const out = await sorobanCampaigns();
  const b = out.find((c) => c.id === 'camp-b');
  assert.equal(b.raised, '0');
  assert.equal(b.withdrawn, false);
});

test('archived, wrong-code, malformed and wrong-asset instances fail exactly as before', async () => {
  entries.delete(ik(campA.contractId));
  await assert.rejects(sorobanCampaigns(), /operator restoration required/);
  entries.set(ik(campA.contractId), instanceEntry(campA.contractId, { wasmHash: Buffer.alloc(32, 0) }));
  await assert.rejects(sorobanCampaigns(), /reviewed crowdfund Wasm/);
  const notInstance = {
    key: new Contract(campA.contractId).getFootprint(),
    val: xdr.LedgerEntryData.contractData(
      new xdr.ContractDataEntry({
        ext: xdr.ExtensionPoint.v0(),
        contract: new Contract(campA.contractId).address().toScAddress(),
        durability: xdr.ContractDataDurability.persistent,
        val: xdr.ScVal.scvBool(true),
      }),
    ),
  };
  entries.set(ik(campA.contractId), notInstance as never);
  await assert.rejects(sorobanCampaigns(), /malformed; refusing/);
  entries.set(ik(campA.contractId), instanceEntry(campA.contractId));
  process.env.USDC_ISSUER = Keypair.random().publicKey();
  await assert.rejects(sorobanCampaigns(), /does not match configured testnet USDC/);
  process.env.USDC_ISSUER = issuer;
});

test('network failure on the batched read rejects the listing', async () => {
  failGetLedger = new Error('Request failed with status code 502');
  await assert.rejects(sorobanCampaigns(), /502/);
});

test('archived balance still fails closed through the simulation fallback', async () => {
  entries.delete(balanceEntry(campA.contractId, actor, 0n).key.toXDR('base64'));
  simulateHandler = () => ({
    _parsed: true,
    latestLedger: 1,
    result: undefined,
    events: [],
    error: undefined,
    restorePreamble: { minResourceFee: '0', transactionData: {} },
  });
  // rpc.Api.isSimulationRestore recognizes restorePreamble; isSimulationError needs .error.
  await assert.rejects(sorobanCampaigns(actor), /operator restoration required|contract read/);
});

test('registries beyond one chunk page the batched read deterministically', async () => {
  const many = Array.from({ length: 101 }, (_, i) => ({
    id: `c${i}`,
    name: `C${i}`,
    contractId: StrKey.encodeContract(Buffer.from([...Buffer.alloc(28, 0), ...Buffer.from([(i / 256) | 0, i % 256, 0, 1])])),
  }));
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify(many);
  entries = new Map(
    many.map((c) => {
      const e = instanceEntry(c.contractId);
      return [e.key.toXDR('base64'), e] as const;
    }),
  );
  const out = await sorobanCampaigns();
  assert.equal(out.length, 101);
  assert.equal(getLedgerCalls.length, 2);
  assert.equal(getLedgerCalls[0].length, 100);
  assert.equal(getLedgerCalls[1].length, 1);
});
