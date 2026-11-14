// Support and feedback tickets: a signed-in user files a ticket (kind
// 'support' or 'feedback') and sees their own ticket list with status.
// Tickets are private to the filing account; there is no public listing.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Ticket } from '../community/api';
import { COMMUNITY_LIMITS, createTicket, fetchMyTickets } from '../community/api';
import { notifyCommunityActivityChanged } from '../community/events';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

export default function SupportCenter() {
  const { account, token } = useCommunityAuth();
  // Clear private records and drafts before rendering another actor/session.
  return <SupportSession key={JSON.stringify([account?.publicKey ?? null, token])} />;
}

function SupportSession() {
  const { m, locale } = useI18n();
  const { account, token } = useCommunityAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [kind, setKind] = useState<'support' | 'feedback'>('support');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const live = useRef(false);
  const readSequence = useRef(0);
  const writeSequence = useRef(0);
  const confirmedCreates = useRef(new Map<string, { ticket: Ticket; sequence: number }>());
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const reload = useCallback(() => {
    if (!account || !token) return;
    const read = ++readSequence.current;
    const writesAtStart = writeSequence.current;
    fetchMyTickets(token)
      .then(({ tickets }) => {
        if (!live.current || read !== readSequence.current) return;
        // A GET snapshot can predate a POST that finished while it was pending.
        // Only merge those later creates. A subsequent GET remains authoritative
        // for status changes and removals after all earlier writes completed.
        const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));
        for (const [id, { ticket, sequence }] of confirmedCreates.current) {
          if (sequence <= writesAtStart) confirmedCreates.current.delete(id);
          else if (!byId.has(ticket.id)) byId.set(ticket.id, ticket);
        }
        setTickets([...byId.values()]);
      })
      .catch((e) => live.current && read === readSequence.current && setError(e instanceof Error ? e.message : String(e)));
  }, [account, token]);

  useEffect(reload, [reload]);

  if (!account) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!account || !token) return;
    setBusy(true);
    setError('');
    try {
      const { ticket } = await createTicket(token, { kind, subject: subject.trim(), body: body.trim() });
      if (!live.current) return;
      notifyCommunityActivityChanged();
      confirmedCreates.current.set(ticket.id, { ticket, sequence: ++writeSequence.current });
      setTickets((prev) => [ticket, ...(prev ?? []).filter((existing) => existing.id !== ticket.id)]);
      setSubject('');
      setBody('');
    } catch (e) {
      if (live.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (live.current) setBusy(false);
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
