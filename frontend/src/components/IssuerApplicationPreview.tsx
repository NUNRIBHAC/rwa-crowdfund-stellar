// Visible preview of the issuer application for visitors who are not signed
// in: disabled fields only - nothing entered here is sent or stored. The
// working submission form (IssuerApplicationForm) appears after wallet
// sign-in. Field labels reuse the real form's applicationFields keys so the
// preview matches what the visitor sees after signing in.
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

export default function IssuerApplicationPreview() {
  const { m } = useI18n();
  const { account, restored } = useCommunityAuth();
  if (!restored || account) return null;
  const f = m.community.applicationFields;
  const placeholder = m.community.applicationPreviewPlaceholder;
  return (
    <section className="community-section" aria-labelledby="issuer-application-preview">
      <h2 id="issuer-application-preview">{m.community.applicationPreviewTitle}</h2>
      <p className="community-note">{m.community.applicationPreviewNote}</p>
      <div className="application-form">
        <label>
          {f.projectName}
          <input disabled placeholder={placeholder} />
        </label>
        <label>
          {f.country}
          <input disabled placeholder={placeholder} />
        </label>
        <label>
          {f.instrumentType}
          <input disabled placeholder={placeholder} />
        </label>
        <label>
          {f.targetAmount}
          <input disabled placeholder={placeholder} />
        </label>
      </div>
      <button className="btn btn-primary" disabled>
        {m.community.applicationPreviewSubmit}
      </button>
    </section>
  );
}
