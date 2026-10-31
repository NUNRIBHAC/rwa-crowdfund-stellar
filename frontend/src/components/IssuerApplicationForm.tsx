// Issuer application: a signed-in wallet applies to list a project. The form
// states clearly that submitting is not an offer, listing or approval - the
// application goes to the operator for review (status stays visible as
// 'received' in this prototype; review happens off-site).
import { useState } from 'react';
import type { FormEvent } from 'react';
import { COMMUNITY_LIMITS, submitIssuerApplication } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

export default function IssuerApplicationForm() {
  const { m } = useI18n();
  const { account, token } = useCommunityAuth();
  const [projectName, setProjectName] = useState('');
  const [country, setCountry] = useState('');
  const [instrumentType, setInstrumentType] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!account) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await submitIssuerApplication(token, {
        projectName: projectName.trim(),
        country: country.trim(),
        instrumentType: instrumentType.trim(),
        targetAmount: targetAmount.trim(),
        description: description.trim(),
        contactEmail: contactEmail.trim(),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="community-section" aria-labelledby="issuer-application">
      <h2 id="issuer-application">{m.community.applicationTitle}</h2>
      <p className="community-note">{m.community.applicationNote}</p>
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
      {done ? (
        <p className="community-success">{m.community.applicationDone}</p>
      ) : (
        <form onSubmit={submit} className="application-form">
          <label>
            {m.community.applicationFields.projectName}
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} maxLength={COMMUNITY_LIMITS.applicationField} required />
          </label>
          <label>
            {m.community.applicationFields.country}
            <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={COMMUNITY_LIMITS.applicationField} required />
          </label>
          <label>
            {m.community.applicationFields.instrumentType}
            <input value={instrumentType} onChange={(e) => setInstrumentType(e.target.value)} maxLength={COMMUNITY_LIMITS.applicationField} required />
          </label>
          <label>
            {m.community.applicationFields.targetAmount}
            <input value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} maxLength={COMMUNITY_LIMITS.applicationField} required />
          </label>
          <label>
            {m.community.applicationFields.description}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={COMMUNITY_LIMITS.applicationDescription}
              rows={5}
              required
            />
          </label>
          <label>
            {m.community.applicationFields.contactEmail}
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={COMMUNITY_LIMITS.applicationField} />
          </label>
          <button
            className="btn btn-primary"
            disabled={busy || !projectName.trim() || !country.trim() || !instrumentType.trim() || !targetAmount.trim() || !description.trim()}
          >
            {m.community.applicationSubmit}
          </button>
        </form>
      )}
    </section>
  );
}
