import { tpl } from '../format';
// Operator dashboard (demo admin surface): issuer application triage, comment
// moderation, ticket closure and campaign news posting for wallets on the
// server-side OPERATOR_WALLETS allow-list. The allow-list is enforced on every
// request server-side; the isOperator flag from /api/auth/me only reveals this
// section in the UI. News posts always carry the platform-demo author label -
// there is no verified issuer identity, so the form copy bans approval,
// listing or return claims.
//
// CONTRACT DELTAS this component needs (backend owns both files):
// - community/api.ts: fetchMe must return { account, isOperator?: boolean }
//   (the server already sends isOperator on GET /api/auth/me).
// - community/CommunityAuth.tsx: carry isOperator from fetchMe/verifyChallenge
//   into context and expose it alongside account/token.
import { useCallback, useEffect, useState } from 'react';
import { formatTokenAmount } from '../funding-math';
import {
  closeOperatorTicket,
  fetchOperatorApplications,
  fetchOperatorAuditLog,
  fetchOperatorComments,
  fetchOperatorReconciliation,
  fetchOperatorTickets,
  type AuditEntry,
  type ReconciliationResponse,
  postOperatorNews,
  setOperatorApplicationStatus,
  setOperatorCommentHidden,
} from '../community/api';
import type { IssuerApplication, OperatorComment, Ticket } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';
import { routeHash } from '../router';

type Props = {
  // Campaign registry subset for the news form selector (id + display name).
  campaigns: { id: string; name: string }[];
};

type Tab = 'applications' | 'comments' | 'tickets' | 'news' | 'reconciliation' | 'audit';

