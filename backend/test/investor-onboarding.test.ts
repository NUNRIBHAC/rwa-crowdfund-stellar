import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardingStatus } from '../src/investor-onboarding.js';
import type { AppropriatenessRecord } from '../src/community-store.js';
const p = { identity: 'passed' as const, risksAcknowledged: true, updatedAt: 1 };
const a = {
  reviewAssessmentDueAt: 100,
  reviewSimulationDueAt: 100,
  simulation: { netWorthEur: 1, capacityEur: 0.1, transmittedAt: 1 },
  outcome: 'knowledge_check_passed',
} as AppropriatenessRecord;
test('demo only: missing, rejected, expired or unacknowledged records stay incomplete/blocked', () => {
  assert.equal(onboardingStatus(p, null, 2).eligibility, 'demo_incomplete');
  assert.equal(onboardingStatus({ ...p, identity: 'rejected' }, a, 2).eligibility, 'demo_blocked');
  assert.equal(onboardingStatus(p, a, 101).eligibility, 'demo_incomplete');
  assert.equal(onboardingStatus(p, { ...a, outcome: 'warning_issued', warningAcknowledgedAt: null }, 2).eligibility, 'demo_incomplete');
  const ready = onboardingStatus(p, a, 2);
  assert.equal(ready.eligibility, 'demo_ready');
  assert.equal(ready.realIdentityVerified, false);
  assert.equal(ready.realInvestmentEligible, false);
});

test('saved progress survives independent store reopen and stays account-scoped; rejects PII/extra fields', async () => {
  const { FileCommunityStore } = await import('../src/community-store.js');
  const { saveOnboarding, readOnboarding } = await import('../src/investor-onboarding.js');
  const fs = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'onboarding-'));
  try {
    const file = path.join(dir, 'store.json');
    const store = new FileCommunityStore(file);
    const owner = { publicKey: 'G1', displayName: null, createdAt: 1 };
    const other = { ...owner, publicKey: 'G2' };
    await store.change((s) => {
      s.accounts.G1 = owner;
      s.accounts.G2 = other;
    });
    await saveOnboarding(store, owner, { identity: 'pending', risksAcknowledged: false }, 3);
    assert.equal((await readOnboarding(new FileCommunityStore(file), owner)).progress.identity, 'pending');
    assert.equal((await readOnboarding(store, other)).progress.identity, 'not_started');
    await assert.rejects(saveOnboarding(store, owner, { identity: 'passed', risksAcknowledged: true, passport: 'not-accepted' }));
    assert.equal((await readOnboarding(store, owner)).progress.identity, 'pending');
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
