import { useI18n } from '../i18n';

// Issuer landing page. The application form is a non-functional preview: issuer
// onboarding is not wired in this prototype, so the form is disabled and says so.
export default function Financing() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.financing.title}</h1>
      <p>{m.financing.intro}</p>

      <section aria-label={m.financing.journeyAria}>
        <h2 className="section-title">{m.financing.journeyTitle}</h2>
        <ol className="step-cards">
          {m.financing.steps.map((s, i) => (
            <li key={i} className="step-card">
              <span className="step-num" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label={m.financing.previewAria}>
        <h2 className="section-title">{m.financing.previewTitle}</h2>
        <p className="widget-note">{m.financing.previewNote}</p>
        <form className="issuer-form" aria-disabled="true" onSubmit={(e) => e.preventDefault()}>
          <label>
            {m.financing.companyName}
            <input disabled placeholder={m.financing.notAvailable} />
          </label>
          <label>
            {m.financing.country}
            <input disabled placeholder={m.financing.notAvailable} />
          </label>
          <label>
            {m.financing.targetAmount}
            <input disabled placeholder={m.financing.notAvailable} />
          </label>
          <label>
            {m.financing.instrument}
            <select disabled>
              <option>{m.financing.notAvailable}</option>
            </select>
          </label>
          <button className="btn btn-primary" disabled>
            {m.financing.submit}
          </button>
        </form>
      </section>
    </>
  );
}
