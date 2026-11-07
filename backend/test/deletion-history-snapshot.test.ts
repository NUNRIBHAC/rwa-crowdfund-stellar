import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Address, Keypair, StrKey, xdr } from '@stellar/stellar-sdk';
import { ARCHIVE_VERSION, type ArchivedChainEvent, type EventArchiveCheckpoint } from '../src/event-archive.js';
import {
  buildWalletHistorySnapshot,
  participantsFromArchivedEvents,
  walletDeletionEvidenceVerdict,
  type WalletHistorySources,
} from '../src/deletion-history-snapshot.js';
import type { ContractCreationRecord } from '../src/deployment-manifest.js';

const NETWORK = 'Test SDF Network ; September 2015';
const wallet = Keypair.random().publicKey();
const stranger = Keypair.random().publicKey();
const contractA = StrKey.encodeContract(Buffer.alloc(32, 1));
const contractB = StrKey.encodeContract(Buffer.alloc(32, 2));
const contractC = StrKey.encodeContract(Buffer.alloc(32, 3));
const contractD = StrKey.encodeContract(Buffer.alloc(32, 4));

const sym = (s: string) => xdr.ScVal.scvSymbol(s).toXDR('base64');
const addr = (key: string) => Address.fromString(key).toScVal().toXDR('base64');
const amount = (n: number) => xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Int64.fromString('0'), lo: xdr.Uint64.fromString(String(n)) })).toXDR('base64');

let seq = 0;
const makeEvent = (campaignId: string, contractId: string, ledger: number, topics: string[], value: string): ArchivedChainEvent => ({
  eventId: `evt-${++seq}`,
  campaignId,
  contractId,
  ledger,
  ledgerClosedAt: null,
  pagingToken: null,
  topics,
  value,
  parsedKind: null,
  parsedContributor: null,
  archivedAt: new Date(1_700_000_000_000).toISOString(),
  archiveVersion: ARCHIVE_VERSION,
});

type FakeArchiveOpts = {
  events?: ArchivedChainEvent[];
  checkpoints?: Record<string, EventArchiveCheckpoint | undefined>;
  failCampaigns?: boolean;
};
const fakeArchive = (opts: FakeArchiveOpts) => ({
  put: async () => 0,
  list: async (campaignId?: string) => (opts.events ?? []).filter((e) => !campaignId || e.campaignId === campaignId),
  count: async () => (opts.events ?? []).length,
  campaigns: async () => {
    if (opts.failCampaigns) throw new Error('listing failed');
    return [...new Set((opts.events ?? []).map((e) => e.campaignId))].sort();
  },
  readCheckpoint: async (campaignId: string) => opts.checkpoints?.[campaignId],
  writeCheckpoint: async () => {},
});
const checkpoint = (through: number, extra: Partial<EventArchiveCheckpoint> = {}): EventArchiveCheckpoint => ({
  version: ARCHIVE_VERSION,
  processedThroughLedger: through,
  updatedAt: 1_700_000_000_000,
  ...extra,
});
const fakeManifest = (records: ContractCreationRecord[] = [], failGet = false) => ({
  put: async () => {},
  get: async (contractId: string) => {
    if (failGet) throw new Error('corrupt');
    return records.find((r) => r.contractId === contractId);
  },
  list: async () => records,
});
const manifestRecord = (campaignId: string, contractId: string, createdLedger: number, networkPassphrase = NETWORK): ContractCreationRecord => ({
  campaignId,
  contractId,
  createdLedger,
  deploymentHash: 'a'.repeat(64),
  networkPassphrase,
  recordedAt: 1_700_000_000_000,
});

const baseSources = (over: Partial<WalletHistorySources> = {}): WalletHistorySources => ({
  registry: [{ id: 'demo-solar', name: 'Demo Solar', contractId: contractA }],
  archive: fakeArchive({ checkpoints: { 'demo-solar': checkpoint(1000) } }),
  manifest: fakeManifest([manifestRecord('demo-solar', contractA, 10)]),
  client: { getLatestLedger: async () => ({ sequence: 1200 }) },
  journal: { intents: [] },
  pending: [],
  communityCampaignIds: [],
  networkPassphrase: NETWORK,
  ...over,
});

