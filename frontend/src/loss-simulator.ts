// Synthetic scenario engine only. No network, wallet, storage or account input.
// All amounts are integer cents; probabilities and ownership use basis points.
export type ScenarioId = 'base' | 'adverse' | 'severe';
export type LoanState = 'current' | 'late' | 'collection' | 'restructured' | 'defaulted' | 'closedLoss';
export type Loan = {
  id: string;
  campaign: string;
  promoter: string;
  principal: bigint;
  annualRateBps: bigint;
  principalReceived: bigint;
  payments: { received: string; principal: bigint }[];
  collateralValue: bigint;
  schedule: { due: string; principal: bigint }[];
  investors: { id: string; shareBps: bigint }[];
};
const euros = (n: bigint) => n * 100n;
export const SYNTHETIC_LOANS: readonly Loan[] = [
  {
    id: 'L1',
    campaign: 'C1',
    promoter: 'P1',
    principal: euros(100000n),
    annualRateBps: 800n,
    principalReceived: euros(30000n),
    payments: [{ received: '2026-10-01', principal: euros(30000n) }],
    collateralValue: euros(50000n),
    schedule: [
      { due: '2026-09-01', principal: euros(25000n) },
      { due: '2026-12-01', principal: euros(25000n) },
      { due: '2027-03-01', principal: euros(25000n) },
      { due: '2027-06-01', principal: euros(25000n) },
    ],
    investors: [
      { id: 'I1', shareBps: 6000n },
      { id: 'I2', shareBps: 4000n },
    ],
  },
  {
    id: 'L2',
    campaign: 'C1',
    promoter: 'P1',
    principal: euros(60000n),
    annualRateBps: 600n,
    principalReceived: euros(10000n),
    payments: [{ received: '2026-10-02', principal: euros(10000n) }],
    collateralValue: euros(20000n),
    schedule: [
      { due: '2026-10-01', principal: euros(20000n) },
      { due: '2027-02-01', principal: euros(20000n) },
      { due: '2027-06-01', principal: euros(20000n) },
    ],
    investors: [
      { id: 'I1', shareBps: 5000n },
      { id: 'I2', shareBps: 5000n },
    ],
  },
  {
    id: 'L3',
    campaign: 'C2',
    promoter: 'P2',
    principal: euros(80000n),
    annualRateBps: 700n,
    principalReceived: euros(20000n),
    payments: [{ received: '2026-08-01', principal: euros(20000n) }],
    collateralValue: euros(30000n),
    schedule: [
      { due: '2026-08-01', principal: euros(20000n) },
      { due: '2026-12-01', principal: euros(20000n) },
      { due: '2027-04-01', principal: euros(20000n) },
      { due: '2027-08-01', principal: euros(20000n) },
    ],
    investors: [
      { id: 'I1', shareBps: 3000n },
      { id: 'I2', shareBps: 7000n },
    ],
  },
];
type Assumption = { pdBps: bigint; recoveryBps: bigint; days: bigint; state: LoanState; defaultEvent: boolean };
export const SCENARIOS: Record<ScenarioId, readonly Assumption[]> = {
  base: [
    { pdBps: 200n, recoveryBps: 8000n, days: 15n, state: 'late', defaultEvent: false },
    { pdBps: 400n, recoveryBps: 7000n, days: 45n, state: 'restructured', defaultEvent: false },
    { pdBps: 100n, recoveryBps: 9000n, days: 0n, state: 'current', defaultEvent: false },
  ],
  adverse: [
    { pdBps: 2000n, recoveryBps: 4000n, days: 90n, state: 'closedLoss', defaultEvent: true },
    { pdBps: 2500n, recoveryBps: 6000n, days: 120n, state: 'closedLoss', defaultEvent: true },
    { pdBps: 1000n, recoveryBps: 7000n, days: 60n, state: 'collection', defaultEvent: false },
  ],
  severe: [
    { pdBps: 5000n, recoveryBps: 1000n, days: 180n, state: 'closedLoss', defaultEvent: true },
    { pdBps: 6000n, recoveryBps: 2000n, days: 240n, state: 'closedLoss', defaultEvent: true },
    { pdBps: 4000n, recoveryBps: 1500n, days: 150n, state: 'closedLoss', defaultEvent: true },
  ],
};
export function expectedLoss(ead: bigint, pdBps: bigint, lgdBps: bigint) {
  if (ead < 0n || pdBps < 0n || pdBps > 10000n || lgdBps < 0n || lgdBps > 10000n) throw new RangeError('invalid scenario');
  return (ead * pdBps * lgdBps) / 100000000n;
}
export function capitalLoss(outstanding: bigint, recovered: bigint) {
  if (outstanding < 0n || recovered < 0n || recovered > outstanding) throw new RangeError('invalid recovery');
  return outstanding - recovered;
}
export function allocate(amount: bigint, investors: Loan['investors']) {
  if (amount < 0n || !investors.length || investors.some((i) => i.shareBps < 0n) || investors.reduce((a, i) => a + i.shareBps, 0n) !== 10000n)
    throw new RangeError('invalid ownership');
  let left = amount;
  return investors.map((i, index) => {
    const value = index === investors.length - 1 ? left : (amount * i.shareBps) / 10000n;
    left -= value;
    return { id: i.id, amount: value };
  });
}
export function simulate(id: ScenarioId, loans: readonly Loan[] = SYNTHETIC_LOANS) {
  if (!Object.hasOwn(SCENARIOS, id)) throw new RangeError('unknown scenario');
  if (loans.length !== SCENARIOS[id].length) throw new RangeError('scenario loan mismatch');
  const rows = loans.map((sourceLoan, index) => {
    // The severe synthetic portfolio deliberately concentrates all exposure in P1.
    const loan = { ...sourceLoan, promoter: id === 'severe' ? 'P1' : sourceLoan.promoter };
    if (
      loan.principal < 0n ||
      loan.principalReceived < 0n ||
      loan.principalReceived > loan.principal ||
      loan.annualRateBps < 0n ||
      loan.collateralValue < 0n ||
      loan.schedule.some((x) => x.principal < 0n) ||
      loan.payments.some((x) => x.principal < 0n) ||
      loan.payments.reduce((n, x) => n + x.principal, 0n) !== loan.principalReceived ||
      loan.schedule.reduce((n, x) => n + x.principal, 0n) !== loan.principal
    )
      throw new RangeError('invalid synthetic loan');
    const a = SCENARIOS[id][index],
      ead = loan.principal - loan.principalReceived;
    const recovered = a.defaultEvent ? (ead * a.recoveryBps) / 10000n : 0n;
    const realized = a.defaultEvent ? capitalLoss(ead, recovered) : 0n;
    // ACT/365, simple non-capitalized interest on the scenario opening balance.
    const interest = (ead * loan.annualRateBps * a.days) / (10000n * 365n);
    const costs = a.defaultEvent ? euros(500n) : 0n;
    const positions = allocate(ead, loan.investors);
    const recoveries = allocate(recovered, loan.investors);
    // Bound recovery to each allocated position, then redistribute residual cents.
    let residual = 0n;
    recoveries.forEach((part, i) => {
      if (part.amount > positions[i].amount) {
        residual += part.amount - positions[i].amount;
        part.amount = positions[i].amount;
      }
    });
    recoveries.forEach((part, i) => {
      const room = positions[i].amount - part.amount;
      const extra = room < residual ? room : residual;
      part.amount += extra;
      residual -= extra;
    });
    if (residual !== 0n) throw new RangeError('unallocated recovery');
    const investorLoss = positions.map((part, i) => ({ id: part.id, amount: a.defaultEvent ? part.amount - recoveries[i].amount : 0n }));
    const events: (LoanState | 'partialRecovery')[] = a.defaultEvent
      ? ['late', 'collection', 'defaulted', 'partialRecovery', 'closedLoss']
      : a.state === 'current'
        ? ['current']
        : a.state === 'restructured'
          ? ['late', 'restructured']
          : [a.state];
    return {
      loan,
      ...a,
      ead,
      recovered,
      realized,
      interest,
      costs,
      expected: expectedLoss(ead, a.pdBps, 10000n - a.recoveryBps),
      unresolved: a.defaultEvent ? 0n : ead,
      events,
      positions,
      recoveries,
      investorLoss,
    };
  });
  const sum = (key: 'ead' | 'recovered' | 'realized' | 'expected' | 'interest' | 'costs' | 'unresolved') => rows.reduce((n, r) => n + r[key], 0n);
  const group = (key: 'campaign' | 'promoter') =>
    Object.fromEntries(
      [...new Set(rows.map((r) => r.loan[key]))].map((k) => [
        k,
        {
          ead: rows.filter((r) => r.loan[key] === k).reduce((n, r) => n + r.ead, 0n),
          recovered: rows.filter((r) => r.loan[key] === k).reduce((n, r) => n + r.recovered, 0n),
          loss: rows.filter((r) => r.loan[key] === k).reduce((n, r) => n + r.realized, 0n),
        },
      ]),
    );
  const investors = Object.fromEntries(
    [...new Set(loans.flatMap((l) => l.investors.map((i) => i.id)))].map((k) => [
      k,
      {
        ead: rows.reduce((n, r) => n + (r.positions.find((i) => i.id === k)?.amount ?? 0n), 0n),
        recovered: rows.reduce((n, r) => n + (r.recoveries.find((i) => i.id === k)?.amount ?? 0n), 0n),
        loss: rows
          .flatMap((r) => r.investorLoss)
          .filter((i) => i.id === k)
          .reduce((n, i) => n + i.amount, 0n),
      },
    ]),
  );
  return {
    rows,
    totals: {
      ead: sum('ead'),
      recovered: sum('recovered'),
      realized: sum('realized'),
      expected: sum('expected'),
      interest: sum('interest'),
      costs: sum('costs'),
      unresolved: sum('unresolved'),
    },
    campaigns: group('campaign'),
    promoters: group('promoter'),
    investors,
    platformOperatingLoss: 0n,
  };
}
