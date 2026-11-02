// Campaign-builder draft: pure validation + parameter derivation, kept free of
// React so the rules can be tested at their boundaries. Mirrors the contract
// constructor (contracts/crowdfund/src/lib.rs) and the registry rules in
// backend/src/soroban.ts. Nothing here deploys anything.
//
// Units: the testnet USDC SAC (CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA)
// reports decimals() = 7 (verified against the live contract). Amounts are
// parsed exactly as decimal strings into BigInt base units - never through
// floating point - and at most 7 decimal places are accepted, matching
// contributionError in format.ts.

export const BUILDER_SLUG_RE = /^[a-zA-Z0-9_-]{1,48}$/;
export const BUILDER_NAME_MAX = 120;
export const TOKEN_DECIMALS = 7;
export const DECIMAL_FACTOR = 10_000_000n;
// The constructor takes goal: i128, so base units must fit the i128 range.
export const GOAL_UNITS_MAX = 170141183460469231731687303715884105727n; // 2^127 - 1

export type BuilderField = 'name' | 'slug' | 'goal' | 'deadline';
export type BuilderError = 'nameTooLong' | 'slugInvalid' | 'goalInvalid' | 'goalOutOfRange' | 'deadlinePast';

/** Exact decimal-string to base-units conversion; null when not a positive
 *  amount with at most TOKEN_DECIMALS decimal places. */
export function goalToUnits(goal: string): bigint | null {
  const v = goal.trim();
  if (!/^\d+(\.\d{1,7})?$/.test(v)) return null;
  const [whole, fraction = ''] = v.split('.');
  const units = BigInt(whole) * DECIMAL_FACTOR + BigInt((fraction + '0000000').slice(0, TOKEN_DECIMALS));
  return units > 0n ? units : null;
}

/** A date-only deadline is interpreted as 00:00 UTC on that calendar day, so
 *  the meaning does not depend on the visitor's timezone. The contract
 *  requires deadline > now, so today's date is already too late at 00:00 UTC. */
export function deadlineToTimestamp(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const ms = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(ms) ? ms / 1000 : null;
}

export function validateBuilder(
  input: { name: string; slug: string; goal: string; deadline: string },
  nowSeconds: number,
): Partial<Record<BuilderField, BuilderError>> {
  const errors: Partial<Record<BuilderField, BuilderError>> = {};
  if (input.name.length > BUILDER_NAME_MAX) errors.name = 'nameTooLong';
  if (input.slug !== '' && !BUILDER_SLUG_RE.test(input.slug)) errors.slug = 'slugInvalid';
  if (input.goal.trim() !== '') {
    const units = goalToUnits(input.goal);
    if (units === null) errors.goal = 'goalInvalid';
    else if (units > GOAL_UNITS_MAX) errors.goal = 'goalOutOfRange';
  }
  if (input.deadline !== '') {
    const ts = deadlineToTimestamp(input.deadline);
    if (ts === null || ts <= nowSeconds) errors.deadline = 'deadlinePast';
  }
  return errors;
}

// --- v2 contract set (share token + offering) ---
// Mirrors validateV2Params in backend/src/soroban.ts; the server re-checks
// every rule before building anything.
export const V2_SYMBOL_RE = /^[A-Za-z0-9]{1,12}$/;
export const V2_DECIMALS_MAX = 18;
export type V2BuilderInput = { symbol: string; decimals: string; minPerInvestor: string; maxPerInvestor: string };
export type V2BuilderField = 'symbol' | 'decimals' | 'minPerInvestor' | 'maxPerInvestor';
export type V2BuilderError = 'symbolInvalid' | 'decimalsInvalid' | 'amountInvalid' | 'maxBelowMin';

export function validateV2Builder(input: V2BuilderInput): Partial<Record<V2BuilderField, V2BuilderError>> {
  const errors: Partial<Record<V2BuilderField, V2BuilderError>> = {};
  if (input.symbol !== '' && !V2_SYMBOL_RE.test(input.symbol)) errors.symbol = 'symbolInvalid';
  if (input.decimals !== '' && !/^(0|[1-9]\d{0,1})$/.test(input.decimals)) errors.decimals = 'decimalsInvalid';
  else if (input.decimals !== '' && Number(input.decimals) > V2_DECIMALS_MAX) errors.decimals = 'decimalsInvalid';
  const min = input.minPerInvestor.trim() === '' ? null : goalToUnits(input.minPerInvestor);
  const max = input.maxPerInvestor.trim() === '' ? null : goalToUnits(input.maxPerInvestor);
  if (input.minPerInvestor.trim() !== '' && min === null) errors.minPerInvestor = 'amountInvalid';
  if (input.maxPerInvestor.trim() !== '' && max === null) errors.maxPerInvestor = 'amountInvalid';
  if (min !== null && max !== null && max < min) errors.maxPerInvestor = 'maxBelowMin';
  return errors;
}

