// Issuer landing page. The application form is a non-functional preview: issuer
// onboarding is not wired in this prototype, so the form is disabled and says so.
export default function Financing() {
  return (
    <>
      <h1 className="page-title">Financing for companies</h1>
      <p>
        Raise capital from the crowd through a Soroban contract with all-or-nothing funding. This page describes the intended issuer journey; onboarding is not
        open in this prototype.
      </p>

      <section aria-label="Issuer journey overview">
        <h2 className="section-title">The intended journey</h2>
        <ol className="step-cards">
          <li className="step-card">
            <span className="step-num" aria-hidden="true">
              1
            </span>
            <h3>Apply</h3>
            <p>Tell us about your company, the amount and the instrument you have in mind.</p>
          </li>
          <li className="step-card">
            <span className="step-num" aria-hidden="true">
              2
            </span>
            <h3>Review</h3>
            <p>Eligibility and document review, then a structured financing offer.</p>
          </li>
          <li className="step-card">
            <span className="step-num" aria-hidden="true">
              3
            </span>
            <h3>Build</h3>
            <p>Campaign page, instrument terms, documents and marketing content prepared together.</p>
          </li>
          <li className="step-card">
            <span className="step-num" aria-hidden="true">
              4
            </span>
            <h3>Fund</h3>
            <p>All-or-nothing campaign. Funds settle only if the goal is met by the deadline.</p>
          </li>
        </ol>
      </section>

      <section aria-label="Application preview">
        <h2 className="section-title">Application (preview)</h2>
        <p className="widget-note">Issuer onboarding is not wired in this prototype: this form is disabled and nothing entered here is sent or stored.</p>
        <form className="issuer-form" aria-disabled="true" onSubmit={(e) => e.preventDefault()}>
          <label>
            Company name
            <input disabled placeholder="Not available in this prototype" />
          </label>
          <label>
            Country of registration
            <input disabled placeholder="Not available in this prototype" />
          </label>
          <label>
            Target amount
            <input disabled placeholder="Not available in this prototype" />
          </label>
          <label>
            Instrument of interest
            <select disabled>
              <option>Not available in this prototype</option>
            </select>
          </label>
          <button className="btn btn-primary" disabled>
            Submit application (not available)
          </button>
        </form>
      </section>
    </>
  );
}
