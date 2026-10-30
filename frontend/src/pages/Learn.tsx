import { INSTRUMENT_CLASSES, INSTRUMENT_GROUPS } from '../data/instruments';
import { GLOSSARY } from '../data/glossary';
import { routeHash } from '../router';

export default function Learn() {
  return (
    <>
      <h1 className="page-title">Learn</h1>
      <p>Plain-language explanations of the instrument classes this platform is designed around. Educational content only: no offer, no investment advice.</p>

      {INSTRUMENT_GROUPS.map((g) => (
        <section key={g.id} aria-label={g.title}>
          <h2 className="section-title">{g.title}</h2>
          <p>{g.intro}</p>
          <div className="instrument-grid">
            {INSTRUMENT_CLASSES.filter((c) => c.group === g.id).map((c) => (
              <article key={c.id} className="instrument-card">
                <h3>{c.label}</h3>
                {c.subtypeOf && <p className="instrument-sub">{c.subtypeOf}</p>}
                <p>{c.summary}</p>
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

      <section aria-label="Glossary">
        <h2 className="section-title">Glossary</h2>
        {GLOSSARY.map((g) => (
          <details key={g.term} className="accordion">
            <summary>{g.term}</summary>
            <p>{g.definition}</p>
          </details>
        ))}
      </section>

      <p className="section-link">
        Before any real-money decision, read the <a href={routeHash({ name: 'risk-warnings' })}>risk warnings</a>.
      </p>
    </>
  );
}
