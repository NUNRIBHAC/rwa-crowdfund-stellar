import { routeHash } from '../router';
import { useI18n } from '../i18n';

export default function Glossary() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.glossaryPage.title}</h1>
      <p>{m.glossaryPage.intro}</p>

      <section aria-label={m.glossaryPage.sectionAria}>
        {m.glossary.map((g) => (
          <details key={g.term} className="accordion">
            <summary>{g.term}</summary>
            <p>{g.definition}</p>
          </details>
        ))}
      </section>

      <p className="section-link">
        {m.glossaryPage.backPre} <a href={routeHash({ name: 'learn' })}>{m.glossaryPage.backLink}</a>. {m.glossaryPage.riskPre}{' '}
        <a href={routeHash({ name: 'risk-warnings' })}>{m.glossaryPage.riskLink}</a>.
      </p>
    </>
  );
}
