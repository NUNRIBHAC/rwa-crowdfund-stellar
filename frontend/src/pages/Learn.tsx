import { useI18n } from '../i18n';

export default function Learn() {
  const { m } = useI18n();
  const seniorityLabel = (s: string) => (m.instruments.seniorityLabels as Record<string, string>)[s] ?? s;
  return (
    <div className="learn-page">
      <h1 className="page-title">{m.learn.title}</h1>
      <p>{m.learn.intro}</p>

      <details className="learn-navigation" open>
        <summary>{m.learn.title}</summary>
        <nav aria-label={m.learn.title}>
          {m.instruments.groups.map((g) => (
            <a key={g.id} href={`#learn-${g.id}`}>
              {g.title}
            </a>
          ))}
          <a href="#learn-overlays">{m.learn.overlaysTitle}</a>
          <a href="#learn-qualifiers">{m.learn.qualifiersTitle}</a>
        </nav>
      </details>
      <div className="learn-content">
        {m.instruments.groups.map((g) => (
          <section key={g.id} id={`learn-${g.id}`} aria-label={g.title}>
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

        <section id="learn-overlays" aria-label={m.learn.overlaysAria}>
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

        <section id="learn-qualifiers" aria-label={m.learn.qualifiersAria}>
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
      </div>
    </div>
  );
}
