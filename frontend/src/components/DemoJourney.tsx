// A distinct teaching scenario. Never calls wallet, real assessment or funds APIs.
import { useEffect, useState } from 'react';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';
import { fetchDemoJourney, advanceDemoJourney, type DemoJourneyView } from '../community/api';
export default function DemoJourney() {
  const { account, token } = useCommunityAuth();
  const { m } = useI18n();
  const t = m.demoJourney;
  const [view, setView] = useState<DemoJourneyView | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setView(null);
    setError('');
    if (token)
      fetchDemoJourney(token)
        .then((v) => {
          if (live) setView(v);
        })
        .catch((e) => {
          if (live) setError(e.message);
        });
    return () => {
      live = false;
    };
  }, [token]);
  async function advance() {
    if (!view?.nextAction || busy) return;
    setBusy(true);
    setError('');
    try {
      setView(await advanceDemoJourney(token, view.nextAction));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="community-section demo-journey" aria-labelledby="synthetic-journey">
      <h2 id="synthetic-journey">{t.title}</h2>
      <p className="community-note">{t.notice}</p>
      {!account ? (
        <p>{m.onboarding.signIn}</p>
      ) : view ? (
        <>
          <ol>
            {Object.entries(t.steps).map(([id, label]) => (
              <li key={id} aria-current={view.nextAction === id ? 'step' : undefined}>
                {view.completed.includes(id) ? '✓ ' : ''}
                {label}
              </li>
            ))}
          </ol>
          {view.nextAction ? (
            <button className="btn" disabled={busy} onClick={() => void advance()}>
              {t.steps[view.nextAction]}
            </button>
          ) : (
            <p role="status">{t.complete}</p>
          )}
          {view.applicationId && (
            <p>
              {t.application}: <code>{view.applicationId}</code>
            </p>
          )}
          {view.document && (
            <details>
              <summary>{t.document}</summary>
              <p>{view.document.filename}</p>
              <p className="document-hash" dir="ltr">
                SHA-256: {view.document.sha256}
              </p>
              <pre className="application-document-content">{view.document.content}</pre>
            </details>
          )}
          {view.campaignId && (
            <p>
              {t.campaign}: <code>{view.campaignId}</code>
            </p>
          )}
          {view.business.contribution && (
            <>
              <h3>{t.businessReceipt}</h3>
              <Receipt receipt={view.business.contribution} />
              <h3>{t.investorReceipt}</h3>
              <Receipt receipt={view.investor.contribution!} />
              <p>{t.match}</p>
            </>
          )}
        </>
      ) : (
        <p role="status">{m.community.loading}</p>
      )}
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
    </section>
  );
}
function Receipt({ receipt }: { receipt: NonNullable<DemoJourneyView['business']['contribution']> }) {
  const { m } = useI18n();
  return (
    <dl className="demo-journey-receipt">
      <dt>{m.demoJourney.receipt}</dt>
      <dd>
        <code>{receipt.id}</code>
      </dd>
      <dt>{m.demoJourney.campaign}</dt>
      <dd>
        <code>{receipt.campaignId}</code>
      </dd>
      <dt>{m.demoJourney.amount}</dt>
      <dd>
        {receipt.amount} {m.demoJourney.units}
      </dd>
      <dt>{m.demoJourney.status}</dt>
      <dd>{m.demoJourney.simulated}</dd>
    </dl>
  );
}
