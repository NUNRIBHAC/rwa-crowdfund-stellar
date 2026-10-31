// Campaign news. Posts are written through the operator's admin key as an
// issuer stand-in (authorLabel 'platform-demo'): there is no verified issuer
// identity, so every post is labeled as platform demo content.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { NewsPost } from '../community/api';
import { fetchNews } from '../community/api';
import { useI18n } from '../i18n';

export default function NewsList({ campaignId, fallback = null }: { campaignId: string; fallback?: ReactNode }) {
  const { m, locale } = useI18n();
  const [posts, setPosts] = useState<NewsPost[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetchNews(campaignId)
      .then(({ news }) => live && setPosts(news))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [campaignId]);

  if (error) return <p className="community-error">{error}</p>;
  if (posts === null) return <p className="community-loading">{m.community.loading}</p>;
  if (posts.length === 0) return <>{fallback}</>;

  return (
    <section className="community-section" aria-labelledby="campaign-news">
      <h2 id="campaign-news">{m.community.newsTitle}</h2>
      {posts.map((p) => (
        <article key={p.id} className="news-post">
          <h3>{p.title}</h3>
          <p className="news-meta">
            {new Date(p.createdAt).toLocaleDateString(locale)} - {m.community.newsAuthorDemo}
          </p>
          <p>{p.body}</p>
        </article>
      ))}
    </section>
  );
}
