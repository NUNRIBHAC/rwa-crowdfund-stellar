// Original prototype illustrations. None is evidence of the actual project.
// Canonical demo photo retains its permanent illustrative-photo caption.
export const CAMPAIGN_PHOTOS: Record<string, string> = {
  'demo-solar': '/demo-solar-farm.jpg',
  'staging-load': '/illustrative-covers/blocks-1.svg',
};

// Unknown/new campaigns receive deterministic original vector illustrations.
// Real issuer media needs its own source/rights record before replacing it.
export function campaignPhoto(campaignId: string): string {
  if (CAMPAIGN_PHOTOS[campaignId]) return CAMPAIGN_PHOTOS[campaignId];
  const index = [...campaignId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  return `/illustrative-covers/blocks-${index}.svg`;
}
