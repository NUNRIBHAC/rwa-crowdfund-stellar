// Owner-scoped notifications for the account dashboard: issuer application
// updates, comment moderation and ticket closures for the signed-in wallet,
// fetched from the community backend. Bodies render from structured event
// vars through the localized template functions; rows written before vars
// existed fall back to the server-stored English title/body untouched.
import { useCallback, useEffect, useState } from 'react';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../community/api';
import type { CommunityNotification, NotificationKind } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

const KIND_KEYS: Record<NotificationKind, 'applicationReceived' | 'applicationStatus' | 'commentModerated' | 'ticketClosed'> = {
  application_received: 'applicationReceived',
  application_status: 'applicationStatus',
  comment_moderated: 'commentModerated',
  ticket_closed: 'ticketClosed',
};

export default function NotificationsSection() {
  const { m, locale } = useI18n();
  const { account, token } = useCommunityAuth();
  const [notifications, setNotifications] = useState<CommunityNotification[] | null>(null);
  const [error, setError] = useState('');

  const labels = m.community.notifications;

  const load = useCallback(() => {
    if (!account) return;
    fetchNotifications(token)
      .then((v) => setNotifications(v.notifications))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [account, token]);

  useEffect(() => {
    if (!account) {
      setNotifications(null);
      return;
    }
    setError('');
    load();
  }, [account, load]);

  if (!account) return null;

  const fmt = (ts: number) => new Date(ts).toLocaleString(locale);

  // Localized body from structured vars; server English strings are the
  // documented fallback for rows without vars, never parsed.
  const bodyFor = (n: CommunityNotification): string => {
    const v = n.vars;
    if (!v) return n.body;
    switch (n.kind) {
      case 'application_received':
        return v.projectName ? labels.bodies.applicationReceived({ projectName: v.projectName }) : n.body;
      case 'application_status': {
        const status = v.status as keyof typeof m.community.applicationStatus | undefined;
        const statusLabel = status && m.community.applicationStatus[status] ? m.community.applicationStatus[status] : undefined;
        return v.projectName && statusLabel ? labels.bodies.applicationStatus({ projectName: v.projectName, statusLabel }) : n.body;
      }
      case 'comment_moderated': {
        if (!v.campaignId) return n.body;
        const base = labels.bodies.commentModerated({ campaignId: v.campaignId });
        return v.reason ? `${base} ${labels.bodies.commentModeratedReason({ reason: v.reason })}` : base;
      }
      case 'ticket_closed': {
        const kind = v.ticketKind as keyof typeof m.community.ticketKinds | undefined;
        const kindLabel = kind && m.community.ticketKinds[kind] ? m.community.ticketKinds[kind] : undefined;
        return kindLabel && v.subject ? labels.bodies.ticketClosed({ kindLabel, subject: v.subject }) : n.body;
      }
    }
  };

  const markRead = (id: string) => {
    markNotificationRead(token, id)
      .then(() => setNotifications((cur) => (cur ? cur.map((n) => (n.id === id ? { ...n, readAt: Date.now() } : n)) : cur)))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };

  const markAll = () => {
    markAllNotificationsRead(token)
      .then(() => setNotifications((cur) => (cur ? cur.map((n) => ({ ...n, readAt: n.readAt ?? Date.now() })) : cur)))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };

  const unread = (notifications ?? []).filter((n) => !n.readAt).length;

  return (
    <section aria-label={labels.title}>
      <div className="registry-bar">
        <h2 className="section-title">{labels.title}</h2>
        {unread > 0 && (
          <button type="button" className="btn btn-ghost" onClick={markAll}>
            {labels.markAllRead}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
      {!notifications || notifications.length === 0 ? (
        <p className="community-note">{labels.empty}</p>
      ) : (
        <ul className="portfolio-list">
          {notifications.map((n) => (
            <li key={n.id} className={`portfolio-row notification-row${n.readAt ? '' : ' notification-unread'}`}>
              <span className="notification-main">
                <span className="notification-title">{labels.kinds[KIND_KEYS[n.kind]]}</span>
                <span className="notification-body">{bodyFor(n)}</span>
                <span className="doc-note">{fmt(n.createdAt)}</span>
              </span>
              {!n.readAt && (
                <button type="button" className="btn btn-ghost notification-mark" onClick={() => markRead(n.id)}>
                  {labels.markRead}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
