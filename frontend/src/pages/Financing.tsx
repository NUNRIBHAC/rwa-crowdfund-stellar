import { useI18n } from '../i18n';
import { useCommunityAuth } from '../community/CommunityAuth';
import IssuerApplicationPreview from '../components/IssuerApplicationPreview';
import IssuerApplicationForm from '../components/IssuerApplicationForm';

// Issuer landing page. The application form is live: a signed-in wallet
// submits an application that is stored for operator review (status stays
// visible to the applicant). Submitting is not an offer, listing or approval.
export default function Financing() {
  const { m } = useI18n();
  const { account } = useCommunityAuth();
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

      <p className="community-note">
        {m.financing.builderDraftLead} <a href="/campaign-builder">{m.financing.builderDraftLink}</a>
      </p>

      <IssuerApplicationPreview />
      {!account && (
        <p>
          <a className="btn btn-primary" href="/account">
            {m.nav.account}
          </a>
        </p>
      )}
      <IssuerApplicationForm />
    </>
  );
}
