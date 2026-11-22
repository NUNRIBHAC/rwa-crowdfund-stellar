import type { Campaign } from './types';
import { campaignStatus, type CampaignStatus } from './components/CampaignCard';

/** One existing campaign per visible state. Never invent a missing state. */
export function selectHomeCampaigns(campaigns: readonly Campaign[]): Campaign[] {
  const states: CampaignStatus[] = ['open', 'funded', 'ended'];
  return states.flatMap((status) => {
    const candidates = campaigns.filter((campaign) => campaignStatus(campaign) === status);
    candidates.sort((a, b) => {
      const deadlineOrder = Number(a.config.deadline) - Number(b.config.deadline);
      if (deadlineOrder) return status === 'open' ? deadlineOrder : -deadlineOrder;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    return candidates.length ? [candidates[0]] : [];
  });
}
