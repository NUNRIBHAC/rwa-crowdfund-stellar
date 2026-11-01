import { tpl } from '../format';
// Account security: honest wallet-auth posture (no password or 2FA app in
// this prototype; the wallet signature is the credential) plus real session
// management - list the account's active sessions, end any of them, or end
// all but the current one. Data comes from the community backend; sessions
// are stored sha256-hashed server-side and addressed by a short hash prefix.
import { useCallback, useEffect, useState } from 'react';
import { disableTotp, enableTotp, enrollTotp, fetchSessions, logoutOtherSessions, revokeSession } from '../community/api';
import type { SessionInfo } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

export default function SecuritySection() {
  const { m, locale } = useI18n();
  const { account, token } = useCommunityAuth();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const labels = m.community.security;
  const [totpPhase, setTotpPhase] = useState<'idle' | 'enroll' | 'recovery' | 'disable'>('idle');
  const [totpEnroll, setTotpEnroll] = useState<{ otpauthUrl: string; manualKey: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpRecovery, setTotpRecovery] = useState<string[] | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(account?.totpEnabled === true);

  const load = useCallback(() => {
    if (!account) return;
    fetchSessions(token)
      .then((v) => setSessions(v.sessions))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [account, token]);

  useEffect(() => {
    if (!account) {
      setSessions(null);
      return;
    }
    setError('');
    load();
  }, [account, load]);

  if (!account) return null;

  const fmt = (ts: number) => new Date(ts).toLocaleString(locale);
  const others = (sessions ?? []).filter((s) => !s.current);

  const run = (op: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    op()
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setBusy(false));
  };

  const onRevoke = (id: string) =>
    run(async () => {
      await revokeSession(token, id);
      setSessions((prev) => (prev ?? []).filter((s) => s.id !== id));
    });

  const onRevokeOthers = () =>
    run(async () => {
      const { removed } = await logoutOtherSessions(token);
      setSessions((prev) => (prev ?? []).filter((s) => s.current));
      setNotice(tpl(removed === 1 ? labels.revokedOthers.one : labels.revokedOthers.other, { count: removed }));
    });

  return (
    <section className="community-section" aria-labelledby="security-title">
      <h2 id="security-title" className="section-title">
        {labels.title}
      </h2>
      <p>{labels.authMethodNote}</p>
      <h3>{labels.totpTitle}</h3>
      <p className="community-note">{totpEnabled ? labels.totpOnNote : labels.totpOffNote}</p>
      {totpPhase === 'idle' && !totpEnabled && (
        <button
          className="btn"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError('');
            enrollTotp(token)
              .then((v) => {
                setTotpEnroll(v);
                setTotpPhase('enroll');
              })
              .catch((e) => setError(e instanceof Error ? e.message : String(e)))
              .finally(() => setBusy(false));
          }}
        >
          {labels.totpEnable}
        </button>
      )}
      {totpPhase === 'enroll' && totpEnroll && (
        <div>
          <p className="community-note">{labels.totpScanNote}</p>
          <p className="community-note">
            <code>{totpEnroll.otpauthUrl}</code>
          </p>
          <p className="community-note">
            {labels.totpManualLabel}: <code>{totpEnroll.manualKey}</code>
          </p>
          <form
            className="display-name-form"
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              enableTotp(token, totpCode.trim())
                .then((v) => {
                  setTotpRecovery(v.recoveryCodes);
                  setTotpPhase('recovery');
                  setTotpEnabled(true);
                  setTotpCode('');
                })
                .catch((err) => setError(err instanceof Error ? err.message : String(err)))
                .finally(() => setBusy(false));
            }}
          >
            <label>
              {labels.totpCodeLabel}
              <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" />
            </label>
            <button className="btn btn-primary" disabled={busy || !totpCode.trim()}>
              {labels.totpConfirm}
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy}
              onClick={() => {
                setTotpPhase('idle');
                setTotpEnroll(null);
                setTotpCode('');
              }}
            >
              {labels.totpCancel}
            </button>
          </form>
        </div>
      )}
      {totpPhase === 'recovery' && totpRecovery && (
        <div>
          <h4>{labels.totpRecoveryTitle}</h4>
          <p className="community-note">{labels.totpRecoveryNote}</p>
          <ul className="portfolio-list">
            {totpRecovery.map((c) => (
              <li key={c}>
                <code>{c}</code>
              </li>
            ))}
          </ul>
          <p className="community-note">{labels.totpEnabledMsg}</p>
          <button
            className="btn"
            onClick={() => {
              setTotpPhase('idle');
              setTotpRecovery(null);
              setTotpEnroll(null);
            }}
          >
            {labels.totpDone}
          </button>
        </div>
      )}
      {totpPhase === 'idle' && totpEnabled && (
        <button className="btn" disabled={busy} onClick={() => setTotpPhase('disable')}>
          {labels.totpDisable}
        </button>
      )}
      {totpPhase === 'disable' && (
        <div>
          <p className="community-note">{labels.totpDisableNote}</p>
          <form
            className="display-name-form"
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              disableTotp(token, totpCode.trim())
                .then(() => {
                  setTotpEnabled(false);
                  setTotpPhase('idle');
                  setTotpCode('');
                  setNotice(labels.totpDisabledMsg);
                })
                .catch((err) => setError(err instanceof Error ? err.message : String(err)))
                .finally(() => setBusy(false));
            }}
          >
            <label>
              {labels.totpDisableCodeLabel}
              <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} autoComplete="one-time-code" />
            </label>
            <button className="btn btn-primary" disabled={busy || !totpCode.trim()}>
              {labels.totpDisable}
            </button>
            <button className="btn" type="button" disabled={busy} onClick={() => setTotpPhase('idle')}>
              {labels.totpCancel}
            </button>
          </form>
        </div>
      )}

      <h3>{labels.sessionsTitle}</h3>
      {!sessions || sessions.length === 0 ? (
        <p>{labels.empty}</p>
      ) : (
        <ul className="account-checklist">
          {sessions.map((s) => (
            <li key={s.id} className="account-checklist-item">
              <div>
                <h3>
                  {labels.sessionLabel} <code>{s.id}</code> {s.current ? <span className="status-chip status-pending">{labels.currentBadge}</span> : null}
                </h3>
                <p>
                  {labels.createdLabel}: {fmt(s.createdAt)} - {labels.expiresLabel}: {fmt(s.expiresAt)}
                </p>
              </div>
              {!s.current ? (
                <button className="btn" disabled={busy} onClick={() => onRevoke(s.id)}>
                  {labels.revoke}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {others.length > 0 ? (
        <button className="btn" disabled={busy} onClick={onRevokeOthers}>
          {labels.revokeOthers}
        </button>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
      {error ? (
        <p role="alert" className="community-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
