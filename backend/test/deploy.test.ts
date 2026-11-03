import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Account, Address, Keypair, Networks, StrKey, Transaction, TransactionBuilder, nativeToScVal, SorobanDataBuilder, xdr } from '@stellar/stellar-sdk';
import { sorobanDeps, buildCampaignDeploy, submitCampaignDeploy, buildCampaignDeployV2, submitCampaignDeployV2 } from '../src/soroban.js';
import { PostgresJournal, injectJournalBackendForTests, resetJournalBackendForTests, journalBackend, type IntentStore } from '../src/journal.js';

// Campaign deployment adapter tests: the fake RPC below is adapter evidence
// only, not evidence of a real deployment. Build/submit reuse the journaled
// intent lifecycle of the contribution path, in two single-operation steps
// (upload reviewed Wasm, then create the instance).
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'soroban-deploy-'));
const operator = Keypair.random();
const newContractId = StrKey.encodeContract(Buffer.alloc(32, 9));
process.env.STELLAR_NETWORK = 'testnet';
process.env.USDC_ISSUER = Keypair.random().publicKey();
process.env.SOROBAN_INTENTS_PATH = path.join(tmp, 'intents.json');
process.env.SOROBAN_BUILD_RATE_PER_MIN = '1000';
process.env.SOROBAN_DEPLOY_POLL_MS = '1';
const wasmPath = new URL('./fixtures/reviewed-crowdfund.wasm', import.meta.url);
const wasm = fs.readFileSync(wasmPath);

let addressAuth = false,
  restoreRequired = false,
  missingAccount = false,
  simError = false,
  throwsOnSend = false,
  badDeployedWasm = false,
  wasmOnLedger = false,
  lastSentWasCreate = false,
  createMetaOnly = false,
  createNoId = false,
  txStatus = 'SUCCESS';
// v2 harness: the fake RPC serves the real packaged v2 Wasms under their pin
// hashes and hands out a distinct contract id per created instance kind.
const v2TokenWasm = fs.readFileSync(new URL('../../backend/wasm/v2-share-token.wasm', import.meta.url));
const v2OfferingWasm = fs.readFileSync(new URL('../../backend/wasm/v2-offering.wasm', import.meta.url));
const v2TokenHash = createHash('sha256').update(v2TokenWasm).digest('hex');
const v2OfferingHash = createHash('sha256').update(v2OfferingWasm).digest('hex');
const v2TokenContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const v2OfferingContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
let v2TokenOnLedger = false,
  v2OfferingOnLedger = false,
  v2LastCreateWasToken = false,
  lastCreateWasV2 = false,
  sendCount = 0;
