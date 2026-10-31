// Support and feedback tickets: a signed-in user files a ticket (kind
// 'support' or 'feedback') and sees their own ticket list with status.
// Tickets are private to the filing account; there is no public listing.
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Ticket } from '../community/api';
import { COMMUNITY_LIMITS, createTicket, fetchMyTickets } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

export default function SupportCenter() {
  const { m, locale } = useI18n();
  const { account, token } = useCommunityAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [kind, setKind] = useState<'support' | 'feedback'>('support');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    if (!token) return;
    fetchMyTickets(token)
      .then(({ tickets }) => setTickets(tickets))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [token]);

  useEffect(reload, [reload]);

  if (!account) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { ticket } = await createTicket(token, { kind, subject: subject.trim(), body: body.trim() });
      setTickets((prev) => [ticket, ...(prev ?? [])]);
      setSubject('');
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="community-section" aria-labelledby="support-center">
      <h2 id="support-center">{m.community.ticketsTitle}</h2>
      <p className="community-note">{m.community.ticketsNote}</p>
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
      <form onSubmit={submit} className="ticket-form">
        <label>
          {m.community.ticketKindLabel}
          <select value={kind} onChange={(e) => setKind(e.target.value as 'support' | 'feedback')}>
            <option value="support">{m.community.ticketKinds.support}</option>
            <option value="feedback">{m.community.ticketKinds.feedback}</option>
          </select>
        </label>
        <label>
          {m.community.ticketSubjectLabel}
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={COMMUNITY_LIMITS.ticketSubject} required />
        </label>
        <label>
          {m.community.ticketBodyLabel}
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={COMMUNITY_LIMITS.ticketBody} rows={4} required />
        </label>
        <button className="btn btn-primary" disabled={busy || !subject.trim() || !body.trim()}>
          {m.community.ticketSubmit}
        </button>
      </form>
      {tickets === null ? (
        <p className="community-loading">{m.community.loading}</p>
      ) : tickets.length === 0 ? (
        <p className="community-note">{m.community.ticketsEmpty}</p>
      ) : (
        <ul className="ticket-list">
          {tickets.map((t) => (
            <li key={t.id}>
              <span className={`status-chip ${t.status === 'closed' ? 'status-ended' : 'status-open'}`}>
                {t.status === 'closed' ? m.community.ticketStatus.closed : m.community.ticketStatus.open}
              </span>{' '}
              <strong>{t.subject}</strong> <span className="community-note">({m.community.ticketKinds[t.kind]})</span>
              <br />
              <span className="community-note">{new Date(t.createdAt).toLocaleString(locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
