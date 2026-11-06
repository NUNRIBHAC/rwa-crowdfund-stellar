import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  Account,
  Address,
  Asset,
  Contract,
  Keypair,
  Networks,
  Operation,
  StrKey,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  SorobanDataBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import {
  sorobanDeps,
  amountUnits,
  sorobanCampaigns,
  buildSoroban,
  submitSoroban,
  statusSoroban,
  recoverSoroban,
  confirmedContribution,
  deriveContributionFromNetwork,
} from '../src/soroban.js';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'soroban-api-'));
const actor = Keypair.random();
const contractId = StrKey.encodeContract(Buffer.alloc(32, 2));
process.env.STELLAR_NETWORK = 'testnet';
process.env.USDC_ISSUER = Keypair.random().publicKey();
const tokenId = new Asset('USDC', process.env.USDC_ISSUER).contractId(Networks.TESTNET);
process.env.SOROBAN_INTENTS_PATH = path.join(tmp, 'intents.json');
process.env.COMMUNITY_STORE_PATH = path.join(tmp, 'community-store.json');
process.env.EVENT_ARCHIVE_PATH = path.join(tmp, 'event-archive.json');
const wasmPath = new URL('./fixtures/reviewed-crowdfund.wasm', import.meta.url);
// Reviewed Wasm fixture reproduced from the pinned contract build. This fake
// RPC is adapter evidence only, not evidence of a deployment.
let prepared: Transaction;
let sendCount = 0,
  throwsOnSend = false,
  txStatus = 'NOT_FOUND',
  wrongHash = false;
let badWasm = false,
  addressAuth = false,
  restoreRequired = false,
  missingAccount = false;
