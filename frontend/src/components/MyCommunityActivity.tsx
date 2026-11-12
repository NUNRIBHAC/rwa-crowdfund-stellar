// Owner-scoped community activity for the account dashboard: the signed-in
// wallet's own issuer applications, support/feedback tickets and comments,
// fetched from the community backend. Empty states are honest - nothing is
// invented for wallets with no activity.
import { useEffect, useState } from 'react';
import { fetchMyApplications, fetchMyComments, fetchMyTickets } from '../community/api';
import type { IssuerApplication, OwnComment, Ticket } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { COMMUNITY_ACTIVITY_CHANGED } from '../community/events';
import { useI18n } from '../i18n';
import { routeHash } from '../router';
import ApplicationDocuments from './ApplicationDocuments';

export default function MyCommunityActivity() {
  const { account, token } = useCommunityAuth();
  return <ScopedCommunityActivity key={`${account?.publicKey ?? ''}:${token}`} />;
}
function ScopedCommunityActivity() {
  const { m, locale } = useI18n();
  const { account, token } = useCommunityAuth();
  const [applications, setApplications] = useState<IssuerApplication[] | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [comments, setComments] = useState<OwnComment[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!account) {
      setApplications(null);
      setTickets(null);
      setComments(null);
      return;
    }
    let stale = false;
    setError('');
    // Independent fetches: one failing endpoint must not blank the others.
    const load = () => {
      const guard = <T,>(p: Promise<T>, apply: (v: T) => void) =>
        p
          .then((v) => {
            if (!stale) apply(v);
          })
          .catch((e) => {
            if (!stale) setError(e instanceof Error ? e.message : String(e));
          });
      void Promise.all([
        guard(fetchMyApplications(token), (v) => setApplications(v.applications)),
        guard(fetchMyTickets(token), (v) => setTickets(v.tickets)),
        guard(fetchMyComments(token), (v) => setComments(v.comments)),
      ]);
    };
    load();
    // Submit forms announce successful writes so these lists refresh live.
    window.addEventListener(COMMUNITY_ACTIVITY_CHANGED, load);
    return () => {
      stale = true;
      window.removeEventListener(COMMUNITY_ACTIVITY_CHANGED, load);
    };
  }, [account, token]);

  if (!account) return null;
  const fmt = (ts: number) => new Date(ts).toLocaleString(locale);

  return (
    <>
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
      <section aria-label={m.community.myApplicationsTitle}>
        <h2 className="section-title">{m.community.myApplicationsTitle}</h2>
        {!applications || applications.length === 0 ? (
          <p className="community-note">{m.community.myApplicationsEmpty}</p>
        ) : (
          <ul className="portfolio-list">
            {applications.map((a) => (
              <li key={a.id} className="portfolio-row application-row">
                <span>{a.projectName}</span>
                <span className="doc-note">{fmt(a.createdAt)}</span>
                <span
                  className={`status-chip status-${a.status === 'approved' ? 'paid' : a.status === 'closed' || a.status === 'rejected' ? 'ended' : 'pending'}`}
                >
                  {m.community.applicationStatus[a.status]}
                </span>
                <ApplicationDocuments application={a} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label={m.community.myTicketsTitle}>
        <h2 className="section-title">{m.community.myTicketsTitle}</h2>
        {!tickets || tickets.length === 0 ? (
          <p className="community-note">{m.community.ticketsEmpty}</p>
        ) : (
          <ul className="portfolio-list">
            {tickets.map((t) => (
              <li key={t.id} className="portfolio-row">
                <span>{t.subject}</span>
                <span className="doc-note">{fmt(t.createdAt)}</span>
                <span className={`status-chip status-${t.status === 'closed' ? 'ended' : 'pending'}`}>{m.community.ticketStatus[t.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label={m.community.myCommentsTitle}>
        <h2 className="section-title">{m.community.myCommentsTitle}</h2>
        {!comments || comments.length === 0 ? (
          <p className="community-note">{m.community.commentsEmpty}</p>
        ) : (
          <ul className="portfolio-list">
            {comments.map((c) => (
              <li key={c.id} className="portfolio-row">
                <a href={routeHash({ name: 'campaign', campaignId: c.campaignId })}>{c.campaignId}</a>
                <span className="doc-note">
                  {fmt(c.createdAt)}
                  {c.hidden ? ` - ${m.community.commentHidden}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
