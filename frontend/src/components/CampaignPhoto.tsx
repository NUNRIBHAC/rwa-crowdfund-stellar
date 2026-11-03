import { useState } from 'react';
import { useI18n } from '../i18n';
import { campaignPhoto } from '../data/campaignPhotos';

/** Every listing has a photo. All current assets are illustrative, never
 * evidence of the funded project, ownership, valuation or verification. */
export default function CampaignPhoto({ campaignId, variant }: { campaignId: string; variant: 'card' | 'campaign' }) {
  const { m } = useI18n();
  const [failed, setFailed] = useState(false);
  const src = campaignPhoto(campaignId);
  return (
    <figure className={`${variant}-photo`}>
      <img src={failed ? campaignPhoto('') : src} alt={m.card.photoAlt} loading="lazy" onError={() => setFailed(true)} />
      <figcaption>{m.card.photoCaption}</figcaption>
    </figure>
  );
}
