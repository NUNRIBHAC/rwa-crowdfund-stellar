// Manual, read-only shadow check for the batched campaign listing read
// (work/campaign-read-batching). NOT part of the test suite: it makes one
// bounded pass against the live public testnet RPC and compares the old
// per-campaign simulation reads with the new batched ledger read, field by
// field. Run deliberately, never on a schedule:
//   cd backend && npx tsx scripts/shadow-campaign-reads.ts
//
// Measured call accounting (2026-11-05 run, random actor without balances,
// three documented campaigns from docs/testnet-deployment.md):
//   old path: 5 RPC calls per campaign (12 simulateTransaction + 3
//     getLedgerEntries across 3 campaigns)
//   new path: 1 batched getLedgerEntries carrying all 6 keys (3 instance +
//     3 balance) + 3 balance_of simulation fallbacks (all balance entries
//     missing for that actor) = 4 calls total
// Theoretical bounds: old = 5N calls; new = ceil(k/100) batched reads
// (k = N keys without actor, 2N with) plus one balance_of simulation per
// campaign whose balance entry is missing.
import { Account, Address, Contract, Keypair, Networks, TransactionBuilder, rpc, scValToNative } from '@stellar/stellar-sdk';

process.env.USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify([
  { id: 'demo-solar', name: 'Demo Solar Farm (testnet)', contractId: 'CCBIMGPHIOUFN6IC6MYPFXOGJQIRJHHDXA2Y7LQDCYBSJOKHULICO6NY' },
  { id: 'e2e-success', name: 'E2E Success Path', contractId: 'CAF673HYNQLEJJH5XNNZUMXAJQOBNN5FCAOQFBTPTCZZX45UG6PCF5WJ' },
  { id: 'e2e-refund', name: 'E2E Refund Path', contractId: 'CBKUUNTKEJQ7RRXMG7ROOW7ZKTWKBEZLGHAMTICP3FFQRZLRB7LX6CII' },
]);

const actor = Keypair.random().publicKey();
const client = new rpc.Server('https://soroban-testnet.stellar.org', { timeout: 15000 });

async function oldView(contractId: string, method: string, args: unknown[] = []) {
  const tx = new TransactionBuilder(new Account(actor, '0'), { fee: '100', networkPassphrase: Networks.TESTNET })
    .addOperation(new Contract(contractId).call(method, ...(args as never[])))
    .setTimeout(900)
    .build();
  const result = await client.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) throw new Error('contract read failed: ' + result.error);
  if (rpc.Api.isSimulationRestore(result)) throw new Error('contract state archived; operator restoration required');
  if (!result.result) throw new Error('contract read missing result');
  return scValToNative(result.result.retval);
}

const { sorobanCampaigns } = await import('../src/soroban.js');
const entries = JSON.parse(process.env.SOROBAN_CAMPAIGNS_JSON) as { id: string; contractId: string }[];
const t0 = Date.now();
const fresh = await sorobanCampaigns(actor);
const tNew = Date.now() - t0;

let mismatches = 0;
const t1 = Date.now();
for (const e of entries) {
  const [config, raised, withdrawn, balance] = await Promise.all([
    oldView(e.contractId, 'get_config'),
    oldView(e.contractId, 'total_raised'),
    oldView(e.contractId, 'is_withdrawn'),
    oldView(e.contractId, 'balance_of', [Address.account(Keypair.fromPublicKey(actor).rawPublicKey()).toScVal()]),
  ]);
  const got = fresh.find((c: { id: string }) => c.id === e.id) as Record<string, any> | undefined;
  const same =
    got &&
    got.config.creator === config.creator &&
    got.config.token === config.token &&
    String(got.config.goal) === String(config.goal) &&
    String(got.config.deadline) === String(config.deadline) &&
    String(got.raised) === String(raised) &&
    got.withdrawn === withdrawn &&
    String(got.balance) === String(balance);
  console.log(
    e.id,
    same ? 'MATCH' : 'MISMATCH',
    JSON.stringify({
      old: { raised: String(raised), withdrawn, balance: String(balance) },
      new: got && { raised: got.raised, withdrawn: got.withdrawn, balance: got.balance },
    }),
  );
  if (!same) mismatches++;
}
const tOld = Date.now() - t1;
console.log(`mismatches=${mismatches} newBatchMs=${tNew} oldPerCampaignMs=${tOld}`);
process.exit(mismatches ? 1 : 0);
