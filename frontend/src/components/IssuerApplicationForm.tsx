// Issuer application: a signed-in wallet applies to list a project. The form
// states clearly that submitting is not an offer, listing or approval - the
// application goes to the operator for review (status stays visible as
// 'received' in this prototype; review happens off-site).
//
// Validation: native required/type=email constraint validation stays the
// authority (localized browser messages, focus management). On top of it,
// invalid fields get aria-invalid + an inline message (aria-describedby) so
// the error state is visible and announced beyond the transient native
// bubble; the inline text uses the site locale via m.community keys, with
// the browser's validationMessage as fallback for unconstrained cases. Server zod errors keep surfacing in the role=alert region.
import { useState } from 'react';
import type { FormEvent, InvalidEvent } from 'react';
import { COMMUNITY_LIMITS, submitIssuerApplication } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

type FieldKey = 'projectName' | 'country' | 'instrumentType' | 'targetAmount' | 'description' | 'contactEmail';

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [done, setDone] = useState(false);

  if (!account) return null;

  function markInvalid(e: InvalidEvent<HTMLFormElement>) {
    const el = e.target as HTMLInputElement | HTMLTextAreaElement;
    const key = el.name as FieldKey;
    if (!key) return;
    // Site-locale messages for the cases this form can produce (required,
    // email format); anything else keeps the browser's own validationMessage.
    const message = el.validity.valueMissing
      ? m.community.applicationValidation.required
      : el.validity.typeMismatch && el.type === 'email'
        ? m.community.applicationValidation.emailInvalid
        : el.validationMessage;
    setFieldErrors((prev) => ({ ...prev, [key]: message }));
  }

  function revalidate(key: FieldKey, el: HTMLInputElement | HTMLTextAreaElement) {
    setFieldErrors((prev) => {
      if (!prev[key] || !el.checkValidity()) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function fieldProps(key: FieldKey) {
    const message = fieldErrors[key];
    return {
      name: key,
      'aria-invalid': message ? true : undefined,
      'aria-describedby': message ? `issuer-error-${key}` : undefined,
    };
  }

  function fieldMessage(key: FieldKey) {
    const message = fieldErrors[key];
    return message ? (
      <p className="field-error" id={`issuer-error-${key}`}>
        {message}
      </p>
    ) : null;
  }

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
      setFieldErrors({});
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
        <form onSubmit={submit} onInvalidCapture={markInvalid} className="application-form">
          <label>
            {m.community.applicationFields.projectName}
            <input
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                revalidate('projectName', e.target);
              }}
              maxLength={COMMUNITY_LIMITS.applicationField}
              required
              {...fieldProps('projectName')}
            />
            {fieldMessage('projectName')}
          </label>
          <label>
            {m.community.applicationFields.country}
            <input
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                revalidate('country', e.target);
              }}
              maxLength={COMMUNITY_LIMITS.applicationField}
              required
              {...fieldProps('country')}
            />
            {fieldMessage('country')}
          </label>
          <label>
            {m.community.applicationFields.instrumentType}
            <input
              value={instrumentType}
              onChange={(e) => {
                setInstrumentType(e.target.value);
                revalidate('instrumentType', e.target);
              }}
              maxLength={COMMUNITY_LIMITS.applicationField}
              required
              {...fieldProps('instrumentType')}
            />
            {fieldMessage('instrumentType')}
          </label>
          <label>
            {m.community.applicationFields.targetAmount}
            <input
              value={targetAmount}
              onChange={(e) => {
                setTargetAmount(e.target.value);
                revalidate('targetAmount', e.target);
              }}
              maxLength={COMMUNITY_LIMITS.applicationField}
              required
              {...fieldProps('targetAmount')}
            />
            {fieldMessage('targetAmount')}
          </label>
          <label>
            {m.community.applicationFields.description}
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                revalidate('description', e.target);
              }}
              maxLength={COMMUNITY_LIMITS.applicationDescription}
              rows={5}
              required
              {...fieldProps('description')}
            />
            {fieldMessage('description')}
          </label>
          <label>
            {m.community.applicationFields.contactEmail}
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => {
                setContactEmail(e.target.value);
                revalidate('contactEmail', e.target);
              }}
              maxLength={COMMUNITY_LIMITS.applicationField}
              {...fieldProps('contactEmail')}
            />
            {fieldMessage('contactEmail')}
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {m.community.applicationSubmit}
          </button>
        </form>
      )}
    </section>
  );
}
