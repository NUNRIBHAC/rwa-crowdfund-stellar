import { useI18n } from '../i18n';

// Investor and issuer journey. Every step is honestly marked: live in this
// prototype, or planned and not implemented. Nothing planned is made to look live.
export default function HowItWorks() {
  const { m } = useI18n();
  const investorStates = ['planned', 'planned', 'planned', 'live', 'live', 'planned', 'live', 'planned', 'planned'];
  const issuerStates = ['planned', 'planned', 'live', 'live', 'planned'];

  const StepList = ({ title, steps, states }: { title: string; steps: { title: string; text: string }[]; states: string[] }) => (
    <section aria-label={title}>
      <h2 className="section-title">{title}</h2>
      <ol className="journey-list">
        {steps.map((s, i) => (
          <li key={s.title} className="journey-item">
            <div className="journey-head">
              <h3>{s.title}</h3>
              <span className={`status-chip ${states[i] === 'live' ? 'status-funded' : 'status-pending'}`}>
                {states[i] === 'live' ? m.howItWorks.live : m.howItWorks.planned}
              </span>
            </div>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );

  return (
    <>
      <h1 className="page-title">{m.howItWorks.title}</h1>
      <p>{m.howItWorks.intro}</p>
      <StepList title={m.howItWorks.investorTitle} steps={m.howItWorks.investorSteps} states={investorStates} />
      <StepList title={m.howItWorks.issuerTitle} steps={m.howItWorks.issuerSteps} states={issuerStates} />
    </>
  );
}
