import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FileCommunityStore } from '../src/community-store.js';
import { MeetingSimulationService } from '../src/meeting-simulation.js';
async function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fixture-meeting-'));
  const file = path.join(dir, 'isolated-community.json');
  const store = new FileCommunityStore(file);
  await store.change((s) => {
    for (const key of ['organizer', 'A', 'B', 'outsider']) s.accounts[key] = { publicKey: key, createdAt: 1, displayName: null };
  });
  return { file, store, service: new MeetingSimulationService(store, () => 123), cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
const input = {
  campaignId: 'synthetic',
  title: 'Fixture meeting',
  resolution: 'Non-binding rehearsal choice',
  participants: ['A', 'B'],
  idempotencyKey: 'fixture-first',
};
test('saved fixture meeting has frozen participants, one idempotent choice per account and non-binding closed totals', async () => {
  const f = await fixture();
  try {
    const before = await f.store.read();
    const m = await f.service.create('organizer', input);
    assert.equal((await f.service.create('organizer', { ...input, participants: ['B', 'A'] })).id, m.id);
    await assert.rejects(f.service.create('organizer', { ...input, title: 'Changed' }), /inputs differ/);
    await assert.rejects(f.service.participate('A', m.id, { choice: 'for' }), /open/);
    await f.service.transition('organizer', m.id, 'open');
    const a = await f.service.participate('A', m.id, { choice: 'for' });
    assert.equal(a.ownChoice, 'for');
    assert.equal(a.totals, null);
    assert.equal(a.canParticipate, false);
    assert.equal((await f.service.participate('A', m.id, { choice: 'for' })).castCount, 1);
    await assert.rejects(f.service.participate('A', m.id, { choice: 'against' }), /already recorded/);
    await f.service.participate('B', m.id, { choice: 'abstain' });
    await assert.rejects(f.service.transition('A', m.id, 'closed'), /organizer/);
    await f.service.transition('organizer', m.id, 'closed');
    const closed = await new MeetingSimulationService(new FileCommunityStore(f.file)).read('A', m.id);
    assert.deepEqual(closed.totals, { for: 1, against: 0, abstain: 1 });
    assert.equal(closed.binding, false);
    assert.equal(closed.legalEffect, false);
    assert.equal('ballots' in closed, false);
    assert.equal('participants' in closed, false);
    assert.equal('audit' in closed, false);
    await assert.rejects(f.service.participate('B', m.id, { choice: 'abstain' }), /open/);
    const after = await f.store.read();
    delete after.simulatedMeetings;
    assert.deepEqual(after, before);
  } finally {
    f.cleanup();
  }
});
test('outsiders, forged identity fields, unknown accounts and invalid transitions fail without creating rights or messages', async () => {
  const f = await fixture();
  try {
    await assert.rejects(f.service.create('organizer', { ...input, participants: ['A', 'A'] }), /duplicate/);
    await assert.rejects(f.service.create('organizer', { ...input, participants: ['missing'] }), /must exist/);
    await assert.rejects(f.service.create('organizer', { ...input, quorum: 'invented' }));
    const m = await f.service.create('organizer', input);
    await assert.rejects(f.service.read('outsider', m.id), /participant/);
    await assert.rejects(f.service.transition('organizer', m.id, 'closed'), /transition/);
    await f.service.transition('organizer', m.id, 'open');
    await assert.rejects(f.service.participate('outsider', m.id, { choice: 'for' }), /participant/);
    await assert.rejects(f.service.participate('A', m.id, { choice: 'for', actor: 'B' }));
    await assert.rejects(f.service.transition('organizer', m.id, 'cancelled'), /transition/);
    const other = await f.service.create('organizer', { ...input, idempotencyKey: 'cancel' });
    assert.equal((await f.service.transition('organizer', other.id, 'cancelled')).state, 'cancelled');
    await assert.rejects(f.service.transition('organizer', other.id, 'open'), /transition/);
    assert.deepEqual((await f.store.read()).notifications, {});
  } finally {
    f.cleanup();
  }
});

test('reserved object keys cannot become fixture actors or ballot entries', async () => {
  const f = await fixture();
  try {
    for (const actor of ['__proto__', 'constructor', 'prototype']) {
      await assert.rejects(f.service.create(actor, input));
      await assert.rejects(f.service.create('organizer', { ...input, participants: [actor] }));
      await assert.rejects(f.service.participate(actor, 'absent', { choice: 'for' }));
      await assert.rejects(f.service.read(actor, 'absent'));
    }
  } finally {
    f.cleanup();
  }
});
