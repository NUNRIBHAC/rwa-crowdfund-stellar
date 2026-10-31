// Company accounts: a signed-in wallet applies for a company account linked
// to it. Manual review, same posture as issuer applications - status stays
// 'pending' until a real operator decides. Demo honesty: the registry fields
// are applicant-provided claims; no register extract or owner IDs are
// uploaded or verified in this prototype, and investing from a company
// context is planned, not active.
//
// Validation mirrors the issuer form: native required constraint validation
// stays the authority, aria-invalid + inline site-locale messages on top.
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, InvalidEvent } from 'react';
import { applyForCompany, fetchMyCompanies } from '../community/api';
import type { CompanyApplication } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

type FieldKey = 'companyName' | 'legalForm' | 'registrationNumber' | 'country';

export default function CompanyAccountsSection() {
  const { m, locale } = useI18n();
  const { account, token } = useCommunityAuth();
  const [companies, setCompanies] = useState<CompanyApplication[] | null>(null);
  const [values, setValues] = useState<Record<FieldKey, string>>({ companyName: '', legalForm: '', registrationNumber: '', country: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const labels = m.community.company;

  const load = useCallback(() => {
    if (!account) return;
    fetchMyCompanies(token)
      .then((v) => setCompanies(v.companies))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [account, token]);

  useEffect(() => {
    if (!account) {
      setCompanies(null);
      return;
    }
    setError('');
    load();
  }, [account, load]);

  if (!account) return null;

  const fmt = (ts: number) => new Date(ts).toLocaleString(locale);

  function markInvalid(e: InvalidEvent<HTMLFormElement>) {
    const el = e.target as HTMLInputElement;
    const key = el.name as FieldKey;
    if (!key) return;
    const message = el.validity.valueMissing ? m.community.applicationValidation.required : el.validationMessage;
    setFieldErrors((prev) => ({ ...prev, [key]: message }));
  }

  function revalidate(key: FieldKey, el: HTMLInputElement) {
    setValues((prev) => ({ ...prev, [key]: el.value }));
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
      required: true,
      maxLength: key === 'companyName' ? 200 : 120,
      value: values[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => revalidate(key, e.target),
      'aria-invalid': message ? true : undefined,
      'aria-describedby': message ? `company-error-${key}` : undefined,
    };
  }

  function fieldMessage(key: FieldKey) {
    const message = fieldErrors[key];
    return message ? (
      <p className="field-error" id={`company-error-${key}`}>
        {message}
      </p>
    ) : null;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { company } = await applyForCompany(token, {
        companyName: values.companyName.trim(),
        legalForm: values.legalForm.trim(),
        registrationNumber: values.registrationNumber.trim(),
        country: values.country.trim(),
      });
      setCompanies((prev) => [company, ...(prev ?? [])]);
      setValues({ companyName: '', legalForm: '', registrationNumber: '', country: '' });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="community-section" aria-labelledby="company-accounts-title">
      <h2 id="company-accounts-title" className="section-title">
        {labels.title}
      </h2>
      <p>{labels.note}</p>

      <h3>{labels.listTitle}</h3>
      {!companies || companies.length === 0 ? (
        <p>{labels.empty}</p>
      ) : (
        <ul className="account-checklist">
          {companies.map((c) => (
            <li key={c.id} className="account-checklist-item">
              <div>
                <h3>{c.companyName}</h3>
                <p>
                  {c.legalForm} - {c.registrationNumber} - {c.country} - {fmt(c.createdAt)}
                </p>
              </div>
              <span className={`status-chip status-${c.status === 'rejected' ? 'ended' : 'pending'}`}>{labels.status[c.status]}</span>
            </li>
          ))}
        </ul>
      )}

      <h3>{labels.formTitle}</h3>
      {done ? <p role="status">{labels.submitted}</p> : null}
      <form onSubmit={submit} onInvalidCapture={markInvalid}>
        <label>
          {labels.fields.companyName}
          <input {...fieldProps('companyName')} />
        </label>
        {fieldMessage('companyName')}
        <label>
          {labels.fields.legalForm}
          <input {...fieldProps('legalForm')} />
        </label>
        {fieldMessage('legalForm')}
        <label>
          {labels.fields.registrationNumber}
          <input {...fieldProps('registrationNumber')} />
        </label>
        {fieldMessage('registrationNumber')}
        <label>
          {labels.fields.country}
          <input {...fieldProps('country')} />
        </label>
        {fieldMessage('country')}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? labels.submitting : labels.submit}
        </button>
      </form>
      {error ? (
        <p role="alert" className="community-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
