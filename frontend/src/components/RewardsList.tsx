// Campaign reward tiers (blueprint section 6: issuer-provided marketing
// content, kept separate from platform facts). Tiers are issuer-authored
// metadata; the platform displays them without promising claimability or
// fulfillment. Absent tiers render an honest "none announced" note.
import { useEffect, useState } from 'react';
import type { CampaignMetadata } from '../community/api';
import { fetchCampaignMetadata } from '../community/api';
import { useI18n } from '../i18n';

export default function RewardsList({ campaignId }: { campaignId: string }) {
  const { m } = useI18n();
  const [metadata, setMetadata] = useState<CampaignMetadata | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    fetchCampaignMetadata(campaignId)
      .then(({ metadata }) => {
        if (live) setMetadata(metadata);
      })
      .catch(() => undefined)
      .finally(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [campaignId]);

  if (!loaded) return null;
  const rewards = metadata?.rewards ?? [];

  return (
    <section className="community-section" aria-labelledby="campaign-rewards">
      <h2 id="campaign-rewards">{m.community.rewardsTitle}</h2>
      {rewards.length === 0 ? (
        <p className="community-note">{m.community.rewardsNone}</p>
      ) : (
        <>
          <p className="community-note">{m.community.rewardsNote}</p>
          <ul className="document-list">
            {rewards.map((r) => (
              <li key={r.id}>
                <strong>{r.threshold}</strong>
                <span className="doc-note"> - {r.description}</span> {r.demo && <span className="status-chip chip-demo">{m.community.demoBadge}</span>}
                {r.terms && <p className="community-note">{r.terms}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
