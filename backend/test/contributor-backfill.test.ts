import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { backfillCampaignContributors } from '../src/contributor-backfill.js';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';

const G1 = 'G' + 'A'.repeat(55);
const G2 = 'G' + 'B'.repeat(55);
const CONTRACT = 'CCUYSC424OJYEWFJHRCKMNBFQHRWWQQICXAZPRXJUM7PBTTYJFXN2Z73';

type FakeEvent = { ledger: number; topic: any[]; value?: any };

class FakeClient {
  calls: { startLedger: number; limit?: number }[] = [];
  failOnCall = -1; // 1-based getEvents call index that throws a generic RPC error
  constructor(
    public latest: number,
    public floor: number,
    public events: FakeEvent[],
  ) {}
  async getLatestLedger() {
    return { sequence: this.latest };
  }
  callsRaw: any[] = [];
  async getEvents(params: any) {
    this.calls.push({ startLedger: params.startLedger, limit: params.limit });
    this.callsRaw.push(params);
    if (this.failOnCall === this.calls.length) throw new Error('rpc connection reset');
    if (params.startLedger < this.floor) {
      throw new Error(`startLedger must be within the ledger range: ${this.floor} - ${this.latest + 1}`);
    }
    const evs = this.events.filter((e) => e.ledger >= params.startLedger);
    return { events: evs.slice(0, params.limit ?? 1000) };
  }
}

const harness = (client: FakeClient, prior?: any) => {
  const recorded: string[] = [];
  const checkpoints: any[] = [];
  const run = () =>
    backfillCampaignContributors({
      client,
      campaignId: 'qa-campaign',
      contractId: CONTRACT,
      readCheckpoint: async () => prior,
      record: async (_id, contributor) => {
        if (!recorded.includes(contributor)) recorded.push(contributor);
      },
      checkpoint: async (_id, cp) => {
        checkpoints.push(cp);
        prior = cp;
      },
      now: () => 1111111,
    });
  return { run, recorded, checkpoints };
};

const contributed = (ledger: number, who: string): FakeEvent => ({
  ledger,
  topic: [{ symbol: 'contributed' }, { address: who }],
  value: { map: [] },
});

test('first run clamps to the observed retention floor, flags the unknown window below it', async () => {
  const client = new FakeClient(2000, 1000, [contributed(1500, G1)]);
  const { run, recorded, checkpoints } = harness(client);
  const r = await run();
  assert.deepEqual(recorded, [G1]);
  assert.equal(r.gap, 'start-before-floor');
  assert.equal(r.recorded, 1);
  const last = checkpoints.at(-1);
  assert.equal(last.processedThroughLedger, 2000);
  assert.equal(last.gap, 'start-before-floor');
  assert.equal(last.floorLedger, 1000);
  assert.equal(last.floorObservedAt, 1111111);
});

test('retention-floor rejection as a plain { code, message } object (live Soroban RPC throw shape) still clamps to the floor', async () => {
  const client = new FakeClient(2000, 1000, [contributed(1500, G1)]);
  // The live RPC rejects with a plain object, not an Error instance.
  const plainRpcError = { code: -32600, message: 'startLedger must be within the ledger range: 1000 - 2001' };
  const original = client.getEvents.bind(client);
  client.getEvents = (async (params: any) => {
    if (params.startLedger < 1000) throw plainRpcError;
    return original(params);
  }) as FakeClient['getEvents'];
  const { run, recorded, checkpoints } = harness(client);
  const r = await run();
  assert.deepEqual(recorded, [G1]);
  assert.equal(r.gap, 'start-before-floor');
  assert.equal(r.recorded, 1);
  const last = checkpoints.at(-1);
  assert.equal(last.gap, 'start-before-floor');
  assert.equal(last.floorLedger, 1000);
  assert.equal(last.floorObservedAt, 1111111);
});

