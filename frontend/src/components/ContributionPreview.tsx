import { useI18n } from '../i18n';
import { contributionPreview } from '../contribution-preview';
import { fundingState } from '../funding-math';

export default function ContributionPreview({
  raised,
  goal,
  amount,
  onAmount,
}: {
  raised: string;
  goal: string;
  amount: string;
  onAmount: (value: string) => void;
}) {
  const { m } = useI18n();
  const t = m.contributionPreview;
  const preview = contributionPreview(raised, goal, amount);
  const current = fundingState(raised, goal, 100);
  const projected = preview.kind === 'ready' ? fundingState(preview.projectedUnits, goal, 100) : current;
  const fill = (s: ReturnType<typeof fundingState>) => (s.kind === 'ready' ? s.filled + s.partial : 0);
  return (
    <section className="contribution-preview" aria-label={t.title}>
      <h3>{t.title}</h3>
      <p>{t.note}</p>
      <label className="amount-label">
        {m.card.amountLabel}
        <input
          value={amount}
          onChange={(e) => onAmount(e.target.value)}
          placeholder="250.00"
          inputMode="decimal"
          aria-describedby="preview-validation preview-fees"
          aria-invalid={amount !== '' && preview.kind !== 'ready' ? true : undefined}
        />
      </label>
      <div id="preview-validation" aria-live="polite">
        {preview.kind === 'ready' ? (
          <>
            <dl className="preview-facts">
              <div>
                <dt>{t.current}</dt>
                <dd dir="ltr">{preview.current.text}%</dd>
              </div>
              <div>
                <dt>{t.share}</dt>
                <dd dir="ltr">{preview.share.text}%</dd>
              </div>
              <div>
                <dt>{t.projected}</dt>
                <dd dir="ltr">{preview.projected.text}%</dd>
              </div>
            </dl>
            <div className="preview-scale" aria-hidden="true">
              {Array.from({ length: 100 }, (_, i) => {
                const index = (9 - Math.floor(i / 10)) * 10 + (i % 10);
                const c = Math.max(0, Math.min(1, fill(current) - index));
                const p = Math.max(0, Math.min(1, fill(projected) - index));
                return (
                  <span
                    key={i}
                    className={p > c ? 'preview-addition' : ''}
                    style={{ background: `linear-gradient(to right, var(--accent) ${c * 100}%, var(--indigo-200) ${c * 100}%)` }}
                    data-projected={p > c ? true : undefined}
                  >
                    {p > c && <i style={{ left: `${c * 100}%`, width: `${(p - c) * 100}%` }} />}
                  </span>
                );
              })}
            </div>
            {(preview.current.roundedDown || preview.share.roundedDown || preview.projected.roundedDown) && <p>{t.rounding}</p>}
          </>
        ) : (
          <p>{preview.kind === 'unavailable' ? t.unavailable : preview.kind === 'over-goal' ? t.overGoal : amount ? t.invalid : null}</p>
        )}
      </div>
      <p id="preview-fees">{t.fees}</p>
      <p>{t.outcomes}</p>
    </section>
  );
}
