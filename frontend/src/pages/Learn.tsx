import { routeHash } from '../router';
import { useI18n } from '../i18n';

export default function Learn() {
  const { m } = useI18n();
  const seniorityLabel = (s: string) => (m.instruments.seniorityLabels as Record<string, string>)[s] ?? s;
  return (
    <>
      <h1 className="page-title">{m.learn.title}</h1>
      <p>{m.learn.intro}</p>

      {m.instruments.groups.map((g) => (
        <section key={g.id} aria-label={g.title}>
          <h2 className="section-title">{g.title}</h2>
          <p>{g.intro}</p>
          <div className="instrument-grid">
            {m.instruments.classes
              .filter((c) => c.group === g.id)
              .map((c) => (
                <article key={c.id} className="instrument-card">
                  <h3>{c.label}</h3>
                  {c.subtypeOf && <p className="instrument-sub">{c.subtypeOf}</p>}
                  {c.note && <p className="instrument-sub">{c.note}</p>}
                  <p>{c.summary}</p>
                  {c.seniorityStates.length > 0 && (
                    <p className="instrument-seniority">
                      <strong>{m.learn.seniorityStatesLabel}</strong> {c.seniorityStates.map((s) => seniorityLabel(s)).join(' · ')}
                    </p>
                  )}
                  <div className="instrument-cols">
                    <div>
                      <h4>{m.learn.opportunities}</h4>
                      <ul>
                        {c.opportunities.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>{m.learn.risks}</h4>
                      <ul>
                        {c.risks.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="instrument-suitable">
                    <strong>{m.learn.suitableLabel}</strong> {c.suitableFor}
                  </p>
                </article>
              ))}
          </div>
        </section>
      ))}

      <section aria-label={m.learn.overlaysAria}>
        <h2 className="section-title">{m.learn.overlaysTitle}</h2>
        <p>{m.learn.overlaysIntro}</p>
        <div className="instrument-grid">
          {m.instruments.overlays.map((o) => (
            <article key={o.id} className="instrument-card">
              <h3>{o.label}</h3>
              <p>{o.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label={m.learn.qualifiersAria}>
        <h2 className="section-title">{m.learn.qualifiersTitle}</h2>
        <p>{m.learn.qualifiersIntro}</p>
        <div className="instrument-grid">
          {m.instruments.qualifiers.map((q) => (
            <article key={q.id} className="instrument-card">
              <h3>{q.label}</h3>
              <p>{q.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label={m.learn.glossaryAria}>
        <h2 className="section-title">{m.learn.glossaryTitle}</h2>
        <p>
          {m.learn.glossaryPre} <a href={routeHash({ name: 'glossary' })}>{m.learn.glossaryLink}</a>.
        </p>
      </section>

      <p className="section-link">
        {m.learn.riskPre} <a href={routeHash({ name: 'risk-warnings' })}>{m.learn.riskLink}</a>.
      </p>
    </>
  );
}
