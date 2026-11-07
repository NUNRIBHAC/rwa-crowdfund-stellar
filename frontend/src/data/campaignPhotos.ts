// Original prototype illustrations. None is evidence of the actual project.
// Canonical demo photo retains its permanent illustrative-photo caption.
export const CAMPAIGN_PHOTOS: Record<string, string> = {
  'demo-solar': 'https://blockallisto-media.nunrib-df6.workers.dev/demo-solar-farm.jpg',
  'staging-load': 'https://blockallisto-media.nunrib-df6.workers.dev/demo-solar-farm.jpg',
};

// User requested photo-style covers. This local photo is illustrative for every campaign.
// Real issuer media needs its own source/rights record before replacing it.
export function campaignPhoto(campaignId: string): string {
  if (CAMPAIGN_PHOTOS[campaignId]) return CAMPAIGN_PHOTOS[campaignId];
  return 'https://blockallisto-media.nunrib-df6.workers.dev/demo-solar-farm.jpg';
}
