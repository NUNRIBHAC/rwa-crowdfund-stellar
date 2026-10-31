import React, { useCallback, useEffect, useState } from 'react';
import { communityApi, loadSession, type PublicComment, type Session } from './client';

// Campaign comments. Bodies are user content: render as plain text only
// (React escapes by default; never dangerouslySetInnerHTML).
export function Comments({ campaignId, labels }: { campaignId: string; labels?: Partial<typeof DEFAULT_LABELS> }) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const [comments, setComments] = useState<PublicComment[] | null>(null);
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    communityApi
      .listComments(campaignId)
      .then((r) => setComments(r.comments))
      .catch(() => setComments([]));
  }, [campaignId]);
  useEffect(refresh, [refresh]);
  useEffect(() => {
    const id = setInterval(() => setSession(loadSession()), 2000);
    return () => clearInterval(id);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await communityApi.addComment(campaignId, draft.trim());
      setDraft('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="community-comments" aria-label={t.heading}>
      <h3>{t.heading}</h3>
      {comments === null ? (
        <p>{t.loading}</p>
      ) : comments.length === 0 ? (
        <p>{t.empty}</p>
      ) : (
        <ul>
          {comments.map((c) => (
            <li key={c.id}>
              <strong>{c.author}</strong> <time dateTime={new Date(c.createdAt).toISOString()}>{new Date(c.createdAt).toLocaleString()}</time>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {session ? (
        <form onSubmit={submit}>
          <label>
            {t.yourComment}
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} rows={3} required />
          </label>
          <button type="submit" disabled={busy || draft.trim().length === 0}>
            {t.post}
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      ) : (
        <p>{t.signInToComment}</p>
      )}
    </section>
  );
}

const DEFAULT_LABELS = {
  heading: 'Comments',
  loading: 'Loading comments…',
  empty: 'No comments yet.',
  yourComment: 'Your comment',
  post: 'Post comment',
  signInToComment: 'Sign in with your wallet to comment.',
};
