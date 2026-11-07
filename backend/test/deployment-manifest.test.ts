import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { FileDeploymentManifestStore, validateCreationRecord, recordCreationFromTransaction, type ContractCreationRecord } from '../src/deployment-manifest.js';

const contractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const otherContract = StrKey.encodeContract(Buffer.alloc(32, 9));
const hash = 'a'.repeat(64);
const record = (): ContractCreationRecord => ({
  campaignId: 'demo-solar',
  contractId,
  createdLedger: 1234,
  deploymentHash: hash,
  networkPassphrase: 'Test SDF Network ; September 2015',
  recordedAt: 1_700_000_000_000,
});
const tmpdir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-'));

test('validateCreationRecord accepts a well-formed record and rejects malformed input', () => {
  assert.deepEqual(validateCreationRecord(record()), record());
  for (const change of [
    { campaignId: '' },
    { campaignId: 'bad id!' },
    { contractId: 'not-a-contract' },
    { contractId: Keypair.random().publicKey() },
    { createdLedger: 0 },
    { createdLedger: 1.5 },
    { createdLedger: '1234' },
    { deploymentHash: 'zz' },
    { networkPassphrase: '' },
    { recordedAt: -1 },
  ])
    assert.equal(validateCreationRecord({ ...record(), ...change }), null);
  for (const value of [null, [], 'x', 42]) assert.equal(validateCreationRecord(value), null);
});

test('file store round-trips records, is idempotent and refuses conflicts', async () => {
  const store = new FileDeploymentManifestStore(path.join(tmpdir(), 'manifest.json'));
  assert.equal(await store.get(contractId), undefined);
  await store.put(record());
  await store.put(record()); // identical rewrite is a no-op
  assert.deepEqual(await store.get(contractId), record());
  assert.deepEqual(await store.list(), [record()]);
  await assert.rejects(store.put({ ...record(), createdLedger: 9999 }), /conflicting creation record/);
  await assert.rejects(store.put({ ...record(), contractId: otherContract, createdLedger: -5 }), /invalid contract creation record/);
  // corrupt stored rows throw on read, never read as absent
  const file = path.join(tmpdir(), 'manifest.json');
  await new FileDeploymentManifestStore(file).put(record());
  fs.writeFileSync(file, JSON.stringify({ [contractId]: { ...record(), createdLedger: 'bad' } }));
  await assert.rejects(new FileDeploymentManifestStore(file).get(contractId), /corrupt/);
  await assert.rejects(new FileDeploymentManifestStore(file).list(), /corrupt/);
  fs.writeFileSync(file, '[1,2]');
  await assert.rejects(new FileDeploymentManifestStore(file).get(contractId), /not an object/);
});

test('recordCreationFromTransaction grounds creation in a SUCCESS transaction only', async () => {
  const meta = { created: { data: { type: 6, contractData: { key: { type: 20 }, contract: { contractId: Buffer.alloc(32, 7).toString('hex') } } } } };
  const client = { getTransaction: async (h: string) => ({ txHash: h, status: 'SUCCESS', ledger: 1234, resultMetaXdr: meta }) };
  const store = new FileDeploymentManifestStore(path.join(tmpdir(), 'manifest.json'));
  const written = await recordCreationFromTransaction({
    client,
    hash,
    campaignId: 'demo-solar',
    networkPassphrase: record().networkPassphrase,
    store,
    now: () => 1_700_000_000_000,
  });
  assert.deepEqual(written, record());
  assert.deepEqual(await store.get(contractId), record());

  const failed = { getTransaction: async (h: string) => ({ txHash: h, status: 'FAILED', ledger: 1234, resultMetaXdr: meta }) };
  await assert.rejects(recordCreationFromTransaction({ client: failed, hash, campaignId: 'demo-solar', networkPassphrase: 'n', store }), /not SUCCESS/);
  const mismatched = { getTransaction: async () => ({ txHash: 'b'.repeat(64), status: 'SUCCESS', ledger: 1234, resultMetaXdr: meta }) };
  await assert.rejects(recordCreationFromTransaction({ client: mismatched, hash, campaignId: 'demo-solar', networkPassphrase: 'n', store }), /mismatched/);
  const noLedger = { getTransaction: async (h: string) => ({ txHash: h, status: 'SUCCESS', resultMetaXdr: meta }) };
  await assert.rejects(recordCreationFromTransaction({ client: noLedger, hash, campaignId: 'demo-solar', networkPassphrase: 'n', store }), /ledger/);
  const noMeta = { getTransaction: async (h: string) => ({ txHash: h, status: 'SUCCESS', ledger: 1 }) };
  await assert.rejects(recordCreationFromTransaction({ client: noMeta, hash, campaignId: 'demo-solar', networkPassphrase: 'n', store }), /no created contract/);
  const twoMeta = {
    getTransaction: async (h: string) => ({
      txHash: h,
      status: 'SUCCESS',
      ledger: 1,
      resultMetaXdr: [
        meta,
        { created: { data: { type: 6, contractData: { key: { type: 20 }, contract: { contractId: Buffer.alloc(32, 9).toString('hex') } } } } },
      ],
    }),
  };
  await assert.rejects(recordCreationFromTransaction({ client: twoMeta, hash, campaignId: 'demo-solar', networkPassphrase: 'n', store }), /ambiguous/);
  await assert.rejects(
    recordCreationFromTransaction({ client, hash: 'nope', campaignId: 'demo-solar', networkPassphrase: 'n', store }),
    /invalid deployment transaction hash/,
  );
  await assert.rejects(recordCreationFromTransaction({ client, hash, campaignId: 'bad id', networkPassphrase: 'n', store }), /invalid campaign id/);
  await assert.rejects(recordCreationFromTransaction({ client, hash, campaignId: 'demo-solar', networkPassphrase: '', store }), /passphrase/);
});

