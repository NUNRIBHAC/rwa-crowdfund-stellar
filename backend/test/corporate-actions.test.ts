import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCapTable, buildDistributionPreview } from '../src/corporate-actions.js';
import type { ShareRegisterPayload } from '../src/share-register.js';

const row = (publicKey: string, netIntended: string, extra: Record<string, unknown> = {}) => ({ publicKey, netIntended, ...extra }) as never;
const reg = (contributors: unknown[]): ShareRegisterPayload => ({ campaignId: 'c1', generatedAt: 'now', network: 'testnet', demo: true, semantics: '', totals: {} as never, notes: [], contributors: contributors as never });

test('cap table: shares of the known base, unknown holders excluded not zero', () => {
  const t = buildCapTable(reg([row('A', '60'), row('B', '40'), row('C', 'UNKNOWN'), row('D', '-5')]));
  assert.equal(t.knownBase, '100');
  assert.equal(t.complete, false);
  assert.equal(t.holdersUnknown, 2);
  assert.deepEqual(t.rows.map((r) => [r.publicKey, r.position, r.basisPoints]), [['A', '60', 6000], ['B', '40', 4000], ['C', 'UNKNOWN', null], ['D', 'UNKNOWN', null]]);
});

test('cap table: on-chain balance wins over the journal figure', () => {
  const t = buildCapTable(reg([row('A', '10', { onChainBalance: '25' }), row('B', '10')]));
  assert.equal(t.rows[0].position, '25');
  assert.equal(t.rows[0].positionSource, 'on-chain');
  assert.equal(t.knownBase, '35');
});

test('distribution preview: exact sum, largest remainder, unknown excluded and flagged', () => {
  const t = buildCapTable(reg([row('A', '1'), row('B', '1'), row('C', '1'), row('U', 'UNKNOWN')]));
  const p = buildDistributionPreview(t, '100');
  assert.equal(p.allocated, '100');
  assert.equal(p.complete, false);
  assert.deepEqual(p.excludedUnknownHolders, ['U']);
  assert.equal(p.rows.length, 3);
  assert.equal(p.rows.map((r) => r.amount).sort().join(','), '33.3333333,33.3333333,33.3333334');
  assert.match(p.notice, /PREVIEW ONLY/);
});

test('distribution preview: complete only when all holders known; rejects bad totals', () => {
  const t = buildCapTable(reg([row('A', '3'), row('B', '1')]));
  const p = buildDistributionPreview(t, '10');
  assert.equal(p.complete, true);
  assert.deepEqual(p.rows.map((r) => r.amount), ['7.5', '2.5']);
  for (const bad of ['0', '-1', 'abc', '1.00000001', '']) assert.throws(() => buildDistributionPreview(t, bad));
  assert.equal(buildDistributionPreview(buildCapTable(reg([])), '5').complete, false);
});
