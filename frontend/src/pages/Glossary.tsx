import { GLOSSARY } from '../data/glossary';
import { routeHash } from '../router';

export default function Glossary() {
  return (
    <>
      <h1 className="page-title">Glossary</h1>
      <p>Key terms used across this platform and crowdfunding offers in general. Educational content only: no offer, no investment advice.</p>

      <section aria-label="Glossary terms">
        {GLOSSARY.map((g) => (
          <details key={g.term} className="accordion">
            <summary>{g.term}</summary>
            <p>{g.definition}</p>
          </details>
        ))}
      </section>

      <p className="section-link">
        Back to the <a href={routeHash({ name: 'learn' })}>Learn page</a>. Before any real-money decision, read the{' '}
        <a href={routeHash({ name: 'risk-warnings' })}>risk warnings</a>.
      </p>
    </>
  );
}