let lastEnvelope = '';
let balanceUnits = 0n;
const sends: string[] = [];
const reviewedWasmHash = createHash('sha256').update(fs.readFileSync(wasmPath)).digest();
// Fake instance ledger entry: carries the contract's current wasm hash, the
// field verifyCode now reads per request instead of downloading full code.
// badWasm swaps in a wrong hash; restoreRequired empties the live entries
// (archived instance).
const instanceEntry = () => ({
  latestLedger: 1,
  entries: restoreRequired
    ? []
    : [
        {
          key: new Contract(contractId).getFootprint(),
          val: xdr.LedgerEntryData.contractData(
            new xdr.ContractDataEntry({
              ext: xdr.ExtensionPoint.v0(),
              contract: Address.fromString(contractId).toScAddress(),
              key: xdr.ScVal.scvLedgerKeyContractInstance(),
              durability: xdr.ContractDataDurability.fromName('persistent'),
              val: xdr.ScVal.scvContractInstance(
                new xdr.ScContractInstance({
                  executable: xdr.ContractExecutable.contractExecutableWasm(badWasm ? Buffer.alloc(32, 9) : reviewedWasmHash),
                  storage: [
                    new xdr.ScMapEntry({
                      key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Config')]),
                      val: nativeToScVal({ creator: actor.publicKey(), token: tokenId, goal: 1000000000n, deadline: 2000000000n }),
                    }),
                  ],
                }),
              ),
            }),
          ),
          lastModifiedLedgerSeq: 1,
          liveUntilLedgerSeq: 100,
        },
      ],
});
const client: any = {
  getLedgerEntries: async (...keys: xdr.LedgerKey[]) => {
    const live = new Map((instanceEntry().entries as any[]).map((e) => [e.key.toXDR('base64'), e]));
    return { latestLedger: 1, entries: keys.map((k) => live.get(k.toXDR('base64'))).filter(Boolean) };
  },
  getAccount: async (pub: string) => {
    if (missingAccount) throw new Error('Account not found');
    return new Account(pub, '1');
  },
  simulateTransaction: async (tx: Transaction) => {
    prepared = tx;
    const invoke = (tx.operations[0] as any).func.invokeContract;
    const method = invoke.functionName.toString();
    const value =
      method === 'get_config'
        ? { creator: actor.publicKey(), token: tokenId, goal: 1000000000n, deadline: 2000000000n }
        : method === 'is_withdrawn'
          ? false
          : method === 'balance_of'
            ? balanceUnits
            : 0n;
    const auth = new xdr.SorobanAuthorizationEntry({
      credentials: addressAuth ? ({ type: 'sorobanCredentialsAddress' } as any) : xdr.SorobanCredentials.sorobanCredentialsSourceAccount(),
      rootInvocation: new xdr.SorobanAuthorizedInvocation({
        function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(invoke),
        subInvocations: [],
      }),
    });
    return {
      _parsed: true,
      latestLedger: 1,
      result: { retval: nativeToScVal(value), auth: [auth] },
      events: [],
      minResourceFee: '10000',
      transactionData: new SorobanDataBuilder().setResourceFee('10000'),
      ...(restoreRequired ? { restorePreamble: { transactionData: new SorobanDataBuilder(), minResourceFee: '100' } } : {}),
    };
  },
  prepareTransaction: async (tx: Transaction) => {
    prepared = tx;
    return tx;
  },
  sendTransaction: async (tx: Transaction) => {
    sendCount++;
    sends.push(tx.toXDR());
    lastEnvelope = tx.toXDR();
    if (throwsOnSend) throw new Error('response lost');
    return { hash: Buffer.from(tx.hash()).toString('hex'), status: 'PENDING' };
  },
  getTransaction: async (hash: string) => ({
    txHash: wrongHash ? 'wrong' : hash,
    status: txStatus,
    ledger: 100,
    envelopeXdr: lastEnvelope,
  }),
};
sorobanDeps.client = () => client;
function reset() {
  balanceUnits = 0n;
  fs.rmSync(process.env.SOROBAN_INTENTS_PATH!, { force: true });
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify([{ id: 's1', name: 'Soroban test campaign', contractId }]);
  process.env.STELLAR_NETWORK = 'testnet';
  sendCount = 0;
  sends.length = 0;
  throwsOnSend = false;
  txStatus = 'NOT_FOUND';
  wrongHash = false;
  lastEnvelope = '';
  badWasm = false;
  addressAuth = false;
  restoreRequired = false;
  process.env.SOROBAN_BUILD_RATE_PER_MIN = '1000';
  process.env.SOROBAN_RECOVER_RATE_PER_MIN = '1000';
  delete process.env.SOROBAN_MAX_OPEN_INTENTS;
}
const signed = (built: any, signer = actor) => {
  const tx = TransactionBuilder.fromXDR(built.xdr, Networks.TESTNET);
  tx.sign(signer);
  return tx.toXDR();
};
// Build tests rely on fixture below that can be reproduced from pinned Rust.
assert.ok(fs.existsSync(wasmPath), 'reviewed Wasm fixture must exist');
const fixtureAvailable = true;

test('amounts use seven-decimal integer precision and reject overflow/float input', () => {
  assert.equal(amountUnits('10.0000001'), 100000001n);
  for (const invalid of ['0', '-1', '1.00000001', 'NaN', '1e7', '99999999999999999999999999999999999999999999']) assert.throws(() => amountUnits(invalid));
  assert.throws(() => amountUnits(1 as any));
});

test('empty registry is explicit and public network is always disabled', async () => {
  reset();
  process.env.SOROBAN_CAMPAIGNS_JSON = '[]';
  assert.deepEqual(await sorobanCampaigns(), []);
  process.env.STELLAR_NETWORK = 'public';
  await assert.rejects(sorobanCampaigns(), /testnet-only/);
});

test('registry duplicate and unreviewed Wasm fail closed', async () => {
  reset();
  badWasm = true;
  await assert.rejects(buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '10' }), /does not match reviewed/);
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify([
    { id: 's1', name: 'One', contractId },
    { id: 's1', name: 'Two', contractId },
  ]);
  await assert.rejects(sorobanCampaigns(), /duplicate/);
});

test('missing wallet account surfaces as coded SIM_ACCOUNT_MISSING', { skip: !fixtureAvailable }, async () => {
  reset();
  missingAccount = true;
  try {
    await assert.rejects(buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '10' }), (e: any) => {
      assert.equal(e.code, 'SIM_ACCOUNT_MISSING');
      return true;
    });
  } finally {
    missingAccount = false;
  }
});