test('first run with full-depth RPC (floor 1) reports no gap', async () => {
  const client = new FakeClient(2000, 1, [contributed(50, G2)]);
  const { run, recorded, checkpoints } = harness(client);
  const r = await run();
  assert.deepEqual(recorded, [G2]);
  assert.equal(r.gap, undefined);
  assert.equal(checkpoints.at(-1).gap, undefined);
});

test('cursor within retention resumes from cursor+1 and keeps no gap', async () => {
  const client = new FakeClient(2000, 1000, [contributed(1800, G1)]);
  const { run, recorded } = harness(client, { version: 3, processedThroughLedger: 1200, updatedAt: 1 });
  const r = await run();
  assert.equal(client.calls[0].startLedger, 1201);
  assert.deepEqual(recorded, [G1]);
  assert.equal(r.gap, undefined);
});

test('cursor behind the retention floor after downtime flags cursor-behind-floor and resumes at the floor', async () => {
  const client = new FakeClient(2000, 1000, [contributed(1100, G2)]);
  const { run, recorded, checkpoints } = harness(client, { version: 3, processedThroughLedger: 500, updatedAt: 1 });
  const r = await run();
  assert.equal(r.gap, 'cursor-behind-floor');
  assert.deepEqual(recorded, [G2]);
  assert.equal(checkpoints.at(-1).gap, 'cursor-behind-floor');
  assert.equal(checkpoints.at(-1).floorLedger, 1000);
});

test('only contributed topics record; refunded/withdrawn and malformed contributors skip', async () => {
  const client = new FakeClient(2000, 1, [
    contributed(100, G1),
    { ledger: 101, topic: [{ symbol: 'refunded' }, { address: G2 }] },
    { ledger: 102, topic: [{ symbol: 'withdrawn' }, { address: G2 }] },
    { ledger: 103, topic: [{ symbol: 'contributed' }, { address: 'NOT-A-KEY' }] },
  ]);
  const { run, recorded } = harness(client);
  const r = await run();
  assert.deepEqual(recorded, [G1]);
  assert.equal(r.skipped, 1);
  assert.equal(r.recorded, 1);
});

test('a window at the event limit may be truncated: fail and never advance the checkpoint into it', async () => {
  const events = Array.from({ length: 4 }, (_, i) => contributed(3000 + i, i % 2 ? G1 : G2));
  const client = new FakeClient(99999, 1, events);
  const { run, checkpoints } = harness(client);
  const p = backfillCampaignContributors({
    client,
    campaignId: 'qa-campaign',
    contractId: CONTRACT,
    readCheckpoint: async () => undefined,
    record: async () => {},
    checkpoint: async (_id, cp) => {
      checkpoints.push(cp);
    },
    windowLedgers: 5000,
    eventLimit: 4,
  });
  await assert.rejects(p, /may be truncated/);
  assert.equal(checkpoints.length, 0);
  void run;
});

test('generic RPC failure mid-scan keeps the checkpoint at the last fully processed window', async () => {
  // 3 windows at size 5000 over latest 12000; the 3rd getEvents call (2nd window scan) fails.
  const client = new FakeClient(12000, 1, [contributed(100, G1), contributed(6000, G2)]);
  client.failOnCall = 3; // probe(1), window1(2), window2(3) throws
  const { recorded, checkpoints } = harness(client);
  await assert.rejects(
    backfillCampaignContributors({
      client,
      campaignId: 'qa-campaign',
      contractId: CONTRACT,
      readCheckpoint: async () => undefined,
      record: async (_id, c) => {
        if (!recorded.includes(c)) recorded.push(c);
      },
      checkpoint: async (_id, cp) => {
        checkpoints.push(cp);
      },
    }),
    /rpc connection reset/,
  );
  assert.deepEqual(
    checkpoints.map((c) => c.processedThroughLedger),
    [5000],
  );
  assert.deepEqual(recorded, [G1]); // G2 sits beyond window 1; never recorded before its window completes
});

