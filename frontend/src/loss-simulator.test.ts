import { describe, expect, it } from 'vitest';
import { allocate, capitalLoss, expectedLoss, simulate, SYNTHETIC_LOANS } from './loss-simulator';
describe('isolated synthetic loss scenarios', () => {
  it('reproduces the requested 70000 outstanding / 40% recovery example', () => {
    const r = simulate('adverse').rows[0];
    expect(r.ead).toBe(7000000n);
    expect(r.recovered).toBe(2800000n);
    expect(r.realized).toBe(4200000n);
  });
  it.each(['base', 'adverse', 'severe'] as const)('reconciles every cent in %s', (id) => {
    const r = simulate(id);
    for (const row of r.rows) {
      expect(row.recovered + row.realized + row.unresolved).toBe(row.ead);
      expect(row.investorLoss.reduce((n, x) => n + x.amount, 0n)).toBe(row.realized);
      expect(row.loan.principalReceived + row.ead).toBe(row.loan.principal);
      expect(row.expected).toBeGreaterThanOrEqual(0n);
      expect(row.expected).toBeLessThanOrEqual(row.ead);
    }
    expect(Object.values(r.investors).reduce((n, x) => n + x.loss, 0n)).toBe(r.totals.realized);
    for (const groups of [r.campaigns, r.promoters]) {
      expect(Object.values(groups).reduce((n, x) => n + x.ead, 0n)).toBe(r.totals.ead);
      expect(Object.values(groups).reduce((n, x) => n + x.loss, 0n)).toBe(r.totals.realized);
    }
    expect(r.platformOperatingLoss).toBe(0n);
  });
  it('varies fictional promoter concentration explicitly in the severe scenario', () => {
    expect(Object.keys(simulate('base').promoters)).toEqual(['P1', 'P2']);
    const severe = simulate('severe');
    expect(Object.keys(severe.promoters)).toEqual(['P1']);
    expect(severe.promoters.P1.ead).toBe(severe.totals.ead);
    expect(SYNTHETIC_LOANS[2].promoter).toBe('P2');
  });
  it('reconciles every dated historical payment with the opening paid principal', () => {
    for (const loan of SYNTHETIC_LOANS) {
      expect(loan.payments.reduce((n, p) => n + p.principal, 0n)).toBe(loan.principalReceived);
      expect(loan.payments.every((p) => /^2026-/.test(p.received))).toBe(true);
    }
  });
  it('does not turn elapsed days into a default classification', () => {
    const r = simulate('adverse').rows[2];
    expect(r.days).toBe(60n);
    expect(r.state).toBe('collection');
    expect(r.realized).toBe(0n);
    expect(r.events).not.toContain('defaulted');
  });
  it('keeps late and restructured loans unresolved, never books expected loss as realized', () => {
    const r = simulate('base');
    expect(r.totals.realized).toBe(0n);
    expect(r.totals.expected).toBeGreaterThan(0n);
    expect(r.totals.unresolved).toBe(r.totals.ead);
    expect(r.rows[1].events).toEqual(['late', 'restructured']);
  });
  it('does not offset principal loss with interest, collection costs or collateral valuations', () => {
    const r = simulate('adverse').rows[0];
    expect(r.interest).toBe(138082n);
    expect(r.costs).toBe(50000n);
    expect(r.loan.collateralValue).toBe(5000000n);
    expect(r.realized).toBe(4200000n);
  });
  it('uses basis points and integer rounding without floating point', () => {
    expect(expectedLoss(7000000n, 2000n, 6000n)).toBe(840000n);
    expect(expectedLoss(1n, 1n, 1n)).toBe(0n);
    expect(capitalLoss(7000000n, 2800000n)).toBe(4200000n);
  });
  it('allocates rounding residual to the last synthetic investor without losing cents', () => {
    expect(
      allocate(1n, [
        { id: 'A', shareBps: 6000n },
        { id: 'B', shareBps: 4000n },
      ]),
    ).toEqual([
      { id: 'A', amount: 0n },
      { id: 'B', amount: 1n },
    ]);
  });
  it('keeps each investor reconciled when fractional cent allocations differ', () => {
    const loans = SYNTHETIC_LOANS.map((l) => ({
      ...l,
      principal: 4n,
      principalReceived: 0n,
      schedule: [{ due: '2026-12-01', principal: 4n }],
      payments: [],
      investors: [
        { id: 'A', shareBps: 3333n },
        { id: 'B', shareBps: 6667n },
      ],
    }));
    for (const id of ['base', 'adverse', 'severe'] as const) {
      for (const r of simulate(id, loans).rows) {
        r.positions.forEach((p, i) => {
          expect(r.recoveries[i].amount).toBeLessThanOrEqual(p.amount);
          expect(r.investorLoss[i].amount + r.recoveries[i].amount).toBe(r.defaultEvent ? p.amount : 0n);
        });
        expect(r.investorLoss.reduce((n, p) => n + p.amount, 0n)).toBe(r.realized);
      }
    }
  });
  it('caps synthetic recovery by each allocated holding, including zero-share residual cases', () => {
    const loans = SYNTHETIC_LOANS.map((l) => ({
      ...l,
      principal: 2n,
      principalReceived: 0n,
      schedule: [{ due: '2026-12-01', principal: 2n }],
      payments: [],
      investors: [
        { id: 'A', shareBps: 5000n },
        { id: 'B', shareBps: 5000n },
        { id: 'C', shareBps: 0n },
      ],
    }));
    for (const r of simulate('severe', loans).rows) {
      r.positions.forEach((p, i) => expect(r.recoveries[i].amount + r.investorLoss[i].amount).toBe(p.amount));
    }
  });
  it('rejects impossible amounts and ownership rather than silently repairing them', () => {
    expect(() => capitalLoss(1n, 2n)).toThrow();
    expect(() => expectedLoss(1n, 10001n, 1n)).toThrow();
    expect(() => expectedLoss(-1n, 1n, 1n)).toThrow();
    expect(() => allocate(1n, [{ id: 'A', shareBps: 1n }])).toThrow();
    expect(() => simulate('base', [{ ...SYNTHETIC_LOANS[0], principalReceived: 999999999n }, ...SYNTHETIC_LOANS.slice(1)])).toThrow();
  });
  it('has no mutation of the fixed register or scenario during replay', () => {
    const before = SYNTHETIC_LOANS.map((l) => ({ ...l }));
    const a = simulate('severe');
    const b = simulate('base');
    expect(simulate('severe')).toEqual(a);
    expect(b.totals.realized).toBe(0n);
    expect(SYNTHETIC_LOANS).toEqual(before);
  });
});
