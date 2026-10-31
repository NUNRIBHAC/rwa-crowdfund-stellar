// DRAFT - campaign builder UI prep (reversible, not committed to a release).
// This form NEVER deploys: it mirrors the real validation rules of the
// crowdfund contract constructor and the campaign registry (shared, tested
// logic in campaign-builder.ts), and shows the exact parameters a deployment
// would use. The deploy action is disabled - campaign creation is an operator
// decision outside this demo, and this preview is not an open listing form.
import { useMemo, useState } from 'react';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';
import { BUILDER_NAME_MAX, builderComplete, builderPreview, validateBuilder } from '../campaign-builder';

// Testnet USDC SAC; decimals() = 7 verified against the live contract.
const TESTNET_USDC_SAC = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

export default function CampaignBuilderDraft() {
  const { m } = useI18n();
  const t = m.builder;
  const { account } = useCommunityAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [industry, setIndustry] = useState('energy-utilities');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');

  const industryLabels = (m.invest as { industryLabels?: Record<string, string> }).industryLabels ?? {};
  const input = { name, slug, goal, deadline };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const errors = validateBuilder(input, nowSeconds);
  const errorText = {
    nameTooLong: t.nameErrorTooLong,
    slugInvalid: t.slugErrorInvalid,
    goalInvalid: t.goalErrorInvalid,
    deadlinePast: t.deadlineErrorPast,
  } as const;

  const complete = builderComplete(input, nowSeconds, account?.publicKey ?? null);
  const preview = useMemo(
    () => (complete ? builderPreview(input, account!.publicKey, TESTNET_USDC_SAC) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complete, name, slug, goal, deadline, account],
  );

  return (
    <div className="page">
      <h1 className="page-title">
        {t.title} <span className="demo-badge">{t.badge}</span>
      </h1>
      <p>{t.intro}</p>
      {!account && <p className="community-note">{t.connectNote}</p>}
      <form className="issuer-form" onSubmit={(e) => e.preventDefault()}>
        <label>
          {t.nameLabel}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={BUILDER_NAME_MAX} aria-invalid={!!errors.name} />
          {errors.name && <span className="field-error">{errorText[errors.name]}</span>}
        </label>
        <label>
          {t.slugLabel}
          <input value={slug} onChange={(e) => setSlug(e.target.value)} aria-invalid={!!errors.slug} placeholder={t.slugPlaceholder} />
          {errors.slug && <span className="field-error">{errorText[errors.slug]}</span>}
        </label>
        <label>
          {t.industryLabel}
          <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {Object.entries(industryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.goalLabel}
          <input value={goal} onChange={(e) => setGoal(e.target.value)} inputMode="decimal" aria-invalid={!!errors.goal} placeholder={t.goalPlaceholder} />
          {errors.goal && <span className="field-error">{errorText[errors.goal]}</span>}
        </label>
        <label>
          {t.deadlineLabel}
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-invalid={!!errors.deadline} />
          <span className="community-note">{t.deadlineNote}</span>
          {errors.deadline && <span className="field-error">{errorText[errors.deadline]}</span>}
        </label>
        <label>
          {t.creatorLabel}
          <input value={account?.publicKey ?? ''} readOnly placeholder={t.creatorPlaceholder} />
        </label>
        <label>
          {t.tokenLabel}
          <input value={`Testnet USDC (${TESTNET_USDC_SAC.slice(0, 8)}…)`} readOnly />
        </label>
      </form>
      {preview && (
        <section aria-label={t.previewAria} className="community-note">
          <h2 className="section-title">{t.previewTitle}</h2>
          <p>{t.previewConstructor}</p>
          <pre className="builder-preview-json">{JSON.stringify(preview.constructorArgs, null, 2)}</pre>
          <p>{t.previewRegistry}</p>
          <pre className="builder-preview-json">{JSON.stringify(preview.registryEntry, null, 2)}</pre>
        </section>
      )}
      <button type="button" className="builder-deploy-disabled" disabled>
        {t.deployDisabled}
      </button>
    </div>
  );
}
