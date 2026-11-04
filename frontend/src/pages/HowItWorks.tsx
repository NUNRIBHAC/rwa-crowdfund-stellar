import { useState } from 'react';
import { useI18n } from '../i18n';
import { routeHash } from '../router';
import EditorialCubes from '../components/EditorialCubes';

// The intended sequence is distinct from today's restricted testnet features.
export default function HowItWorks() {
  const { m } = useI18n();
  const [journey, setJourney] = useState<'investor' | 'issuer'>('investor');
  const h = m.howItWorks;
  const firstSentence = (text: string) => text.split(/(?<=[.!?。।])\s+/)[0];
  const lastSentence = (text: string) => text.split(/(?<=[.!?。।])\s+/).at(-1) ?? text;
  const investorSteps = h.investorSteps.map((step, i) => ({
    ...step,
    text:
      i === 2
        ? `${m.appropriateness.intro} ${m.appropriateness.categorisationNote}`
        : i === 7
          ? `${m.account.note} ${m.account.returnSub} ${step.text}`
          : step.text,
  }));
  // One testnet signature is both contribution and testnet settlement. Keep the
  // production payment explanation in Details, not as another working action.
  investorSteps[4] = { title: h.contributionPayment, text: `${investorSteps[4].text} ${investorSteps[6].text}` };
  const investor = investorSteps.filter((_, i) => i !== 6);
  const issuer = h.issuerSteps.map((step, i) => ({
    ...step,
    text:
      i === 0
        ? `${m.financing.intro} ${m.applicationDocuments.uploadNote} ${step.text}`
        : i === 1
          ? `${m.financing.builderDraftLead} ${m.financing.builderDraftLink} ${step.text}`
          : step.text,
  }));
  const states =
    journey === 'investor'
      ? ['partial', 'planned', 'partial', 'live', 'live', 'planned', 'partial', 'planned']
      : ['partial', 'partial', 'live', 'partial', 'planned'];
  const steps = journey === 'investor' ? investor : issuer;
  const tabLabel = journey === 'investor' ? h.contributorTab : h.businessTab;
  const destination = routeHash({ name: journey === 'investor' ? 'investments' : 'financing' });
  const action = journey === 'investor' ? h.exploreDemo : h.applicationPreview;
  return (
    <div className="how-page guided-how">
      <div className="guided-how-intro">
        <div>
          <h1 className="page-title">{h.guidedTitle}</h1>
          <p>{h.guidedIntro}</p>
        </div>
        <EditorialCubes />
      </div>
      <div className="journey-switch" role="tablist" aria-label={h.title}>
        {(['investor', 'issuer'] as const).map((id) => (
          <button
            key={id}
            id={`journey-tab-${id}`}
            className="btn"
            role="tab"
            aria-selected={journey === id}
            aria-controls="journey-panel"
            onClick={() => setJourney(id)}
          >
            {id === 'investor' ? h.contributorTab : h.businessTab}
          </button>
        ))}
      </div>
      <section className="journey-try-now" aria-label={h.tryNow}>
        <h2>{h.tryNow}</h2>
        <div className="hero-actions">
          <a className="btn btn-outline" href={destination}>
            {action}
          </a>
          {journey === 'investor' && (
            <a className="btn btn-ghost" href={routeHash({ name: 'investments' })}>
              {h.campaignRecords}
            </a>
          )}
        </div>
      </section>
      <section id="journey-panel" className="journey-panel journey-selected" role="tabpanel" aria-labelledby={`journey-tab-${journey}`}>
        <h2 className="section-title">{h.fullJourney}</h2>
        <p className="journey-overview">
          {tabLabel}: {steps.map((s) => s.title).join(' → ')}
        </p>
        <ol className="journey-list">
          {steps.map((s, i) => (
            <li key={s.title} className="journey-item">
              <span className="journey-number" aria-hidden="true">
                {i + 1}
              </span>
              <div className="journey-head">
                <h3>{s.title}</h3>
                <span className={`status-chip ${states[i] === 'live' ? 'status-funded' : 'status-pending'}`}>
                  {states[i] === 'live' ? h.live : states[i] === 'partial' ? h.partial : h.planned}
                </span>
              </div>
              <p>{journey === 'investor' && (i === 0 || i === 1 || i === 5 || i === 7) ? lastSentence(s.text) : firstSentence(s.text)}</p>
              <details>
                <summary>{h.details}</summary>
                <p>{s.text}</p>
              </details>
            </li>
          ))}
        </ol>
        <a className="btn btn-primary journey-final-action" href={destination}>
          {action}
        </a>
      </section>
    </div>
  );
}
