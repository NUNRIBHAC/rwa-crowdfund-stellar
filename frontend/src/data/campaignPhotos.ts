import { sampleCampaignPhotoBase } from './sampleCampaignPhotos';
import { MEDIA_ORIGIN } from '../media-fallback';

// Original prototype illustrations. None is evidence of the actual project.
// Canonical demo photo retains its permanent illustrative-photo caption.
export const CAMPAIGN_PHOTOS: Record<string, string> = {
  'demo-solar': 'https://blockallisto-media.nunrib-df6.workers.dev/campaigns/demo-solar-farm.jpg',
  'staging-load': 'https://blockallisto-media.nunrib-df6.workers.dev/campaigns/demo-solar-farm.jpg',
};

// Each fictional business has a reviewed illustrative stock crop.
// Real issuer media needs its own source/rights record before replacing it.
export function campaignPhoto(campaignId: string): string {
  const sample = sampleCampaignPhotoBase(campaignId);
  if (sample) return MEDIA_ORIGIN + sample + '.jpg';
  if (Object.hasOwn(CAMPAIGN_PHOTOS, campaignId)) return CAMPAIGN_PHOTOS[campaignId];
  return 'https://blockallisto-media.nunrib-df6.workers.dev/campaigns/demo-solar-farm.jpg';
}