const client: any = {
  getAccount: async (pub: string) => {
    if (missingAccount) throw new Error('Account not found');
    return new Account(pub, '1');
  },
  getContractWasmByHash: async (hash: Buffer) => {
    const hex = Buffer.from(hash).toString('hex');
    if (hex === v2TokenHash) {
      if (!v2TokenOnLedger) throw new Error('not found');
      return v2TokenWasm;
    }
    if (hex === v2OfferingHash) {
      if (!v2OfferingOnLedger) throw new Error('not found');
      return v2OfferingWasm;
    }
    if (!wasmOnLedger) throw new Error('not found');
    return wasm;
  },
  simulateTransaction: async (tx: Transaction) => {
    if (simError) return { _parsed: true, latestLedger: 1, error: 'simulation exploded' };
    assert.equal(tx.operations.length, 1, 'deploy steps are single-operation transactions');
    const func = (tx.operations[0] as any).func;
    const isCreate = func.type === 'hostFunctionTypeCreateContractV2';
    const auth = isCreate
      ? [
          new xdr.SorobanAuthorizationEntry({
            credentials: addressAuth ? ({ type: 'sorobanCredentialsAddress' } as any) : xdr.SorobanCredentials.sorobanCredentialsSourceAccount(),
            rootInvocation: new xdr.SorobanAuthorizedInvocation({
              function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeCreateContractV2HostFn(func.createContractV2),
              subInvocations: [],
            }),
          }),
        ]
      : [];
    return {
      _parsed: true,
      latestLedger: 1,
      result: { retval: nativeToScVal(0n), auth },
      events: [],
      minResourceFee: '10000',
      transactionData: new SorobanDataBuilder().setResourceFee('10000'),
      ...(restoreRequired ? { restorePreamble: { transactionData: new SorobanDataBuilder(), minResourceFee: '100' } } : {}),
    };
  },
  sendTransaction: async (tx: Transaction) => {
    sendCount++;
    if (throwsOnSend) throw new Error('response lost');
    const func = (tx.operations[0] as any).func;
    lastSentWasCreate = func.type === 'hostFunctionTypeCreateContractV2';
    if (lastSentWasCreate) {
      const wr = func.value.executable.wasmHash;
      const wv = typeof wr === 'function' ? wr() : wr;
      const wh = Buffer.from(Buffer.isBuffer(wv) || wv instanceof Uint8Array ? wv : wv.toXDR()).toString('hex');
      lastCreateWasV2 = wh === v2TokenHash || wh === v2OfferingHash;
      v2LastCreateWasToken = wh === v2TokenHash;
    }
    return { hash: Buffer.from(tx.hash()).toString('hex'), status: 'PENDING' };
  },
  getTransaction: async (hash: string) => ({
    txHash: hash,
    status: txStatus,
    ledger: 100,
    // Upload returns the Wasm hash (bytes), create returns the contract address.
    returnValue:
      txStatus === 'SUCCESS' && !createMetaOnly && !createNoId
        ? lastSentWasCreate
          ? new Address(lastCreateWasV2 ? (v2LastCreateWasToken ? v2TokenContractId : v2OfferingContractId) : newContractId).toScVal()
          : nativeToScVal(wasmHashBytes(), { type: 'bytes' })
        : undefined,
    // The real RPC does not populate returnValue for createContract
    // operations; the created instance is then only in the meta.
    resultMetaXdr:
      txStatus === 'SUCCESS' && createMetaOnly && lastSentWasCreate
        ? metaWithCreatedContract(lastCreateWasV2 ? (v2LastCreateWasToken ? v2TokenContractId : v2OfferingContractId) : newContractId)
        : undefined,
  }),
  getContractWasmByContractId: async (id: string) => {
    if (badDeployedWasm) return Buffer.from('wrong');
    if (id === v2TokenContractId) return v2TokenWasm;
    if (id === v2OfferingContractId) return v2OfferingWasm;
    return wasm;
  },
};
sorobanDeps.client = () => client;
const wasmHashBytes = () => createHash('sha256').update(wasm).digest();
// Minimal transaction meta carrying one created contractData instance entry,
// shaped like what the testnet RPC serves for createContract operations.
const metaWithCreatedContract = (contractId: string): string => {
  const raw = Buffer.from(StrKey.decodeContract(contractId));
  const entry = new xdr.LedgerEntry({
    lastModifiedLedgerSeq: 1,
    data: xdr.LedgerEntryData.contractData(
      new xdr.ContractDataEntry({
        ext: xdr.ExtensionPoint.v0(),
        contract: Address.contract(raw).toScAddress(),
        key: xdr.ScVal.scvLedgerKeyContractInstance(),
        durability: xdr.ContractDataDurability.fromName('persistent'),
        val: xdr.ScVal.scvVoid(),
      }),
    ),
    ext: xdr.LedgerEntryExt.v0(),
  });
  return xdr.TransactionMeta.v4(
    new xdr.TransactionMetaV4({
      ext: xdr.ExtensionPoint.v0(),
      txChangesBefore: [],
      operations: [new xdr.OperationMetaV2({ ext: xdr.ExtensionPoint.v0(), changes: [xdr.LedgerEntryChange.ledgerEntryCreated(entry)], events: [] })],
      txChangesAfter: [],
      sorobanMeta: null,
      events: [],
      diagnosticEvents: [],
    }),
  ).toXDR('base64');
};
function reset() {
  fs.rmSync(process.env.SOROBAN_INTENTS_PATH!, { force: true });
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify([{ id: 'taken', name: 'Existing', contractId: StrKey.encodeContract(Buffer.alloc(32, 3)) }]);
  process.env.STELLAR_NETWORK = 'testnet';
  delete process.env.SOROBAN_RECOVERY_MODE;
  addressAuth = false;
  sendCount = 0;
  restoreRequired = false;
  missingAccount = false;
  simError = false;
  throwsOnSend = false;
  badDeployedWasm = false;
  wasmOnLedger = false;
  txStatus = 'SUCCESS';
  v2TokenOnLedger = false;
  v2OfferingOnLedger = false;
  createMetaOnly = false;
  createNoId = false;
}
const input = () => ({ actor: operator.publicKey(), id: 'solar-nine', name: 'Solar Nine', goal: '250', deadline: Math.floor(Date.now() / 1000) + 86400 });
const signed = (builtXdr: string) => {
  const tx = TransactionBuilder.fromXDR(builtXdr, Networks.TESTNET);
  tx.sign(operator);
  return tx.toXDR();
};

