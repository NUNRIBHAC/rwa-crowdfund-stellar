// Content surfaces from the CONDA audit slice: events, blog, press, jobs.
// All four are honest demo shells: structure + planned formats + explicit
// empty states and demo notes. No fictional events, articles, press releases
// or vacancies - content appears only when the platform actually publishes it.
// Routes (backend wires them): /events, /blog, /press, /jobs.
// Footer proposal: Communication column links to these four pages.
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
