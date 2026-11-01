// ECSPR Art. 21 appropriateness assessment (RTS 2022/2114): entry knowledge
// test + loss-bearing capacity simulation, backed by the community server
// (PR #29). Data scopes stay distinct by design:
//  - the knowledge test sends answers for server-side scoring; only the
//    outcome is stored;
//  - the loss simulation computes CLIENT-SIDE and transmits ONLY the two
//    result figures (netWorthEur + capacityEur). The income/asset/commitment
//    inputs never leave the browser: they are held in local state, used for
//    one calculation, and are never sent, logged or persisted anywhere
//    (RTS Art. 5(5) provider non-access/non-recording);
//  - a passed quiz never labels the investor sophisticated or professional.
// The mandated risk warning (RTS Art. 4(2), verbatim English sentence plus a
// localized rendering) stays visible until acknowledged and never encourages
// proceeding. Collection is fail-closed server-side: deployments without
// APPROPRIATENESS_COLLECT answer 503 ("held"), staging restricts collection
// to an explicit QA allowlist (403) - both states render honestly.
// Replaces the old localStorage-only InvestorCategorisation prototype.
import { useCallback, useEffect, useState } from 'react';
import { acknowledgeWarning, fetchAppropriateness, submitKnowledgeAssessment, transmitSimulationResult, type AppropriatenessRecord } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';
import { tpl } from '../format';

// RTS 2022/2114 Art. 4(2) mandated warning sentence: fixed English legal
// text shown verbatim on every locale, followed by the locale translation.
const MANDATED_WARNING_EN = 'An investment in a crowdfunding project includes the risk of losing the entirety of the money invested.';

type LoadState = 'loading' | 'ready' | 'held' | 'limited' | 'error';