test('deploy build validates campaign parameters', async () => {
  reset();
  await assert.rejects(buildCampaignDeploy({ ...input(), id: 'bad id!' }), /invalid campaign id/);
  await assert.rejects(buildCampaignDeploy({ ...input(), name: '' }), /invalid campaign name/);
  await assert.rejects(buildCampaignDeploy({ ...input(), name: 'x'.repeat(121) }), /invalid campaign name/);
  await assert.rejects(buildCampaignDeploy({ ...input(), goal: 'not-a-number' }), /decimal string/);
  await assert.rejects(buildCampaignDeploy({ ...input(), goal: '0' }), /positive/);
  await assert.rejects(buildCampaignDeploy({ ...input(), deadline: 1000 }), /deadline must be in the future/);
  await assert.rejects(buildCampaignDeploy({ ...input(), id: 'taken' }), /already registered/);
});

test('deploy build refuses non-wallet actors and recovery mode', async () => {
  reset();
  await assert.rejects(buildCampaignDeploy({ ...input(), actor: newContractId }), /ordinary wallet account required/);
  process.env.SOROBAN_RECOVERY_MODE = 'true';
  await assert.rejects(buildCampaignDeploy(input()), /recovery mode/);
});

test('deploy build maps simulation and account failures', async () => {
  reset();
  missingAccount = true;
  await assert.rejects(buildCampaignDeploy(input()), /does not exist on testnet/);
  missingAccount = false;
  simError = true;
  await assert.rejects(buildCampaignDeploy(input()), /rejected the transaction simulation/);
  simError = false;
  restoreRequired = true;
  await assert.rejects(buildCampaignDeploy(input()), /state restoration required/);
});

test('deploy build refuses separate address authorization', async () => {
  reset();
  wasmOnLedger = true;
  addressAuth = true;
  await assert.rejects(buildCampaignDeploy(input()), /separate address authorization is unsupported/);
});

test('deploy upload step precedes create when the reviewed Wasm is not on the ledger', async () => {
  reset();
  const upload = await buildCampaignDeploy(input());
  assert.equal(upload.step, 'upload');
  const done = await submitCampaignDeploy({ actor: operator.publicKey(), xdr: signed(upload.xdr) });
  assert.equal(done.step, 'upload');
  assert.equal(done.status, 'SUCCESS');
  assert.match(done.message, /build again to create the campaign instance/);
  assert.ok(!('registryEntry' in done));
  // Once the Wasm is on the ledger, the next build creates the instance.
  wasmOnLedger = true;
  const create = await buildCampaignDeploy(input());
  assert.equal(create.step, 'create');
  const created = await submitCampaignDeploy({ actor: operator.publicKey(), xdr: signed(create.xdr), name: 'Solar Nine' });
  assert.equal(created.step, 'create');
  assert.equal(created.status, 'SUCCESS');
  assert.equal(created.contractId, newContractId);
  assert.deepEqual(created.registryEntry, { id: 'solar-nine', name: 'Solar Nine', contractId: newContractId });
  assert.match(created.note, /SOROBAN_CAMPAIGNS_JSON/);
  // A repeat submit of the same envelope short-circuits on the terminal intent.
  const again = await submitCampaignDeploy({ actor: operator.publicKey(), xdr: signed(create.xdr) });
  assert.equal(again.status, 'SUCCESS');
  assert.equal(again.contractId, newContractId);
});

test('deploy create step runs directly when the reviewed Wasm is already on the ledger', async () => {
  reset();
  wasmOnLedger = true;
  const built = await buildCampaignDeploy(input());
  assert.equal(built.step, 'create');
  assert.equal(built.testOnly, true);
  const tx = TransactionBuilder.fromXDR(built.xdr, Networks.TESTNET);
  assert.equal(tx.operations.length, 1);
});

