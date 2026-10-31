// Investor categorisation (CONDA blueprint section 7 step 3 / T&Cs §5):
// entry knowledge test + loss-bearing-capacity simulation before unrestricted
// use. Explicitly a NON-BINDING PROTOTYPE: results persist only in this
// browser (localStorage) and neither grant nor restrict access. Real ECSP
// Art. 21 gating would need backend persistence - outside this slice.
// Mount as a section on the account page.
import { useState } from 'react';
import { useI18n } from '../i18n';

const STORAGE_KEY = 'blockallisto-investor-categorisation';

export default function InvestorCategorisation() {
  const { m, locale } = useI18n();
  const t = m.categorisation;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [assets, setAssets] = useState('');
  const [income, setIncome] = useState('');
  const [planned, setPlanned] = useState('');
  const [simResult, setSimResult] = useState<string | null>(null);

  const questions = t.catQuestions;
  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);

  const check = () => {
    setChecked(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, total: questions.length, at: Date.now() }));
    } catch {
      /* private mode: no persistence */
    }
  };

  const runSim = (e: React.FormEvent) => {
    e.preventDefault();
    const a = Number(assets);
    const p = Number(planned);
    if (!Number.isFinite(a) || !Number.isFinite(p) || a <= 0 || p <= 0) return;
    setSimResult(new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format((p / a) * 100));
  };

  return (
    <section className="community-section" aria-labelledby="categorisation-title">
      <h2 id="categorisation-title" className="section-title">
        {t.catTitle} <span className="demo-badge">{m.community.demoBadge}</span>
      </h2>
      <p className="community-note">{t.catPrototypeNote}</p>

      <h3>{t.catKnowledgeTitle}</h3>
      <p className="community-note">{t.catKnowledgeIntro}</p>
      {questions.map((q, qi) => (
        <fieldset key={qi} className="cat-question">
          <legend>{q.q}</legend>
          {q.options.map((opt, oi) => (
            <label key={oi} className="cat-option">
              <input type="radio" name={`cat-q-${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers({ ...answers, [qi]: oi })} disabled={checked} />
              {opt}
            </label>
          ))}
          {checked && <p className="community-note">{q.why}</p>}
        </fieldset>
      ))}
      {!checked ? (
        <button className="btn btn-primary" disabled={Object.keys(answers).length < questions.length} onClick={check}>
          {t.catSubmit}
        </button>
      ) : (
        <>
          <p className={score === questions.length ? 'community-note' : 'community-error'} role="status">
            {t.catScoreLabel(score, questions.length)} - {score === questions.length ? t.catResultPass : t.catResultReview(questions.length - score)}
          </p>
          <button
            className="btn"
            onClick={() => {
              setAnswers({});
              setChecked(false);
            }}
          >
            {t.catRetake}
          </button>
        </>
      )}

      <h3>{t.catSimTitle}</h3>
      <p className="community-note">{t.catSimIntro}</p>
      <form onSubmit={runSim}>
        <label>
          {t.catAssetsLabel}
          <input inputMode="decimal" value={assets} onChange={(e) => setAssets(e.target.value)} required />
        </label>
        <label>
          {t.catIncomeLabel}
          <input inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)} />
        </label>
        <label>
          {t.catPlannedLabel}
          <input inputMode="decimal" value={planned} onChange={(e) => setPlanned(e.target.value)} required />
        </label>
        <button className="btn btn-primary">{t.catSimRun}</button>
      </form>
      {simResult && (
        <p role="status" className="community-note">
          {t.catSimResult({ pct: simResult })}
        </p>
      )}
      <p className="community-note">{t.catSimNote}</p>
      <p className="community-note">{t.catSavedNote}</p>
    </section>
  );
}
