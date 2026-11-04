import { useState } from 'react';
import { useI18n } from '../i18n';

// Investor and issuer journey. Every step is honestly marked: live in this
// prototype, or planned and not implemented. Nothing planned is made to look live.
export default function HowItWorks() {
  const { m } = useI18n();
  const [journey, setJourney] = useState('investor');
  const investorStates = ['partial', 'planned', 'partial', 'live', 'live', 'planned', 'live', 'partial', 'planned'];
  const issuerStates = ['partial', 'partial', 'live', 'partial', 'planned'];
  const investorSteps = m.howItWorks.investorSteps.map((step, i) => ({
    ...step,
    text: i === 2 ? `${m.appropriateness.intro} ${m.appropriateness.categorisationNote}` : i === 7 ? `${m.account.note} ${m.account.returnSub}` : step.text,
  }));
  const issuerSteps = m.howItWorks.issuerSteps.map((step, i) => ({
    ...step,
    text:
      i === 0
        ? `${m.financing.intro} ${m.applicationDocuments.uploadNote}`
        : i === 1
          ? `${m.financing.builderDraftLead} ${m.financing.builderDraftLink}`
          : step.text,
  }));

  const StepList = ({ id, title, steps, states }: { id: string; title: string; steps: { title: string; text: string }[]; states: string[] }) => (
    <section className={`journey-panel ${journey === id ? 'journey-selected' : ''}`} aria-label={title}>
      <h2 className="section-title">{title}</h2>
      <ol className="journey-list">
        {steps.map((s, i) => (
          <li key={s.title} className="journey-item">
            <div className="journey-head">
              <h3>{s.title}</h3>
              <span className={`status-chip ${states[i] === 'live' ? 'status-funded' : 'status-pending'}`}>
                {states[i] === 'live' ? m.howItWorks.live : states[i] === 'partial' ? m.howItWorks.partial : m.howItWorks.planned}
              </span>
            </div>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );

  return (
    <div className="how-page">
      <h1 className="page-title">{m.howItWorks.title}</h1>
      <p>{m.howItWorks.intro}</p>
      <div className="journey-switch" role="group" aria-label={m.howItWorks.title}>
        <button className="btn" aria-pressed={journey === 'investor'} onClick={() => setJourney('investor')}>
          {m.howItWorks.investorTitle}
        </button>
        <button className="btn" aria-pressed={journey === 'issuer'} onClick={() => setJourney('issuer')}>
          {m.howItWorks.issuerTitle}
        </button>
      </div>
      <div className="journey-columns">
        <StepList id="investor" title={m.howItWorks.investorTitle} steps={investorSteps} states={investorStates} />
        <StepList id="issuer" title={m.howItWorks.issuerTitle} steps={issuerSteps} states={issuerStates} />
      </div>
    </div>
  );
}
