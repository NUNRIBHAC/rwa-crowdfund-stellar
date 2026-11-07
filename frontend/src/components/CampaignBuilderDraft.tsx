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
  validateV2Builder,
  v2BuilderComplete,
  type DeploySubmitResult,
  type V2BuilderInput,
} from '../campaign-builder';
import { tpl } from '../format';
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
  const [contractSet, setContractSet] = useState<'v1' | 'v2'>('v1');
  const [v2, setV2] = useState<V2BuilderInput>({ symbol: '', decimals: '7', minPerInvestor: '', maxPerInvestor: '' });
  const [stepNote, setStepNote] = useState('');

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

  const v2Errors = contractSet === 'v2' ? validateV2Builder(v2) : {};
  const v2ErrorText = {
    symbolInvalid: t.v2SymbolError,
    decimalsInvalid: t.v2DecimalsError,
    amountInvalid: t.v2AmountError,
    maxBelowMin: t.v2MaxBelowMinError,
  } as const;

  const complete = builderComplete(input, nowSeconds, account?.publicKey ?? null) && (contractSet === 'v1' || v2BuilderComplete(v2));
  const preview = useMemo(
    () =>
      complete
        ? contractSet === 'v2'
          ? {
              constructorArgs: {
                shareToken: { admin: account!.publicKey, name, symbol: v2.symbol, decimals: Number(v2.decimals) },
                offering: {
                  admin: account!.publicKey,
                  token: '<assigned at deployment>',
                  issuer: account!.publicKey,
                  minPerInvestor: v2.minPerInvestor,
                  maxPerInvestor: v2.maxPerInvestor,
                  goal,
                  deadline: deadlineToTimestamp(deadline)!,
                },
                wiring: 'offering is set as the share-token minter after both exist',
              },
              registryEntry: {
                id: slug,
                name,
                contractSet: 'v2',
                tokenContractId: '<assigned at deployment>',
                offeringContractId: '<assigned at deployment>',
              },
            }
          : builderPreview(input, account!.publicKey, TESTNET_USDC_SAC)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complete, contractSet, name, slug, goal, deadline, account, v2],
  );

  async function deploy() {
    if (!complete || !isOperator || busy) return;
    setBusy(true);
    setDeployError('');
    setDeployResult(null);
    try {
      setStepNote('');
      const result = await runBuilderDeploy(
        { name, slug, goal, deadline: deadlineToTimestamp(deadline)! },
        {
          build: (args) =>
            buildCampaignDeploy(token, {
              ...args,
              contractSet,
              ...(contractSet === 'v2'
                ? { v2: { symbol: v2.symbol, decimals: Number(v2.decimals), minPerInvestor: v2.minPerInvestor, maxPerInvestor: v2.maxPerInvestor } }
                : {}),
            }),
          sign: async (xdr, networkPassphrase) => {
            const r = await signTransaction(xdr, { networkPassphrase });
            if (r.error || !r.signedTxXdr) throw new Error(r.error?.message ?? t.walletNoSign);
            return r.signedTxXdr;
          },
          submit: (args) => submitCampaignDeploy(token, { ...args, contractSet }),
        },
        (step) => setStepNote(tpl(t.deployStepDone, { step })),
        contractSet === 'v2' ? 6 : 2,
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
          {t.contractSetLabel}
          <select
            value={contractSet}
            onChange={(e) => setContractSet(e.target.value === 'v2' ? 'v2' : 'v1')}
            title={contractSet === 'v2' ? t.contractSetV2 : t.contractSetV1}
          >
            <option value="v1">{t.contractSetV1}</option>
            <option value="v2">{t.contractSetV2}</option>
          </select>
          {/* The closed select clips longer translations at narrow widths; the
              full selected label stays visible here for touch users, who get
              no title hover. Uses the same translation strings, no new copy. */}
          <span className="community-note">
            {contractSet === 'v2' ? t.contractSetV2 : t.contractSetV1}
          </span>
        </label>
        {contractSet === 'v2' && (
          <>
            <label>
              {t.v2SymbolLabel}
              <input value={v2.symbol} onChange={(e) => setV2({ ...v2, symbol: e.target.value })} maxLength={12} aria-invalid={!!v2Errors.symbol} />
              {v2Errors.symbol && <span className="field-error">{v2ErrorText[v2Errors.symbol]}</span>}
            </label>
            <label>
              {t.v2DecimalsLabel}
              <input value={v2.decimals} onChange={(e) => setV2({ ...v2, decimals: e.target.value })} inputMode="numeric" aria-invalid={!!v2Errors.decimals} />
              {v2Errors.decimals && <span className="field-error">{v2ErrorText[v2Errors.decimals]}</span>}
            </label>
            <label>
              {t.v2MinLabel}
              <input
                value={v2.minPerInvestor}
                onChange={(e) => setV2({ ...v2, minPerInvestor: e.target.value })}
                inputMode="decimal"
                aria-invalid={!!v2Errors.minPerInvestor}
              />
              {v2Errors.minPerInvestor && <span className="field-error">{v2ErrorText[v2Errors.minPerInvestor]}</span>}
            </label>
            <label>
              {t.v2MaxLabel}
              <input
                value={v2.maxPerInvestor}
                onChange={(e) => setV2({ ...v2, maxPerInvestor: e.target.value })}
                inputMode="decimal"
                aria-invalid={!!v2Errors.maxPerInvestor}
              />
              {v2Errors.maxPerInvestor && <span className="field-error">{v2ErrorText[v2Errors.maxPerInvestor]}</span>}
            </label>
          </>
        )}
        <label>
          {t.creatorLabel}
          <input value={account?.publicKey ?? ''} readOnly placeholder={t.creatorPlaceholder} />
        </label>
        {contractSet === 'v1' && (
          <label>
            {t.tokenLabel}
            <input value={`Testnet USDC (${TESTNET_USDC_SAC.slice(0, 8)}…)`} readOnly />
          </label>
        )}
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
      {stepNote && !deployResult && (
        <p className="community-note" role="status">
          {stepNote}
        </p>
      )}
      {deployResult?.registryEntry && (
        <section aria-label={t.deployResultAria} className="community-note">
          <h2 className="section-title">{deployResult.registryEntry.contractSet === 'v2' ? t.deploySuccessV2 : t.deploySuccess}</h2>
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
