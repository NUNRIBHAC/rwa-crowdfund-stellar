/** Deterministic monthly educational stress model, not a probability forecast.
 * Independent from CrowdIndex compatibility arithmetic and regulatory assessment.
 * Taxes apply to positive interest received, with no assumed loss/fee deduction.
 */
export type PortfolioInputs = {
  amount: number;
  months: number;
  annualCouponPct: number;
  idleCashPct: number;
  annualDefaultPct: number;
  recoveryPct: number;
  recoveryDelayMonths: number;
  annualFeePct: number;
  taxPct: number;
  inflationPct: number;
  reinvest: boolean;
  /** Deterministic failure at the start of this month, 0 disables it. */
  platformFailureMonth: number;
  platformExposurePct: number;
  platformRecoveryPct: number;
  platformRecoveryDelayMonths: number;
  /** Additional borrower stress at start of month one. Not annual probability. */
  immediateDefaultPct: number;
};
export const PORTUGAL_STANDARD_CAPITAL_TAX = {
  ratePct: 28,
  verifiedOn: '2026-11-23',
  year: 2026,
  source: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Folhetos_informativos/Documents/SFP-Taxas-2026.pdf',
} as const;
export type CashFlowRow = {
  month: number;
  performing: number;
  idle: number;
  paidOut: number;
  pendingRecovery: number;
  interest: number;
  tax: number;
  fees: number;
  principalLost: number;
  recovered: number;
  nominalWealth: number;
  liquidAndPerforming: number;
};
function validate(x: PortfolioInputs) {
  for (const v of Object.values(x)) if (typeof v !== 'boolean' && !Number.isFinite(v)) throw new RangeError('Non-finite portfolio input');
  if (!(x.amount > 0 && x.amount <= 1e12) || !Number.isInteger(x.months) || x.months < 1 || x.months > 1200 || typeof x.reinvest !== 'boolean')
    throw new RangeError('Unsupported principal or term');
  for (const v of [
    x.annualCouponPct,
    x.idleCashPct,
    x.annualDefaultPct,
    x.recoveryPct,
    x.annualFeePct,
    x.taxPct,
    x.platformExposurePct,
    x.platformRecoveryPct,
    x.immediateDefaultPct,
  ]) {
    if (v < 0 || v > 100) throw new RangeError('Percentage outside 0 to 100');
  }
  if (x.inflationPct <= -100 || x.inflationPct > 100) throw new RangeError('Invalid inflation');
  for (const v of [x.platformFailureMonth, x.platformRecoveryDelayMonths, x.recoveryDelayMonths]) {
    if (!Number.isInteger(v) || v < 0 || v > 1200) throw new RangeError('Invalid month');
  }
}
function path(x: PortfolioInputs): CashFlowRow[] {
  let performing = x.amount * (1 - x.idleCashPct / 100),
    idle = x.amount - performing,
    paidOut = 0;
  let pending: { due: number; amount: number }[] = [];
  const coupon = Math.pow(1 + x.annualCouponPct / 100, 1 / 12) - 1;
  const hazard = 1 - Math.pow(1 - x.annualDefaultPct / 100, 1 / 12);
  const rows: CashFlowRow[] = [];
  for (let month = 1; month <= x.months; month++) {
    let principalLost = 0,
      recovered = 0;
    const defaultPrincipal = performing * (month === 1 ? x.immediateDefaultPct / 100 : 0);
    performing -= defaultPrincipal;
    principalLost += defaultPrincipal * (1 - x.recoveryPct / 100);
    if (defaultPrincipal) pending.push({ due: month + x.recoveryDelayMonths, amount: (defaultPrincipal * x.recoveryPct) / 100 });
    // The platform shock precedes ordinary borrower defaults, so no euro defaults twice.
    if (month === x.platformFailureMonth) {
      const fraction = x.platformExposurePct / 100;
      const affected = (performing + idle) * fraction;
      performing *= 1 - fraction;
      idle *= 1 - fraction;
      principalLost += affected * (1 - x.platformRecoveryPct / 100);
      pending.push({ due: month + x.platformRecoveryDelayMonths, amount: (affected * x.platformRecoveryPct) / 100 });
      // Previously defaulted receivables are not exposed a second time in this simplified shock.
    }
    const defaults = performing * hazard;
    performing -= defaults;
    principalLost += defaults * (1 - x.recoveryPct / 100);
    if (defaults) pending.push({ due: month + x.recoveryDelayMonths, amount: (defaults * x.recoveryPct) / 100 });
    recovered = pending.filter((p) => p.due <= month).reduce((sum, p) => sum + p.amount, 0);
    pending = pending.filter((p) => p.due > month);
    const interest = performing * coupon;
    const tax = (interest * x.taxPct) / 100;
    // Fee applies to performing principal after this month's shocks/defaults.
    const fees = Math.min(performing + idle + interest - tax + recovered, (performing * x.annualFeePct) / 1200);
    const netIncome = interest - tax;
    if (x.reinvest) {
      const available = Math.max(0, performing + idle + netIncome + recovered - fees);
      idle = (available * x.idleCashPct) / 100;
      performing = available - idle;
    } else {
      paidOut += netIncome;
      idle += recovered;
      const fromIdle = Math.min(idle, fees);
      idle -= fromIdle;
      performing = Math.max(0, performing - (fees - fromIdle));
    }
    const pendingRecovery = pending.reduce((sum, p) => sum + p.amount, 0);
    const liquidAndPerforming = performing + idle + paidOut;
    rows.push({
      month,
      performing,
      idle,
      paidOut,
      pendingRecovery,
      interest,
      tax,
      fees,
      principalLost,
      recovered,
      nominalWealth: liquidAndPerforming + pendingRecovery,
      liquidAndPerforming,
    });
  }
  return rows;
}
export function calculatePortfolio(x: PortfolioInputs) {
  validate(x);
  const rows = path(x),
    final = rows.at(-1)!;
  const sum = (key: 'interest' | 'tax' | 'fees' | 'principalLost' | 'recovered') => rows.reduce((a, r) => a + r[key], 0);
  const grossInterestReceived = sum('interest'),
    tax = sum('tax'),
    fees = sum('fees'),
    principalLost = sum('principalLost');
  const inflationFactor = Math.pow(1 + x.inflationPct / 100, x.months / 12);
  const realWealth = final.nominalWealth / inflationFactor;
  if (![final.nominalWealth, realWealth].every(Number.isFinite)) throw new RangeError('Result outside supported range');
  // Counterfactual waterfall is order-sensitive. Every difference reconciles, not an independent risk estimate.
  const clean = { ...x, idleCashPct: 0, annualDefaultPct: 0, immediateDefaultPct: 0, platformFailureMonth: 0, annualFeePct: 0, taxPct: 0 };
  const configs = [
    clean,
    { ...clean, idleCashPct: x.idleCashPct },
    { ...clean, idleCashPct: x.idleCashPct, annualDefaultPct: x.annualDefaultPct, immediateDefaultPct: x.immediateDefaultPct },
    { ...x, annualFeePct: 0, taxPct: 0 },
    { ...x, taxPct: 0 },
    x,
  ];
  const values = configs.map((c) => path(c).at(-1)!.nominalWealth);
  const waterfall = {
    gross: values[0],
    idleCashEffect: values[0] - values[1],
    borrowerEffect: values[1] - values[2],
    platformEffect: values[2] - values[3],
    feeEffect: values[3] - values[4],
    taxEffect: values[4] - values[5],
    final: values[5],
  };
  return {
    rows,
    final,
    grossInterestReceived,
    tax,
    fees,
    principalLost,
    recovered: sum('recovered'),
    gain: final.nominalWealth - x.amount,
    realWealth,
    inflationEffect: final.nominalWealth - realWealth,
    waterfall,
  };
}