test('deploy submit rejects envelopes this API did not prepare', async () => {
  reset();
  wasmOnLedger = true;
  const built = await buildCampaignDeploy(input());
  const other = Keypair.random();
  const tx = TransactionBuilder.fromXDR(built.xdr, Networks.TESTNET);
  tx.sign(other);
  await assert.rejects(submitCampaignDeploy({ actor: operator.publicKey(), xdr: tx.toXDR() }), /invalid signed transaction/);
  const stranger = await buildCampaignDeploy({ ...input(), id: 'solar-ten' });
  const strangerTx = TransactionBuilder.fromXDR(stranger.xdr, Networks.TESTNET);
  strangerTx.sign(operator);
  fs.rmSync(process.env.SOROBAN_INTENTS_PATH!, { force: true });
  await assert.rejects(submitCampaignDeploy({ actor: operator.publicKey(), xdr: strangerTx.toXDR() }), /not prepared by this API/);
});

test('deploy submit reports on-chain failure and refuses mismatched code', async () => {
  reset();
  wasmOnLedger = true;
  txStatus = 'FAILED';
  const built = await buildCampaignDeploy(input());
  await assert.rejects(submitCampaignDeploy({ actor: operator.publicKey(), xdr: signed(built.xdr) }), /failed on-chain/);
  reset();
  wasmOnLedger = true;
  badDeployedWasm = true;
  const built2 = await buildCampaignDeploy(input());
  await assert.rejects(submitCampaignDeploy({ actor: operator.publicKey(), xdr: signed(built2.xdr) }), /does not match the reviewed crowdfund Wasm/);
});

test('deploy submit reports broadcast loss as UNKNOWN without guessing', async () => {
  reset();
  wasmOnLedger = true;
  txStatus = 'NOT_FOUND';
  throwsOnSend = true;
  const built = await buildCampaignDeploy(input());
  await assert.rejects(submitCampaignDeploy({ actor: operator.publicKey(), xdr: signed(built.xdr) }), /response lost/);
  const store = JSON.parse(fs.readFileSync(process.env.SOROBAN_INTENTS_PATH!, 'utf8'));
  assert.equal(store.intents.find((i: any) => i.hash === built.hash).status, 'UNKNOWN');
});

// --- v2 contract set (share-token + offering, wired) ---
const v2Input = () => ({
  ...input(),
  id: 'solar-v2',
  v2: { symbol: 'SLRNINE', decimals: 7, minPerInvestor: '10', maxPerInvestor: '1000' },
});

test('v2 build validates the contract-set parameters', async () => {
  reset();
  await assert.rejects(buildCampaignDeployV2({ ...v2Input(), v2: { ...v2Input().v2, symbol: 'bad symbol!' } }), /invalid share-token symbol/);
  await assert.rejects(buildCampaignDeployV2({ ...v2Input(), v2: { ...v2Input().v2, decimals: 19 } }), /invalid share-token decimals/);
  await assert.rejects(buildCampaignDeployV2({ ...v2Input(), v2: { ...v2Input().v2, minPerInvestor: '0' } }), /positive i128 range/);
  await assert.rejects(buildCampaignDeployV2({ ...v2Input(), v2: { ...v2Input().v2, minPerInvestor: '100', maxPerInvestor: '10' } }), /at least the min/);
  await assert.rejects(buildCampaignDeployV2({ ...v2Input(), id: 'taken' }), /already registered/);
});

test('v2 deploy walks the full five-step chain and returns a wired registry entry', async () => {
  reset();
  const run = async () => {
    const built = await buildCampaignDeployV2(v2Input());
    if (built.complete) return built;
    const done = await submitCampaignDeployV2({ actor: operator.publicKey(), xdr: signed(built.xdr), name: 'Solar V2' });
    return { built, done };
  };
  let r: any = await run();
  assert.equal(r.built.step, 'upload-token');
  assert.equal(r.done.step, 'upload-token');
  v2TokenOnLedger = true; // the uploaded code is now on the ledger
  r = await run();
  assert.equal(r.built.step, 'upload-offering');
  v2OfferingOnLedger = true;
  r = await run();
  assert.equal(r.built.step, 'create-token');
  assert.equal(r.done.contractId, v2TokenContractId);
  r = await run();
  assert.equal(r.built.step, 'create-offering');
  assert.equal(r.done.contractId, v2OfferingContractId);
  r = await run();
  assert.equal(r.built.step, 'set-minter');
  assert.equal(r.done.complete, true);
  assert.deepEqual(r.done.registryEntry, {
    id: 'solar-v2',
    name: 'Solar V2',
    contractSet: 'v2',
    tokenContractId: v2TokenContractId,
    offeringContractId: v2OfferingContractId,
  });
  assert.match(r.done.note, /never edits the registry/);
  // A completed campaign reports completion without building another tx.
  const after = await buildCampaignDeployV2(v2Input());
  assert.equal(after.complete, true);
  assert.equal(after.tokenContractId, v2TokenContractId);
  assert.equal(after.offeringContractId, v2OfferingContractId);
});

