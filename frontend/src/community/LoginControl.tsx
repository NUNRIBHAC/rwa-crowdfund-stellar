import React, { useState } from 'react';
import { loadSession, loginWithFreighter, logout, setDisplayName, type Session } from './client';

// Wallet sign-in control. Signing the server challenge proves key ownership
// only; the UI must keep saying this is not KYC and unlocks no investing.
export function LoginControl({ labels }: { labels?: Partial<typeof DEFAULT_LABELS> }) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [nameDraft, setNameDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    setError(null);
    try {
      setSession(await loginWithFreighter());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }
  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    try {
      const account = await setDisplayName(nameDraft);
      setSession((s) => (s ? { ...s, account } : s));
      setNameDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (!session) {
    return (
      <div className="community-login">
        <button type="button" onClick={login} disabled={busy}>
          {t.signIn}
        </button>
        <p>{t.notKyc}</p>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  }
  const short = `${session.account.publicKey.slice(0, 4)}…${session.account.publicKey.slice(-4)}`;
  return (
    <div className="community-login">
      <p>
        {t.signedInAs} <strong>{session.account.displayName ?? short}</strong>
      </p>
      <form onSubmit={saveName}>
        <label>
          {t.displayName}
          <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={40} placeholder={session.account.displayName ?? ''} />
        </label>
        <button type="submit">{t.saveName}</button>
      </form>
      <button
        type="button"
        onClick={() => {
          void logout();
          setSession(null);
        }}
      >
        {t.signOut}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

const DEFAULT_LABELS = {
  signIn: 'Sign in with Freighter',
  notKyc: 'Sign-in proves wallet ownership only. It is not identity verification and does not unlock investing.',
  signedInAs: 'Signed in as',
  displayName: 'Display name (optional)',
  saveName: 'Save',
  signOut: 'Sign out',
};