export default function OperatorSection({ campaigns }: Props) {
  const { m, locale } = useI18n();
  const { account, token, isOperator } = useCommunityAuth();
  const labels = m.community.operator;

  const [tab, setTab] = useState<Tab>('applications');
  const [applications, setApplications] = useState<IssuerApplication[] | null>(null);
  const [comments, setComments] = useState<OperatorComment[] | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationResponse | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [newsCampaign, setNewsCampaign] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');

  const load = useCallback(() => {
    if (!account || !isOperator) return;
    setError('');
    // Independent fetches: one failing endpoint must not blank the others.
    const guard = <T,>(p: Promise<T>, apply: (v: T) => void) => p.then(apply).catch((e) => setError(e instanceof Error ? e.message : String(e)));
    void Promise.all([
      guard(fetchOperatorApplications(token), (v) => setApplications(v.applications)),
      guard(fetchOperatorComments(token), (v) => setComments(v.comments)),
      guard(fetchOperatorTickets(token), (v) => setTickets(v.tickets)),
      guard(fetchOperatorReconciliation(token), setReconciliation),
      guard(fetchOperatorAuditLog(token), (v) => setAudit(v.audit)),
    ]);
  }, [account, isOperator, token]);

  useEffect(load, [load]);

  if (!account || !isOperator) return null;

  const fmt = (ts: number) => new Date(ts).toLocaleString(locale);

  const run = (action: Promise<unknown>, ok: string) => {
    setBusy(true);
    setNotice('');
    setError('');
    action
      .then(() => {
        setNotice(ok);
        load();
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setBusy(false));
  };

  const setStatus = (id: string, status: string) => run(setOperatorApplicationStatus(token, id, status), labels.statusUpdated);

  const submitHide = (id: string) => {
    run(setOperatorCommentHidden(token, id, true, reason.trim() || undefined), labels.statusUpdated);
    setReasonFor(null);
    setReason('');
  };

  const submitNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsCampaign || !newsTitle.trim() || !newsBody.trim()) {
      setError(labels.newsValidation);
      return;
    }
    run(postOperatorNews(token, newsCampaign, newsTitle.trim(), newsBody.trim()), labels.newsPosted);
    setNewsTitle('');
    setNewsBody('');
  };

  const tabBtn = (id: Tab) => (
    <button key={id} className={`chip ${tab === id ? 'chip-active' : ''}`} onClick={() => setTab(id)} aria-pressed={tab === id}>
      {labels.tabs[id]}
    </button>
  );

  return (
    <section className="community-section" aria-labelledby="operator-title">
      <h2 id="operator-title" className="section-title">
        {labels.title} <span className="demo-badge">{m.community.demoBadge}</span>
      </h2>
      <p className="community-note">{labels.demoNote}</p>
      <div className="filter-chips" role="group" aria-label={labels.title}>
        {(['applications', 'comments', 'tickets', 'news', 'reconciliation', 'audit'] as Tab[]).map(tabBtn)}
      </div>
      {error && (
        <p role="alert" className="community-error">
          {error}{' '}
          <button className="btn" onClick={load}>
            {labels.retry}
          </button>
        </p>
      )}
      {notice && <p className="community-note">{notice}</p>}

      {tab === 'applications' && (
        <>
          {!applications ? (
            <p className="community-loading">{m.community.loading}</p>
          ) : applications.length === 0 ? (
            <p className="community-note">{labels.applicationsEmpty}</p>
          ) : (
            <table className="operator-table">
              <thead>
                <tr>
                  <th>{labels.colProject}</th>
                  <th>{labels.colCountry}</th>
                  <th>{labels.colInstrument}</th>
                  <th>{labels.colTarget}</th>
                  <th>{labels.colSubmitted}</th>
                  <th>{labels.colStatus}</th>
                  <th>{labels.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>{a.projectName}</td>
                    <td>{a.country}</td>
                    <td>{a.instrumentType}</td>
                    <td>{a.targetAmount}</td>
                    <td className="cell-nowrap">{fmt(a.createdAt)}</td>
                    <td>
                      <span className={`status-chip status-${a.status === 'closed' ? 'ended' : 'pending'}`}>{m.community.applicationStatus[a.status]}</span>
                    </td>
                    <td>
                      {a.status === 'received' && (
                        <button className="btn" disabled={busy} onClick={() => setStatus(a.id, 'under_review')}>
                          {labels.markUnderReview}
                        </button>
                      )}
                      {a.status !== 'closed' && (
                        <button className="btn" disabled={busy} onClick={() => setStatus(a.id, 'closed')}>
                          {labels.closeApplication}
                        </button>
                      )}
                      {a.status === 'closed' && (
                        <button className="btn" disabled={busy} onClick={() => setStatus(a.id, 'received')}>
                          {labels.reopenApplication}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'comments' && (
        <>
          {!comments ? (
            <p className="community-loading">{m.community.loading}</p>
          ) : comments.length === 0 ? (
            <p className="community-note">{labels.commentsEmpty}</p>
          ) : (
            <table className="operator-table">
              <thead>
                <tr>
                  <th>{labels.colCampaign}</th>
                  <th>{labels.colAuthor}</th>
                  <th>{labels.colComment}</th>
                  <th>{labels.colPosted}</th>
                  <th>{labels.colState}</th>
                  <th>{labels.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <a href={routeHash({ name: 'campaign', campaignId: c.campaignId })}>{c.campaignId}</a>
                    </td>
                    <td>{c.displayName ?? `${c.publicKey.slice(0, 6)}…${c.publicKey.slice(-4)}`}</td>
                    <td>{c.body}</td>
                    <td className="cell-nowrap">{fmt(c.createdAt)}</td>
                    <td>{c.hiddenAt !== null ? labels.stateHidden : labels.stateVisible}</td>
                    <td>
                      {c.hiddenAt !== null ? (
                        <button className="btn" disabled={busy} onClick={() => run(setOperatorCommentHidden(token, c.id, false), labels.statusUpdated)}>
                          {labels.unhide}
                        </button>
                      ) : reasonFor === c.id ? (
                        <span className="operator-reason">
                          <label>
                            {labels.hideReasonLabel}
                            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={labels.hideReasonPlaceholder} maxLength={200} />
                          </label>
                          <button className="btn btn-primary" disabled={busy} onClick={() => submitHide(c.id)}>
                            {labels.confirmHide}
                          </button>
                          <button
                            className="btn"
                            disabled={busy}
                            onClick={() => {
                              setReasonFor(null);
                              setReason('');
                            }}
                          >
                            {labels.cancel}
                          </button>
                        </span>
                      ) : (
                        <button className="btn" disabled={busy} onClick={() => setReasonFor(c.id)}>
                          {labels.hide}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'tickets' && (
        <>
          {!tickets ? (
            <p className="community-loading">{m.community.loading}</p>
          ) : tickets.length === 0 ? (
            <p className="community-note">{labels.ticketsEmpty}</p>
          ) : (
            <table className="operator-table">
              <thead>
                <tr>
                  <th>{labels.colKind}</th>
                  <th>{labels.colSubject}</th>
                  <th>{labels.colMessage}</th>
                  <th>{labels.colOpened}</th>
                  <th>{labels.colStatus}</th>
                  <th>{labels.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>{m.community.ticketKinds[t.kind]}</td>
                    <td>{t.subject}</td>
                    <td>{t.body}</td>
                    <td className="cell-nowrap">{fmt(t.createdAt)}</td>
                    <td>
                      <span className={`status-chip status-${t.status === 'closed' ? 'ended' : 'pending'}`}>{m.community.ticketStatus[t.status]}</span>
                    </td>
                    <td>
                      {t.status === 'open' && (
                        <button className="btn" disabled={busy} onClick={() => run(closeOperatorTicket(token, t.id), labels.statusUpdated)}>
                          {labels.closeTicket}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="community-note">{labels.closedNote}</p>
        </>
      )}

      {tab === 'news' && (
        <form onSubmit={submitNews}>
          <h3>{labels.newsFormTitle}</h3>
          <label>
            {labels.newsCampaignLabel}
            <select value={newsCampaign} onChange={(e) => setNewsCampaign(e.target.value)} required>
              <option value="">-</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {labels.newsTitleLabel}
            <input value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} maxLength={200} required />
          </label>
          <label>
            {labels.newsBodyLabel}
            <textarea value={newsBody} onChange={(e) => setNewsBody(e.target.value)} maxLength={4000} required />
          </label>
          <p className="community-note">{m.community.newsAuthorDemo}</p>
          <button className="btn btn-primary" disabled={busy || !newsCampaign || !newsTitle.trim() || !newsBody.trim()}>
            {labels.newsSubmit}
          </button>
        </form>
      )}
      {tab === 'reconciliation' && (
        <>
          <p className="community-note">{labels.reconNote}</p>
          {!reconciliation ? (
            <p className="community-loading">{m.community.loading}</p>
          ) : reconciliation.campaigns.length === 0 ? (
            <p className="community-note">{labels.reconEmpty}</p>
          ) : (
            <>
              <table className="operator-table">
                <thead>
                  <tr>
                    <th>{labels.colCampaign}</th>
                    <th>{labels.colOnChain}</th>
                    <th>{labels.colJournalCovered}</th>
                    <th>{labels.colNotCovered}</th>
                    <th>{labels.colSucceeded}</th>
                    <th>{labels.colOpenIntents}</th>
                    <th>{labels.colNotes}</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliation.campaigns.map((c) => (
                    <tr key={c.campaignId}>
                      <td>{c.campaignId}</td>
                      <td className="cell-nowrap">{formatTokenAmount(c.onChainRaised) ?? '\u2014'}</td>
                      <td className="cell-nowrap">{formatTokenAmount(c.journalCovered) ?? '\u2014'}</td>
                      <td className="cell-nowrap">{formatTokenAmount(c.notJournalCovered) ?? '\u2014'}</td>
                      <td>
                        {c.successContributes}/{c.successRefunds}/{c.successWithdraws}
                      </td>
                      <td>{c.openIntentHashes.length}</td>
                      <td>{c.notes.join(' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reconciliation.quarantinedIntents > 0 && (
                <p className="community-error">{tpl(labels.reconQuarantined, { n: reconciliation.quarantinedIntents })}</p>
              )}
              <p className="community-note">
                {labels.colGenerated}: {new Date(reconciliation.generatedAt).toLocaleString(locale)} ({reconciliation.network})
              </p>
            </>
          )}
        </>
      )}

      {tab === 'audit' && (
        <>
          <p className="community-note">{labels.auditNote}</p>
          {!audit ? (
            <p className="community-loading">{m.community.loading}</p>
          ) : audit.length === 0 ? (
            <p className="community-note">{labels.auditEmpty}</p>
          ) : (
            <table className="operator-table">
              <thead>
                <tr>
                  <th>{labels.colTime}</th>
                  <th>{labels.colGate}</th>
                  <th>{labels.colAction}</th>
                  <th>{labels.colTargetRef}</th>
                  <th>{labels.colDetail}</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((e) => (
                  <tr key={e.id}>
                    <td className="cell-nowrap">{fmt(e.at)}</td>
                    <td>{e.actor}</td>
                    <td>{e.action}</td>
                    <td>{e.target}</td>
                    <td>{e.detail ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