test('RPC adapter prepares contract call with no local contribution reservation', { skip: !fixtureAvailable }, async () => {
  reset();
  const b = await buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '10.25' });
  assert.equal(prepared.operations.length, 1);
  const assembled = TransactionBuilder.fromXDR(b.xdr, Networks.TESTNET);
  assert.ok(BigInt(assembled.fee) >= 10100n, 'resource fee from real SDK assembly included');
  const call = (prepared.operations[0] as any).func.invokeContract;
  assert.equal(call.functionName.toString(), 'contribute');
  assert.equal(b.networkPassphrase, Networks.TESTNET);
  const store = JSON.parse(fs.readFileSync(process.env.SOROBAN_INTENTS_PATH!, 'utf8'));
  assert.equal(store.intents[0].status, 'BUILT');
  assert.equal(store.raised, undefined);
  assert.equal(sendCount, 0);
  const campaigns = await sorobanCampaigns(actor.publicKey());
  assert.equal(campaigns[0].raised, '0');
});

test('signed intent survives response loss, holds on NOT_FOUND and retries identical XDR', { skip: !fixtureAvailable }, async () => {
  reset();
  const b = await buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '10' });
  const x = signed(b);
  throwsOnSend = true;
  await assert.rejects(submitSoroban('s1', { actor: actor.publicKey(), xdr: x }), /response lost/);
  const stored = JSON.parse(fs.readFileSync(process.env.SOROBAN_INTENTS_PATH!, 'utf8')).intents[0];
  assert.equal(stored.signedXdr, x);
  assert.equal(stored.status, 'UNKNOWN');
  const missing = await statusSoroban(b.hash);
  assert.equal(missing.held, true);
  await assert.rejects(buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '10' }), /unresolved/);
  throwsOnSend = false;
  await submitSoroban('s1', { actor: actor.publicKey(), xdr: x });
  assert.deepEqual(sends, [x, x]);
  txStatus = 'SUCCESS';
  const success = await statusSoroban(b.hash);
  assert.equal(success.confirmed, true);
  await submitSoroban('s1', { actor: actor.publicKey(), xdr: x });
  assert.equal(sendCount, 2, 'confirmed hash never resent');
});

test('confirmedContribution derives the record from the network-confirmed envelope, never journal fields', { skip: !fixtureAvailable }, async () => {
  reset();
  const b = await buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '10' });
  await submitSoroban('s1', { actor: actor.publicKey(), xdr: signed(b) });
  txStatus = 'SUCCESS';
  await statusSoroban(b.hash);
  // Derived from the network envelope: registered campaign + contract,
  // function contribute, contributor = envelope source.
  assert.deepEqual(await confirmedContribution(b.hash), { campaignId: 's1', contributor: actor.publicKey() });
  // Unknown hash, non-contribute action and non-SUCCESS intents are null.
  assert.equal(await confirmedContribution('0'.repeat(64)), null);
  // Network response without an envelope is retryable (throw), never a
  // journal-field guess.
  const saved = lastEnvelope;
  lastEnvelope = '';
  await assert.rejects(confirmedContribution(b.hash), /no transaction envelope/);
  lastEnvelope = saved;
  // Journal row fields are never trusted: even a tampered campaign field is
  // ignored - derivation is authoritative from the network envelope and the
  // registry (matched by contract id).
  const p = process.env.SOROBAN_INTENTS_PATH!;
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  doc.intents[0].campaign = 'unregistered';
  fs.writeFileSync(p, JSON.stringify(doc));
  assert.deepEqual(await confirmedContribution(b.hash), { campaignId: 's1', contributor: actor.publicKey() });
  // Network-only derivation works without any journal row at all (post-prune).
  fs.rmSync(p, { force: true });
  assert.equal(await confirmedContribution(b.hash), null, 'journal filter: unknown hash is null');
  assert.deepEqual(await deriveContributionFromNetwork(b.hash), { campaignId: 's1', contributor: actor.publicKey() });
});

