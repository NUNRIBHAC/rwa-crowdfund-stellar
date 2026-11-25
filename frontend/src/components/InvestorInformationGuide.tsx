import { useId, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { routeHash } from '../router';

// Factual navigation only. No profile, holdings, ranking or recommendation input.
// Reuses the existing localized glossary and calculator disclosures, not FAQ
// claims about operational features that can become stale independently.
export default function InvestorInformationGuide() {
  const { m } = useI18n();
  const id = useId();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const topics = useMemo(
    () => [
      { id: 'terms', title: m.glossaryPage.title },
      { id: 'risks', title: m.footer.riskWarnings },
      { id: 'fees', title: m.yieldCalculator.feeAmount },
      { id: 'assumptions', title: m.yieldCalculator.assumptions },
    ],
    [m],
  );
  const entries = useMemo(
    () => [
      ...m.glossary.map((item, i) => ({ id: `term-${i}`, topic: 'terms', title: item.term, text: item.definition })),
      ...m.riskWarnings.items.map((item, i) => ({ id: `risk-${i}`, topic: 'risks', title: item.h, text: item.p })),
      { id: 'fees', topic: 'fees', title: m.yieldCalculator.feeAmount, text: m.contributionTerms.fees },
      { id: 'assumptions', topic: 'assumptions', title: m.yieldCalculator.assumptions, text: m.yieldCalculator.assumptionsNote },
      { id: 'model', topic: 'assumptions', title: m.informationGuide.model, text: `${m.yieldCalculator.formula} ${m.yieldCalculator.advancedNote}` },
    ],
    [m],
  );
  const needle = query.trim().toLocaleLowerCase();
  const visible = entries.filter(
    (entry) => (topic === 'all' || entry.topic === topic) && (!needle || `${entry.title} ${entry.text}`.toLocaleLowerCase().includes(needle)),
  );
  return (
    <section className="investor-information-guide" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{m.informationGuide.title}</h2>
      <p>{m.informationGuide.intro}</p>
      <p className="community-note">{m.yieldCalculator.notice}</p>
      <div className="information-guide-controls">
        <label htmlFor={`${id}-search`}>{m.informationGuide.searchLabel}</label>
        <input id={`${id}-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={m.informationGuide.searchPlaceholder} />
        <div className="tab-bar" role="group" aria-label={m.informationGuide.topics}>
          {[{ id: 'all', title: m.informationGuide.all }, ...topics].map((item) => (
            <button
              type="button"
              key={item.id}
              className={`chip ${topic === item.id ? 'chip-active' : ''}`}
              aria-pressed={topic === item.id}
              onClick={() => setTopic(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 && <p role="status">{m.informationGuide.noMatches}</p>}
      {visible.length > 0 && (
        <div className="information-guide-results">
          {visible.map((entry) => (
            <details className="accordion" key={entry.id}>
              <summary>{entry.title}</summary>
              <p>{entry.text}</p>
            </details>
          ))}
        </div>
      )}
      <nav className="investors-context" aria-label={m.glossaryPage.sectionAria}>
        <a className="btn" href={routeHash({ name: 'glossary' })}>
          {m.glossaryPage.title}
        </a>
        <a className="btn" href={routeHash({ name: 'risk-warnings' })}>
          {m.footer.riskWarnings}
        </a>
        <a className="btn" href={routeHash({ name: 'risk-disclosure' })}>
          {m.footer.riskDisclosure}
        </a>
        <a className="btn" href="#yield-title">
          {m.yieldCalculator.title}
        </a>
      </nav>
    </section>
  );
}
