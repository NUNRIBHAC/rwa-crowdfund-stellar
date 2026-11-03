// Synthetic onboarding stores choices, never identity documents or financial
// inputs. No result enables a real offer, transaction, investor class or rights.
import { z } from 'zod';
import type { Account, CommunityStore, AppropriatenessRecord } from './community-store.js';
export type DemoOnboarding = { identity: 'not_started' | 'pending' | 'passed' | 'rejected'; risksAcknowledged: boolean; updatedAt: number };
const inputSchema = z.object({ identity: z.enum(['not_started', 'pending', 'passed', 'rejected']), risksAcknowledged: z.boolean() }).strict();
export function onboardingStatus(progress: DemoOnboarding, assessment: AppropriatenessRecord | null, now: number) {
  const current = !!assessment && assessment.reviewAssessmentDueAt > now && !!assessment.simulation && (assessment.reviewSimulationDueAt ?? 0) > now;
  const warningReady = !!assessment && (assessment.outcome === 'knowledge_check_passed' || !!assessment.warningAcknowledgedAt);
  const eligibility =
    progress.identity === 'rejected'
      ? 'demo_blocked'
      : progress.identity === 'passed' && progress.risksAcknowledged && current && warningReady
        ? 'demo_ready'
        : 'demo_incomplete';
  return {
    progress,
    assessmentSaved: !!assessment,
    assessmentCurrent: current,
    warningReady,
    eligibility,
    demo: true as const,
    realInvestmentEligible: false as const,
    realIdentityVerified: false as const,
  };
}
export async function readOnboarding(store: CommunityStore, account: Account, now = Date.now()) {
  const state = await store.read();
  return onboardingStatus(
    state.accounts[account.publicKey]?.demoOnboarding ?? { identity: 'not_started', risksAcknowledged: false, updatedAt: 0 },
    state.appropriateness[account.publicKey] ?? null,
    now,
  );
}
export async function saveOnboarding(store: CommunityStore, account: Account, input: unknown, now = Date.now()) {
  const parsed = inputSchema.parse(input);
  await store.change((state) => {
    const owner = state.accounts[account.publicKey];
    if (!owner) throw new Error('account not found');
    owner.demoOnboarding = { ...parsed, updatedAt: now };
  });
  return readOnboarding(store, account, now);
}