test('terminal intent status stays readable after the journal purges its signed envelope', { skip: !fixtureAvailable }, async () => {
  reset();
  const b = await buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '10' });
  await submitSoroban('s1', { actor: actor.publicKey(), xdr: signed(b) });
  txStatus = 'SUCCESS';
  const first = await statusSoroban(b.hash);
  assert.equal(first.confirmed, true);
  // Once terminal, the journal's retention policy scrubs signedXdr
  // (purgeTerminalEnvelopes on read); a later status check must still return
  // the recorded terminal status instead of 400ing as 'signed intent not found'.
  const stored = JSON.parse(fs.readFileSync(process.env.SOROBAN_INTENTS_PATH!, 'utf8')).intents[0];
  assert.equal(stored.status, 'SUCCESS');
  const again = await statusSoroban(b.hash);
  assert.equal(again.status, 'SUCCESS');
  assert.equal(again.confirmed, true);
});

test('wrong signer, unknown signed envelope and mismatched status hashes are rejected', { skip: !fixtureAvailable }, async () => {
  reset();
  const b = await buildSoroban('s1', { actor: actor.publicKey(), action: 'refund' });
  await assert.rejects(submitSoroban('s1', { actor: actor.publicKey(), xdr: signed(b, Keypair.random()) }), /invalid signed/);
  const x = signed(b);
  await submitSoroban('s1', { actor: actor.publicKey(), xdr: x });
  wrongHash = true;
  await assert.rejects(statusSoroban(b.hash), /mismatched/);
  wrongHash = false;
  txStatus = 'FAILED';
  const failed = await statusSoroban(b.hash);
  assert.equal(failed.confirmed, false);
  assert.equal(failed.status, 'FAILED');
});

test('legacy campaign never becomes a contract campaign implicitly', async () => {
  reset();
  await assert.rejects(buildSoroban('c1', { actor: actor.publicKey(), action: 'refund' }), /not registered/);
});

test('archived state requires restoration before a wallet is asked to sign', async () => {
  reset();
  restoreRequired = true;
  await assert.rejects(buildSoroban('s1', { actor: actor.publicKey(), action: 'refund' }), /restoration required/);
  assert.equal(sendCount, 0);
});

test('source-account auth assembles; separate address credentials fail before signing', async () => {
  reset();
  const source = await buildSoroban('s1', { actor: actor.publicKey(), action: 'refund' });
  const tx = TransactionBuilder.fromXDR(source.xdr, Networks.TESTNET) as Transaction;
  assert.equal((tx.operations[0] as any).auth[0].credentials.type, 'sorobanCredentialsSourceAccount');
  addressAuth = true;
  await assert.rejects(buildSoroban('s1', { actor: actor.publicKey(), action: 'refund' }), /separate address authorization/);
});

test('noncreator cannot prepare creator withdrawal', async () => {
  reset();
  await assert.rejects(buildSoroban('s1', { actor: Keypair.random().publicKey(), action: 'withdraw' }), /only the creator/);
});

test('HTTP build/submit/status roundtrip invokes only registered Soroban flow', async () => {
  reset();
  process.env.NODE_ENV = 'test';
  const { app } = await import('../src/server.js');
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  const root = `http://127.0.0.1:${(srv.address() as any).port}`;
  const post = (url: string, body: any) => fetch(root + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const list = await fetch(root + '/api/campaigns');
    assert.equal(list.status, 200);
    assert.match(list.headers.get('content-security-policy') ?? '', /default-src 'self'/);
    assert.match(list.headers.get('strict-transport-security') ?? '', /max-age=/);
    assert.equal(list.headers.get('x-frame-options'), 'DENY');
    assert.equal(list.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(((await list.json()) as any).campaigns[0].mode, 'soroban');
    const build = await post('/api/campaigns/s1/soroban/build', { actor: actor.publicKey(), action: 'contribute', amount: '1' });
    assert.equal(build.status, 200);
    const b: any = await build.json();
    assert.equal(b.feeStroops, '10100');
    const response = await post('/api/campaigns/s1/soroban/submit', { actor: actor.publicKey(), xdr: signed(b) });
    assert.equal(response.status, 200);
    assert.equal(((await response.json()) as any).confirmed, false);
    txStatus = 'SUCCESS';
    const checked: any = await (await fetch(root + '/api/soroban/transactions/' + b.hash)).json();
    assert.equal(checked.confirmed, true);
    assert.equal(sendCount, 1);
  } finally {
    srv.close();
  }
});

test('journal-loss recovery re-registers exact signed intent, blocks replacement until resolved', async () => {
  reset();
  const b = await buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '1' });
  const signedXdr = signed(b);
  fs.rmSync(process.env.SOROBAN_INTENTS_PATH!, { force: true }); // journal lost
  const r = await recoverSoroban({ actor: actor.publicKey(), xdr: signedXdr });
  assert.equal(r.recovered, true);
  assert.equal(r.status, 'NOT_FOUND');
  assert.equal(r.campaign, 's1');
  await assert.rejects(buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '1' }), /unresolved/);
  txStatus = 'SUCCESS';
  assert.equal((await statusSoroban(b.hash)).status, 'SUCCESS');
  await buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '1' }); // allowed once terminal
});