test('v2 deploy skips both uploads when the pinned Wasms are already on the ledger', async () => {
  reset();
  v2TokenOnLedger = true;
  v2OfferingOnLedger = true;
  const built = await buildCampaignDeployV2(v2Input());
  assert.equal(built.step, 'create-token');
  const tx = TransactionBuilder.fromXDR(built.xdr, Networks.TESTNET);
  assert.equal(tx.operations.length, 1);
});

test('v2 create refuses to journal a contract id whose code mismatches the pin', async () => {
  reset();
  v2TokenOnLedger = true;
  v2OfferingOnLedger = true;
  badDeployedWasm = true;
  const built = await buildCampaignDeployV2(v2Input());
  await assert.rejects(submitCampaignDeployV2({ actor: operator.publicKey(), xdr: signed(built.xdr) }), /does not match its pin/);
});

test('v2 create extracts the contract id from transaction meta when returnValue is absent', async () => {
  reset();
  v2TokenOnLedger = true;
  v2OfferingOnLedger = true;
  createMetaOnly = true;
  const built = await buildCampaignDeployV2(v2Input());
  assert.equal(built.step, 'create-token');
  const done = await submitCampaignDeployV2({ actor: operator.publicKey(), xdr: signed(built.xdr), name: 'Solar V2' });
  assert.equal(done.confirmed, true);
  assert.equal(done.contractId, v2TokenContractId);
  const next = await buildCampaignDeployV2(v2Input());
  assert.equal(next.step, 'create-offering');
});

// In-memory fake of the pg pool surface with a connect() client (the
// PostgresJournal takes the advisory-lock path when connect exists), carrying
// contract_id the way the migrated production table does.
function pgFakePool() {
  const rows = new Map<string, any>();
  let seq = 0;
  const query = async (text: string, params?: unknown[]) => {
    const sql = text.replace(/\s+/g, ' ').trim();
    if (/^(CREATE|ALTER|BEGIN|COMMIT|ROLLBACK)/.test(sql)) return { rows: [], rowCount: 0 };
    if (/^SELECT pg_advisory_lock/.test(sql)) return { rows: [] };
    if (/^SELECT pg_advisory_unlock/.test(sql)) return { rows: [] };
    if (/^SELECT pg_backend_pid/.test(sql)) return { rows: [{ pid: 1 }] };
    if (/^SELECT signed_xdr FROM soroban_intents/.test(sql)) {
      const row = rows.get((params as any[])[0]);
      return { rows: row ? [{ signed_xdr: row.signed_xdr ?? null }] : [] };
    }
    if (/^INSERT INTO soroban_intents/.test(sql)) {
      const [hash, campaign, actor, action, amount, xdr, signed_xdr, status, contract_id] = params as any[];
      const prior = rows.get(hash);
      // Mirror the upsert: a terminal stored status wins, and a stored
      // contract id is never erased by an id-less save.
      const terminal = prior?.status === 'SUCCESS' || prior?.status === 'FAILED';
      rows.set(hash, {
        seq: prior?.seq ?? ++seq,
        hash,
        campaign,
        actor,
        action,
        amount,
        xdr,
        signed_xdr: status === 'SUCCESS' || status === 'FAILED' ? null : (prior?.signed_xdr ?? signed_xdr ?? null),
        status: terminal ? prior.status : status,
        contract_id: contract_id ?? prior?.contract_id ?? null,
      });
      return { rows: [] };
    }
    if (/^SELECT .* FROM soroban_intents ORDER BY seq$/.test(sql)) return { rows: [...rows.values()].sort((a, b) => a.seq - b.seq) };
    if (/^DELETE FROM soroban_intents/.test(sql)) return { rows: [], rowCount: 0 };
    if (/^DELETE FROM soroban_rate_hits/.test(sql)) return { rows: [], rowCount: 0 };
    if (/^SELECT count\(\*\) AS n FROM soroban_rate_hits/.test(sql)) return { rows: [{ n: 0 }] };
    if (/^INSERT INTO soroban_rate_hits/.test(sql)) return { rows: [] };
    throw new Error('unexpected SQL: ' + sql);
  };
  return {
    query,
    async connect() {
      return { query, release() {} };
    },
    async end() {},
  };
}

