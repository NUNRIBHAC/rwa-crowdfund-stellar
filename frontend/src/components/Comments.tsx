// Campaign comments: public read; posting requires a community session
// (wallet challenge sign-in). Commenters are identified by display name or a
// shortened public key - never by any personal data.
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { CommunityComment } from '../community/api';
import { COMMUNITY_LIMITS, fetchComments, postComment } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';
import { shorten } from '../format';

export default function Comments({ campaignId }: { campaignId: string }) {
  const { m, locale } = useI18n();
  const { account, token } = useCommunityAuth();
  const [comments, setComments] = useState<CommunityComment[] | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    fetchComments(campaignId)
      .then(({ comments }) => live && setComments(comments))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [campaignId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const { comment } = await postComment(token, campaignId, body.trim());
      setComments((prev) => [...(prev ?? []), comment]);
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="community-section" aria-labelledby="campaign-comments">
      <h2 id="campaign-comments">{m.community.commentsTitle}</h2>
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
      {comments === null ? (
        <p className="community-loading">{m.community.loading}</p>
      ) : comments.length === 0 ? (
        <p className="community-note">{m.community.commentsEmpty}</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <p className="comment-meta">
                <strong>{c.displayName ?? shorten(c.publicKey, 6, 4)}</strong> - {new Date(c.createdAt).toLocaleString(locale)}
              </p>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {account ? (
        <form onSubmit={submit} className="comment-form">
          <label>
            {m.community.commentLabel}
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={COMMUNITY_LIMITS.commentBody} rows={3} required />
          </label>
          <p className="community-note">{m.community.commentPostingAs(account.displayName ?? shorten(account.publicKey, 6, 4))}</p>
          <button className="btn btn-primary" disabled={busy || !body.trim()}>
            {m.community.commentSubmit}
          </button>
        </form>
      ) : (
        <p className="community-note">{m.community.commentsSignInHint}</p>
      )}
    </section>
  );
}