test('recovery never submits and rejects a mismatched RPC hash', async () => {
  reset();
  wrongHash = true;
  const b = await buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '1' });
  fs.rmSync(process.env.SOROBAN_INTENTS_PATH!, { force: true });
  await assert.rejects(recoverSoroban({ actor: actor.publicKey(), xdr: signed(b) }), /mismatched/);
  assert.equal(sendCount, 0);
});

test('recovery mode blocks all builds after a stale restore until operator reconciliation', async () => {
  reset();
  // Signed intent exists only in a journal portion a stale backup would lose.
  const b = await buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '1' });
  const signedXdr = signed(b);
  // Operator restores an older journal without that intent and starts in recovery mode.
  fs.rmSync(process.env.SOROBAN_INTENTS_PATH!, { force: true });
  process.env.SOROBAN_RECOVERY_MODE = 'true';
  // Without the gate this build would create a duplicate while the signed
  // envelope is outstanding. The gate rejects it for every actor.
  await assert.rejects(buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '1' }), /recovery mode/);
  await assert.rejects(buildSoroban('s1', { actor: Keypair.random().publicKey(), action: 'contribute', amount: '1' }), /recovery mode/);
  // Reconciliation: the retained envelope is re-registered and resolves.
  const r = await recoverSoroban({ actor: actor.publicKey(), xdr: signedXdr });
  assert.equal(r.campaign, 's1');
  txStatus = 'SUCCESS';
  assert.equal((await statusSoroban(b.hash)).status, 'SUCCESS');
  // Operator completes reconciliation and lifts the gate.
  delete process.env.SOROBAN_RECOVERY_MODE;
  await buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '1' });
  delete process.env.SOROBAN_RECOVERY_MODE;
});

test('per-actor open intent cap blocks further builds until intents resolve', { skip: !fixtureAvailable }, async () => {
  reset();
  process.env.SOROBAN_MAX_OPEN_INTENTS = '2';
  const a = Keypair.random();
  await buildSoroban('s1', { actor: a.publicKey(), action: 'contribute', amount: '1' });
  await buildSoroban('s1', { actor: a.publicKey(), action: 'contribute', amount: '1' });
  await assert.rejects(buildSoroban('s1', { actor: a.publicKey(), action: 'contribute', amount: '1' }), /too many open intents/);
  // A different actor is unaffected.
  await buildSoroban('s1', { actor: Keypair.random().publicKey(), action: 'contribute', amount: '1' });
});

test('build and recover rate limits reject bursts per actor', { skip: !fixtureAvailable }, async () => {
  reset();
  process.env.SOROBAN_BUILD_RATE_PER_MIN = '2';
  process.env.SOROBAN_RECOVER_RATE_PER_MIN = '1';
  const a = Keypair.random();
  await buildSoroban('s1', { actor: a.publicKey(), action: 'contribute', amount: '1' });
  await buildSoroban('s1', { actor: a.publicKey(), action: 'contribute', amount: '1' });
  await assert.rejects(buildSoroban('s1', { actor: a.publicKey(), action: 'contribute', amount: '1' }), /rate limit/);
  // A separate fresh actor: recover limit is independent of build.
  const c = Keypair.random();
  const b = await buildSoroban('s1', { actor: c.publicKey(), action: 'contribute', amount: '1' });
  fs.rmSync(process.env.SOROBAN_INTENTS_PATH!, { force: true }); // journal lost
  const r = await recoverSoroban({ actor: c.publicKey(), xdr: signed(b, c) });
  assert.equal(r.recovered, true);
  await assert.rejects(recoverSoroban({ actor: c.publicKey(), xdr: signed(b, c) }), /rate limit/);
});