test('re-run is idempotent and advances the cursor to latest', async () => {
  const client = new FakeClient(2000, 1, [contributed(100, G1)]);
  const first = harness(client);
  await first.run();
  // Same event history, chain advanced: resume re-presents the old event
  // (the service dedupes the write) and moves the cursor to the new latest.
  const advanced = new FakeClient(2500, 1, [contributed(100, G1)]);
  const second = harness(advanced, first.checkpoints.at(-1));
  const r = await second.run();
  assert.equal(advanced.calls[0].startLedger, 2001);
  assert.equal(second.checkpoints.at(-1).processedThroughLedger, 2500);
  // The already-processed event is below the resume point, so nothing is
  // re-presented; crash-window reprocessing is covered by the mid-scan
  // failure test and service-level dedupe by the audit-provenance test.
  assert.equal(r.recorded, 0);
});

test('up-to-date cursor does no network work', async () => {
  const client = new FakeClient(2000, 1, []);
  const { run } = harness(client, { version: 3, processedThroughLedger: 2000, updatedAt: 1 });
  const r = await run();
  assert.equal(r.scanned, 0);
  assert.equal(client.calls.length, 0);
});

test('an unparseable range error is a generic failure: nothing moves', async () => {
  const client = new FakeClient(2000, 1, [contributed(100, G1)]);
  client.getEvents = async () => {
    throw new Error('startLedger out of bounds in an unexpected format');
  };
  const { run, recorded, checkpoints } = harness(client);
  await assert.rejects(run, /unexpected format/);
  assert.equal(recorded.length, 0);
  assert.equal(checkpoints.length, 0);
});

test('the RPC topic filter is sent as base64 XDR (plain strings are rejected as invalid parameters)', async () => {
  const { xdr } = await import('@stellar/stellar-sdk');
  const client = new FakeClient(2000, 1, []);
  const { run } = harness(client);
  await run();
  const expected = xdr.ScVal.scvSymbol('contributed').toXDR('base64');
  assert.ok(client.callsRaw.length > 0);
  for (const call of client.callsRaw) {
    assert.deepEqual(call.filters[0].topics, [[expected, '*']]);
  }
});

test('invalid contract id fails before any network traffic', async () => {
  const client = new FakeClient(2000, 1, []);
  await assert.rejects(
    backfillCampaignContributors({
      client,
      campaignId: 'qa-campaign',
      contractId: 'not-a-contract',
      readCheckpoint: async () => undefined,
      record: async () => {},
      checkpoint: async () => {},
    }),
    /invalid contract id|address/i,
  );
  assert.equal(client.calls.length, 0);
});

test('prior floor observation survives later checkpoints', async () => {
  const prior = { version: 3, processedThroughLedger: 1500, gap: 'start-before-floor', floorLedger: 1000, floorObservedAt: 42, updatedAt: 1 };
  const client = new FakeClient(2000, 1000, []);
  const { run, checkpoints } = harness(client, prior);
  await run();
  const last = checkpoints.at(-1);
  assert.equal(last.gap, 'start-before-floor');
  assert.equal(last.floorLedger, 1000);
  assert.equal(last.floorObservedAt, 42);
});

// --- service-level: durable checkpoint + audit provenance ---

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-svc-'));
let counter = 0;
const newService = () => new CommunityService(new FileCommunityStore(path.join(dir, `store-${counter++}.json`)));

test('checkpoint round-trips through the durable store and lists for the reconciliation surface', async () => {
  const service = newService();
  assert.equal(await service.getContributorBackfillCheckpoint('qa-campaign'), undefined);
  await service.setContributorBackfillCheckpoint('qa-campaign', {
    processedThroughLedger: 4999,
    gap: 'start-before-floor',
    floorLedger: 1000,
    latestLedger: 2000,
    updatedAt: 7,
  });
  const got = await service.getContributorBackfillCheckpoint('qa-campaign');
  assert.equal(got?.processedThroughLedger, 4999);
  assert.equal(got?.gap, 'start-before-floor');
  const all = await service.listContributorBackfillCheckpoints();
  assert.equal(all['qa-campaign'].floorLedger, 1000);
});