export function v2BuilderComplete(input: V2BuilderInput): boolean {
  return (
    V2_SYMBOL_RE.test(input.symbol) &&
    /^(0|([1-9]\d{0,1}))$/.test(input.decimals) &&
    Number(input.decimals) <= V2_DECIMALS_MAX &&
    goalToUnits(input.minPerInvestor) !== null &&
    goalToUnits(input.maxPerInvestor) !== null &&
    goalToUnits(input.maxPerInvestor)! >= goalToUnits(input.minPerInvestor)!
  );
}

export function builderComplete(input: { name: string; slug: string; goal: string; deadline: string }, nowSeconds: number, creator: string | null): boolean {
  return (
    input.name.length > 0 &&
    input.name.length <= BUILDER_NAME_MAX &&
    BUILDER_SLUG_RE.test(input.slug) &&
    goalToUnits(input.goal) !== null &&
    goalToUnits(input.goal)! <= GOAL_UNITS_MAX &&
    (deadlineToTimestamp(input.deadline) ?? 0) > nowSeconds &&
    creator !== null
  );
}

export function builderPreview(
  input: { name: string; slug: string; goal: string; deadline: string },
  creator: string,
  token: string,
): { constructorArgs: { creator: string; token: string; goal: string; deadline: number }; registryEntry: { id: string; name: string; contractId: string } } {
  return {
    constructorArgs: {
      creator,
      token,
      goal: goalToUnits(input.goal)!.toString(),
      deadline: deadlineToTimestamp(input.deadline)!,
    },
    registryEntry: { id: input.slug, name: input.name, contractId: '<assigned at deployment>' },
  };
}

// --- Deployment orchestration ---
// Two-step, wallet-signed deployment against the operator API: step 1
// uploads the reviewed contract code (skipped by the server once the code
// hash exists on the ledger), step 2 creates the campaign instance. The
// signer callback is the ONLY place a wallet is asked to sign; the flow
// never holds or sees a secret key. Dependencies are injected so the
// sequence is testable without network or wallet.
export type DeployBuildResult = { xdr: string; networkPassphrase: string; step: string };
export type DeploySubmitResult = {
  step: string;
  status: string;
  confirmed: boolean;
  contractId?: string;
  complete?: boolean;
  tokenContractId?: string;
  offeringContractId?: string;
  registryEntry?: { id: string; name: string; contractId?: string; contractSet?: string; tokenContractId?: string; offeringContractId?: string };
  note?: string;
  message?: string;
};
// The loop is result-driven: any SUCCESS+confirmed submit that carries no
// final registryEntry means "build again for the next step" (the server
// derives progress from its journal). v1 needs at most 2 builds (upload,
// create); the v2 chain needs at most 5 (two uploads, two creates,
// set-minter) plus one spare for a same-step retry after a FAILED step.
export async function runBuilderDeploy(
  input: { name: string; slug: string; goal: string; deadline: number },
  deps: {
    build: (input: { id: string; name: string; goal: string; deadline: number }) => Promise<DeployBuildResult>;
    sign: (xdr: string, networkPassphrase: string) => Promise<string>;
    submit: (input: { xdr: string; name: string }) => Promise<DeploySubmitResult>;
  },
  onStep?: (step: string) => void,
  maxBuilds = 2,
): Promise<DeploySubmitResult> {
  const buildInput = () => ({ id: input.slug, name: input.name, goal: input.goal, deadline: input.deadline });
  let built = await deps.build(buildInput());
  for (let attempt = 0; attempt < maxBuilds; attempt++) {
    const signedXdr = await deps.sign(built.xdr, built.networkPassphrase);
    const result = await deps.submit({ xdr: signedXdr, name: input.name });
    if (result.status === 'SUCCESS' && result.confirmed && !result.registryEntry && !result.complete) {
      onStep?.(result.step === 'upload' ? 'uploaded' : result.step);
      built = await deps.build(buildInput());
      continue;
    }
    return result;
  }
  throw new Error(
    maxBuilds <= 2 ? 'deployment did not reach the create step after the code upload' : 'deployment did not complete within the expected number of steps',
  );
}
