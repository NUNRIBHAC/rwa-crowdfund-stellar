import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Address, Keypair, StrKey, nativeToScVal } from '@stellar/stellar-sdk';
import { sorobanDeps, sorobanRegistryEntry, isV2Entry, readV2SharePositions, V2_HOLDER_READ_CAP } from '../src/soroban.js';

process.env.STELLAR_NETWORK = 'testnet';

// This fake RPC is adapter evidence only, not evidence of a deployment.
const v1ContractId = StrKey.encodeContract(Buffer.alloc(32, 2));
const tokenId = StrKey.encodeContract(Buffer.alloc(32, 7));
const offeringId = StrKey.encodeContract(Buffer.alloc(32, 8));
const tokenWasm = fs.readFileSync(new URL('../wasm/v2-share-token.wasm', import.meta.url));
const offeringWasm = fs.readFileSync(new URL('../wasm/v2-offering.wasm', import.meta.url));
const holderA = Keypair.random().publicKey();
const holderB = Keypair.random().publicKey();
const issuer = Keypair.random().publicKey();
let badTokenWasm = false;
const balances: Record<string, bigint> = { [holderA]: 42000000n, [holderB]: 0n };

const client: any = {
  getContractWasmByContractId: async (id: string) => {
    if (id === tokenId) return badTokenWasm ? Buffer.from('wrong') : tokenWasm;
    if (id === offeringId) return offeringWasm;
    throw new Error('unknown contract ' + id);
  },
  simulateTransaction: async (tx: any) => {
    const invoke = (tx.operations[0] as any).func.invokeContract;
    const method = invoke.functionName.toString();
    const cid = StrKey.encodeContract(Buffer.from(invoke.contractAddress.contractId.value));
    let value: unknown;
    if (cid === tokenId) {
      if (method === 'name') value = 'QA Shares';
      else if (method === 'symbol') value = 'QSH';
      else if (method === 'decimals') value = 7;
      else if (method === 'total_supply') value = 100000000n;
      else if (method === 'balance') value = balances[Address.fromScVal(invoke.args[0]).toString()] ?? 0n;
      else throw new Error('unexpected token method ' + method);
    } else if (cid === offeringId) {
      if (method !== 'get_config') throw new Error('unexpected offering method ' + method);
      value = { token: tokenId, issuer, min_per_investor: 10000000n, max_per_investor: 100000000n, goal: 1000000000n, deadline: 2000000000n };
    } else {
      throw new Error('unexpected contract ' + cid);
    }
    return { _parsed: true, latestLedger: 1, result: { retval: nativeToScVal(value), auth: [] }, events: [] };
  },
};
sorobanDeps.client = () => client;

const registry = (entries: unknown[]) => {
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify(entries);
};
const v2Entry = { id: 'v2camp', name: 'V2 test campaign', contractSet: 'v2', tokenContractId: tokenId, offeringContractId: offeringId };

test('registry accepts a v2 contract-set entry and narrows its shape', () => {
  registry([{ id: 's1', name: 'V1 campaign', contractId: v1ContractId }, v2Entry]);
  const e = sorobanRegistryEntry('v2camp');
  assert.ok(e && isV2Entry(e));
  assert.equal((e as any).tokenContractId, tokenId);
  const v1 = sorobanRegistryEntry('s1');
  assert.ok(v1 && !isV2Entry(v1));
  assert.equal(sorobanRegistryEntry('nope'), null);
});

test('registry rejects a v2 pair sharing one contract id', () => {
  registry([{ ...v2Entry, offeringContractId: tokenId }]);
  assert.throws(() => sorobanRegistryEntry('v2camp'), /invalid campaign registry entry/);
});

test('registry rejects a v2 token id colliding with a v1 contract id', () => {
  registry([
    { id: 's1', name: 'V1 campaign', contractId: v1ContractId },
    { ...v2Entry, tokenContractId: v1ContractId },
  ]);
  assert.throws(() => sorobanRegistryEntry('v2camp'), /duplicate campaign registry entry/);
});

test('registry rejects a malformed v2 contract address', () => {
  registry([{ ...v2Entry, tokenContractId: 'not-a-contract' }]);
  assert.throws(() => sorobanRegistryEntry('v2camp'), /invalid campaign registry entry/);
});

test('readV2SharePositions reads pinned token/offering state and per-holder balances', async () => {
  registry([v2Entry]);
  badTokenWasm = false;
  const p = await readV2SharePositions('v2camp', [holderA, holderB, holderA, 'not-an-address']);
  assert.equal(p.campaignId, 'v2camp');
  assert.equal(p.tokenContractId, tokenId);
  assert.equal(p.offeringContractId, offeringId);
  assert.deepEqual(p.token, { name: 'QA Shares', symbol: 'QSH', decimals: 7, totalSupply: '100000000' });
  assert.deepEqual(p.offering, {
    token: tokenId,
    issuer,
    minPerInvestor: '10000000',
    maxPerInvestor: '100000000',
    goal: '1000000000',
    deadline: '2000000000',
  });
  assert.deepEqual(p.holders, [
    { publicKey: holderA, balance: '42000000' },
    { publicKey: holderB, balance: '0' },
  ]);
  assert.equal(p.holdersTruncated, false);
});

test('readV2SharePositions refuses a v1 campaign id and an unknown id', async () => {
  registry([{ id: 's1', name: 'V1 campaign', contractId: v1ContractId }]);
  await assert.rejects(readV2SharePositions('s1', [holderA]), /not a v2 contract-set entry/);
  await assert.rejects(readV2SharePositions('nope', [holderA]), /campaign not registered/);
});

test('readV2SharePositions fails closed on share-token code mismatch', async () => {
  registry([v2Entry]);
  badTokenWasm = true;
  await assert.rejects(readV2SharePositions('v2camp', [holderA]), /does not match the pinned v2 Wasm/);
  badTokenWasm = false;
});

test('holder reads are capped and the truncation is disclosed', async () => {
  registry([v2Entry]);
  const many = Array.from({ length: V2_HOLDER_READ_CAP + 1 }, () => Keypair.random().publicKey());
  const p = await readV2SharePositions('v2camp', many);
  assert.equal(p.holders.length, V2_HOLDER_READ_CAP);
  assert.equal(p.holdersTruncated, true);
});
