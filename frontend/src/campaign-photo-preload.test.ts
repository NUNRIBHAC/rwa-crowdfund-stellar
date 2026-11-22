import { afterEach, expect, test } from 'vitest';
import { preloadCampaignPhoto, CAMPAIGN_PHOTO_SIZES, campaignPhotoSources } from './campaign-photo-preload';
import { CAMPAIGN_PHOTOS } from './data/campaignPhotos';
afterEach(() => document.querySelectorAll('link[data-campaign-photo]').forEach((link) => link.remove()));
test('known illustrative detail starts exactly one matching responsive hint before API data exists', () => {
  const link = preloadCampaignPhoto('/campaigns/qa-postclose')!;
  expect(link.rel).toBe('preload');
  expect(link.as).toBe('image');
  expect(link.type).toBe('image/avif');
  expect(link.imageSrcset).toBe(campaignPhotoSources('avif'));
  expect(link.imageSizes).toBe(CAMPAIGN_PHOTO_SIZES);
  expect(link.fetchPriority).toBe('high');
  expect(preloadCampaignPhoto('/campaigns/qa-postclose')).toBe(link);
  expect(document.querySelectorAll('link[data-campaign-photo]')).toHaveLength(1);
});
test('list, unknown routes, malformed identifiers and future custom media never hint the demo photo', () => {
  for (const path of ['/', '/campaigns', '/account', '/campaigns/%GG', '/campaigns/future-issuer']) expect(preloadCampaignPhoto(path)).toBeNull();
  CAMPAIGN_PHOTOS['qa-postclose'] = '/issuer-photo.jpg';
  try {
    expect(preloadCampaignPhoto('/campaigns/qa-postclose')).toBeNull();
  } finally {
    delete CAMPAIGN_PHOTOS['qa-postclose'];
  }
});

test('all forty-four sample hints match their business and reuse one current resource hint', async () => {
  const { SAMPLE_CAMPAIGN_PHOTO_BASES } = await import('./data/sampleCampaignPhotos');
  for (const [id, base] of Object.entries(SAMPLE_CAMPAIGN_PHOTO_BASES)) {
    const link = preloadCampaignPhoto('/campaigns/' + id)!;
    expect(link.href).toContain(base + '-800.avif');
    expect(link.imageSrcset).toBe(campaignPhotoSources('avif', id));
    expect(document.querySelectorAll('link[data-campaign-photo]')).toHaveLength(1);
  }
  for (const id of ['__proto__', 'constructor', 'toString']) expect(preloadCampaignPhoto('/campaigns/' + id)).toBeNull();
});
