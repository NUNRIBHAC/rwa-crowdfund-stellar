import React, { useState } from 'react';
import { communityApi, loadSession } from './client';

// Support and feedback tickets. Requires wallet sign-in; submissions are
// private to the sender and the admin desk, retained max 90 days.
export function SupportForm({ kind, labels }: { kind: 'support' | 'feedback'; labels?: Partial<typeof DEFAULT_LABELS> }) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await communityApi.createTicket(kind, subject.trim(), body.trim());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!loadSession()) return <p>{t.signInFirst}</p>;
  if (done) return <p role="status">{t.thanks}</p>;
  return (
    <form className="community-support" onSubmit={submit}>
      <label>
        {t.subject}
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} required />
      </label>
      <label>
        {t.message}
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} rows={5} required />
      </label>
      <button type="submit" disabled={busy}>
        {t.send}
      </button>
      <p>{t.retention}</p>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

const DEFAULT_LABELS = {
  subject: 'Subject',
  message: 'Message',
  send: 'Send',
  thanks: 'Sent. This demo desk is read by the project owner; replies are not automated.',
  signInFirst: 'Sign in with your wallet to contact support.',
  retention: 'Stored privately and deleted after 90 days. Demo platform - do not include sensitive personal data.',
};
