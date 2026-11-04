import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildCapTable } from '../src/corporate-actions.js';
import type { ShareRegisterPayload } from '../src/share-register.js';
import { DistributionSimulationLedger, type DistributionSimulationAdapter } from '../src/distribution-simulation.js';
const table = (unknown = false) =>
  buildCapTable({
    campaignId: 'synthetic-campaign',
    generatedAt: 'synthetic-snapshot',
    network: 'testnet',
    demo: true,
    semantics: '',
    notes: [],
    totals: {} as never,
    contributors: [
      { publicKey: 'synthetic-A', netIntended: '3' },
      { publicKey: 'synthetic-B', netIntended: unknown ? 'UNKNOWN' : '1' },
    ] as never,
  } satisfies ShareRegisterPayload);
const fixture = (adapter?: DistributionSimulationAdapter) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'distribution-simulation-'));
  const filename = path.join(dir, 'isolated.json');
  return {
    dir,
    filename,
    ledger: new DistributionSimulationLedger(filename, adapter, () => 123),
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
};
test('durable isolated rehearsal: prepare, distinct review, exact simulated receipts, reopen', async () => {
  const f = fixture();
  try {
    const source = table();
    const draft = f.ledger.prepare('preparer', source, '10', 'first');
    source.rows[0].position = '999';
    draft.rows[0].amount = '999';
    assert.equal(f.ledger.get(draft.id).rows[0].amount, '7.5');
    assert.throws(() => f.ledger.approve('preparer', draft.id), /distinct/);
    f.ledger.approve('reviewer', draft.id);
    await assert.rejects(f.ledger.execute('outsider', draft.id), /reviewer/);
    const done = await f.ledger.execute('reviewer', draft.id);
    assert.equal(done.state, 'simulated');
    assert.equal(done.legalEffect, false);
    assert.equal(done.mode, 'test_only');
    assert.deepEqual(
      done.receipts.map((r) => r.amount),
      ['7.5', '2.5'],
    );
    assert.deepEqual(
      done.audit.map((a) => a.event),
      ['simulation.prepared', 'simulation.approved', 'simulation.dispatching', 'simulation.simulated'],
    );
    assert.equal(new DistributionSimulationLedger(f.filename).get(done.id).state, 'simulated');
    await assert.rejects(f.ledger.execute('reviewer', draft.id), /no automatic retries/);
    assert.throws(() => f.ledger.cancel('reviewer', draft.id, 'No longer needed'), /undispatched/);
    assert.equal(fs.statSync(f.filename).mode & 0o777, 0o600);
  } finally {
    f.cleanup();
  }
});
test('same idempotency key returns one instruction and rejects changed amount or actor', () => {
  const f = fixture();
  try {
    const first = f.ledger.prepare('preparer', table(), '10', 'same');
    assert.equal(f.ledger.prepare('preparer', table(), '10.0', 'same').id, first.id);
    assert.throws(() => f.ledger.prepare('preparer', table(), '11', 'same'), /different inputs/);
    assert.throws(() => f.ledger.prepare('other', table(), '10', 'same'), /different inputs/);
    assert.equal(JSON.parse(fs.readFileSync(f.filename, 'utf8')).instructions.length, 1);
  } finally {
    f.cleanup();
  }
});
test('unknown, mixed or empty bases and duplicate holders never prepare instructions', () => {
  const f = fixture();
  try {
    assert.throws(() => f.ledger.prepare('preparer', table(true), '10', 'unknown'), /complete/);
    const mixed = table();
    mixed.basis.mixed = true;
    assert.throws(() => f.ledger.prepare('preparer', mixed, '10', 'mixed'), /complete/);
    const empty = table();
    empty.rows = [];
    assert.throws(() => f.ledger.prepare('preparer', empty, '10', 'empty'), /complete/);
    const duplicate = table();
    duplicate.rows.push(duplicate.rows[0]);
    assert.throws(() => f.ledger.prepare('preparer', duplicate, '10', 'duplicate'), /duplicate/);
    assert.equal(fs.existsSync(f.filename), false);
  } finally {
    f.cleanup();
  }
});
test('lost response is unknown and cannot be automatically redispatched', async () => {
  let calls = 0;
  const f = fixture({
    mode: 'test_only',
    simulate: async () => {
      calls++;
      throw Error('response lost');
    },
  });
  try {
    const i = f.ledger.prepare('preparer', table(), '10', 'timeout');
    f.ledger.approve('reviewer', i.id);
    assert.equal((await f.ledger.execute('reviewer', i.id)).state, 'unknown');
    await assert.rejects(f.ledger.execute('reviewer', i.id), /no automatic retries/);
    assert.equal(calls, 1);
    assert.equal(f.ledger.get(i.id).receipts.length, 0);
  } finally {
    f.cleanup();
  }
});
test('persisted dispatching prevents duplicate concurrent dispatch and survives an interrupted response', async () => {
  let release!: (x: never[]) => void;
  const f = fixture({
    mode: 'test_only',
    simulate: () =>
      new Promise((r) => {
        release = r;
      }),
  });
  try {
    const i = f.ledger.prepare('preparer', table(), '10', 'concurrent');
    f.ledger.approve('reviewer', i.id);
    const pending = f.ledger.execute('reviewer', i.id);
    assert.equal(new DistributionSimulationLedger(f.filename).get(i.id).state, 'dispatching');
    await assert.rejects(f.ledger.execute('reviewer', i.id), /no automatic retries/);
    release([]);
    assert.equal((await pending).state, 'unknown');
  } finally {
    f.cleanup();
  }
});
test('wrong, missing, duplicate or non-simulation receipts are unknown, never paid', async () => {
  for (const receipts of [
    [],
    [{ publicKey: 'synthetic-A', amount: '7.5', reference: 'bank:real' }],
    [
      { publicKey: 'synthetic-A', amount: '7.5', reference: 'simulation:same' },
      { publicKey: 'synthetic-B', amount: '2.5', reference: 'simulation:same' },
    ],
    [
      { publicKey: 'synthetic-A', amount: '7.5', reference: 'simulation:1' },
      { publicKey: 'synthetic-B', amount: '99', reference: 'simulation:2' },
    ],
  ]) {
    const f = fixture({ mode: 'test_only', simulate: async () => receipts });
    try {
      const i = f.ledger.prepare('preparer', table(), '10', 'bad');
      f.ledger.approve('reviewer', i.id);
      assert.equal((await f.ledger.execute('reviewer', i.id)).state, 'unknown');
    } finally {
      f.cleanup();
    }
  }
});
test('live adapters rejected and snapshot or allocation edits fail closed', () => {
  assert.throws(() => new DistributionSimulationLedger('/unused', { mode: 'live' } as never), /not supported/);
  const f = fixture();
  try {
    const i = f.ledger.prepare('preparer', table(), '10', 'tamper');
    const stored = JSON.parse(fs.readFileSync(f.filename, 'utf8'));
    stored.instructions[0].snapshot.rows[0].position = '999';
    fs.writeFileSync(f.filename, JSON.stringify(stored));
    assert.throws(() => f.ledger.get(i.id), /snapshot invalid/);
  } finally {
    f.cleanup();
  }
});
test('only participants can cancel before dispatch, cancellation is durable and audited', async () => {
  const f = fixture();
  try {
    const i = f.ledger.prepare('preparer', table(), '10', 'cancel');
    assert.throws(() => f.ledger.cancel('outsider', i.id, 'No longer needed'), /participants/);
    assert.throws(() => f.ledger.cancel('preparer', i.id, 'short'));
    const cancelled = f.ledger.cancel('preparer', i.id, 'Synthetic instruction no longer needed');
    assert.equal(cancelled.state, 'cancelled');
    assert.equal(cancelled.audit.at(-1)?.reason, 'Synthetic instruction no longer needed');
    assert.throws(() => f.ledger.approve('reviewer', i.id), /draft/);
    await assert.rejects(f.ledger.execute('reviewer', i.id), /approved/);
  } finally {
    f.cleanup();
  }
});

