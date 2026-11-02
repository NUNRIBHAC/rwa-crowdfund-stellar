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
  const {
    account,
    busy,
    error,
    restored,
    signIn,
    emailSignUp,
    emailSignIn,
    emailCompleteVerification,
    emailResendToken,
    signOut,
    setDisplayName,
    totpPending,
    completeTotp,
  } = useCommunityAuth();
  const [name, setName] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [method, setMethod] = useState<'wallet' | 'email'>('wallet');
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [resent, setResent] = useState(false);

  if (!restored) return <p className="community-loading">{m.community.loading}</p>;

  if (!account) {
    if (totpPending) {
      return (
        <section className="community-section" aria-labelledby="community-totp">
          <h2 id="community-totp">{m.community.totpTitle}</h2>
          <p className="community-note">{method === 'email' ? m.community.totpExplainerEmail : m.community.totpExplainer}</p>
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
    if (pendingVerifyEmail) {
      return (
        <section className="community-section" aria-labelledby="community-verify">
          <h2 id="community-verify">{m.community.emailVerifyTitle}</h2>
          <p className="community-note">{m.community.emailVerifyExplainer.replace('{email}', pendingVerifyEmail)}</p>
          {error && (
            <p role="alert" className="community-error">
              {error}
            </p>
          )}
          <form
            className="display-name-form"
            onSubmit={(e) => {
              e.preventDefault();
              emailCompleteVerification(pendingVerifyEmail, verifyToken.trim()).catch(() => undefined);
            }}
          >
            <label>
              {m.community.emailVerifyTokenLabel}
              <input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} autoComplete="one-time-code" placeholder="blv_..." />
            </label>
            <button className="btn btn-primary" disabled={busy || !verifyToken.trim()}>
              {m.community.emailVerifySubmit}
            </button>
          </form>
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              emailResendToken(pendingVerifyEmail)
                .then(() => setResent(true))
                .catch(() => undefined)
            }
          >
            {m.community.emailResendButton}
          </button>
          {resent && <p className="community-note">{m.community.emailResendDone}</p>}
          <p className="community-note">{m.community.emailDemoNote}</p>
        </section>
      );
    }
    return (
      <section className="community-section" aria-labelledby="community-signin">
        <h2 id="community-signin">{m.community.signInTitle}</h2>
        <div className="signin-method-toggle" role="tablist" aria-label={m.community.signInMethodLabel}>
          <button
            role="tab"
            aria-selected={method === 'wallet'}
            className={method === 'wallet' ? 'btn btn-primary' : 'btn'}
            onClick={() => setMethod('wallet')}
          >
            {m.community.signInMethodWallet}
          </button>
          <button role="tab" aria-selected={method === 'email'} className={method === 'email' ? 'btn btn-primary' : 'btn'} onClick={() => setMethod('email')}>
            {m.community.signInMethodEmail}
          </button>
        </div>
        {error && (
          <p role="alert" className="community-error">
            {error}
          </p>
        )}
        {method === 'wallet' ? (
          <>
            <p className="community-note">{m.community.signInExplainer}</p>
            <button className="btn btn-primary" disabled={busy || !actor} onClick={() => signIn(actor)}>
              {m.community.signInButton}
            </button>
            {!actor && <p className="community-note">{m.community.signInConnectFirst}</p>}
          </>
        ) : (
          <>
            <p className="community-note">{m.community.emailExplainer}</p>
            <form
              className="display-name-form"
              onSubmit={(e) => {
                e.preventDefault();
                const addr = email.trim();
                if (emailMode === 'register') {
                  emailSignUp(addr, password)
                    .then(() => {
                      setPendingVerifyEmail(addr.toLowerCase());
                      setResent(false);
                    })
                    .catch(() => undefined);
                } else {
                  emailSignIn(addr, password).catch(() => undefined);
                }
              }}
            >
              <label>
                {m.community.emailLabel}
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </label>
              <label>
                {m.community.passwordLabel}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={emailMode === 'register' ? 'new-password' : 'current-password'}
                  required
                />
              </label>
              {emailMode === 'register' && <p className="community-note">{m.community.emailPasswordHint}</p>}
              <button className="btn btn-primary" disabled={busy || !email.trim() || !password}>
                {emailMode === 'register' ? m.community.emailRegisterButton : m.community.emailLoginButton}
              </button>
            </form>
            <button className="btn" disabled={busy} onClick={() => setEmailMode(emailMode === 'register' ? 'login' : 'register')}>
              {emailMode === 'register' ? m.community.emailModeLogin : m.community.emailModeRegister}
            </button>
            {emailMode === 'login' && (
              <button
                className="btn"
                disabled={busy || !email.trim()}
                onClick={() =>
                  emailResendToken(email.trim())
                    .then(() => setResent(true))
                    .catch(() => undefined)
                }
              >
                {m.community.emailResendButton}
              </button>
            )}
            {resent && <p className="community-note">{m.community.emailResendDone}</p>}
          </>
        )}
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
