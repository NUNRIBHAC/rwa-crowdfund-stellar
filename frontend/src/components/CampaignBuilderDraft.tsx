// DRAFT - campaign builder (reversible, not committed to a release).
// The form mirrors the real validation rules of the crowdfund contract
// constructor and the campaign registry (shared, tested logic in
// campaign-builder.ts) and shows the exact parameters a deployment uses.
// For OPERATOR wallets only, deployment is live on testnet: the two-step
// flow (upload reviewed contract code, then create the instance) prepares
// unsigned transactions server-side that the operator's own wallet signs
// with Freighter - the server holds no key. The created contract is NOT
// listed automatically: the returned registry entry must be added to
// SOROBAN_CAMPAIGNS_JSON by hand. For everyone else the button stays
// disabled; campaign creation is an operator decision, not an open form.
import { useMemo, useState } from 'react';
import { signTransaction } from '@stellar/freighter-api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';
import {
  BUILDER_NAME_MAX,
  builderComplete,
  builderPreview,
  deadlineToTimestamp,
  runBuilderDeploy,
  validateBuilder,
  type DeploySubmitResult,
} from '../campaign-builder';
import { buildCampaignDeploy, submitCampaignDeploy } from '../community/api';

// Testnet USDC SAC; decimals() = 7 verified against the live contract.
const TESTNET_USDC_SAC = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

export default function CampaignBuilderDraft() {
  const { m } = useI18n();
  const t = m.builder;
  const { account, token, isOperator } = useCommunityAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [industry, setIndustry] = useState('energy-utilities');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [deployError, setDeployError] = useState('');
  const [deployResult, setDeployResult] = useState<DeploySubmitResult | null>(null);

  const industryLabels = (m.invest as { industryLabels?: Record<string, string> }).industryLabels ?? {};
  const input = { name, slug, goal, deadline };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const errors = validateBuilder(input, nowSeconds);
  const errorText = {
    nameTooLong: t.nameErrorTooLong,
    slugInvalid: t.slugErrorInvalid,
    goalInvalid: t.goalErrorInvalid,
    goalOutOfRange: t.goalErrorRange,
    deadlinePast: t.deadlineErrorPast,
  } as const;

  const complete = builderComplete(input, nowSeconds, account?.publicKey ?? null);
  const preview = useMemo(
    () => (complete ? builderPreview(input, account!.publicKey, TESTNET_USDC_SAC) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complete, name, slug, goal, deadline, account],
  );

  async function deploy() {
    if (!complete || !isOperator || busy) return;
    setBusy(true);
    setDeployError('');
    setDeployResult(null);
    try {
      const result = await runBuilderDeploy(
        { name, slug, goal, deadline: deadlineToTimestamp(deadline)! },
        {
          build: (args) => buildCampaignDeploy(token, args),
          sign: async (xdr, networkPassphrase) => {
            const r = await signTransaction(xdr, { networkPassphrase });
            if (r.error || !r.signedTxXdr) throw new Error(r.error?.message ?? t.walletNoSign);
            return r.signedTxXdr;
          },
          submit: (args) => submitCampaignDeploy(token, args),
        },
      );
      setDeployResult(result);
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">
        {t.title} <span className="demo-badge">{t.badge}</span>
      </h1>
      <p>{t.intro}</p>
      {isOperator && <p className="community-note">{t.operatorNote}</p>}
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
      {preview && !deployResult && (
        <section aria-label={t.previewAria} className="community-note">
          <h2 className="section-title">{t.previewTitle}</h2>
          <p>{t.previewConstructor}</p>
          <pre className="builder-preview-json">{JSON.stringify(preview.constructorArgs, null, 2)}</pre>
          <p>{t.previewRegistry}</p>
          <pre className="builder-preview-json">{JSON.stringify(preview.registryEntry, null, 2)}</pre>
        </section>
      )}
      {deployError && (
        <p className="field-error" role="alert">
          {t.deployError} {deployError}
        </p>
      )}
      {deployResult?.registryEntry && (
        <section aria-label={t.deployResultAria} className="community-note">
          <h2 className="section-title">{t.deploySuccess}</h2>
          <p>{t.deployRegistryNote}</p>
          <pre className="builder-preview-json">{JSON.stringify(deployResult.registryEntry, null, 2)}</pre>
        </section>
      )}
      {deployResult && !deployResult.registryEntry && <p className="community-note">{deployResult.message ?? deployResult.status}</p>}
      <button type="button" className={isOperator && complete ? '' : 'builder-deploy-disabled'} disabled={!isOperator || !complete || busy} onClick={deploy}>
        {busy ? t.deployBusy : isOperator ? t.deploy : t.deployDisabled}
      </button>
    </div>
  );
}
