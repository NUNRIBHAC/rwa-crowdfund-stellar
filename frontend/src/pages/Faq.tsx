import { useMemo, useState } from 'react';
import { FAQ_CATEGORIES, FAQ_STATE_LABELS, type FaqState } from '../data/faq';

const STATE_CLASS: Record<FaqState, string> = {
  live: 'status-funded',
  planned: 'status-pending',
  info: 'status-info',
};

export default function Faq() {
  const [cat, setCat] = useState<string>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_CATEGORIES.filter((c) => cat === 'all' || c.id === cat)
      .map((c) => ({
        ...c,
        entries: q ? c.entries.filter((e) => `${e.q} ${e.a}`.toLowerCase().includes(q)) : c.entries,
      }))
      .filter((c) => c.entries.length > 0);
  }, [cat, query]);

  return (
    <>
      <h1 className="page-title">Frequently asked questions</h1>
      <p>
        Answers are tagged like the How it works page: <strong>Live in prototype</strong> describes what the code does today,{' '}
        <strong>Planned - not built</strong> is not implemented anywhere, and <strong>General background</strong> explains crowdfunding practice without
        claiming this platform does it.
      </p>
      <div className="faq-controls">
        <input
          className="discovery-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions and answers"
          aria-label="Search questions"
        />
        <div className="tab-bar" role="group" aria-label="FAQ category">
          <button className={`chip ${cat === 'all' ? 'chip-active' : ''}`} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
            All
          </button>
          {FAQ_CATEGORIES.map((c) => (
            <button key={c.id} className={`chip ${cat === c.id ? 'chip-active' : ''}`} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.title}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 && <p role="status">No questions match your search.</p>}
      {visible.map((c) => (
        <section key={c.id} aria-label={c.title} className="faq-category">
          <h2 className="section-title">{c.title}</h2>
          {c.entries.map((e) => (
            <details key={e.q} className="accordion">
              <summary>
                <span>{e.q}</span>
                <span className={`status-chip faq-state ${STATE_CLASS[e.state]}`}>{FAQ_STATE_LABELS[e.state]}</span>
              </summary>
              <p>{e.a}</p>
            </details>
          ))}
        </section>
      ))}
    </>
  );
}
