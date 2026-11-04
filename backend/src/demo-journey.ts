// Isolated account-scoped teaching scenario. These records can never be used
// as issuer applications, campaign registry entries, assessments or transfers.
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { CommunityError } from './community.js';
import type { Account, CommunityStore } from './community-store.js';
const actions = ['submit_application', 'attach_document', 'review', 'approve', 'create_campaign', 'complete_onboarding', 'contribute'] as const;
export type DemoJourneyAction = (typeof actions)[number];
export type DemoJourney = {
  id: string;
  completed: DemoJourneyAction[];
  updatedAt: number;
};
const input = z.object({ action: z.enum(actions) }).strict();
export function journeyView(record: DemoJourney | undefined) {
  const completed = record?.completed ?? [];
  const id = record?.id ?? null;
  const has = (action: DemoJourneyAction) => completed.includes(action);
  const campaignId = has('create_campaign') ? `${id}:campaign` : null;
  const contribution = has('contribute')
    ? { id: `${id}:contribution`, campaignId, amount: '10', unit: 'SIMULATED_UNITS', status: 'SIMULATED', transactionHash: null }
    : null;
  return {
    demo: true as const,
    simulation: true as const,
    productionEligible: false as const,
    realFundsMoved: false as const,
    realIdentityVerified: false as const,
    realInvestmentEligible: false as const,
    id,
    completed,
    nextAction: actions[completed.length] ?? null,
    applicationId: has('submit_application') ? `${id}:application` : null,
    document: has('attach_document')
      ? {
          id: `${id}:document`,
          filename: 'synthetic-project.txt',
          content: 'SYNTHETIC SOLAR PROJECT. Training only. No real issuer, assets, identity or rights.',
          sha256: createHash('sha256').update('SYNTHETIC SOLAR PROJECT. Training only. No real issuer, assets, identity or rights.').digest('hex'),
        }
      : null,
    campaignId,
    business: {
      persona: 'SYNTHETIC_BUSINESS',
      applicationStatus: has('approve')
        ? 'SIMULATED_APPROVED'
        : has('review')
          ? 'SIMULATED_UNDER_REVIEW'
          : has('submit_application')
            ? 'SIMULATED_RECEIVED'
            : 'NOT_STARTED',
      contribution,
    },
    investor: { persona: 'SYNTHETIC_INVESTOR', onboardingStatus: has('complete_onboarding') ? 'SIMULATED_READY' : 'NOT_STARTED', contribution },
    updatedAt: record?.updatedAt ?? null,
  };
}
export async function readDemoJourney(store: CommunityStore, account: Account) {
  const state = await store.read();
  return journeyView(state.accounts[account.publicKey]?.demoJourney);
}
export async function advanceDemoJourney(store: CommunityStore, account: Account, body: unknown, now = Date.now()) {
  const { action } = input.parse(body);
  await store.change((state) => {
    const owner = state.accounts[account.publicKey];
    if (!owner) throw new CommunityError(404, 'account not found', 'not_found');
    const record = owner.demoJourney ?? {
      id: `simulation:${createHash('sha256').update(account.publicKey).digest('hex').slice(0, 24)}`,
      completed: [],
      updatedAt: now,
    };
    if (record.completed.includes(action)) return; // Retried requests never duplicate receipts.
    if (actions[record.completed.length] !== action) throw new CommunityError(409, 'simulation step out of order', 'invalid_state');
    record.completed.push(action);
    record.updatedAt = now;
    owner.demoJourney = record;
  });
  return readDemoJourney(store, account);
}
