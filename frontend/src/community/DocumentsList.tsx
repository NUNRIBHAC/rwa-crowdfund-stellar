import React, { useEffect, useState } from 'react';
import { communityApi, type CampaignMetadata } from './client';

// Campaign documents. Entries flagged demo are fictional templates and must
// keep the visible demo badge; a demo KIIS is not a real KIIS.
export function DocumentsList({ campaignId, labels }: { campaignId: string; labels?: Partial<typeof DEFAULT_LABELS> }) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const [metadata, setMetadata] = useState<CampaignMetadata | null | undefined>(undefined);
  useEffect(() => {
    communityApi
      .metadata(campaignId)
      .then((r) => setMetadata(r.metadata))
      .catch(() => setMetadata(null));
  }, [campaignId]);
  return (
    <section className="community-documents" aria-label={t.heading}>
      <h3>{t.heading}</h3>
      {metadata === undefined ? (
        <p>{t.loading}</p>
      ) : metadata === null || metadata.documents.length === 0 ? (
        <p>{t.empty}</p>
      ) : (
        <ul>
          {metadata.documents.map((d) => (
            <li key={d.id}>
              <a href={d.url} target="_blank" rel="noopener noreferrer">
                {d.title}
              </a>{' '}
              {d.demo && <span className="community-demo-badge">{t.demoBadge}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const DEFAULT_LABELS = {
  heading: 'Documents',
  loading: 'Loading documents…',
  empty: 'No documents published for this campaign.',
  demoBadge: 'Demo template - fictional, not an offer',
};
