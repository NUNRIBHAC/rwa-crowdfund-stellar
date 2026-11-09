// Operator view of investor-issuer threads (backend feat/investor-issuer-
// messaging, b3a79ee): the same GET returns every thread of the campaign as
// one flat list, so threads are grouped client-side by investorKey. Replies
// go through the operator route naming the thread; a reply into a thread
// that no longer exists is a server 404 shown as-is. Operator authorship is
// labeled operator - never a verified issuer identity.
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { COMMUNITY_LIMITS, fetchIssuerMessages, replyIssuerMessage } from '../community/api';
import type { IssuerMessage } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';
import { shorten, tpl } from '../format';

type Thread = { investorKey: string; messages: IssuerMessage[]; lastActivityAt: number };

export default function OperatorIssuerMessages({ campaigns }: { campaigns: { id: string; name: string }[] }) {
  const { m, locale } = useI18n();
  const { token } = useCommunityAuth();
  const [campaignId, setCampaignId] = useState('');
  const [messages, setMessages] = useState<IssuerMessage[] | null>(null);
  const [investorKey, setInvestorKey] = useState('');
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const threads = useMemo<Thread[]>(() => {
    const byKey = new Map<string, IssuerMessage[]>();
    for (const msg of messages ?? []) {
      const list = byKey.get(msg.investorKey) ?? [];
      list.push(msg);
      byKey.set(msg.investorKey, list);
    }
    return [...byKey.entries()]
      .map(([key, list]) => ({ investorKey: key, messages: list, lastActivityAt: Math.max(...list.map((x) => x.createdAt)) }))
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }, [messages]);

  useEffect(() => {
    setMessages(null);
    setInvestorKey('');
    setError('');
    if (!token || !campaignId) return;
    let live = true;
    fetchIssuerMessages(token, campaignId)
      .then(({ messages }) => live && setMessages(messages))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [token, campaignId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token || !investorKey) return;
    setBusy(true);
    setError('');
    try {
      const message = await replyIssuerMessage(token, campaignId, investorKey, body.trim());
      setMessages((prev) => [...(prev ?? []), message]);
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const active = threads.find((t) => t.investorKey === investorKey);

  if (campaigns.length === 0) return <p className="community-note">{m.messaging.noCampaigns}</p>;

  return (
    <div className="messaging-panel">
      <p className="community-note">{m.messaging.operatorNote}</p>
      <div className="messaging-filter">
        <label>
          {m.messaging.selectCampaign}
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">-</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
      {campaignId && messages === null && !error ? <p className="community-loading">{m.community.loading}</p> : null}
      {messages !== null && threads.length === 0 ? <p className="community-note">{m.messaging.noThreads}</p> : null}
      {threads.length > 0 && (
        <ul className="thread-list" aria-label={m.messaging.threadListLabel}>
          {threads.map((t) => {
            const last = t.messages[t.messages.length - 1];
            return (
              <li key={t.investorKey}>
                <button
                  type="button"
                  className="thread-item"
                  aria-current={t.investorKey === investorKey}
                  onClick={() => {
                    setInvestorKey(t.investorKey);
                    setBody('');
                    setError('');
                  }}
                >
                  <span className="thread-item-top">
                    <span>{tpl(m.messaging.threadWith, { key: shorten(t.investorKey, 6, 4) })}</span>
                    <span className="message-meta">{new Date(t.lastActivityAt).toLocaleString(locale)}</span>
                  </span>
                  <span className="thread-preview" dir="auto">
                    {last.body.length > 80 ? `${last.body.slice(0, 80)}…` : last.body}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {campaignId && threads.length > 0 && !active ? <p className="community-note">{m.messaging.selectThread}</p> : null}
      {active && (
        <>
          <ul className="message-list" aria-label={tpl(m.messaging.threadWith, { key: shorten(active.investorKey, 6, 4) })}>
            {active.messages.map((msg) => (
              <li key={msg.id} className={`message ${msg.authorRole === 'operator' ? 'outgoing' : 'incoming'}`}>
                <p className="message-meta">
                  <strong>
                    {msg.authorRole === 'operator' ? m.messaging.operatorLabel : tpl(m.messaging.threadWith, { key: shorten(msg.authorKey, 6, 4) })}
                  </strong>{' '}
                  - {new Date(msg.createdAt).toLocaleString(locale)}
                </p>
                <p dir="auto" className="message-body">
                  {msg.body}
                </p>
              </li>
            ))}
          </ul>
          <form onSubmit={submit}>
            <label>
              {m.messaging.replyLabel}
              <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={COMMUNITY_LIMITS.ticketBody} rows={3} required />
            </label>
            <button className="btn btn-primary" disabled={busy || !body.trim()}>
              {busy ? m.messaging.sending : m.messaging.reply}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
