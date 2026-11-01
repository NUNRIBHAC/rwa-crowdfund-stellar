// Content surfaces from the CONDA audit slice: events, blog, press, jobs,
// podcast. All five are honest demo shells: structure + planned formats +
// explicit empty states and demo notes. No fictional events, articles, press
// releases, vacancies or episodes - content appears only when the platform
// actually publishes it. Routes (backend wires them): /events, /blog,
// /press, /jobs, /podcast.
// Footer: Communication column links to these five pages.
import { useEffect, useState } from 'react';
import { fetchEpisodes } from '../community/api';
import type { PodcastEpisode } from '../community/api';
import { useI18n } from '../i18n';

function PageShell({ title, intro, children, demoNote }: { title: string; intro: string; children?: React.ReactNode; demoNote: string }) {
  const { m } = useI18n();
  return (
    <section className="community-section" aria-labelledby="content-title">
      <h1 id="content-title" className="page-title">
        {title} <span className="demo-badge">{m.community.demoBadge}</span>
      </h1>
      <p className="community-note">{intro}</p>
      {children}
      <p className="community-note">{demoNote}</p>
    </section>
  );
}

export function EventsPage() {
  const { m } = useI18n();
  const t = m.contentPages;
  return (
    <PageShell title={t.eventsTitle} intro={t.eventsIntro} demoNote={t.eventsDemoNote}>
      <div className="chip-row" role="tablist" aria-label={t.eventsTitle}>
        <button className="chip chip-active" aria-pressed="true">
          {t.eventsLive}
        </button>
        <button className="chip" aria-pressed="false" disabled>
          {t.eventsPast}
        </button>
      </div>
      <p className="community-note">{t.eventsEmptyLive}</p>
      <h3>{t.eventsFormatsTitle}</h3>
      <ul className="portfolio-list">
        <li className="portfolio-row">
          <strong>{t.eventsFormatPitch}</strong>
          <p className="community-note">{t.eventsFormatPitchDesc}</p>
        </li>
        <li className="portfolio-row">
          <strong>{t.eventsFormatLounge}</strong>
          <p className="community-note">{t.eventsFormatLoungeDesc}</p>
        </li>
        <li className="portfolio-row">
          <strong>{t.eventsFormatWebinar}</strong>
          <p className="community-note">{t.eventsFormatWebinarDesc}</p>
        </li>
      </ul>
      <h3>{t.eventsHowTitle}</h3>
      <p className="community-note">{t.eventsHowBody}</p>
    </PageShell>
  );
}

export function BlogPage() {
  const { m } = useI18n();
  const t = m.contentPages;
  return (
    <PageShell title={t.blogTitle} intro={t.blogIntro} demoNote={t.blogDemoNote}>
      {t.blogPosts.length === 0 && <p className="community-note">{t.blogEmpty}</p>}
      {t.blogPosts.map((post) => (
        <article className="blog-post" key={post.title}>
          <h3>{post.title}</h3>
          <p className="community-note">{post.date}</p>
          {post.paragraphs.map((para) => (
            <p className="community-note" key={para.slice(0, 40)}>
              {para}
            </p>
          ))}
        </article>
      ))}
    </PageShell>
  );
}

export function PressPage() {
  const { m } = useI18n();
  const t = m.contentPages;
  return (
    <PageShell title={t.pressTitle} intro={t.pressIntro} demoNote={t.pressDemoNote}>
      <p className="community-note">{t.pressEmpty}</p>
      <h3>{t.pressFactSheetTitle}</h3>
      <dl className="portfolio-list">
        <div className="portfolio-row">
          <dt>
            <strong>{t.pressFactStatusLabel}</strong>
          </dt>
          <dd className="community-note">{t.pressFactStatusValue}</dd>
        </div>
        <div className="portfolio-row">
          <dt>
            <strong>{t.pressFactOperatorLabel}</strong>
          </dt>
          <dd className="community-note">{t.pressFactOperatorValue}</dd>
        </div>
        <div className="portfolio-row">
          <dt>
            <strong>{t.pressFactTechLabel}</strong>
          </dt>
          <dd className="community-note">{t.pressFactTechValue}</dd>
        </div>
        <div className="portfolio-row">
          <dt>
            <strong>{t.pressContactLabel}</strong>
          </dt>
          <dd className="community-note">{t.pressFactContactValue}</dd>
        </div>
      </dl>
      <h3>{t.pressKitLabel}</h3>
      <p className="community-note">{t.pressKitNote}</p>
    </PageShell>
  );
}

export function JobsPage() {
  const { m } = useI18n();
  const t = m.contentPages;
  return (
    <PageShell title={t.jobsTitle} intro={t.jobsIntro} demoNote={t.jobsDemoNote}>
      <p className="community-note">{t.jobsEmpty}</p>
      <h3>{t.jobsAboutTitle}</h3>
      <p className="community-note">{t.jobsAboutBody}</p>
      <p className="community-note">{t.jobsSpeculativeNote}</p>
    </PageShell>
  );
}

export function PodcastPage() {
  const { m, locale } = useI18n();
  const t = m.contentPages;
  const [episodes, setEpisodes] = useState<PodcastEpisode[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetchEpisodes()
      .then(({ episodes }) => live && setEpisodes(episodes))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, []);

  // Honest intro: the "no episodes have been recorded" wording only holds
  // while the page is empty; a populated page must not claim it.
  const intro = episodes !== null && episodes.length > 0 ? t.podcastIntroWithEpisodes : t.podcastIntro;

  return (
    <PageShell title={t.podcastTitle} intro={intro} demoNote={t.podcastDemoNote}>
      {error && <p className="community-error">{error}</p>}
      {!error && episodes === null && <p className="community-loading">{m.community.loading}</p>}
      {!error && episodes !== null && episodes.length === 0 && <p className="community-note">{t.podcastEmpty}</p>}
      {!error && episodes !== null && episodes.length > 0 && (
        <ul className="portfolio-list" aria-label={t.podcastTitle}>
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
      )}
      <h3>{t.podcastFormatsTitle}</h3>
      <ul className="portfolio-list">
        <li className="portfolio-row">
          <strong>{t.podcastFormatInterviews}</strong>
          <p className="community-note">{t.podcastFormatInterviewsDesc}</p>
        </li>
        <li className="portfolio-row">
          <strong>{t.podcastFormatEducation}</strong>
          <p className="community-note">{t.podcastFormatEducationDesc}</p>
        </li>
        <li className="portfolio-row">
          <strong>{t.podcastFormatUpdates}</strong>
          <p className="community-note">{t.podcastFormatUpdatesDesc}</p>
        </li>
      </ul>
    </PageShell>
  );
}
