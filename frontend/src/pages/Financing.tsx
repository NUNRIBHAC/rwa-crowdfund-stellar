import { useI18n } from '../i18n';
import type { Market } from '../market';
import SignInPanel from '../components/SignInPanel';
import IssuerApplicationForm from '../components/IssuerApplicationForm';

// Issuer landing page. The application form is live: a signed-in wallet
// submits an application that is stored for operator review (status stays
// visible to the applicant). Submitting is not an offer, listing or approval.
export default function Financing({ market }: { market: Market }) {
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

      <SignInPanel actor={market.actor} />
      <IssuerApplicationForm />
    </>
  );
}
