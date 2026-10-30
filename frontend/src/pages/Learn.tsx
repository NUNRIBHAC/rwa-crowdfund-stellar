import { INSTRUMENT_CLASSES, INSTRUMENT_GROUPS, LABEL_QUALIFIERS, SENIORITY_LABELS, STRUCTURE_OVERLAYS } from '../data/instruments';
import { routeHash } from '../router';

export default function Learn() {
  return (
    <>
      <h1 className="page-title">Learn</h1>
      <p>
        Plain-language explanations of the instrument model this platform is designed around: four participation-side parents and two debt parents (loan and
        bond), each debt parent issued senior, subordinated or with seniority unspecified. Structure overlays combine with a debt parent; rank and label
        qualifiers are platform wording, preserved as-is. Educational content only: no offer, no investment advice.
      </p>

      {INSTRUMENT_GROUPS.map((g) => (
        <section key={g.id} aria-label={g.title}>
          <h2 className="section-title">{g.title}</h2>
          <p>{g.intro}</p>
          <div className="instrument-grid">
            {INSTRUMENT_CLASSES.filter((c) => c.group === g.id).map((c) => (
              <article key={c.id} className="instrument-card">
                <h3>{c.label}</h3>
                {c.subtypeOf && <p className="instrument-sub">{c.subtypeOf}</p>}
                {c.note && <p className="instrument-sub">{c.note}</p>}
                <p>{c.summary}</p>
                {c.seniorityStates && (
                  <p className="instrument-seniority">
                    <strong>Seniority states:</strong> {c.seniorityStates.map((s) => SENIORITY_LABELS[s]).join(' · ')}
                  </p>
                )}
                <div className="instrument-cols">
                  <div>
                    <h4>Opportunities</h4>
                    <ul>
                      {c.opportunities.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Risks</h4>
                    <ul>
                      {c.risks.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="instrument-suitable">
                  <strong>Who is it suitable for:</strong> {c.suitableFor}
                </p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section aria-label="Structure overlays">
        <h2 className="section-title">Structure overlays</h2>
        <p>Overlays combine with a loan or bond parent and never stand alone as instruments.</p>
        <div className="instrument-grid">
          {STRUCTURE_OVERLAYS.map((o) => (
            <article key={o.id} className="instrument-card">
              <h3>{o.label}</h3>
              <p>{o.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Rank and label qualifiers">
        <h2 className="section-title">Rank and label qualifiers</h2>
        <p>Platform wording you may meet on offers. These labels qualify an instrument; they are not instrument classes themselves.</p>
        <div className="instrument-grid">
          {LABEL_QUALIFIERS.map((q) => (
            <article key={q.id} className="instrument-card">
              <h3>{q.label}</h3>
              <p>{q.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Glossary">
        <h2 className="section-title">Glossary</h2>
        <p>
          Key platform and crowdfunding terms live on their own page: <a href={routeHash({ name: 'glossary' })}>open the glossary</a>.
        </p>
      </section>

      <p className="section-link">
        Before any real-money decision, read the <a href={routeHash({ name: 'risk-warnings' })}>risk warnings</a>.
      </p>
    </>
  );
}
