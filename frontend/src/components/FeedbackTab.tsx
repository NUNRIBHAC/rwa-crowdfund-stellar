// Floating right-edge feedback tab (CONDA S-048/S-149 pattern), visible on
// every page. Opens a small panel that posts a support ticket with kind
// 'feedback' through the existing community API - no new backend needed.
// Signed-out visitors get a working route in: connect the wallet and sign
// the challenge without leaving the panel, then the form appears.
// Mount once at app root (below the header so the theme/nav z-order is kept).
import { useState } from 'react';
import { createTicket } from '../community/api';
import { notifyCommunityActivityChanged } from '../community/events';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

export default function FeedbackTab({ actor, onConnect }: { actor: string; onConnect: () => Promise<void> }) {
  const { m } = useI18n();
  const { account, token, signIn, busy: authBusy, error: authError } = useCommunityAuth();
  const labels = m.community;
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState('');

  const connect = () => {
    setConnectBusy(true);
    setConnectError('');
    onConnect()
      .catch((err) => setConnectError(err instanceof Error ? err.message : String(err)))
      .finally(() => setConnectBusy(false));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setBusy(true);
    setError('');
    createTicket(token, { kind: 'feedback', subject: subject.trim(), body: body.trim() })
      .then(() => {
        notifyCommunityActivityChanged();
        setDone(true);
        setSubject('');
        setBody('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setBusy(false));
  };

  return (
    <>
      <button className="feedback-tab" onClick={() => setOpen(true)} aria-haspopup="dialog">
        {labels.feedbackTabLabel}
      </button>
      {open && (
        <div className="feedback-panel" role="dialog" aria-label={labels.feedbackPanelTitle}>
          <h3>{labels.feedbackPanelTitle}</h3>
          <p className="community-note">{labels.feedbackPanelIntro}</p>
          {!account ? (
            <>
              <p className="community-note">{labels.feedbackSignInPrompt}</p>
              {connectError && (
                <p role="alert" className="community-error">
                  {connectError}
                </p>
              )}
              {authError && (
                <p role="alert" className="community-error">
                  {authError}
                </p>
              )}
              {!actor ? (
                <button className="btn btn-primary" disabled={connectBusy} onClick={connect}>
                  {m.header.connect}
                </button>
              ) : (
                <button className="btn btn-primary" disabled={authBusy} onClick={() => signIn(actor)}>
                  {labels.signInButton}
                </button>
              )}
            </>
          ) : done ? (
            <p className="community-note">{labels.feedbackSubmitted}</p>
          ) : (
            <form onSubmit={submit}>
              <label>
                {labels.ticketSubjectLabel}
                <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required />
              </label>
              <label>
                {labels.ticketBodyLabel}
                <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} required />
              </label>
              <p className="community-note">{labels.ticketsNote}</p>
              {error && (
                <p role="alert" className="community-error">
                  {error}
                </p>
              )}
              <button className="btn btn-primary" disabled={busy || !subject.trim() || !body.trim()}>
                {labels.ticketSubmit}
              </button>
            </form>
          )}
          <button
            className="btn"
            onClick={() => {
              // After a successful send, closing finishes it: the next open
              // starts with a fresh empty form. Fields were already cleared
              // on submit, so nothing old can be resent or leak back.
              if (done) {
                setDone(false);
                setError('');
              }
              setOpen(false);
            }}
          >
            {labels.feedbackClose}
          </button>
        </div>
      )}
    </>
  );
}
