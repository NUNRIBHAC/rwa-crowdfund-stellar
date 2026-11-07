import { tpl } from '../format';
import ApplicationDocuments from './ApplicationDocuments';
// Operator dashboard (demo admin surface): issuer application triage, comment
// moderation, ticket closure, campaign news and podcast episode publishing
// for wallets on the server-side OPERATOR_WALLETS allow-list. The allow-list is enforced on every
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
import { useCallback, useEffect, useRef, useState } from 'react';
import OperatorIssuerMessages from './OperatorIssuerMessages';
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
  postOperatorEpisode,
  postOperatorNews,
  postOperatorReport,
  setOperatorApplicationStatus,
  setOperatorCommentHidden,
} from '../community/api';
import type { IssuerApplication, OperatorComment, Ticket } from '../community/api';
import CorporateActionsPanel from './CorporateActionsPanel';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';
import { routeHash } from '../router';

type Props = {
  // Campaign registry subset for the news form selector (id + display name).
  campaigns: { id: string; name: string }[];
  campaignsLoading?: boolean;
  campaignsUnavailable?: boolean;
};

type Tab = 'applications' | 'comments' | 'tickets' | 'messages' | 'news' | 'reports' | 'podcast' | 'reconciliation' | 'corporate' | 'audit';

export default function OperatorSection({ campaigns, campaignsLoading = false, campaignsUnavailable = false }: Props) {
  const { m, locale } = useI18n();
  const { account, token, isOperator } = useCommunityAuth();
  const labels = m.community.operator;
  const campaignExists = (id: string) => campaigns.some((campaign) => campaign.id === id);
  const campaignReadsBlocked = campaignsLoading || campaignsUnavailable;
  const campaignReadStatus = campaignReadsBlocked ? (
    <p role="status" className={campaignsUnavailable ? 'community-error' : 'community-loading'}>
      {campaignsUnavailable ? m.errors.apiUnavailable : m.community.loading}
    </p>
  ) : campaigns.length === 0 ? (
    <p role="status" className="community-note">
      {labels.corp.empty}
    </p>
  ) : null;

  const [tab, setTab] = useState<Tab>('applications');
  const activeTab = useRef<Tab>('applications');
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
  const [repCampaign, setRepCampaign] = useState('');
  const [repKind, setRepKind] = useState<'funding_outcome' | 'use_of_proceeds' | 'milestone' | 'other'>('funding_outcome');
  const [repTitle, setRepTitle] = useState('');
  const [repBody, setRepBody] = useState('');
  const [epTitle, setEpTitle] = useState('');
  const [epDescription, setEpDescription] = useState('');
  const [epAudio, setEpAudio] = useState('');
  const [epCampaign, setEpCampaign] = useState('');

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
    const actionTab = activeTab.current;
    setBusy(true);
    setNotice('');
    setError('');
    action
      .then(() => {
        if (activeTab.current === actionTab) setNotice(ok);
        load();
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setBusy(false));
  };

  const setStatus = (id: string, status: string, note?: string) => run(setOperatorApplicationStatus(token, id, status, note), labels.statusUpdated);

  const submitHide = (id: string) => {
    run(setOperatorCommentHidden(token, id, true, reason.trim() || undefined), labels.statusUpdated);
    setReasonFor(null);
    setReason('');
  };

  const submitNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (campaignReadsBlocked) return;
    if (!campaignExists(newsCampaign) || !newsTitle.trim() || !newsBody.trim()) {
      setError(labels.newsValidation);
      return;
    }
    run(postOperatorNews(token, newsCampaign, newsTitle.trim(), newsBody.trim()), labels.newsPosted);
    setNewsTitle('');
    setNewsBody('');
  };

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (campaignReadsBlocked) return;
    if (!campaignExists(repCampaign) || !repTitle.trim() || !repBody.trim()) {
      setError(labels.repValidation);
      return;
    }
    // The server refuses unless the campaign's on-chain deadline has passed
    // (and, for use_of_proceeds, the withdrawal is recorded); a 409/503 from
    // the gate is surfaced verbatim via the error state.
    run(postOperatorReport(token, repCampaign, repKind, repTitle.trim(), repBody.trim()), labels.repPosted);
    setRepTitle('');
    setRepBody('');
  };

  const submitEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (epCampaign && (campaignReadsBlocked || !campaignExists(epCampaign))) return;
    if (!epTitle.trim() || !epDescription.trim() || !epAudio.trim().startsWith('https://')) {
      setError(labels.epValidation);
      return;
    }
    run(
      postOperatorEpisode(token, {
        title: epTitle.trim(),
        description: epDescription.trim(),
        audioUrl: epAudio.trim(),
        campaignId: epCampaign || null,
      }),
      labels.epPosted,
    );
    setEpTitle('');
    setEpDescription('');
    setEpAudio('');
    setEpCampaign('');
  };

  const tabBtn = (id: Tab) => (
    <button
      key={id}
      className={`chip ${tab === id ? 'chip-active' : ''}`}
      onClick={() => {
        activeTab.current = id;
        setNotice('');
        setTab(id);
      }}
      aria-pressed={tab === id}
    >
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
        {(['applications', 'comments', 'tickets', 'messages', 'news', 'reports', 'podcast', 'reconciliation', 'corporate', 'audit'] as Tab[]).map(tabBtn)}
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

      {tab === 'messages' && <OperatorIssuerMessages campaigns={campaigns} />}
      {tab === 'applications' && (
        <>
          {!applications ? (
            <p className="community-loading">{m.community.loading}</p>
          ) : applications.length === 0 ? (
            <p className="community-note">{labels.applicationsEmpty}</p>
          ) : (
            <div className="table-scroll">
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
                      <td>
                        {a.projectName}
                        <ApplicationDocuments application={a} operator campaigns={campaigns} onChange={load} />
                      </td>
                      <td>{a.country}</td>
                      <td>{a.instrumentType}</td>
                      <td>{a.targetAmount}</td>
                      <td className="cell-nowrap">{fmt(a.createdAt)}</td>
                      <td>
                        <span
                          className={`status-chip status-${a.status === 'approved' ? 'paid' : a.status === 'closed' || a.status === 'rejected' ? 'ended' : 'pending'}`}
                        >
                          {m.community.applicationStatus[a.status]}
                        </span>
                      </td>
                      <td>
                        {a.status === 'received' && (
                          <button className="btn" disabled={busy} onClick={() => setStatus(a.id, 'under_review')}>
                            {labels.markUnderReview}
                          </button>
                        )}
                        {(a.status === 'received' || a.status === 'under_review') && (
                          <>
                            <button className="btn" disabled={busy} onClick={() => setStatus(a.id, 'approved')}>
                              {labels.approveApplication}
                            </button>
                            <button
                              className="btn"
                              disabled={busy}
                              onClick={() => {
                                const note = window.prompt(labels.rejectNotePrompt);
                                if (note) setStatus(a.id, 'rejected', note);
                              }}
                            >
                              {labels.rejectApplication}
                            </button>
                          </>
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
            </div>
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
            <div className="table-scroll">
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
            </div>
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
            <div className="table-scroll">
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
            </div>
          )}
          <p className="community-note">{labels.closedNote}</p>
        </>
      )}

      {tab === 'news' && (
        <form onSubmit={submitNews}>
          <h3>{labels.newsFormTitle}</h3>
          {campaignReadStatus}
          <label>
            {labels.newsCampaignLabel}
            <select disabled={campaignReadsBlocked} value={newsCampaign} onChange={(e) => setNewsCampaign(e.target.value)} required>
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
          <button className="btn btn-primary" disabled={busy || campaignReadsBlocked || !campaignExists(newsCampaign) || !newsTitle.trim() || !newsBody.trim()}>
            {labels.newsSubmit}
          </button>
        </form>
      )}
      {tab === 'reports' && (
        <form onSubmit={submitReport}>
          <h3>{labels.repFormTitle}</h3>
          <p className="community-note">{labels.repGateNote}</p>
          {campaignReadStatus}
          <label>
            {labels.newsCampaignLabel}
            <select disabled={campaignReadsBlocked} value={repCampaign} onChange={(e) => setRepCampaign(e.target.value)} required>
              <option value="">-</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {labels.repKindLabel}
            <select value={repKind} onChange={(e) => setRepKind(e.target.value as typeof repKind)} required>
              {(['funding_outcome', 'use_of_proceeds', 'milestone', 'other'] as const).map((k) => (
                <option key={k} value={k}>
                  {m.community.reportKinds[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {labels.newsTitleLabel}
            <input value={repTitle} onChange={(e) => setRepTitle(e.target.value)} maxLength={160} required />
          </label>
          <label>
            {labels.newsBodyLabel}
            <textarea value={repBody} onChange={(e) => setRepBody(e.target.value)} maxLength={4000} required />
          </label>
          <p className="community-note">{m.community.newsAuthorDemo}</p>
          <button className="btn btn-primary" disabled={busy || campaignReadsBlocked || !campaignExists(repCampaign) || !repTitle.trim() || !repBody.trim()}>
            {labels.repSubmit}
          </button>
        </form>
      )}
      {tab === 'podcast' && (
        <form onSubmit={submitEpisode}>
          <h3>{labels.epFormTitle}</h3>
          {campaignReadStatus}
          <label>
            {labels.epTitleLabel}
            <input value={epTitle} onChange={(e) => setEpTitle(e.target.value)} maxLength={200} required />
          </label>
          <label>
            {labels.epDescriptionLabel}
            <textarea value={epDescription} onChange={(e) => setEpDescription(e.target.value)} maxLength={4000} required />
          </label>
          <label>
            {labels.epAudioLabel}
            <input type="url" value={epAudio} onChange={(e) => setEpAudio(e.target.value)} maxLength={2000} required />
          </label>
          <label>
            {labels.epCampaignLabel}
            <select disabled={campaignReadsBlocked} value={epCampaign} onChange={(e) => setEpCampaign(e.target.value)}>
              <option value="">{labels.epPlatformOption}</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="community-note">{labels.epNote}</p>
          <button
            className="btn btn-primary"
            disabled={
              busy || (!!epCampaign && (campaignReadsBlocked || !campaignExists(epCampaign))) || !epTitle.trim() || !epDescription.trim() || !epAudio.trim()
            }
          >
            {labels.epSubmit}
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
              <div className="table-scroll">
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
                        <td className="reconciliation-notes">
                          {c.noteCodes
                            ? c.noteCodes
                                .map((code, i) => {
                                  const text = labels.reconNotes[code as keyof typeof labels.reconNotes];
                                  return text ? tpl(text, c.noteParams?.[i] ?? {}) : (c.notes[i] ?? labels.reconNote);
                                })
                                .join(' ')
                            : c.notes.join(' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {tab === 'corporate' &&
        (campaignsUnavailable ? (
          <p role="status" className="community-error">
            {m.errors.apiUnavailable}
          </p>
        ) : campaignsLoading ? (
          <p role="status" className="community-loading">
            {m.community.loading}
          </p>
        ) : (
          <CorporateActionsPanel token={token} campaigns={campaigns} />
        ))}

      {tab === 'audit' && (
        <>
          <p className="community-note">{labels.auditNote}</p>
          {!audit ? (
            <p className="community-loading">{m.community.loading}</p>
          ) : audit.length === 0 ? (
            <p className="community-note">{labels.auditEmpty}</p>
          ) : (
            <div className="table-scroll">
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
            </div>
          )}
        </>
      )}
    </section>
  );
}
