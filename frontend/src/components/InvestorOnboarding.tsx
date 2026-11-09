import { useCallback, useEffect, useRef, useState } from 'react';
import { useCommunityAuth } from '../community/CommunityAuth';
import { fetchDemoOnboarding, saveDemoOnboarding, type DemoOnboardingResponse } from '../community/api';
import { useI18n } from '../i18n';
export default function InvestorOnboarding() {
  const { account, token } = useCommunityAuth();
  // A new session owns a new component instance, so an old account response
  // cannot populate the next signed-in account or a signed-out screen.
  return <OnboardingSession key={account && token ? `${account.publicKey}:${token}` : 'signed-out'} signedIn={!!account && !!token} token={token} />;
}

function OnboardingSession({ signedIn, token }: { signedIn: boolean; token: string }) {
  const { m } = useI18n();
  const t = m.onboarding;
  const [record, setRecord] = useState<DemoOnboardingResponse | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const active = useRef(true);
  const reads = useRef(0);
  const load = useCallback(async () => {
    if (!signedIn) return;
    const request = ++reads.current;
    setLoading(true);
    setError('');
    try {
      const saved = await fetchDemoOnboarding(token);
      if (active.current && reads.current === request) setRecord(saved);
    } catch (e) {
      if (active.current && reads.current === request) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (active.current && reads.current === request) setLoading(false);
    }
  }, [signedIn, token]);
  useEffect(() => {
    active.current = true;
    void load();
    return () => {
      active.current = false;
    };
  }, [load]);
  async function save(identity: DemoOnboardingResponse['progress']['identity'], risksAcknowledged: boolean) {
    const request = ++reads.current;
    setBusy(true);
    setError('');
    try {
      const saved = await saveDemoOnboarding(token, { identity, risksAcknowledged });
      if (active.current && reads.current === request) setRecord(saved);
    } catch (e) {
      if (active.current && reads.current === request) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (active.current && reads.current === request) setBusy(false);
    }
  }
  return (
    <section className="community-section" aria-labelledby="demo-onboarding">
      <h2 id="demo-onboarding">{t.title}</h2>
      <p className="community-note">{t.note}</p>
      {!signedIn ? (
        <p>{t.signIn}</p>
      ) : (
        <>
          {loading && <p role="status">{m.community.loading}</p>}
          {error && (
            <>
              <p role="alert">{error}</p>
              {!record && (
                <button className="btn" disabled={busy || loading} onClick={() => void load()}>
                  {t.refresh}
                </button>
              )}
            </>
          )}
          {record && (
            <>
              <p role="status">{t.states[record.eligibility]}</p>
              <label>
                <span style={{ display: 'block', marginBottom: '0.5rem' }}>{t.identity}</span>
                <select
                  disabled={busy || loading}
                  value={record.progress.identity}
                  onChange={(e) => void save(e.target.value as DemoOnboardingResponse['progress']['identity'], record.progress.risksAcknowledged)}
                >
                  {Object.entries(t.identityStates).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <p>{record.assessmentCurrent && record.warningReady ? t.assessmentSaved : t.assessmentNeeded}</p>
              <p>
                <a href="#investor-assessment">{t.assessmentLink}</a>
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={record.progress.risksAcknowledged}
                  disabled={busy || loading}
                  onChange={(e) => void save(record.progress.identity, e.target.checked)}
                />
                {t.risks}
              </label>
              <p>{t.saved}</p>
              <button className="btn" disabled={busy || loading} onClick={() => void load()}>
                {t.refresh}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