test('v2 create progression persists the contract id through the Postgres journal backend', async () => {
  reset();
  v2TokenOnLedger = true;
  v2OfferingOnLedger = true;
  createMetaOnly = true;
  // Production runs the Postgres journal; the file backend masked the
  // contract_id drop that stalled v2 progression on testnet.
  injectJournalBackendForTests(new PostgresJournal(pgFakePool() as any));
  try {
    const built = await buildCampaignDeployV2(v2Input());
    assert.equal(built.step, 'create-token');
    const done = await submitCampaignDeployV2({ actor: operator.publicKey(), xdr: signed(built.xdr), name: 'Solar V2' });
    assert.equal(done.confirmed, true);
    assert.equal(done.contractId, v2TokenContractId);
    // Fail-closed progression: a fresh PG read must return the journaled id,
    // so the next build advances instead of repeating the create step.
    const next = await buildCampaignDeployV2(v2Input());
    assert.equal(next.step, 'create-offering');
    // Idempotency: resubmitting the terminal intent sends no new transaction
    // and returns the same confirmed contract id.
    const sends = sendCount;
    const again = await submitCampaignDeployV2({ actor: operator.publicKey(), xdr: signed(built.xdr), name: 'Solar V2' });
    assert.equal(sendCount, sends);
    assert.equal(again.confirmed, true);
    assert.equal(again.contractId, v2TokenContractId);
  } finally {
    resetJournalBackendForTests();
  }
});

test('v2 create fails closed when the journal does not retain the contract id', async () => {
  reset();
  v2TokenOnLedger = true;
  v2OfferingOnLedger = true;
  createMetaOnly = true;
  // Emulates the production drop: a backend whose save loses contractId.
  const inner = await journalBackend();
  injectJournalBackendForTests({
    read: () => inner.read(),
    save: (store: IntentStore) => inner.save({ ...store, intents: store.intents.map((i) => ({ ...i, contractId: undefined })) }),
  });
  try {
    const built = await buildCampaignDeployV2(v2Input());
    const sends = sendCount;
    await assert.rejects(
      submitCampaignDeployV2({ actor: operator.publicKey(), xdr: signed(built.xdr), name: 'Solar V2' }),
      /journal did not retain the contract id/,
    );
    // It must never report confirmed or advance silently in this state.
    assert.equal(sendCount, sends + 1, 'only the original submission was sent');
    const next = await buildCampaignDeployV2(v2Input());
    assert.equal(next.step, 'create-token');
  } finally {
    resetJournalBackendForTests();
  }
});

test('v2 resubmitting a stranded successful create repairs the journal without a new transaction', async () => {
  reset();
  v2TokenOnLedger = true;
  v2OfferingOnLedger = true;
  // Reproduces the observed testnet failure: the create confirms but no
  // contract id is extractable, so nothing is journaled and the chain stalls.
  createNoId = true;
  const built = await buildCampaignDeployV2(v2Input());
  assert.equal(built.step, 'create-token');
  const signedXdr = signed(built.xdr);
  const first = await submitCampaignDeployV2({ actor: operator.publicKey(), xdr: signedXdr, name: 'Solar V2' });
  assert.equal(first.confirmed, false);
  const stuck = await buildCampaignDeployV2(v2Input());
  assert.equal(stuck.step, 'create-token');
  // Same-hash resubmission is terminal (no second sendTransaction) and heals
  // the journal once the id is extractable from the meta.
  createNoId = false;
  createMetaOnly = true;
  const repaired = await submitCampaignDeployV2({ actor: operator.publicKey(), xdr: signedXdr, name: 'Solar V2' });
  assert.equal(repaired.confirmed, true);
  assert.equal(repaired.contractId, v2TokenContractId);
  const next = await buildCampaignDeployV2(v2Input());
  assert.equal(next.step, 'create-offering');
});
