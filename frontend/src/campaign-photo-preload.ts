import { campaignPhoto } from './data/campaignPhotos';
import { sampleCampaignPhotoBase } from './data/sampleCampaignPhotos';
import { MEDIA_ORIGIN } from './media-fallback';

export const ILLUSTRATIVE_PHOTO = 'https://blockallisto-media.nunrib-df6.workers.dev/campaigns/demo-solar-farm.jpg';
export const CAMPAIGN_PHOTO_SIZES = '(max-width: 900px) calc(100vw - 28px), 708px';
export const CARD_PHOTO_SIZES = '(max-width: 760px) calc(100vw - 56px), 480px';
export const campaignPhotoSources = (format: 'avif' | 'webp', campaignId?: string) => {
  const sample = campaignId ? sampleCampaignPhotoBase(campaignId) : undefined;
  const base = sample ? MEDIA_ORIGIN + sample : 'https://blockallisto-media.nunrib-df6.workers.dev/campaigns/demo-solar-farm';
  return [480, 800, 1280].map((width) => `${base}-${width}.${format} ${width}w`).join(', ');
};

/** Start the known illustrative image before campaign API data arrives.
 * The resource hint creates no campaign content or claim of existence.
 * Custom issuer images never inherit the shared solar photograph hint. */
const ILLUSTRATIVE_IDS = new Set(['demo-solar', 'staging-load', 'qa-postclose', 'qa-backfill', 'qa-backfill2', 'newsproof', 'qa-lifecycle']);
export function preloadCampaignPhoto(pathname: string, root: Document = document): HTMLLinkElement | null {
  const match = /^\/campaigns\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  let id: string;
  try {
    id = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  const sample = sampleCampaignPhotoBase(id);
  if (!sample && (!ILLUSTRATIVE_IDS.has(id) || campaignPhoto(id) !== ILLUSTRATIVE_PHOTO)) return null;
  const existing = root.querySelector<HTMLLinkElement>('link[data-campaign-photo]');
  const link = existing || root.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.type = 'image/avif';
  link.href = sample ? MEDIA_ORIGIN + sample + '-800.avif' : 'https://blockallisto-media.nunrib-df6.workers.dev/campaigns/demo-solar-farm-800.avif';
  link.imageSrcset = campaignPhotoSources('avif', id);
  link.imageSizes = CAMPAIGN_PHOTO_SIZES;
  link.fetchPriority = 'high';
  link.dataset.campaignPhoto = '';
  if (!existing) root.head.append(link);
  return link;
}