const EXPERIENCE_VALUES = ['none', 'some', 'experienced'] as const;
const OBJECTIVE_VALUES = ['capital_preservation', 'income', 'growth', 'other'] as const;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function AppropriatenessSection() {
  const { m, locale } = useI18n();
  const { account, token } = useCommunityAuth();
  const t = m.appropriateness;
  const [state, setState] = useState<LoadState>('loading');
  const [assessment, setAssessment] = useState<AppropriatenessRecord | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Knowledge form state.
  const [retaking, setRetaking] = useState(false);
  const [experience, setExperience] = useState('');
  const [objective, setObjective] = useState('');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Simulation form state: the raw inputs stay in this component's memory
  // only - never transmitted, logged or stored.
  const [income, setIncome] = useState('');
  const [assets, setAssets] = useState('');
  const [commitments, setCommitments] = useState('');
  const [sim, setSim] = useState<{ netWorth: number; capacity: number } | null>(null);
  const [simError, setSimError] = useState('');
  const [simEditing, setSimEditing] = useState(false);

  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString(locale, { dateStyle: 'medium' });
  const fmtEur = (v: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(v);

  const load = useCallback(() => {
    if (!account) return;
    setState('loading');
    setError('');
    fetchAppropriateness(token)
      .then((v) => {
        setAssessment(v.assessment);
        setState('ready');
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('disabled on this deployment')) setState('held');
        else if (msg.includes('limited to designated')) setState('limited');
        else {
          setError(msg);
          setState('error');
        }
      });
  }, [account, token]);

  useEffect(() => {
    setAssessment(null);
    setRetaking(false);
    setJustSubmitted(false);
    setSim(null);
    setSimEditing(false);
    if (account) load();
    else setState('loading');
  }, [account, load]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  const submitKnowledge = () => {
    setBusy(true);
    setError('');
    submitKnowledgeAssessment(token, {
      experienceLevel: experience,
      objective,
      answers: t.questions.map((_, i) => answers[i] ?? -1),
    })
      .then((v) => {
        setAssessment(v.assessment);
        setRetaking(false);
        setJustSubmitted(true);
      })
      .catch(fail)
      .finally(() => setBusy(false));
  };

  const ackWarning = () => {
    setBusy(true);
    setError('');
    acknowledgeWarning(token)
      .then((v) => setAssessment(v.assessment))
      .catch(fail)
      .finally(() => setBusy(false));
  };

  const runSim = (e: React.FormEvent) => {
    e.preventDefault();
    const i = Number(income);
    const a = Number(assets);
    const c = Number(commitments);
    if (![i, a, c].every((n) => Number.isFinite(n) && n >= 0)) {
      setSimError(t.simInvalid);
      setSim(null);
      return;
    }
    setSimError('');
    const netWorth = Math.max(0, round2(i + a - c));
    setSim({ netWorth, capacity: round2(netWorth * 0.1) });
  };

  const transmitSim = () => {
    if (!sim) return;
    setBusy(true);
    setError('');
    transmitSimulationResult(token, { netWorthEur: sim.netWorth, capacityEur: sim.capacity })
      .then((v) => {
        setAssessment(v.assessment);
        setSimEditing(false);
      })
      .catch(fail)
      .finally(() => setBusy(false));
  };

  const showForm = state === 'ready' && (!assessment || retaking);
  const warningPending = !!assessment && assessment.outcome === 'warning_issued' && !assessment.warningAcknowledgedAt;
  const simEligible = !!assessment && (assessment.outcome === 'appropriate' || !!assessment.warningAcknowledgedAt);
  const allAnswered = t.questions.every((_, i) => answers[i] !== undefined);

  return (
    <section className="community-section" aria-labelledby="appropriateness-title">
      <h2 id="appropriateness-title" className="section-title">
        {t.title} <span className="demo-badge">{m.community.demoBadge}</span>
      </h2>
      <p className="community-note">{t.intro}</p>
      {!account && <p className="community-note">{t.signInNote}</p>}
      {account && state === 'loading' && <p className="community-note">{m.community.loading}</p>}
      {account && state === 'held' && <p className="community-note">{t.heldNote}</p>}
      {account && state === 'limited' && <p className="community-note">{t.limitedNote}</p>}
      {error && (
        <p className="community-error" role="alert">
          {error}
        </p>
      )}

      {account && showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitKnowledge();
          }}
        >
          <h3>{t.knowledgeTitle}</h3>
          <p className="community-note">{t.knowledgeIntro}</p>
          <p>
            <label>
              {t.experienceLabel}{' '}
              <select value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="">{t.selectPlaceholder}</option>
                {EXPERIENCE_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {t.experienceOptions[v]}
                  </option>
                ))}
              </select>
            </label>{' '}
            <label>
              {t.objectiveLabel}{' '}
              <select value={objective} onChange={(e) => setObjective(e.target.value)}>
                <option value="">{t.selectPlaceholder}</option>
                {OBJECTIVE_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {t.objectiveOptions[v]}
                  </option>
                ))}
              </select>
            </label>
          </p>
          {t.questions.map((q, qi) => (
            <fieldset key={qi} className="cat-question">
              <legend>{q.q}</legend>
              <label className="cat-option">
                <input type="radio" name={`appr-q-${qi}`} checked={answers[qi] === 0} onChange={() => setAnswers({ ...answers, [qi]: 0 })} />
                {t.yes}
              </label>
              <label className="cat-option">
                <input type="radio" name={`appr-q-${qi}`} checked={answers[qi] === 1} onChange={() => setAnswers({ ...answers, [qi]: 1 })} />
                {t.no}
              </label>
            </fieldset>
          ))}
          <button className="btn btn-primary" type="submit" disabled={busy || !experience || !objective || !allAnswered}>
            {t.submitKnowledge}
          </button>
        </form>
      )}

      {account && assessment && !retaking && (
        <div>
          <h3>{t.statusTitle}</h3>
          <p>
            {t.statusOutcome}: <strong>{t.outcomeLabels[assessment.outcome]}</strong> -{' '}
            {tpl(t.scoreLabel, { score: assessment.knowledgeScore, total: assessment.knowledgeTotal })}
          </p>
          <p className="community-note">
            {tpl(t.completedAt, { date: fmtDate(assessment.completedAt) })} {tpl(t.reviewAssessmentDue, { date: fmtDate(assessment.reviewAssessmentDueAt) })}
          </p>
          {assessment.warningAcknowledgedAt && (
            <p className="community-note">{tpl(t.warningAcknowledgedAt, { date: fmtDate(assessment.warningAcknowledgedAt) })}</p>
          )}
          <p className="community-note">{t.noSophisticatedNote}</p>
          {justSubmitted && (
            <div>
              <p className="community-note">{t.reviewExplanations}</p>
              <ul>
                {t.questions.map((q, qi) => (
                  <li key={qi} className="community-note">
                    {q.q} {q.why}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            className="btn"
            onClick={() => {
              setRetaking(true);
              setAnswers({});
              setExperience('');
              setObjective('');
              setJustSubmitted(false);
            }}
          >
            {t.retake}
          </button>
        </div>
      )}

      {account && warningPending && (
        <div className="appr-warning" role="alert">
          <h3>{t.warningTitle}</h3>
          <p className="appr-warning-text">{MANDATED_WARNING_EN}</p>
          {locale !== 'en' && <p className="appr-warning-text">{t.warningText}</p>}
          <p className="community-note">{t.warningNote}</p>
          <button className="btn btn-primary" disabled={busy} onClick={ackWarning}>
            {t.warningAck}
          </button>
        </div>
      )}

      {account && simEligible && !retaking && (
        <div>
          <h3>{t.simTitle}</h3>
          <p className="community-note">{t.simIntro}</p>
          <p className="community-note">{t.simExclusionsNote}</p>
          <p className="community-note">{t.simPrivacyNote}</p>
          {assessment?.simulation && !simEditing ? (
            <div>
              <p>
                {tpl(t.simNetWorth, { amount: fmtEur(assessment.simulation.netWorthEur) })} -{' '}
                {tpl(t.simCapacity, { amount: fmtEur(assessment.simulation.capacityEur) })}
              </p>
              <p className="community-note">
                {tpl(t.simTransmitted, { date: fmtDate(assessment.simulation.transmittedAt) })}{' '}
                {assessment.reviewSimulationDueAt ? tpl(t.reviewSimulationDue, { date: fmtDate(assessment.reviewSimulationDueAt) }) : ''}
              </p>
              <button
                className="btn"
                onClick={() => {
                  setSimEditing(true);
                  setSim(null);
                }}
              >
                {t.simRecalculate}
              </button>
            </div>
          ) : (
            <form onSubmit={runSim}>
              <p>
                <label>
                  {t.simIncomeLabel} <input type="number" min="0" step="any" value={income} onChange={(e) => setIncome(e.target.value)} required />
                </label>
              </p>
              <p>
                <label>
                  {t.simAssetsLabel} <input type="number" min="0" step="any" value={assets} onChange={(e) => setAssets(e.target.value)} required />
                </label>
              </p>
              <p>
                <label>
                  {t.simCommitmentsLabel}{' '}
                  <input type="number" min="0" step="any" value={commitments} onChange={(e) => setCommitments(e.target.value)} required />
                </label>
              </p>
              <button className="btn" type="submit">
                {t.simRun}
              </button>
              {simError && (
                <p className="community-error" role="alert">
                  {simError}
                </p>
              )}
              {sim && (
                <div>
                  <p role="status">
                    {tpl(t.simNetWorth, { amount: fmtEur(sim.netWorth) })} - {tpl(t.simCapacity, { amount: fmtEur(sim.capacity) })}
                  </p>
                  <button className="btn btn-primary" type="button" disabled={busy} onClick={transmitSim}>
                    {t.simTransmit}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </section>
  );
}
