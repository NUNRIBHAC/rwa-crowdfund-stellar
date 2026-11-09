// Investor-issuer private thread (backend community-routes.ts on
// feat/investor-issuer-messaging, b3a79ee): one thread per investor per
// campaign with the platform operator. Entitlement is enforced server-side
// on read AND write (fail-closed 503 when the on-chain check is unavailable,
// 403 investor_only without a position, 404 for unknown campaigns); the UI
// renders the server's localized error codes instead of pre-gating itself.
// Replies are labeled "platform operator" - no verified issuer identity
// exists in this prototype. No edit/delete UI: the backend has no such
// endpoints. Operators use the operator dashboard messaging tab instead, so
// this panel renders nothing for them (a GET here would return every thread
// of the campaign, not an own thread).
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { COMMUNITY_LIMITS, fetchIssuerMessages, postIssuerMessage } from '../community/api';
import type { IssuerMessage } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

export default function IssuerMessages({ campaignId }: { campaignId: string }) {
  const { m, locale } = useI18n();
  const { account, token, isOperator } = useCommunityAuth();
  const [messages, setMessages] = useState<IssuerMessage[] | null>(null);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMessages(null);
    setError('');
    if (!token || isOperator) return;
    let live = true;
    fetchIssuerMessages(token, campaignId)
      .then(({ messages }) => live && setMessages(messages))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [token, isOperator, campaignId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const message = await postIssuerMessage(token, campaignId, body.trim());
      setMessages((prev) => [...(prev ?? []), message]);
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (isOperator) return null;

  return (
    <section className="community-section messaging-panel" aria-labelledby="issuer-messages">
      <h2 id="issuer-messages">{m.messaging.title}</h2>
      <p className="community-note">{m.messaging.operatorNote}</p>
      {!account ? (
        <p className="community-note">{m.messaging.signInHint}</p>
      ) : (
        <>
          {error && (
            <p role="alert" className="community-error">
              {error}
            </p>
          )}
          {messages === null && !error ? (
            <p className="community-loading">{m.community.loading}</p>
          ) : messages !== null && messages.length === 0 ? (
            <p className="community-note">{m.messaging.empty}</p>
          ) : messages !== null ? (
            <ul className="message-list">
              {messages.map((msg) => (
                <li key={msg.id} className={`message ${msg.authorRole === 'investor' ? 'outgoing' : 'incoming'}`}>
                  <p className="message-meta">
                    <strong>{msg.authorRole === 'operator' ? m.messaging.operatorLabel : m.messaging.you}</strong> -{' '}
                    {new Date(msg.createdAt).toLocaleString(locale)}
                  </p>
                  <p dir="auto" className="message-body">
                    {msg.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          {messages !== null && (
            <form onSubmit={submit}>
              <label>
                {m.messaging.composerLabel}
                <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={COMMUNITY_LIMITS.ticketBody} rows={3} required />
              </label>
              <button className="btn btn-primary" disabled={busy || !body.trim()}>
                {busy ? m.messaging.sending : m.messaging.send}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
