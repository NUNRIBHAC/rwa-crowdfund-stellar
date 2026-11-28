// Internal evidence model, not a licence, operator policy or public attestation.
// No state is inferred from the presence of a URL or from demo activity.
export const TRUST_CRITERIA = [
  'operator_provider_binding',
  'official_register_warnings',
  'reflection_withdrawal',
  'fees_taxes',
  'buyback',
  'provision_fund',
  'preemption_dilution',
  'portfolio_concentration',
  'audited_accounts',
  'portfolio_recoveries',
  'business_history',
  'arrears_defaults_losses',
  'realised_net_return',
  'withdrawal_delays',
  'community_size',
  'environmental_social_impact',
] as const;
export type TrustCriterion = (typeof TRUST_CRITERIA)[number];
export type EvidenceState = 'not_provided' | 'documented' | 'not_applicable' | 'simulation';
export type TrustEvidence = {
  criterion: TrustCriterion;
  state: EvidenceState;
  scope: string;
  sourceUrls: string[];
  asOf: string | null;
  methodology: string | null;
  population: string | null;
  period: { from: string; to: string } | null;
  reason: string | null;
};
const METRICS = new Set<TrustCriterion>([
  'portfolio_concentration',
  'portfolio_recoveries',
  'business_history',
  'arrears_defaults_losses',
  'realised_net_return',
  'withdrawal_delays',
  'community_size',
  'environmental_social_impact',
]);
function date(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
    new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value
  );
}
function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
export function validateTrustEvidence(rows: TrustEvidence[], today: string): TrustEvidence[] {
  if (!date(today) || rows.length !== TRUST_CRITERIA.length) throw new Error('TRUST_EVIDENCE_SCOPE');
  const seen = new Set<string>();
  for (const row of rows) {
    if (!TRUST_CRITERIA.includes(row.criterion) || seen.has(row.criterion) || !nonempty(row.scope)) throw new Error('TRUST_EVIDENCE_SCOPE');
    seen.add(row.criterion);
    if (!['not_provided', 'documented', 'not_applicable', 'simulation'].includes(row.state)) throw new Error('TRUST_EVIDENCE_STATE');
    if (
      !Array.isArray(row.sourceUrls) ||
      row.sourceUrls.some((s) => {
        try {
          const u = new URL(s);
          return u.protocol !== 'https:' || !!u.username || !!u.password;
        } catch {
          return true;
        }
      })
    )
      throw new Error('TRUST_EVIDENCE_SOURCE');
    if (row.asOf !== null && (!date(row.asOf) || row.asOf > today)) throw new Error('TRUST_EVIDENCE_DATE');
    if (row.period && (!date(row.period.from) || !date(row.period.to) || row.period.from > row.period.to || row.period.to > today))
      throw new Error('TRUST_EVIDENCE_PERIOD');
    if (row.state === 'documented' && (!row.sourceUrls.length || !row.asOf)) throw new Error('TRUST_EVIDENCE_SOURCE');
    if (row.state === 'documented' && METRICS.has(row.criterion) && (!nonempty(row.methodology) || !nonempty(row.population) || !row.period))
      throw new Error('TRUST_EVIDENCE_METHODOLOGY');
    if (row.state === 'not_applicable' && (!nonempty(row.reason) || !row.sourceUrls.length || !row.asOf)) throw new Error('TRUST_EVIDENCE_APPLICABILITY');
    if (row.state === 'simulation' && !nonempty(row.reason)) throw new Error('TRUST_EVIDENCE_SIMULATION_LABEL');
  }
  return structuredClone(rows);
}
export function emptyTrustEvidence(scope: string): TrustEvidence[] {
  if (!nonempty(scope)) throw new Error('TRUST_EVIDENCE_SCOPE');
  return TRUST_CRITERIA.map((criterion) => ({
    criterion,
    state: 'not_provided',
    scope,
    sourceUrls: [],
    asOf: null,
    methodology: null,
    population: null,
    period: null,
    reason: null,
  }));
}
// Integer minor units in a SINGLE currency, all positive positions from one dated
// owner snapshot. Never combine wallets/currencies, current escrow and paid history.
export function portfolioConcentration(positions: { offeringId: string; issuerId: string; currency: string; amount: bigint }[]) {
  if (!positions.length) return { state: 'unavailable' as const };
  const currency = positions[0].currency;
  const offerings = new Set<string>();
  const issuers = new Map<string, bigint>();
  let total = 0n;
  for (const row of positions) {
    if (
      !nonempty(row.offeringId) ||
      !nonempty(row.issuerId) ||
      !nonempty(row.currency) ||
      row.currency !== currency ||
      row.amount <= 0n ||
      offerings.has(row.offeringId)
    )
      throw new Error('TRUST_CONCENTRATION_INPUT');
    offerings.add(row.offeringId);
    total += row.amount;
    issuers.set(row.issuerId, (issuers.get(row.issuerId) ?? 0n) + row.amount);
  }
  return {
    state: 'calculated' as const,
    currency,
    total,
    rounding: 'floor_basis_points' as const,
    offerings: positions.map((row) => ({ offeringId: row.offeringId, amount: row.amount, basisPoints: (row.amount * 10000n) / total })),
    issuers: [...issuers].map(([issuerId, amount]) => ({ issuerId, amount, basisPoints: (amount * 10000n) / total })),
  };
}
