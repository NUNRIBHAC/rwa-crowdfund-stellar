// Connected existing services with an isolated RPC adapter. No live signatures,
// hosted sessions, real money or production eligibility are proven by this test.
import { test, after } from 'node:test';
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
  StrKey,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  SorobanDataBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import { sorobanDeps, sorobanCampaigns, buildSoroban, submitSoroban, statusSoroban, confirmedContribution } from '../src/soroban.js';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'soroban-api-'));
const actor = Keypair.random();
const issuer = Keypair.random();
const contractId = StrKey.encodeContract(Buffer.alloc(32, 2));
process.env.STELLAR_NETWORK = 'testnet';
process.env.USDC_ISSUER = Keypair.random().publicKey();
const tokenId = new Asset('USDC', process.env.USDC_ISSUER).contractId(Networks.TESTNET);
process.env.SOROBAN_INTENTS_PATH = path.join(tmp, 'intents.json');
const wasmPath = new URL('./fixtures/reviewed-crowdfund.wasm', import.meta.url);
// Reviewed Wasm fixture reproduced from the pinned contract build. This fake
// RPC is adapter evidence only, not evidence of a deployment.

let sendCount = 0,
  throwsOnSend = false,
  txStatus = 'NOT_FOUND',
  wrongHash = false;
let badWasm = false,
  addressAuth = false,
  restoreRequired = false;
const missingAccount = false;
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
                      val: nativeToScVal({ creator: issuer.publicKey(), token: tokenId, goal: 1000000000n, deadline: 2000000000n }),
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
    const invoke = (tx.operations[0] as any).func.invokeContract;
    const method = invoke.functionName.toString();
    const value =
      method === 'get_config'
        ? { creator: issuer.publicKey(), token: tokenId, goal: 1000000000n, deadline: 2000000000n }
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

import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService, KNOWLEDGE_QUESTIONS } from '../src/community.js';
import { saveOnboarding, readOnboarding } from '../src/investor-onboarding.js';
import { journalBackend } from '../src/journal.js';
import { buildShareRegister } from '../src/share-register.js';
import { buildCapTable, holdingFromCapTable } from '../src/corporate-actions.js';

test('connected application, review, onboarding, contribution adapter and matching persisted records', async () => {
  reset();
  const file = path.join(tmp, 'community.json');
  let store = new FileCommunityStore(file);
  let service = new CommunityService(store);
  const business = { publicKey: issuer.publicKey(), displayName: null, createdAt: Date.now() };
  const investor = { publicKey: actor.publicKey(), displayName: null, createdAt: Date.now() };
  await store.change((s) => {
    s.accounts[business.publicKey] = business;
    s.accounts[investor.publicKey] = investor;
  });
  const application = await service.submitApplication(business, {
    projectName: 'Connected synthetic project - DEMO',
    country: 'PT',
    instrumentType: 'Testnet escrow, no rights',
    targetAmount: '100',
    description: 'Isolated adapter proof only.',
  });
  await service.addApplicationDocument(business, application.id, { filename: 'synthetic.txt', content: 'SYNTHETIC DOCUMENT. No verified business or rights.' });
  await service.adminSetApplicationStatus(application.id, 'under_review', 'isolated:test');
  await service.adminSetApplicationStatus(application.id, 'approved', 'isolated:test', 'Prototype only');
  const campaign = (await sorobanCampaigns())[0];
  await service.linkApplicationCampaign(application.id, { id: campaign.id, contractId, creator: issuer.publicKey(), network: 'testnet' }, 'isolated:test');
  await service.submitKnowledgeAssessment(investor, { experienceLevel: 'some', objective: 'growth', answers: KNOWLEDGE_QUESTIONS.map((q) => q.correct) });
  await service.transmitSimulationResult(investor, { netWorthEur: 100, capacityEur: 10 });
  const onboarding = await saveOnboarding(store, investor, { identity: 'passed', risksAcknowledged: true });
  assert.equal(onboarding.eligibility, 'demo_ready');
  assert.equal(onboarding.realInvestmentEligible, false);
  const built = await buildSoroban(campaign.id, { actor: investor.publicKey, action: 'contribute', amount: '10' });
  await submitSoroban(campaign.id, { actor: investor.publicKey, xdr: signed(built) });
  txStatus = 'SUCCESS';
  assert.equal((await statusSoroban(built.hash)).confirmed, true);
  const proof = await confirmedContribution(built.hash);
  assert.ok(proof);
  await service.recordContributor(proof.campaignId, proof.contributor);
  // Reopen the real stores, rather than compare transient UI state.
  store = new FileCommunityStore(file);
  service = new CommunityService(store);
  const own = (await service.listOwnApplications(business)).find((a) => a.id === application.id)!;
  assert.equal(own.campaign?.id, campaign.id);
  assert.equal((await service.listOwnApplications(investor)).length, 0);
  assert.equal((await readOnboarding(store, investor)).eligibility, 'demo_ready');
  const state = await store.read();
  const intents = (await (await journalBackend()).read()).intents;
  const register = buildShareRegister(campaign.id, intents, Object.values(state.contributors), 'testnet');
  const row = register.contributors.find((r) => r.publicKey === investor.publicKey)!;
  assert.equal(row.registered, true);
  assert.equal(row.netIntended, '10');
  assert.ok(row.intentHashes.includes(built.hash));
  // Fake RPC has no transfer event: confirmed cashflow remains UNKNOWN.
  assert.equal(row.netConfirmed, 'UNKNOWN');
  const holding = holdingFromCapTable(buildCapTable(register), investor.publicKey)!;
  assert.equal(holding.campaignId, own.campaign?.id);
  assert.equal(holding.position, '10');
  assert.equal(holding.positionSource, 'journal-intended');
  assert.equal(sendCount, 1);
});

after(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  delete process.env.SOROBAN_CAMPAIGNS_JSON;
  delete process.env.SOROBAN_INTENTS_PATH;
});
