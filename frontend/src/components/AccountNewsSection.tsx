// Campaign news inside My account: the site-wide news feed filtered to the
// campaigns the signed-in wallet actually contributed to. Distinct from the
// activity feed (the wallet's own recorded intents) and from notifications:
// these are issuer/platform updates about the user's investments. Posts carry
// the same platform-demo author label as campaign news everywhere - no
// verified issuer identity exists yet.
import { useEffect, useState } from 'react';
import type { NewsPost } from '../community/api';
import { fetchNewsFeed } from '../community/api';
import { useI18n } from '../i18n';
import { routeHash } from '../router';

export default function AccountNewsSection({ campaigns }: { campaigns: { id: string; name: string }[] }) {
  const { m, locale } = useI18n();
  const t = m.account;
  const [posts, setPosts] = useState<NewsPost[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetchNewsFeed()
      .then(({ news }) => live && setPosts(news))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, []);

  const nameById = new Map(campaigns.map((c) => [c.id, c.name]));
  const mine = (posts ?? []).filter((p) => nameById.has(p.campaignId)).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <section className="community-section" aria-label={t.newsFeedAria}>
      <h2 className="section-title">{t.newsFeedTitle}</h2>
      {error && <p className="community-error">{error}</p>}
      {!error && posts === null && <p className="community-loading">{m.community.loading}</p>}
      {!error && posts !== null && campaigns.length === 0 && <p className="community-note">{t.newsFeedNoInvestments}</p>}
      {!error && posts !== null && campaigns.length > 0 && mine.length === 0 && <p className="community-note">{t.newsFeedEmpty}</p>}
      {mine.map((p) => (
        <article key={p.id} className="news-post">
          <h3>{p.title}</h3>
          <p className="news-meta">
            {new Date(p.createdAt).toLocaleDateString(locale)} -{' '}
            <a href={routeHash({ name: 'campaign', campaignId: p.campaignId })}>{nameById.get(p.campaignId)}</a> - {m.community.newsAuthorDemo}
          </p>
          <p>{p.body}</p>
        </article>
      ))}
    </section>
  );
}