test('snapshot at one ledger: clear for a stranger, protected for an archived participant', async () => {
  const events = [makeEvent('demo-solar', contractA, 500, [sym('contributed'), addr(wallet)], amount(100))];
  const sources = baseSources({ archive: fakeArchive({ events, checkpoints: { 'demo-solar': checkpoint(1000) } }) });
  const snapshot = await buildWalletHistorySnapshot(sources);
  assert.equal(snapshot.targetLedger, 1000); // min(checkpoint 1000, latest 1200)
  assert.equal(snapshot.manifestComplete, true);
  assert.equal(snapshot.coherent, true);
  assert.equal(snapshot.campaigns[0].createdLedger, 10); // manifest record grounds creation
  assert.equal(await walletDeletionEvidenceVerdict(stranger, sources), 'clear');
  assert.equal(await walletDeletionEvidenceVerdict(wallet, sources), 'protected');
});

test('participants are parsed from every topic position AND the value, XDR and raw text', async () => {
  const inValue = makeEvent('demo-solar', contractA, 500, [sym('refunded')], addr(wallet));
  const rawJson = makeEvent('demo-solar', contractA, 501, ['{"address":"' + stranger + '"}'], '42');
  const events = [inValue, rawJson];
  const parsed = participantsFromArchivedEvents(events, { campaignId: 'demo-solar', contractId: contractA });
  assert.deepEqual(parsed.participantKeys, [stranger, wallet].sort());
  assert.equal(parsed.unreadableEvents, false);
  const sources = baseSources({
    archive: fakeArchive({ events: [inValue], checkpoints: { 'demo-solar': checkpoint(1000) } }),
  });
  assert.equal(await walletDeletionEvidenceVerdict(wallet, sources), 'protected');
});

test('events archived beyond the shared target ledger still count as participation', async () => {
  const late = makeEvent('a', contractA, 950, [sym('contributed'), addr(wallet)], amount(1));
  const sources = baseSources({
    registry: [
      { id: 'a', name: 'A', contractId: contractA },
      { id: 'b', name: 'B', contractId: contractB },
    ],
    archive: fakeArchive({
      events: [late],
      checkpoints: { a: checkpoint(1000), b: checkpoint(800) }, // target = 800
    }),
    manifest: fakeManifest([manifestRecord('a', contractA, 10), manifestRecord('b', contractB, 10)]),
  });
  const snapshot = await buildWalletHistorySnapshot(sources);
  assert.equal(snapshot.targetLedger, 800);
  assert.equal(await walletDeletionEvidenceVerdict(wallet, sources), 'protected'); // ledger 950 > target still counts
  assert.equal(await walletDeletionEvidenceVerdict(stranger, sources), 'clear');
});

test('undecodable long blobs, foreign rows and old archive versions are unreadable, never empty', async () => {
  const blob = makeEvent('demo-solar', contractA, 500, [Buffer.alloc(64, 3).toString('base64')], amount(1));
  const parsed = participantsFromArchivedEvents([blob], { campaignId: 'demo-solar', contractId: contractA });
  assert.equal(parsed.unreadableEvents, true);
  const wrongContract = { ...makeEvent('demo-solar', contractA, 500, [sym('x')], amount(1)), contractId: contractB };
  assert.equal(participantsFromArchivedEvents([wrongContract], { campaignId: 'demo-solar', contractId: contractA }).unreadableEvents, true);
  const oldVersion = { ...makeEvent('demo-solar', contractA, 500, [sym('x')], amount(1)), archiveVersion: 0 };
  assert.equal(participantsFromArchivedEvents([oldVersion], { campaignId: 'demo-solar', contractId: contractA }).unreadableEvents, true);
  const sources = baseSources({ archive: fakeArchive({ events: [blob], checkpoints: { 'demo-solar': checkpoint(1000) } }) });
  assert.equal(await walletDeletionEvidenceVerdict(stranger, sources), 'unavailable');
});

test('checkpoint gaps, absence, old versions and lag to zero all stay unavailable', async () => {
  for (const checkpoints of [
    { 'demo-solar': checkpoint(1000, { gap: 'start-before-floor' as const }) },
    { 'demo-solar': checkpoint(1000, { gap: 'cursor-behind-floor' as const }) },
    {},
    { 'demo-solar': { ...checkpoint(1000), version: 0 } },
    { 'demo-solar': checkpoint(0) },
  ])
    assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ archive: fakeArchive({ checkpoints }) })), 'unavailable');
});

