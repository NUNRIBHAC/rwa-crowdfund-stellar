import type { Campaign } from './types';

export type CampaignSort = 'deadline' | 'progress' | 'name';

// Extracted from the Investments page so the ordering is unit-testable with
// inputs whose three orderings deliberately disagree. Behavior unchanged:
// name = localeCompare A-Z, progress = raised/goal basis points descending
// (BigInt math, no float rounding), deadline = soonest first.
export function compareCampaigns(sortBy: CampaignSort): (a: Campaign, b: Campaign) => number {
  if (sortBy === 'name') return (a, b) => a.name.localeCompare(b.name);
  if (sortBy === 'progress') {
    return (a, b) => Number((BigInt(b.raised) * 10000n) / BigInt(b.config.goal)) - Number((BigInt(a.raised) * 10000n) / BigInt(a.config.goal));
  }
  return (a, b) => Number(a.config.deadline) - Number(b.config.deadline);
}
