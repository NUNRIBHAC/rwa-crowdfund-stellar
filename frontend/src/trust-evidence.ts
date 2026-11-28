// Reject unknown or optimistic payloads before rendering a trust status.
export const trustCriteria = [
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
export type TrustCriterion = (typeof trustCriteria)[number];
export type MissingTrustEvidence = {
  schemaVersion: 1;
  asOf: string;
  scope: 'platform';
  productionEligible: false;
  evidenceComplete: false;
  criteria: {
    criterion: TrustCriterion;
    state: 'not_provided';
    scope: 'platform';
    sourceUrls: [];
    asOf: null;
    methodology: null;
    population: null;
    period: null;
    reason: null;
  }[];
};
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function calendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
export function parseMissingTrustEvidence(value: unknown, today: string): MissingTrustEvidence {
  const invalid = () => {
    throw new Error('API_UNAVAILABLE');
  };
  if (!calendarDate(today) || !record(value)) return invalid();
  if (
    value.schemaVersion !== 1 ||
    value.scope !== 'platform' ||
    value.productionEligible !== false ||
    value.evidenceComplete !== false ||
    !calendarDate(value.asOf) ||
    value.asOf > today
  )
    return invalid();
  if (!Array.isArray(value.criteria) || value.criteria.length !== trustCriteria.length) return invalid();
  for (let i = 0; i < trustCriteria.length; i++) {
    const row: unknown = value.criteria[i];
    if (
      !record(row) ||
      row.criterion !== trustCriteria[i] ||
      row.state !== 'not_provided' ||
      row.scope !== 'platform' ||
      !Array.isArray(row.sourceUrls) ||
      row.sourceUrls.length !== 0
    )
      return invalid();
    for (const key of ['asOf', 'methodology', 'population', 'period', 'reason']) if (row[key] !== null) return invalid();
  }
  return structuredClone(value) as MissingTrustEvidence;
}
