import { describe, expect, test } from 'vitest';
import { calculateYield, type YieldInputs } from './yield-calculator';
import reference from './yield-calculator.reference.json';
const base: YieldInputs = { amount: 50000, annualRatePct: 12, months: 24, strategy: 'reinvest', scenario: 'base', realTerms: false };
describe('black-box reference parity, observed 2026-11-23', () => {
  test.each(reference.map((row, i) => ({ ...row, i })))(
    'reference case $i',
    ({ projectedRounded, gainRounded, annualizedOneDecimal, monthlyRounded, etfRounded, depositRounded, ...row }) => {
      const result = calculateYield({ ...row, referenceZeroFloor: true } as YieldInputs);
      expect(Math.round(result.projected)).toBe(projectedRounded);
      expect(Math.round(result.gain)).toBe(gainRounded);
      expect(Number(result.annualizedPct!.toFixed(1))).toBe(annualizedOneDecimal);
      expect(Math.round(result.etf)).toBe(etfRounded);
      expect(Math.round(result.deposit)).toBe(depositRounded);
      if (monthlyRounded !== null) expect(Math.round(result.nominalMonthlyIncome)).toBe(monthlyRounded);
    },
  );
});
test('annual effective compounding and simple withdrawals use different conventions', () => {
  expect(calculateYield(base).projected).toBeCloseTo(50000 * 1.095 ** 2, 8);
  const r = calculateYield({ ...base, strategy: 'withdraw' });
  expect(r.projected).toBe(59500);
  expect(r.nominalMonthlyIncome).toBeCloseTo((50000 * 0.095) / 12, 8);
});
test('inflation discounts the whole portfolio, not only interest', () => {
  expect(calculateYield({ ...base, realTerms: true }).projected).toBeCloseTo(calculateYield(base).projected / 1.02 ** 2, 8);
});
test('negative adjusted yields remain negative unless reference floor explicitly requested', () => {
  const x = { ...base, amount: 1000, annualRatePct: 4, months: 3, scenario: 'pessimistic' } as const;
  expect(calculateYield(x).projected).toBeLessThan(1000);
  expect(calculateYield({ ...x, referenceZeroFloor: true }).projected).toBe(1000);
  expect(calculateYield({ ...x, referenceZeroFloor: true }).zeroFloorApplied).toBe(true);
});
test('all 120 supported term points reconcile to independent calculations', () => {
  for (const strategy of ['withdraw', 'reinvest'] as const)
    for (const realTerms of [false, true])
      for (let months = 1; months <= 120; months++) {
        const r = calculateYield({ ...base, months, strategy, realTerms });
        expect(r.series.at(-1)!.projected).toBe(r.projected);
        expect(r.series).toHaveLength(months + 1);
        expect(r.gain + base.amount).toBeCloseTo(r.projected, 8);
        expect(r.scenarioReduction + r.projected).toBeCloseTo(r.grossSameStrategy, 8);
      }
});
test.each([NaN, Infinity, -Infinity, 0, -1, 1e13])('rejects invalid principal %s', (amount) =>
  expect(() => calculateYield({ ...base, amount })).toThrow(RangeError),
);
test.each([0, -1, 0.5, 1201, NaN])('rejects invalid term %s', (months) => expect(() => calculateYield({ ...base, months })).toThrow(RangeError));
test.each(['__proto__', 'constructor', 'unknown'])('rejects unknown scenario %s', (scenario) =>
  expect(() => calculateYield({ ...base, scenario } as YieldInputs)).toThrow(RangeError),
);
test('rejects invalid strategy and inflation, and permits explicit alternative assumptions', () => {
  expect(() => calculateYield({ ...base, strategy: 'other' } as unknown as YieldInputs)).toThrow(RangeError);
  expect(() => calculateYield({ ...base, inflationPct: -100 })).toThrow(RangeError);
  expect(calculateYield({ ...base, discountPp: 0, etfRatePct: 0, depositRatePct: 0 }).deposit).toBe(base.amount);
});