test('postgres store mirrors the same semantics', async () => {
  const rows = new Map<string, unknown>();
  const pool = {
    query: async (text: string, params?: unknown[]) => {
      const sql = text.replace(/\s+/g, ' ').trim();
      if (/^CREATE TABLE/.test(sql)) return { rows: [], rowCount: 0 };
      if (/^SELECT doc FROM contract_creations WHERE/.test(sql)) {
        const doc = rows.get((params as string[])[0]);
        return { rows: doc ? [{ doc }] : [], rowCount: doc ? 1 : 0 };
      }
      if (/^SELECT doc FROM contract_creations$/.test(sql)) return { rows: [...rows.values()].map((doc) => ({ doc })), rowCount: rows.size };
      if (/^INSERT INTO contract_creations/.test(sql)) {
        rows.set((params as string[])[0], JSON.parse((params as string[])[1]));
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`unexpected query: ${sql}`);
    },
  };
  const { PostgresDeploymentManifestStore } = await import('../src/deployment-manifest.js');
  const store = new PostgresDeploymentManifestStore(pool as never);
  assert.equal(await store.get(contractId), undefined);
  await store.put(record());
  await store.put(record());
  assert.deepEqual(await store.get(contractId), record());
  assert.deepEqual(await store.list(), [record()]);
  await assert.rejects(store.put({ ...record(), createdLedger: 9999 }), /conflicting/);
  rows.set(contractId, { ...record(), createdLedger: 'bad' });
  await assert.rejects(store.get(contractId), /corrupt/);
  await assert.rejects(store.list(), /corrupt/);
});

test('backend selection is explicit and fails closed without a database URL', async () => {
  const { deploymentManifestBackend, resetDeploymentManifestBackendForTests, FileDeploymentManifestStore, PostgresDeploymentManifestStore } =
    await import('../src/deployment-manifest.js');
  const saved = { ...process.env };
  try {
    for (const key of [
      'DEPLOYMENT_MANIFEST_BACKEND',
      'DEPLOYMENT_MANIFEST_DATABASE_URL',
      'DEPLOYMENT_MANIFEST_PATH',
      'COMMUNITY_REQUIRE_POSTGRES',
      'COMMUNITY_DATABASE_URL',
      'SOROBAN_JOURNAL_BACKEND',
      'SOROBAN_JOURNAL_DATABASE_URL',
    ])
      delete process.env[key];
    resetDeploymentManifestBackendForTests();
    process.env.DEPLOYMENT_MANIFEST_PATH = path.join(tmpdir(), 'manifest.json');
    assert.ok((await deploymentManifestBackend()) instanceof FileDeploymentManifestStore);
    resetDeploymentManifestBackendForTests();
    process.env.COMMUNITY_REQUIRE_POSTGRES = '1';
    await assert.rejects(deploymentManifestBackend(), /refusing to fall back to a volatile file/);
    resetDeploymentManifestBackendForTests();
    process.env.DEPLOYMENT_MANIFEST_DATABASE_URL = 'postgres://localhost:1/test';
    assert.ok((await deploymentManifestBackend()) instanceof PostgresDeploymentManifestStore);
  } finally {
    process.env = saved;
    resetDeploymentManifestBackendForTests();
  }
});
