import React, { useEffect, useState } from 'react';
import { communityApi, type NewsPost } from './client';

// Campaign news. authorLabel 'platform-demo' must stay visible: there is no
// verified issuer identity yet, so readers must see these are platform-posted.
export function NewsList({ campaignId, labels }: { campaignId: string; labels?: Partial<typeof DEFAULT_LABELS> }) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const [news, setNews] = useState<NewsPost[] | null>(null);
  useEffect(() => {
    communityApi
      .listNews(campaignId)
      .then((r) => setNews(r.news))
      .catch(() => setNews([]));
  }, [campaignId]);
  return (
    <section className="community-news" aria-label={t.heading}>
      <h3>{t.heading}</h3>
      {news === null ? (
        <p>{t.loading}</p>
      ) : news.length === 0 ? (
        <p>{t.empty}</p>
      ) : (
        <ul>
          {news.map((n) => (
            <li key={n.id}>
              <h4>{n.title}</h4>
              <p>
                <em>{t.postedByPlatform}</em> <time dateTime={new Date(n.createdAt).toISOString()}>{new Date(n.createdAt).toLocaleDateString()}</time>
              </p>
              <p>{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const DEFAULT_LABELS = {
  heading: 'Campaign news',
  loading: 'Loading news…',
  empty: 'No updates yet.',
  postedByPlatform: 'Posted by the platform (demo) - no verified issuer account exists yet.',
};
