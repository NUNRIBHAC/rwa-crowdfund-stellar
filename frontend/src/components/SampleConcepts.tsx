import { useI18n } from '../i18n';
import { SAMPLE_CONCEPTS, sampleConceptIndex } from '../data/sampleConcepts';
import { routeHash } from '../router';

// No Market, Campaign, wallet, API or transaction handler is accepted here.
export function SampleConceptsSection() {
  const { m } = useI18n();
  const t = m.sampleConcepts;
  return (
    <section className="sample-concepts" aria-labelledby="sample-concepts-title" data-sample-concepts>
      <h2 id="sample-concepts-title" className="section-title">
        {t.title}
      </h2>
      <p>{t.notice}</p>
      <div className="sample-concept-grid">
        {SAMPLE_CONCEPTS.map((concept, index) => (
          <article key={concept.id} className="sample-concept-card" data-concept={concept.id}>
            <span className="status-chip chip-demo">{m.card.demo}</span>
            <p className="sample-concept-format">{t.list[index].label}</p>
            <h3>
              <a href={routeHash({ name: 'campaign', campaignId: concept.id }) + '?fixtures=1'}>{concept.name}</a>
            </h3>
            <p className="sample-concept-state">{t.unavailable}</p>
            <p className="sample-concept-caveat">{t.list[index].caveat}</p>
            {concept.nonFinancial && <p>{t.nonFinancialNotice}</p>}
            <small>{m.sampleLifecycle.notice}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SampleConceptDetail({ conceptId }: { conceptId: string }) {
  const { m } = useI18n();
  const index = sampleConceptIndex(conceptId);
  if (index < 0) return null;
  const concept = SAMPLE_CONCEPTS[index];
  const t = m.sampleConcepts;
  return (
    <section className="sample-concept-detail" data-concept={concept.id}>
      <a href={routeHash({ name: 'investments' }) + '?fixtures=1'}>{m.campaign.backToAll}</a>
      <p>
        <span className="status-chip chip-demo">{m.card.demo}</span>
      </p>
      <h1 className="page-title">{concept.name}</h1>
      <p className="sample-concept-format">{t.list[index].label}</p>
      <p className="sample-concept-state">{t.unavailable}</p>
      <p>{m.sampleLifecycle.notice}</p>
      <div className="sample-concept-caveat">
        <p>{t.list[index].caveat}</p>
      </div>
      {concept.nonFinancial && <p className="sample-concept-caveat">{t.nonFinancialNotice}</p>}
      <p>{t.notice}</p>
    </section>
  );
}
