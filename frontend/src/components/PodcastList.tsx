// Campaign podcast episodes. Episodes are published through the operator's
// admin key as platform stand-in (authorLabel 'platform-demo'): there is no
// verified issuer identity, so every episode is labeled as platform demo
// content. Audio is external https only; the platform never hosts audio.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { PodcastEpisode } from '../community/api';
import { fetchCampaignEpisodes } from '../community/api';
import { useI18n } from '../i18n';

export default function PodcastList({ campaignId, fallback = null }: { campaignId: string; fallback?: ReactNode }) {
  const { m, locale } = useI18n();
  const [episodes, setEpisodes] = useState<PodcastEpisode[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetchCampaignEpisodes(campaignId)
      .then(({ episodes }) => live && setEpisodes(episodes))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [campaignId]);

  if (error) return <p className="community-error">{error}</p>;
  if (episodes === null) return <p className="community-loading">{m.community.loading}</p>;
  if (episodes.length === 0) return <>{fallback}</>;

  return (
    <ul className="portfolio-list" aria-label={m.contentPages.podcastTitle}>
      {episodes.map((ep) => (
        <li key={ep.id} className="portfolio-row podcast-episode">
          <strong>{ep.title}</strong>
          <p className="news-meta">
            {new Date(ep.createdAt).toLocaleDateString(locale)} - {m.community.newsAuthorDemo}
          </p>
          <p className="community-note">{ep.description}</p>
          <audio controls preload="none" src={ep.audioUrl} aria-label={ep.title} />
        </li>
      ))}
    </ul>
  );
}
