import { useMemo, useState } from 'react';
import type { FaqState } from '../data/faq';
import { useI18n } from '../i18n';

const STATE_CLASS: Record<FaqState, string> = {
  live: 'status-funded',
  planned: 'status-pending',
  info: 'status-info',
};

export default function Faq() {
  const { m } = useI18n();
  const [cat, setCat] = useState<string>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return m.faq.categories
      .filter((c) => cat === 'all' || c.id === cat)
      .map((c) => ({
        ...c,
        entries: q ? c.entries.filter((e) => `${e.q} ${e.a}`.toLowerCase().includes(q)) : c.entries,
      }))
      .filter((c) => c.entries.length > 0);
  }, [cat, query, m]);

  return (
    <>
      <h1 className="page-title">{m.faqPage.title}</h1>
      <div className="faq-intro">
        <div>
          <p>
            {m.faqPage.introPre} <strong>{m.faqPage.introLive}</strong> {m.faqPage.introMid1} <strong>{m.faqPage.introPlanned}</strong> {m.faqPage.introMid2}{' '}
            <strong>{m.faqPage.introInfo}</strong> {m.faqPage.introPost}
          </p>
        </div>
        <div className="faq-animation">
          <img className="faq-question" src="/faq-question.svg" alt="" />
          <p className="community-note">{m.hero.illustration}</p>
        </div>
      </div>
      <div className="faq-controls">
        <input
          className="discovery-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={m.faqPage.searchPlaceholder}
          aria-label={m.faqPage.searchAria}
        />
        <div className="tab-bar" role="group" aria-label={m.faqPage.categoryAria}>
          <button className={`chip ${cat === 'all' ? 'chip-active' : ''}`} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
            {m.faqPage.all}
          </button>
          {m.faq.categories.map((c) => (
            <button key={c.id} className={`chip ${cat === c.id ? 'chip-active' : ''}`} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.title}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 && <p role="status">{m.faqPage.noMatches}</p>}
      {visible.map((c) => (
        <section key={c.id} aria-label={c.title} className="faq-category">
          <h2 className="section-title">{c.title}</h2>
          {c.entries.map((e) => (
            <details key={e.q} className="accordion">
              <summary>
                <span>{e.q}</span>
                <span className={`status-chip faq-state ${STATE_CLASS[(e.state as FaqState) ?? 'info']}`}>
                  {(m.faq.stateLabels as Record<string, string>)[e.state] ?? e.state}
                </span>
              </summary>
              <p>{e.a}</p>
            </details>
          ))}
        </section>
      ))}
    </>
  );
}
