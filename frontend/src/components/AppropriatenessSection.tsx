// ECSPR Art. 21 entry knowledge test + loss-bearing capacity simulation
// (RTS 2022/2114): a partial demo implementation backed by the community
// server (PR #29). The full ECSPR Art. 21(2) / RTS Art. 2 background
// information request IS collected (v2), but no Art. 21(1) assessment
// methodology runs on it, and the quiz result is labelled accordingly.
// Investor categorisation follows ECSPR Art. 2(1)(j)/(k) + Annex II: only
// the Annex II Section II request template is captured - there is no
// approval path, so every account stays non-sophisticated. Data scopes stay
// distinct by design:
//  - the knowledge test sends answers for server-side scoring; only the
//    outcome is stored;
//  - the loss simulation computes CLIENT-SIDE and transmits ONLY the two
//    result figures (netWorthEur + capacityEur). The income/asset/commitment
//    inputs never leave the browser: they are held in local state, used for
//    one calculation, and are never sent, logged or persisted anywhere
//    (RTS Art. 5(5) provider non-access/non-recording);
//  - a passed quiz never labels the investor sophisticated or professional,
//    nor counts as the Art. 21(1) appropriateness assessment.
// The mandated risk warning (RTS Art. 4(2), verbatim English sentence plus a
// localized rendering) stays visible until acknowledged and never encourages
// proceeding. Collection is fail-closed server-side: deployments without
// APPROPRIATENESS_COLLECT answer 503 ("held"), staging restricts collection
// to an explicit QA allowlist (403) - both states render honestly.
// Replaces the old localStorage-only InvestorCategorisation prototype.
import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  acknowledgeWarning,
  fetchAppropriateness,
  requestSophistication,
  submitKnowledgeAssessment,
  transmitSimulationResult,
  type AppropriatenessInformation,
  type AppropriatenessRecord,
} from '../community/api';
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

  // Art. 21(2)/RTS Art. 2 information form state (submitted with the test).
  const [familiar, setFamiliar] = useState<string[]>([]);
  const [natures, setNatures] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('');
  const [volume, setVolume] = useState('');
  const [period, setPeriod] = useState('');
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [crowdfundExp, setCrowdfundExp] = useState('');
  const [holding, setHolding] = useState('');
  const [risk, setRisk] = useState('');
  const [sustainability, setSustainability] = useState('');

  // Annex II categorisation request form state (capture-only).
  const [sophRoute, setSophRoute] = useState<'annex_ii_attestation' | 'mifid_professional_client'>('annex_ii_attestation');
  const [sophPerson, setSophPerson] = useState('');
  const [sophCriteria, setSophCriteria] = useState<string[]>([]);
  const [sophProof, setSophProof] = useState('');
  const [sophAware, setSophAware] = useState(false);
  const [sophLiable, setSophLiable] = useState(false);

  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString(locale, { dateStyle: 'medium' });
  const fmtEur = (v: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(v);

  const load = useCallback(() => {
    if (!account) return;
    setState('loading');
    setError('');
    fetchAppropriateness(token)
      .then((v) => {
        setAssessment(v.record);
        setState('ready');
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        // Branch on stable codes; user-facing messages are always localized.
        const code = e instanceof ApiError ? e.code : undefined;
        if (code === 'feature_unavailable') setState('held');
        else if (code === 'feature_restricted') setState('limited');
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
    resetInfoForm();
    resetSophForm();
    if (account) load();
    else setState('loading');
  }, [account, load]);

  // 'none' answers stand alone: selecting 'none' clears the rest, and
  // selecting a real type clears 'none' (mirrors the server-side rule).
  const toggleExclusive = (list: string[], v: string): string[] => {
    if (v === 'none') return list.includes('none') ? [] : ['none'];
    const without = list.filter((x) => x !== 'none');
    return without.includes(v) ? without.filter((x) => x !== v) : [...without, v];
  };

  function resetInfoForm() {
    setFamiliar([]);
    setNatures([]);
    setFrequency('');
    setVolume('');
    setPeriod('');
    setEducation('');
    setProfession('');
    setCrowdfundExp('');
    setHolding('');
    setRisk('');
    setSustainability('');
  }

  function resetSophForm() {
    setSophRoute('annex_ii_attestation');
    setSophPerson('');
    setSophCriteria([]);
    setSophProof('');
    setSophAware(false);
    setSophLiable(false);
  }

  const infoValid =
    familiar.length > 0 &&
    natures.length > 0 &&
    !!frequency &&
    !!volume &&
    !!period &&
    !!education &&
    crowdfundExp !== '' &&
    !!holding &&
    !!risk &&
    !!sustainability;

  const buildInformation = (): AppropriatenessInformation => ({
    familiarInvestmentTypes: familiar,
    pastTransactions: { natures, annualFrequencyBand: frequency, totalVolumeBandEur: volume, periodYearsBand: period },
    educationLevel: education,
    professionOrFormer: profession.trim() ? profession.trim() : null,
    crowdfundingProfessionalExperience: crowdfundExp === 'yes',
    holdingPeriod: holding,
    riskProfile: risk,
    sustainabilityPreference: sustainability,
  });

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  const submitKnowledge = () => {
    setBusy(true);
    setError('');
    submitKnowledgeAssessment(token, {
      experienceLevel: experience,
      objective,
      answers: t.questions.map((_, i) => answers[i] ?? -1),
      information: buildInformation(),
    })
      .then((v) => {
        setAssessment(v.record);
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
      .then((v) => setAssessment(v.record))
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
        setAssessment(v.record);
        setSimEditing(false);
      })
      .catch(fail)
      .finally(() => setBusy(false));
  };

  const submitSoph = () => {
    setBusy(true);
    setError('');
    requestSophistication(token, {
      route: sophRoute,
      personType: sophRoute === 'mifid_professional_client' ? null : (sophPerson as 'natural' | 'legal'),
      attestedCriteria: sophRoute === 'mifid_professional_client' ? [] : sophCriteria,
      professionalClientProof: sophRoute === 'mifid_professional_client' ? sophProof.trim() : null,
      awarenessStatementAccepted: true,
      liabilityStatementAccepted: true,
    })
      .then((v) => {
        setAssessment(v.record);
        resetSophForm();
      })
      .catch(fail)
      .finally(() => setBusy(false));
  };

  const sophValid =
    sophAware &&
    sophLiable &&
    (sophRoute === 'mifid_professional_client'
      ? sophProof.trim().length > 0
      : sophPerson === 'natural'
        ? sophCriteria.length >= 2
        : sophPerson === 'legal'
          ? sophCriteria.length >= 1
          : false);

  const showForm = state === 'ready' && (!assessment || retaking);
  const warningPending = !!assessment && assessment.outcome === 'warning_issued' && !assessment.warningAcknowledgedAt;
  const simEligible = !!assessment && (assessment.outcome === 'knowledge_check_passed' || !!assessment.warningAcknowledgedAt);
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
          <h3>{t.infoTitle}</h3>
          <p className="community-note">{t.infoIntro}</p>
          <p className="community-note">{t.accuracyNotice}</p>
          <fieldset className="cat-question">
            <legend>{t.infoFamiliarLabel}</legend>
            {Object.entries(t.infoFamiliarOptions).map(([v, label]) => (
              <label key={v} className="cat-option">
                <input type="checkbox" checked={familiar.includes(v)} onChange={() => setFamiliar(toggleExclusive(familiar, v))} />
                {label}
              </label>
            ))}
          </fieldset>
          <fieldset className="cat-question">
            <legend>{t.infoNatureLabel}</legend>
            {Object.entries(t.infoNatureOptions).map(([v, label]) => (
              <label key={v} className="cat-option">
                <input type="checkbox" checked={natures.includes(v)} onChange={() => setNatures(toggleExclusive(natures, v))} />
                {label}
              </label>
            ))}
          </fieldset>
          <p>
            <label>
              {t.infoFrequencyLabel}{' '}
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="">{t.selectPlaceholder}</option>
                {Object.entries(t.infoFrequencyOptions).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>{' '}
            <label>
              {t.infoVolumeLabel}{' '}
              <select value={volume} onChange={(e) => setVolume(e.target.value)}>
                <option value="">{t.selectPlaceholder}</option>
                {Object.entries(t.infoVolumeOptions).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>{' '}
            <label>
              {t.infoPeriodLabel}{' '}
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="">{t.selectPlaceholder}</option>
                {Object.entries(t.infoPeriodOptions).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </p>
          <p>
            <label>
              {t.infoEducationLabel}{' '}
              <select value={education} onChange={(e) => setEducation(e.target.value)}>
                <option value="">{t.selectPlaceholder}</option>
                {Object.entries(t.infoEducationOptions).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>{' '}
            <label>
              {t.infoProfessionLabel}{' '}
              <input type="text" maxLength={200} placeholder={t.infoProfessionPlaceholder} value={profession} onChange={(e) => setProfession(e.target.value)} />
            </label>
          </p>
          <fieldset className="cat-question">
            <legend>{t.infoCrowdfundExpLabel}</legend>
            <label className="cat-option">
              <input type="radio" name="appr-crowdfund-exp" checked={crowdfundExp === 'yes'} onChange={() => setCrowdfundExp('yes')} />
              {t.yes}
            </label>
            <label className="cat-option">
              <input type="radio" name="appr-crowdfund-exp" checked={crowdfundExp === 'no'} onChange={() => setCrowdfundExp('no')} />
              {t.no}
            </label>
          </fieldset>
          <p>
            <label>
              {t.infoHoldingLabel}{' '}
              <select value={holding} onChange={(e) => setHolding(e.target.value)}>
                <option value="">{t.selectPlaceholder}</option>
                {Object.entries(t.infoHoldingOptions).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>{' '}
            <label>
              {t.infoRiskLabel}{' '}
              <select value={risk} onChange={(e) => setRisk(e.target.value)}>
                <option value="">{t.selectPlaceholder}</option>
                {Object.entries(t.infoRiskOptions).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>{' '}
            <label>
              {t.infoSustainabilityLabel}{' '}
              <select value={sustainability} onChange={(e) => setSustainability(e.target.value)}>
                <option value="">{t.selectPlaceholder}</option>
                {Object.entries(t.infoSustainabilityOptions).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </p>
          <button className="btn btn-primary" type="submit" disabled={busy || !experience || !objective || !allAnswered || !infoValid}>
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
          <p className="community-note">{assessment.information ? t.infoStatusProvided : t.infoStatusMissing}</p>
          <p className="community-note">{t.noSophisticatedNote}</p>
          <p className="community-note">{t.notFullAssessmentNote}</p>
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
              resetInfoForm();
            }}
          >
            {t.retake}
          </button>
        </div>
      )}

      {account && assessment && !retaking && (
        <div>
          <h3>{t.categorisationTitle}</h3>
          <p className="community-note">{t.categorisationNote}</p>
          <p>
            {t.categorisationStatusLabel}: <strong>{t.categorisationStatusLabels[assessment.categorisation.status]}</strong>
          </p>
          {assessment.categorisation.request ? (
            <p className="community-note">
              {tpl(t.sophRequestedAt, { date: fmtDate(assessment.categorisation.request.requestedAt) })}{' '}
              {t.sophRouteUsed[assessment.categorisation.request.route]}
            </p>
          ) : (
            <div>
              <fieldset className="cat-question">
                <legend>{t.sophRouteLabel}</legend>
                <label className="cat-option">
                  <input
                    type="radio"
                    name="soph-route"
                    checked={sophRoute === 'annex_ii_attestation'}
                    onChange={() => {
                      setSophRoute('annex_ii_attestation');
                      setSophProof('');
                    }}
                  />
                  {t.sophRouteAnnex}
                </label>
                <label className="cat-option">
                  <input
                    type="radio"
                    name="soph-route"
                    checked={sophRoute === 'mifid_professional_client'}
                    onChange={() => {
                      setSophRoute('mifid_professional_client');
                      setSophPerson('');
                      setSophCriteria([]);
                    }}
                  />
                  {t.sophRouteMifid}
                </label>
              </fieldset>
              {sophRoute === 'annex_ii_attestation' && (
                <div>
                  <fieldset className="cat-question">
                    <legend>{t.sophPersonTypeLabel}</legend>
                    <label className="cat-option">
                      <input
                        type="radio"
                        name="soph-person"
                        checked={sophPerson === 'natural'}
                        onChange={() => {
                          setSophPerson('natural');
                          setSophCriteria([]);
                        }}
                      />
                      {t.sophPersonNatural}
                    </label>
                    <label className="cat-option">
                      <input
                        type="radio"
                        name="soph-person"
                        checked={sophPerson === 'legal'}
                        onChange={() => {
                          setSophPerson('legal');
                          setSophCriteria([]);
                        }}
                      />
                      {t.sophPersonLegal}
                    </label>
                  </fieldset>
                  {sophPerson === 'natural' && (
                    <fieldset className="cat-question">
                      <legend>{t.sophCriteriaLabel}</legend>
                      <p className="community-note">{t.sophCriteriaNaturalRule}</p>
                      {Object.entries(t.sophCriteriaNatural).map(([v, label]) => (
                        <label key={v} className="cat-option">
                          <input
                            type="checkbox"
                            checked={sophCriteria.includes(v)}
                            onChange={() => setSophCriteria(sophCriteria.includes(v) ? sophCriteria.filter((x) => x !== v) : [...sophCriteria, v])}
                          />
                          {label}
                        </label>
                      ))}
                    </fieldset>
                  )}
                  {sophPerson === 'legal' && (
                    <fieldset className="cat-question">
                      <legend>{t.sophCriteriaLabel}</legend>
                      <p className="community-note">{t.sophCriteriaLegalRule}</p>
                      {Object.entries(t.sophCriteriaLegal).map(([v, label]) => (
                        <label key={v} className="cat-option">
                          <input
                            type="checkbox"
                            checked={sophCriteria.includes(v)}
                            onChange={() => setSophCriteria(sophCriteria.includes(v) ? sophCriteria.filter((x) => x !== v) : [...sophCriteria, v])}
                          />
                          {label}
                        </label>
                      ))}
                    </fieldset>
                  )}
                </div>
              )}
              {sophRoute === 'mifid_professional_client' && (
                <p>
                  <label>
                    {t.sophProofLabel}{' '}
                    <input type="text" maxLength={500} placeholder={t.sophProofPlaceholder} value={sophProof} onChange={(e) => setSophProof(e.target.value)} />
                  </label>
                </p>
              )}
              <div className="appr-warning">
                <p className="appr-warning-text">{t.sophWarning}</p>
              </div>
              <label className="cat-option">
                <input type="checkbox" checked={sophAware} onChange={(e) => setSophAware(e.target.checked)} />
                {t.sophAwareness}
              </label>
              <label className="cat-option">
                <input type="checkbox" checked={sophLiable} onChange={(e) => setSophLiable(e.target.checked)} />
                {t.sophLiability}
              </label>
              <p>
                <button className="btn btn-primary" disabled={busy || !sophValid} onClick={submitSoph}>
                  {t.sophSubmit}
                </button>
              </p>
            </div>
          )}
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
