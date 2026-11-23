import { expect, test } from 'vitest';
import { calculatePortfolio, type PortfolioInputs } from './portfolio-return';
const base: PortfolioInputs = {
  amount: 10000,
  months: 12,
  annualCouponPct: 12,
  idleCashPct: 0,
  annualDefaultPct: 0,
  recoveryPct: 0,
  recoveryDelayMonths: 0,
  annualFeePct: 0,
  taxPct: 28,
  inflationPct: 2,
  reinvest: true,
  platformFailureMonth: 0,
  platformExposurePct: 100,
  platformRecoveryPct: 0,
  platformRecoveryDelayMonths: 0,
  immediateDefaultPct: 0,
};
test('mandatory tax is applied monthly to positive interest without loss offsets', () => {
  const r = calculatePortfolio(base);
  const m = (1.12 ** (1 / 12) - 1) * 0.72;
  expect(r.final.nominalWealth).toBeCloseTo(10000 * (1 + m) ** 12, 7);
  expect(r.tax).toBeCloseTo(r.grossInterestReceived * 0.28, 9);
  expect(() => calculatePortfolio({ ...base, taxPct: undefined } as unknown as PortfolioInputs)).toThrow();
});
test('zero tax input is explicit, never omitted by the model', () => {
  expect(calculatePortfolio({ ...base, taxPct: 0 }).final.nominalWealth).toBeCloseTo(11200, 7);
});
test('100% idle earns no coupon and has no assumed deposit interest', () => {
  expect(calculatePortfolio({ ...base, idleCashPct: 100 }).final.nominalWealth).toBe(10000);
});
test('half default stress with no recovery removes exactly half the principal before interest', () => {
  const x = { ...base, annualCouponPct: 0, immediateDefaultPct: 50 };
  const r = calculatePortfolio(x);
  expect(r.final.nominalWealth).toBe(5000);
  expect(r.principalLost).toBe(5000);
});
test('default recovery after horizon is receivable, not cash, and earns no coupon', () => {
  const r = calculatePortfolio({ ...base, months: 1, annualCouponPct: 0, immediateDefaultPct: 50, recoveryPct: 40, recoveryDelayMonths: 12 });
  expect(r.final.pendingRecovery).toBe(2000);
  expect(r.final.liquidAndPerforming).toBe(5000);
  expect(r.final.nominalWealth).toBe(7000);
  expect(r.principalLost).toBe(3000);
});
test('platform failure affects exposed idle and performing balances once', () => {
  const r = calculatePortfolio({
    ...base,
    annualCouponPct: 0,
    idleCashPct: 20,
    platformFailureMonth: 1,
    platformExposurePct: 50,
    platformRecoveryPct: 20,
    platformRecoveryDelayMonths: 0,
  });
  expect(r.final.nominalWealth).toBeCloseTo(6000, 9);
  expect(r.principalLost).toBe(4000);
});
test('100% failure and no recovery permits total loss without fabricated negative cash', () => {
  const r = calculatePortfolio({ ...base, platformFailureMonth: 1 });
  expect(r.final.nominalWealth).toBe(0);
  expect(r.tax).toBe(0);
  expect(r.gain).toBe(-10000);
});
test('annual default100% is finite and does not duplicate an immediate default', () => {
  const r = calculatePortfolio({ ...base, annualDefaultPct: 100, immediateDefaultPct: 50 });
  expect(r.principalLost).toBe(10000);
  expect(r.final.nominalWealth).toBe(0);
});
test('withdrawal conserves principal plus cumulative payouts and capitalized tax is absent', () => {
  const r = calculatePortfolio({ ...base, reinvest: false });
  expect(r.final.performing).toBe(10000);
  expect(r.final.paidOut).toBeCloseTo(10000 * (1.12 ** (1 / 12) - 1) * 0.72 * 12, 8);
});
test('monthly ledger and counterfactual waterfall reconcile under216 distinct stresses', () => {
  for (const taxPct of [0, 19.6, 28])
    for (const idleCashPct of [0, 10, 100])
      for (const annualDefaultPct of [0, 5, 100])
        for (const reinvest of [false, true])
          for (const platformFailureMonth of [0, 1])
            for (const recoveryPct of [0, 50]) {
              const x = {
                ...base,
                taxPct,
                idleCashPct,
                annualDefaultPct,
                reinvest,
                platformFailureMonth,
                recoveryPct,
                annualFeePct: 1,
                immediateDefaultPct: 50,
                recoveryDelayMonths: 2,
              };
              const r = calculatePortfolio(x),
                w = r.waterfall;
              expect(w.gross - w.idleCashEffect - w.borrowerEffect - w.platformEffect - w.feeEffect - w.taxEffect).toBeCloseTo(w.final, 7);
              expect(x.amount + r.grossInterestReceived - r.tax - r.fees - r.principalLost).toBeCloseTo(r.final.nominalWealth, 7);
              expect(r.realWealth).toBeCloseTo(r.final.nominalWealth / 1.02, 7);
              expect(r.rows.every((m) => m.performing >= 0 && m.idle >= 0 && m.pendingRecovery >= 0)).toBe(true);
            }
});
test.each([-1, 101, NaN, Infinity])('rejects invalid tax%s', (taxPct) => expect(() => calculatePortfolio({ ...base, taxPct })).toThrow());

test('delayed recoveries and platform shock conserve every monthly ledger entry', () => {
  const x = {
    ...base,
    annualDefaultPct: 13,
    recoveryPct: 44,
    recoveryDelayMonths: 5,
    platformFailureMonth: 3,
    platformExposurePct: 31,
    platformRecoveryPct: 23,
    platformRecoveryDelayMonths: 8,
    idleCashPct: 9,
    annualFeePct: 2,
    immediateDefaultPct: 50,
    months: 24,
  };
  const r = calculatePortfolio(x);
  let prior = x.amount;
  for (const row of r.rows) {
    expect(prior + row.interest - row.tax - row.fees - row.principalLost).toBeCloseTo(row.nominalWealth, 7);
    prior = row.nominalWealth;
  }
  expect(r.final.pendingRecovery).toBeGreaterThan(0);
});
test('same-month full borrower recovery is reinvestable only after this month coupon', () => {
  const r = calculatePortfolio({ ...base, months: 1, annualDefaultPct: 100, recoveryPct: 100, recoveryDelayMonths: 0 });
  expect(r.grossInterestReceived).toBe(0);
  expect(r.final.nominalWealth).toBe(10000);
});
