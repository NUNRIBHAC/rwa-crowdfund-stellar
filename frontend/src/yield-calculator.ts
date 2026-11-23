/** Original scenario arithmetic. Rates are annual effective percentages.
 * Reference compatibility is an explicit choice, never a capital guarantee.
 * No backend, wallet, order or persistence side effects.
 */
export type YieldScenario = 'optimistic' | 'base' | 'pessimistic';
export type YieldStrategy = 'reinvest' | 'withdraw';
export const ILLUSTRATIVE_DISCOUNTS: Readonly<Record<YieldScenario, number>> = {
  optimistic: 0.5,
  base: 2.5,
  pessimistic: 6,
};
export type YieldInputs = {
  amount: number;
  annualRatePct: number;
  months: number;
  strategy: YieldStrategy;
  scenario: YieldScenario;
  realTerms: boolean;
  inflationPct?: number;
  discountPp?: number;
  etfRatePct?: number;
  depositRatePct?: number;
  /** Matches the external reference's zero-yield floor, not a loss model. */
  referenceZeroFloor?: boolean;
};
export function calculateYield(input: YieldInputs) {
  const { amount, annualRatePct, months, strategy, scenario, realTerms } = input;
  const inflation = input.inflationPct ?? 2;
  const discount = input.discountPp ?? ILLUSTRATIVE_DISCOUNTS[scenario];
  const etfRate = input.etfRatePct ?? 7;
  const depositRate = input.depositRatePct ?? 2.5;
  for (const n of [amount, annualRatePct, months, inflation, discount, etfRate, depositRate]) {
    if (!Number.isFinite(n)) throw new RangeError('Non-finite calculation input');
  }
  if (
    amount <= 0 ||
    amount > 1e12 ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > 1200 ||
    annualRatePct <= -100 ||
    annualRatePct > 100 ||
    inflation <= -100 ||
    inflation > 100 ||
    discount < 0 ||
    discount > 100 ||
    etfRate <= -100 ||
    etfRate > 100 ||
    depositRate <= -100 ||
    depositRate > 100 ||
    !['reinvest', 'withdraw'].includes(strategy) ||
    !Object.hasOwn(ILLUSTRATIVE_DISCOUNTS, scenario) ||
    typeof realTerms !== 'boolean'
  ) {
    throw new RangeError('Calculation input outside supported range');
  }
  const adjusted = annualRatePct - discount;
  const effectiveRatePct = input.referenceZeroFloor ? Math.max(0, adjusted) : adjusted;
  if (effectiveRatePct <= -100) throw new RangeError('Adjusted annual yield must exceed -100%');
  const valueAt = (ratePct: number, month: number, compound: boolean) => {
    const years = month / 12;
    const nominal = amount * (compound ? Math.pow(1 + ratePct / 100, years) : 1 + (ratePct / 100) * years);
    const value = nominal / (realTerms ? Math.pow(1 + inflation / 100, years) : 1);
    if (!Number.isFinite(value)) throw new RangeError('Calculation result outside supported range');
    return value;
  };
  const projected = valueAt(effectiveRatePct, months, strategy === 'reinvest');
  const grossSameStrategy = valueAt(annualRatePct, months, strategy === 'reinvest');
  const etf = valueAt(etfRate, months, true);
  const deposit = valueAt(depositRate, months, true);
  const nominalMonthlyIncome = (amount * effectiveRatePct) / 1200;
  const annualizedPct = projected > 0 ? (Math.pow(projected / amount, 12 / months) - 1) * 100 : null;
  const series = Array.from({ length: months + 1 }, (_, month) => ({
    month,
    projected: valueAt(effectiveRatePct, month, strategy === 'reinvest'),
    etf: valueAt(etfRate, month, true),
    deposit: valueAt(depositRate, month, true),
  }));
  return {
    projected,
    gain: projected - amount,
    grossSameStrategy,
    scenarioReduction: grossSameStrategy - projected,
    effectiveRatePct,
    annualizedPct,
    nominalMonthlyIncome,
    etf,
    deposit,
    series,
    zeroFloorApplied: input.referenceZeroFloor === true && adjusted < 0,
  };
}
