import { ILLUSTRATIVE_PHOTO, CAMPAIGN_PHOTO_SIZES, CARD_PHOTO_SIZES, campaignPhotoSources } from '../campaign-photo-preload';
import { useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { campaignPhoto } from '../data/campaignPhotos';
import { sampleCampaignPhotoBase } from '../data/sampleCampaignPhotos';

/** Every listing has a photo. All current assets are illustrative, never
 * evidence of the funded project, ownership, valuation or verification. */
export default function CampaignPhoto({
  campaignId,
  variant,
  firstVisible = false,
}: {
  campaignId: string;
  variant: 'card' | 'campaign';
  firstVisible?: boolean;
}) {
  const { m } = useI18n();
  const imageRef = useRef<HTMLImageElement>(null);
  const [visiblePriority, setVisiblePriority] = useState(false);
  useLayoutEffect(() => {
    const img = imageRef.current;
    if (!firstVisible || variant !== 'card' || !img) return;
    const visible = () => {
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0;
    };
    if (visible()) {
      setVisiblePriority(true);
      return;
    }
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisiblePriority(true);
        observer.disconnect();
      }
    });
    observer.observe(img);
    return () => observer.disconnect();
  }, [firstVisible, variant]);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const src = campaignPhoto(campaignId);
  const failed = failedSource === src;
  const displayed = failed ? 'https://blockallisto-media.nunrib-df6.workers.dev/illustrative-covers/blocks-0.svg' : src;
  const illustration = displayed.endsWith('.svg');
  // Only known reviewed photos have these exact derivatives.
  // A future issuer photo must not inherit unrelated responsive sources.
  const sample = !!sampleCampaignPhotoBase(campaignId);
  const responsive = !failed && (sample || displayed === ILLUSTRATIVE_PHOTO);
  const sizes = variant === 'campaign' ? CAMPAIGN_PHOTO_SIZES : CARD_PHOTO_SIZES;
  return (
    <figure className={`${variant}-photo`}>
      <picture>
        {responsive && <source type="image/avif" srcSet={campaignPhotoSources('avif', campaignId)} sizes={sizes} />}
        {responsive && <source type="image/webp" srcSet={campaignPhotoSources('webp', campaignId)} sizes={sizes} />}
        <img
          ref={imageRef}
          src={displayed}
          width={responsive ? 1280 : undefined}
          height={responsive ? (sample ? 720 : 960) : undefined}
          alt={illustration ? m.invest.illustrativeCover : sample ? m.card.photoCaption : m.card.photoAlt}
          loading={variant === 'card' && !visiblePriority ? 'lazy' : variant === 'card' ? 'eager' : undefined}
          fetchPriority={variant === 'campaign' || visiblePriority ? 'high' : undefined}
          onError={() => setFailedSource(src)}
        />
      </picture>
      <figcaption>{illustration ? m.invest.illustrativeCover : m.card.photoCaption}</figcaption>
    </figure>
  );
}