test('invalid checkpoint is refused', async () => {
  const service = newService();
  await assert.rejects(
    service.setContributorBackfillCheckpoint('qa-campaign', { processedThroughLedger: 0, updatedAt: 1 } as any),
    /invalid backfill checkpoint/,
  );
});

test('backfill-written contributor records carry backend-backfill audit provenance', async () => {
  const service = newService();
  await service.recordContributor('qa-campaign', G1, 'backend-backfill');
  await service.recordContributor('qa-campaign', G2);
  const audit = (await (service as any).store.read()).audit;
  const a1 = audit.find((e: any) => e.target === `qa-campaign:${G1}`);
  const a2 = audit.find((e: any) => e.target === `qa-campaign:${G2}`);
  assert.equal(a1.actor, 'backend-backfill');
  assert.equal(a2.actor, 'backend-journal');
});

test('live RPC topic shape: SDK ScVal wrapper classes (value getter, no plain symbol/address) still record', async () => {
  // The live stellar-sdk getEvents returns ScValSymbol/ScValAddress wrappers:
  // the symbol string is NOT on .symbol and the contributor strkey is NOT on
  // .address (that holds a nested ScAddress object). The native values are on
  // the .value getter. v1 read only the plain shape and recorded nothing live.
  const sdkShaped = { ledger: 1500, topic: [{ value: 'contributed' }, { value: G1 }] };
  const client = new FakeClient(2000, 1, [sdkShaped]);
  const { run, recorded } = harness(client);
  const r = await run();
  assert.deepEqual(recorded, [G1]);
  assert.equal(r.recorded, 1);
});

test('live RPC boxed natives: String-object .value wrappers (typeof object) still record', async () => {
  // Deeper live shape: the SDK wrappers box their natives - .value arrives as
  // a String OBJECT (typeof 'object', correct toString), so typeof-string
  // checks alone silently skip every event (staging rescan after v2:
  // scanned 1, skipped 1, recorded 0).
  const boxed = { ledger: 1500, topic: [{ value: Object('contributed') }, { value: Object(G1) }] };
  const boxedAddr = { ledger: 1501, topic: [{ value: Object('contributed') }, { address: Object(G2) }] };
  const client = new FakeClient(2000, 1, [boxed, boxedAddr]);
  const { run, recorded } = harness(client);
  const r = await run();
  assert.deepEqual(recorded, [G1, G2]);
  assert.equal(r.recorded, 2);
});

test('a checkpoint from an older parser version is discarded and history is re-scanned', async () => {
  // v1 checkpoint claims ledgers through 2000 are processed, but the event at
  // 1500 was never recorded under the old parser. The version mismatch must
  // force a full re-scan (floor-clamped) and a v2 checkpoint.
  const client = new FakeClient(2000, 1000, [contributed(1500, G1)]);
  const { run, recorded, checkpoints } = harness(client, { version: 1, processedThroughLedger: 2000, updatedAt: 1 });
  const r = await run();
  assert.deepEqual(recorded, [G1]);
  assert.equal(r.gap, 'start-before-floor'); // re-derived honestly: version discard restarts at 1
  const last = checkpoints.at(-1);
  assert.equal(last.version, 3);
  assert.equal(last.processedThroughLedger, 2000);
});

test('same-version checkpoints resume without re-scanning', async () => {
  const client = new FakeClient(2000, 1, []);
  const { run } = harness(client, { version: 3, processedThroughLedger: 2000, updatedAt: 1 });
  const r = await run();
  assert.equal(r.scanned, 0);
  assert.equal(client.calls.length, 0); // nothing to do: start 2001 > latest 2000
});