test('unexplained campaign references anywhere mark the manifest incomplete', async () => {
  const extra = { intents: [{ hash: 'h', campaign: 'ghost-campaign', actor: stranger, action: 'contribute', xdr: 'x', status: 'SUCCESS' }], quarantined: [] };
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ journal: extra })), 'unavailable');
  const ghostEvent = makeEvent('ghost-campaign', contractC, 5, [sym('x')], amount(1));
  const ghostArchive = fakeArchive({ events: [ghostEvent], checkpoints: { 'demo-solar': checkpoint(1000), 'ghost-campaign': checkpoint(1000) } });
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ archive: ghostArchive })), 'unavailable');
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ communityCampaignIds: ['ghost-campaign'] })), 'unavailable');
  assert.equal(
    await walletDeletionEvidenceVerdict(stranger, baseSources({ pending: [{ hash: 'h', campaignId: 'ghost-campaign', firstPendingAt: 1 }] })),
    'unavailable',
  );
  const failing = fakeArchive({ checkpoints: { 'demo-solar': checkpoint(1000) }, failCampaigns: true });
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ archive: failing })), 'unavailable');
});

test('v2 campaigns expand to token and offering rows, each needing coverage', async () => {
  const v2 = [{ id: 'v2camp', name: 'V2', contractSet: 'v2', tokenContractId: contractC, offeringContractId: contractD }];
  const both = fakeArchive({ checkpoints: { 'v2camp:token': checkpoint(900), 'v2camp:offering': checkpoint(900) } });
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ registry: v2, archive: both, manifest: fakeManifest() })), 'clear');
  const onlyToken = fakeArchive({ checkpoints: { 'v2camp:token': checkpoint(900) } });
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ registry: v2, archive: onlyToken, manifest: fakeManifest() })), 'unavailable');
});

test('corrupt manifest, refresh failure, client failure and bad registry all stay unavailable', async () => {
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ manifest: fakeManifest([], true) })), 'unavailable');
  assert.equal(
    await walletDeletionEvidenceVerdict(
      stranger,
      baseSources({
        refresh: async () => {
          throw new Error('archive stalled');
        },
      }),
    ),
    'unavailable',
  );
  assert.equal(
    await walletDeletionEvidenceVerdict(
      stranger,
      baseSources({
        client: {
          getLatestLedger: async () => {
            throw new Error('rpc down');
          },
        },
      }),
    ),
    'unavailable',
  );
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ client: { getLatestLedger: async () => ({ sequence: 0 }) } })), 'unavailable');
  const dup = [
    { id: 'a', name: 'A', contractId: contractA },
    { id: 'b', name: 'B', contractId: contractA },
  ];
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ registry: dup })), 'unavailable');
  let refreshed = 0;
  await buildWalletHistorySnapshot(
    baseSources({
      refresh: async () => {
        refreshed += 1;
      },
    }),
  );
  assert.equal(refreshed, 1); // boundary hook runs before the latest ledger is read
});

test('journal, pending and creator evidence compose: protected locally, quarantine/hash-only unavailable', async () => {
  const deployActor = wallet;
  const withDeploy = { intents: [{ hash: 'h', campaign: 'demo-solar', actor: deployActor, action: 'deploy-create', xdr: 'x', status: 'SUCCESS' }] };
  assert.equal(await walletDeletionEvidenceVerdict(wallet, baseSources({ journal: withDeploy })), 'protected'); // creator
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ journal: withDeploy })), 'clear');
  const withIntent = { intents: [{ hash: 'h', campaign: 'demo-solar', actor: wallet, action: 'contribute', xdr: 'x', status: 'SUCCESS' }] };
  assert.equal(await walletDeletionEvidenceVerdict(wallet, baseSources({ journal: withIntent })), 'protected');
  const quarantined = { intents: [], quarantined: [{ reason: 'malformed', possiblySigned: false }] };
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ journal: quarantined })), 'unavailable');
  assert.equal(await walletDeletionEvidenceVerdict(stranger, baseSources({ pending: [{ hash: 'h', firstPendingAt: 1 }] })), 'unavailable'); // hash-only
  assert.equal(
    await walletDeletionEvidenceVerdict(wallet, baseSources({ pending: [{ hash: 'h', campaignId: 'demo-solar', contributor: wallet, firstPendingAt: 1 }] })),
    'protected',
  );
});

test('manifest record network or campaign mismatches fall back to the conservative bound', async () => {
  const wrongNet = fakeManifest([manifestRecord('demo-solar', contractA, 500, 'Public Global Stellar Network ; September 2015')]);
  const snapshot = await buildWalletHistorySnapshot(baseSources({ manifest: wrongNet }));
  assert.equal(snapshot.campaigns[0].createdLedger, 1); // mismatched grounding is not trusted
  const wrongCampaign = fakeManifest([manifestRecord('other-campaign', contractA, 500)]);
  assert.equal((await buildWalletHistorySnapshot(baseSources({ manifest: wrongCampaign }))).campaigns[0].createdLedger, 1);
});
