// Local CPU benchmark of the public listing adapter, not an RPC capacity test.
// Run with: node --import tsx load/bench-campaign-listing.mts
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { Socket } from 'node:net';
import { Address, Asset, Contract, Keypair, Networks, nativeToScVal, StrKey, xdr } from '@stellar/stellar-sdk';

const count = Number(process.env.BENCH_CAMPAIGNS ?? 100);
const iterations = Number(process.env.BENCH_ITERATIONS ?? 1000);
assert(Number.isSafeInteger(count) && count > 0 && count <= 1000);
assert(Number.isSafeInteger(iterations) && iterations > 0 && iterations <= 100000);
process.env.STELLAR_NETWORK = 'testnet';
const issuer = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 2)).publicKey();
const creator = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 3)).publicKey();
process.env.USDC_ISSUER = issuer;
const token = new Asset('USDC', issuer).contractId(Networks.TESTNET);
const registry = Array.from({ length: count }, (_, i) => {
  const bytes = Buffer.alloc(32);
  bytes.writeUInt32BE(i + 1, 28);
  return { id: `campaign-${i}`, name: `Campaign ${i}`, contractId: StrKey.encodeContract(bytes) };
});
process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify(registry);
const config = xdr.ScVal.scvMap([
  new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('creator'), val: Address.fromString(creator).toScVal() }),
  new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('deadline'), val: nativeToScVal(2000000000n, { type: 'u64' }) }),
  new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('goal'), val: nativeToScVal(5000000000n, { type: 'i128' }) }),
  new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('token'), val: Address.fromString(token).toScVal() }),
]);
const fixtures = new Map(
  registry.map((entry) => {
    const contract = new Contract(entry.contractId);
    const key = contract.getFootprint();
    const val = xdr.LedgerEntryData.contractData(
      new xdr.ContractDataEntry({
        ext: xdr.ExtensionPoint.v0(),
        contract: contract.address().toScAddress(),
        key: xdr.ScVal.scvLedgerKeyContractInstance(),
        durability: xdr.ContractDataDurability.persistent,
        val: xdr.ScVal.scvContractInstance(
          new xdr.ScContractInstance({
            executable: xdr.ContractExecutable.contractExecutableWasm(Buffer.from('202c9d7e59623c06d1eb2f1ade4cbd187a73ccd3f8154673593820c71db1b564', 'hex')),
            storage: [
              new xdr.ScMapEntry({ key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Config')]), val: config }),
              new xdr.ScMapEntry({ key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Raised')]), val: nativeToScVal(1234567n, { type: 'i128' }) }),
              new xdr.ScMapEntry({ key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Withdrawn')]), val: xdr.ScVal.scvBool(false) }),
            ],
          }),
        ),
      }),
    );
    return [key.toXDR('base64'), { key, val }] as const;
  }),
);
// Imports never start the real server. Replace RPC before any read and refuse
// network access, including accidental future calls from the adapter.
const networkForbidden = () => {
  throw new Error('Network forbidden in local benchmark');
};
globalThis.fetch = async () => networkForbidden();
Socket.prototype.connect = networkForbidden;
const { sorobanCampaigns, sorobanDeps } = await import(pathToFileURL(resolve(process.env.BENCH_SOURCE ?? 'backend/src/soroban.ts')).href);
const { CampaignListCache } = await import('../backend/src/campaign-list-cache.js');
let rpcCalls = 0;
sorobanDeps.client = () =>
  ({
    getLedgerEntries: async (...keys: xdr.LedgerKey[]) => {
      rpcCalls++;
      return {
        latestLedger: 1,
        entries: keys
          .map((key) => fixtures.get(key.toXDR('base64')))
          .filter(Boolean)
          .reverse(),
      };
    },
    simulateTransaction: async () => {
      throw new Error('Unexpected simulation');
    },
  }) as unknown as ReturnType<typeof sorobanDeps.client>;
const mode = process.env.BENCH_MODE ?? 'fresh';
assert(['fresh', 'warm'].includes(mode));
const cache = new CampaignListCache();
const read = async () => JSON.stringify({ campaigns: mode === 'warm' ? await cache.read(sorobanCampaigns) : await sorobanCampaigns(), mode: 'soroban' });
const expected = await read();
assert.equal(JSON.parse(expected).campaigns.length, count);
for (let i = 0; i < 100; i++) assert.equal(await read(), expected);
let tokenDerivations = 0;
const original = Asset.prototype.contractId;
Asset.prototype.contractId = function (...args) {
  tokenDerivations++;
  return original.apply(this, args);
};
// Count derivations in a separate probe; do not time the instrumentation.
assert.equal(await read(), expected);
Asset.prototype.contractId = original;
rpcCalls = 0;
const delay = monitorEventLoopDelay({ resolution: 10 });
delay.enable();
const cpu = process.cpuUsage();
const resources = process.resourceUsage();
const start = performance.now();
const samples: number[] = [];
let errors = 0;
for (let i = 0; i < iterations; i++) {
  const t = performance.now();
  try {
    assert.equal(await read(), expected);
  } catch {
    errors++;
  }
  samples.push(performance.now() - t);
  if (i % 10 === 0) await new Promise<void>((done) => setImmediate(done));
}
const elapsedMs = performance.now() - start;
const usedCpu = process.cpuUsage(cpu);
delay.disable();
samples.sort((a, b) => a - b);
const percentile = (p: number) => samples[Math.min(samples.length - 1, Math.ceil(samples.length * p) - 1)];
console.log(
  JSON.stringify({
    label: process.env.BENCH_LABEL ?? 'working-tree',
    commit: process.env.BENCH_COMMIT ?? 'unspecified',
    node: process.version,
    timestamp: new Date().toISOString(),
    environment: 'isolated local in-memory RPC fixture; no hosted services',
    mode,
    campaigns: count,
    registryBytes: Buffer.byteLength(process.env.SOROBAN_CAMPAIGNS_JSON),
    fixtureXdrBytes: [...fixtures.values()].reduce((n, e) => n + e.key.toXDR().length + e.val.toXDR().length, 0),
    responseBytes: Buffer.byteLength(expected),
    responseSha256: createHash('sha256').update(expected).digest('hex'),
    iterations,
    concurrency: 1,
    warmupIterations: 100,
    elapsedMs,
    operationsPerSecond: iterations / (elapsedMs / 1000),
    p50Ms: percentile(0.5),
    p95Ms: percentile(0.95),
    p99Ms: percentile(0.99),
    errors,
    rpcCalls,
    tokenDerivationsPerProbe: tokenDerivations,
    cpuUserMs: usedCpu.user / 1000,
    cpuSystemMs: usedCpu.system / 1000,
    maxRssKiB: process.resourceUsage().maxRSS,
    rssBytes: process.memoryUsage().rss,
    eventLoopDelayP95Ms: delay.percentile(95) / 1e6,
    voluntaryContextSwitches: process.resourceUsage().voluntaryContextSwitches - resources.voluntaryContextSwitches,
  }),
);
assert.equal(errors, 0);
