// Presentation profiles for campaigns. Off-chain fields (issuer, instrument
// terms, documents) do not come from the Soroban contract. In this prototype
// profiles exist ONLY for the sample fixtures and are labeled sample data; a
// real deployment would load verified, issuer-attested data from the backend.
// The localized profile content lives in the i18n locale dictionaries.
import type { Campaign } from '../types';
import type { Messages } from '../i18n/locales/en';

export type InfoField = { label: string; value: string };

export type CampaignProfile = Messages['profiles']['list'][number];

export function profileFor(campaign: Campaign | undefined, fixtureMode: boolean, profiles: CampaignProfile[]): CampaignProfile | undefined {
  if (!campaign || !fixtureMode) return undefined;
  return profiles.find((p) => p.campaignId === campaign.id);
}

export function categoriesFor(campaigns: Campaign[], fixtureMode: boolean, profiles: CampaignProfile[]): string[] {
  const cats = new Set<string>();
  for (const c of campaigns) {
    const p = profileFor(c, fixtureMode, profiles);
    if (p) cats.add(p.category);
  }
  return [...cats].sort();
}