test('existing process or crash lock blocks writes without clearing the lock or changing the instruction', () => {
  const f = fixture();
  try {
    const i = f.ledger.prepare('preparer', table(), '10', 'locked');
    fs.writeFileSync(`${f.filename}.lock`, 'synthetic crash lock');
    assert.throws(() => new DistributionSimulationLedger(f.filename).approve('reviewer', i.id), /EEXIST/);
    assert.equal(f.ledger.get(i.id).state, 'draft');
    assert.equal(fs.readFileSync(`${f.filename}.lock`, 'utf8'), 'synthetic crash lock');
    fs.unlinkSync(`${f.filename}.lock`);
    assert.equal(f.ledger.approve('reviewer', i.id).state, 'approved');
  } finally {
    f.cleanup();
  }
});

test('altered allocation is rejected even when snapshot is unchanged', () => {
  const f = fixture();
  try {
    const i = f.ledger.prepare('preparer', table(), '10', 'edited-allocation');
    const stored = JSON.parse(fs.readFileSync(f.filename, 'utf8'));
    stored.instructions[0].rows[0].amount = '999';
    fs.writeFileSync(f.filename, JSON.stringify(stored));
    assert.throws(() => f.ledger.approve('reviewer', i.id), /allocation invalid/);
  } finally {
    f.cleanup();
  }
});
