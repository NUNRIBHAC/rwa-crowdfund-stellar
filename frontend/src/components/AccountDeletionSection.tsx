import { useState } from 'react';
import { deleteOwnAccount } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

export default function AccountDeletionSection() {
  const { account, token, signOut, disableSocialValidation } = useCommunityAuth();
  const { m } = useI18n();
  const text = m.community.deletion;
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!account) return null;
  const cancel = () => {
    setOpen(false);
    setPassword('');
    setCode('');
    setConfirmation('');
    setError(false);
  };
  return (
    <section className="community-section" aria-labelledby="account-deletion-title">
      <h3 id="account-deletion-title">{text.title}</h3>
      <p>{text.boundary}</p>
      {account.authMethod !== 'email' ? (
        <p>{text.unsupported}</p>
      ) : !open ? (
        <button className="btn" onClick={() => setOpen(true)}>
          {text.title}
        </button>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(false);
            try {
              await deleteOwnAccount(token, { confirmation, password, totpCode: code });
              disableSocialValidation?.();
              await signOut();
            } catch {
              setError(true);
              setPassword('');
              setCode('');
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {text.password}
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {account.totpEnabled && (
            <label>
              {text.factor}
              <input autoComplete="one-time-code" inputMode="numeric" required value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
          )}
          <label>
            {text.confirmation}
            <input autoComplete="off" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          <div className="community-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" type="submit" disabled={busy || confirmation !== 'DELETE' || !password || (account.totpEnabled && !code)}>
              {text.submit}
            </button>
            <button className="btn" type="button" disabled={busy} onClick={cancel}>
              {text.cancel}
            </button>
          </div>
          {error && <p role="alert">{text.failure}</p>}
        </form>
      )}
    </section>
  );
}
