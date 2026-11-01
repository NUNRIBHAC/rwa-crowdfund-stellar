// Community sign-in: proves control of the connected wallet by signing a
// server challenge (no transaction, no funds move). The session unlocks
// comment posting, support/feedback tickets and issuer applications.
import { useCommunityAuth } from '../community/CommunityAuth';
import { COMMUNITY_LIMITS } from '../community/api';
import { useI18n } from '../i18n';
import { shorten } from '../format';
import { useState } from 'react';

export default function SignInPanel({ actor }: { actor: string }) {
  const { m } = useI18n();
  const { account, busy, error, restored, signIn, signOut, setDisplayName, totpPending, completeTotp } = useCommunityAuth();
  const [name, setName] = useState('');
  const [totpCode, setTotpCode] = useState('');

  if (!restored) return <p className="community-loading">{m.community.loading}</p>;

  if (!account) {
    if (totpPending) {
      return (
        <section className="community-section" aria-labelledby="community-totp">
          <h2 id="community-totp">{m.community.totpTitle}</h2>
          <p className="community-note">{m.community.totpExplainer}</p>
          {error && (
            <p role="alert" className="community-error">
              {error}
            </p>
          )}
          <form
            className="display-name-form"
            onSubmit={(e) => {
              e.preventDefault();
              completeTotp(totpCode.trim());
            }}
          >
            <label>
              {m.community.totpCodeLabel}
              <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" />
            </label>
            <button className="btn btn-primary" disabled={busy || !totpCode.trim()}>
              {m.community.totpSubmit}
            </button>
          </form>
          <p className="community-note">{m.community.totpRecoveryHint}</p>
        </section>
      );
    }
    return (
      <section className="community-section" aria-labelledby="community-signin">
        <h2 id="community-signin">{m.community.signInTitle}</h2>
        <p className="community-note">{m.community.signInExplainer}</p>
        {error && (
          <p role="alert" className="community-error">
            {error}
          </p>
        )}
        <button className="btn btn-primary" disabled={busy || !actor} onClick={() => signIn(actor)}>
          {m.community.signInButton}
        </button>
        {!actor && <p className="community-note">{m.community.signInConnectFirst}</p>}
      </section>
    );
  }

  return (
    <section className="community-section" aria-labelledby="community-signed-in">
      <h2 id="community-signed-in">{m.community.signedInTitle}</h2>
      <p>
        {m.community.signedInAs}{' '}
        <strong>
          {account.displayName ?? shorten(account.publicKey, 6, 4)} ({shorten(account.publicKey, 6, 4)})
        </strong>
      </p>
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
      <form
        className="display-name-form"
        onSubmit={(e) => {
          e.preventDefault();
          setDisplayName(name.trim());
        }}
      >
        <label>
          {m.community.displayNameLabel}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={COMMUNITY_LIMITS.displayName} placeholder={account.displayName ?? ''} />
        </label>
        <button className="btn" disabled={busy || !name.trim()}>
          {m.community.displayNameSave}
        </button>
      </form>
      <button className="btn" disabled={busy} onClick={signOut}>
        {m.community.signOutButton}
      </button>
    </section>
  );
}
