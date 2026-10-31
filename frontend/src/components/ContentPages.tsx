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
      <h2 id="content-title" className="section-title">
        {title} <span className="demo-badge">{m.community.demoBadge}</span>
      </h2>
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
    </PageShell>
  );
}

export function BlogPage() {
  const { m } = useI18n();
  const t = m.contentPages;
  return (
    <PageShell title={t.blogTitle} intro={t.blogIntro} demoNote={t.blogDemoNote}>
      <p className="community-note">{t.blogEmpty}</p>
    </PageShell>
  );
}

export function PressPage() {
  const { m } = useI18n();
  const t = m.contentPages;
  return (
    <PageShell title={t.pressTitle} intro={t.pressIntro} demoNote={t.pressDemoNote}>
      <p className="community-note">{t.pressEmpty}</p>
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
      <p className="community-note">{t.jobsSpeculativeNote}</p>
    </PageShell>
  );
}
