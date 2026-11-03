// Illustrative photos for prototype campaigns. Every mapped photo MUST render
// with the "illustrative photo - not the actual project" caption (photoCaption);
// never map a real project's photo here. The staging QA campaign intentionally
// reuses the same authorized illustrative asset as the public demo campaign.
export const CAMPAIGN_PHOTOS: Record<string, string> = {
  'demo-solar': '/demo-solar-farm.jpg',
  'staging-load': '/demo-solar-farm.jpg',
};

// Unknown/new testnet campaigns must not silently lose their photo. This
// shared CC0 illustration is explicitly NOT a photograph of that campaign.
// Real issuer media needs its own source/rights record before replacing it.
export function campaignPhoto(campaignId: string): string {
  return CAMPAIGN_PHOTOS[campaignId] ?? '/demo-solar-farm.jpg';
}
