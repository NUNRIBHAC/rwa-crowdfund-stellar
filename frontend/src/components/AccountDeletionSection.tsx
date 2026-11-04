import { useEffect, useRef, useState } from 'react';
import {
  deleteOwnAccount,
  fetchDeletionProviders,
  startDeletionProvider,
  farcasterDeletionNonce,
  farcasterDeletionVerify,
  farcasterCreateChannel,
  farcasterChannelStatus,
} from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { socialProviderDisplayName } from '../community/social';
import { useI18n } from '../i18n';

export default function AccountDeletionSection() {
  const { account, token, signOut, disableSocialValidation } = useCommunityAuth();
  const { m } = useI18n();
  const text = m.community.deletion;
  const farcasterRun = useRef(0);
  const [farcasterUrl, setFarcasterUrl] = useState('');
  const [socialProof, setSocialProof] = useState('');
  const [providers, setProviders] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const proofOwner = useRef('');
  useEffect(() => {
    let active = true;
    farcasterRun.current += 1;
    setFarcasterUrl('');
    setBusy(false);
    const owner = `${account?.publicKey ?? ''}:${token}`;
    if (proofOwner.current !== owner) {
      proofOwner.current = owner;
      setSocialProof('');
      setProviders([]);
      setConfirmation('');
      setPassword('');
      setCode('');
      setOpen(false);
    }
    if (account?.authMethod === 'social' && token) {
      fetchDeletionProviders(token)
        .then((value) => {
          if (active) setProviders(value.providers);
        })
        .catch(() => {
          if (active) setProviders([]);
        });
      const hash = new URLSearchParams(location.hash.slice(1));
      const proof = hash.get('deletion-proof');
      if (proof && /^bld_[0-9a-f]{48}$/.test(proof)) {
        setSocialProof(proof);
        setOpen(true);
        setConfirmation('');
        history.replaceState(null, '', location.pathname + location.search);
      }
    }
    return () => {
      active = false;
      farcasterRun.current += 1;
    };
  }, [account?.publicKey, account?.authMethod, token]);
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!account) return null;
  const cancel = () => {
    farcasterRun.current += 1;
    setFarcasterUrl('');
    setBusy(false);
    setOpen(false);
    setPassword('');
    setCode('');
    setConfirmation('');
    setError(false);
    setSocialProof('');
  };
  return (
    <section className="community-section" aria-labelledby="account-deletion-title">
      <h3 id="account-deletion-title">{text.title}</h3>
      <p>{text.boundary}</p>
      {account.authMethod !== 'email' && account.authMethod !== 'social' ? (
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
              await deleteOwnAccount(
                token,
                account.authMethod === 'social' ? { confirmation, socialProof, totpCode: code } : { confirmation, password, totpCode: code },
              );
              disableSocialValidation?.();
              await signOut();
            } catch {
              setError(true);
              setPassword('');
              setCode('');
              setSocialProof('');
              setConfirmation('');
            } finally {
              setBusy(false);
            }
          }}
        >
          {account.authMethod === 'email' ? (
            <label>
              {text.password}
              <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
          ) : (
            <>
              <p>{socialProof ? text.providerReady : text.providerNote}</p>
              {!socialProof && providers.length === 0 && <p>{text.noProvider}</p>}
            </>
          )}
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
          {account.authMethod === 'social' && !socialProof && !farcasterUrl && (
            <div className="community-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {providers.map((provider) => (
                <button
                  key={provider}
                  className="btn"
                  type="button"
                  disabled={busy || confirmation !== 'DELETE'}
                  onClick={async () => {
                    setBusy(true);
                    setError(false);
                    const operation = ++farcasterRun.current;
                    try {
                      if (provider === 'farcaster') {
                        const run = operation;
                        const n = await farcasterDeletionNonce(token, confirmation);
                        if (run !== farcasterRun.current) return;
                        const channel = await farcasterCreateChannel(n.nonce, n.domain, n.siweUri);
                        if (run !== farcasterRun.current) return;
                        setFarcasterUrl(channel.url);
                        const deadline = Date.now() + 5 * 60 * 1000;
                        while (Date.now() < deadline && run === farcasterRun.current) {
                          await new Promise((resolve) => setTimeout(resolve, 2000));
                          if (run !== farcasterRun.current) return;
                          const status = await farcasterChannelStatus(channel.channelToken);
                          if (run !== farcasterRun.current) return;
                          if (status.state === 'completed' && status.message && status.signature) {
                            const proof = await farcasterDeletionVerify(token, n.nonce, status.message, status.signature);
                            if (run !== farcasterRun.current) return;
                            setSocialProof(proof.proof);
                            setConfirmation('');
                            setCode('');
                            setFarcasterUrl('');
                            setBusy(false);
                            return;
                          }
                          if (status.state === 'error') throw new Error('provider unavailable');
                        }
                        if (run === farcasterRun.current) throw new Error('provider expired');
                        return;
                      }
                      const result = await startDeletionProvider(token, provider, confirmation);
                      location.assign(result.url);
                    } catch {
                      if (operation !== farcasterRun.current) return;
                      setFarcasterUrl('');
                      setError(true);
                      setBusy(false);
                    }
                  }}
                >
                  {text.providerVerify}: {socialProviderDisplayName(provider)}
                </button>
              ))}
            </div>
          )}
          {farcasterUrl && (
            <a className="btn" href={farcasterUrl} target="_blank" rel="noopener noreferrer">
              {text.providerVerify}: Farcaster
            </a>
          )}
          <div className="community-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn"
              type="submit"
              disabled={busy || confirmation !== 'DELETE' || (account.authMethod === 'social' ? !socialProof : !password) || (account.totpEnabled && !code)}
            >
              {text.submit}
            </button>
            <button className="btn" type="button" disabled={busy && !farcasterUrl} onClick={cancel}>
              {text.cancel}
            </button>
          </div>
          {error && <p role="alert">{text.failure}</p>}
        </form>
      )}
    </section>
  );
}
