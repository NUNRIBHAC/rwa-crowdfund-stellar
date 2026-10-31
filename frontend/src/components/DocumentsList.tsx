// Campaign documents (blueprint section: per-campaign document listings).
// Server metadata marks demo documents; every demo document keeps its [DEMO]
// badge and the section states plainly that nothing here is an offer.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { CampaignMetadata } from '../community/api';
import { fetchCampaignMetadata } from '../community/api';
import { useI18n } from '../i18n';

export default function DocumentsList({ campaignId, fallback = null }: { campaignId: string; fallback?: ReactNode }) {
  const { m } = useI18n();
  const [metadata, setMetadata] = useState<CampaignMetadata | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetchCampaignMetadata(campaignId)
      .then(({ metadata }) => {
        if (live) setMetadata(metadata);
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [campaignId]);

  if (!loaded) return <p className="community-loading">{m.community.loading}</p>;
  if (error) return <p className="community-error">{error}</p>;
  if (!metadata || metadata.documents.length === 0) return <>{fallback}</>;

  return (
    <section className="community-section" aria-labelledby="campaign-documents">
      <h2 id="campaign-documents">{m.community.documentsTitle}</h2>
      <p className="community-note">{m.community.documentsNote}</p>
      <ul className="document-list">
        {metadata.documents.map((d) => (
          <li key={d.id}>
            <a href={d.url} target="_blank" rel="noopener noreferrer">
              {d.demo ? ((m.community.demoDocumentTitles as Record<string, string>)[d.id] ?? d.title) : d.title}
            </a>{' '}
            <span className="status-chip chip-instrument">{m.community.documentKinds[d.kind]}</span>{' '}
            {d.demo && <span className="status-chip chip-demo">{m.community.demoBadge}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
