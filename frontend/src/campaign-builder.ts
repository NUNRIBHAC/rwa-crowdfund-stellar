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

export type BuilderField = 'name' | 'slug' | 'goal' | 'deadline';
export type BuilderError = 'nameTooLong' | 'slugInvalid' | 'goalInvalid' | 'deadlinePast';

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
  if (input.goal.trim() !== '' && goalToUnits(input.goal) === null) errors.goal = 'goalInvalid';
  if (input.deadline !== '') {
    const ts = deadlineToTimestamp(input.deadline);
    if (ts === null || ts <= nowSeconds) errors.deadline = 'deadlinePast';
  }
  return errors;
}

export function builderComplete(input: { name: string; slug: string; goal: string; deadline: string }, nowSeconds: number, creator: string | null): boolean {
  return (
    input.name.length > 0 &&
    input.name.length <= BUILDER_NAME_MAX &&
    BUILDER_SLUG_RE.test(input.slug) &&
    goalToUnits(input.goal) !== null &&
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
