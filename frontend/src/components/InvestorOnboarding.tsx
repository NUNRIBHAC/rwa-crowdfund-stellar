import { useEffect, useState } from 'react';
import { useCommunityAuth } from '../community/CommunityAuth';
import { fetchDemoOnboarding, saveDemoOnboarding, type DemoOnboardingResponse } from '../community/api';
import { useI18n } from '../i18n';
export default function InvestorOnboarding() {
  const { account, token } = useCommunityAuth();
  const { m } = useI18n();
  const t = m.onboarding;
  const [record, setRecord] = useState<DemoOnboardingResponse | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    setRecord(null);
    setError('');
    if (token)
      fetchDemoOnboarding(token)
        .then((x) => {
          if (live) setRecord(x);
        })
        .catch((e) => {
          if (live) setError(String(e.message));
        });
    return () => {
      live = false;
    };
  }, [token]);
  async function save(identity: DemoOnboardingResponse['progress']['identity'], risksAcknowledged: boolean) {
    setBusy(true);
    setError('');
    try {
      setRecord(await saveDemoOnboarding(token, { identity, risksAcknowledged }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="community-section" aria-labelledby="demo-onboarding">
      <h2 id="demo-onboarding">{t.title}</h2>
      <p className="community-note">{t.note}</p>
      {!account ? (
        <p>{t.signIn}</p>
      ) : (
        <>
          {error && <p role="alert">{error}</p>}
          {record && (
            <>
              <p role="status">{t.states[record.eligibility]}</p>
              <label>
                <span style={{ display: 'block', marginBottom: '0.5rem' }}>{t.identity}</span>
                <select
                  disabled={busy}
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
                  disabled={busy}
                  onChange={(e) => void save(record.progress.identity, e.target.checked)}
                />
                {t.risks}
              </label>
              <p>{t.saved}</p>
              <button className="btn" disabled={busy} onClick={() => void save(record.progress.identity, record.progress.risksAcknowledged)}>
                {t.refresh}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