test('quarantined journal rows fail API safety holds closed with a reconciliation diagnostic', { skip: !fixtureAvailable }, async () => {
  // A semantically corrupt journal row (staging-drill scenario) is excluded
  // from lookups but must never CLEAR a safety hold by its absence: builds
  // and recoveries refuse until an operator reconciles the preserved row.
  reset();
  const { PostgresJournal, injectJournalBackendForTests, resetJournalBackendForTests } = await import('../src/journal.js');
  const junkHash = 'f'.repeat(64);
  const seeded = [
    {
      hash: junkHash,
      campaign: 's1',
      actor: actor.publicKey(),
      action: 'contribute',
      amount: null,
      xdr: 'not-xdr',
      signed_xdr: null,
      status: 'GARBAGE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  const handle = async (text: string): Promise<any> => {
    const sql = text.replace(/\s+/g, ' ').trim();
    if (/^(CREATE|ALTER)/.test(sql)) return { rows: [] };
    if (/pg_advisory_(un)?lock/.test(sql)) return { rows: [] };
    if (/pg_backend_pid/.test(sql)) return { rows: [{ pid: 1 }] };
    if (/^DELETE FROM soroban_rate_hits/.test(sql)) return { rows: [], rowCount: 0 };
    if (/^SELECT count\(\*\) AS n FROM soroban_rate_hits/.test(sql)) return { rows: [{ n: '0' }] };
    if (/^INSERT INTO soroban_rate_hits/.test(sql)) return { rows: [] };
    if (/^SELECT .* FROM soroban_intents ORDER BY seq$/.test(sql)) return { rows: seeded };
    throw new Error('unexpected SQL: ' + sql);
  };
  const client = { query: handle, release: () => {} };
  const pool = { query: handle, end: async () => {}, connect: async () => client };
  injectJournalBackendForTests(new PostgresJournal(pool as any));
  try {
    await assert.rejects(buildSoroban('s1', { actor: actor.publicKey(), action: 'contribute', amount: '10' }), /quarantined record/);
    await assert.rejects(statusSoroban(junkHash), /quarantined/);
    const tx = new TransactionBuilder(new Account(actor.publicKey(), '7'), { fee: '100', networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.payment({ destination: Keypair.random().publicKey(), asset: Asset.native(), amount: '1' }))
      .setTimeout(60)
      .build();
    tx.sign(actor);
    await assert.rejects(recoverSoroban({ actor: actor.publicKey(), xdr: tx.toXDR() }), /quarantined record/);
    assert.equal(sendCount, 0, 'nothing broadcast while the journal is unreconciled');
  } finally {
    resetJournalBackendForTests();
  }
});

test('refund intents journal the on-chain escrowed amount, never a client-supplied one', { skip: !fixtureAvailable }, async () => {
  reset();
  balanceUnits = 10000000n;
  await buildSoroban('s1', { actor: actor.publicKey(), action: 'refund', amount: '999' });
  const stored = JSON.parse(fs.readFileSync(process.env.SOROBAN_INTENTS_PATH!, 'utf8')).intents[0];
  assert.equal(stored.action, 'refund');
  assert.equal(stored.amount, '1');
});

test('refund with a zero balance leaves the amount unrecorded', { skip: !fixtureAvailable }, async () => {
  reset();
  await buildSoroban('s1', { actor: actor.publicKey(), action: 'refund' });
  const stored = JSON.parse(fs.readFileSync(process.env.SOROBAN_INTENTS_PATH!, 'utf8')).intents[0];
  assert.equal(stored.amount, undefined);
});
