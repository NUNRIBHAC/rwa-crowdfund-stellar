import { SAMPLE_CATALOG } from './sampleCatalog';
/** All terms here are sample presentation terms, never live offer data.
 * Do not parse localized rate strings or infer yield from an instrument name.
 */
export type SampleYieldTerms = {
  campaignId: string;
  annualRatePct: number | null;
  couponModel: 'fixed' | 'conditional' | 'implied' | 'variable' | 'none';
};
const variable = new Set([
  'share',
  'participation-certificate',
  'substanzgenussrecht',
  'limited-partnership',
  'share-depositary-receipt',
  'debt-depositary-receipt',
  'revenue-linked-loan',
  'warrant',
]);
const noFinancialReturn = new Set(['donation', 'reward', 'pre-sale']);
export const SAMPLE_YIELD_TERMS: readonly SampleYieldTerms[] = SAMPLE_CATALOG.map((campaign) => {
  if (noFinancialReturn.has(campaign.instrument) || (campaign.overlays as readonly string[]).includes('zero-coupon')) {
    return { campaignId: campaign.id, annualRatePct: null, couponModel: 'none' };
  }
  if (variable.has(campaign.instrument)) return { campaignId: campaign.id, annualRatePct: null, couponModel: 'variable' };
  const knownRate: Record<string, number> = {
    'fixture-lisbon-riverside': 6.5,
    'fixture-alentejo-solar': 7,
    'fixture-porto-logistics': 8,
    'fixture-tejo-commercial-paper': 4.1,
  };
  // Existing remaining sample debt profiles explicitly state 5% p.a.
  const fixedDebt = campaign.instrument === 'loan' || campaign.instrument === 'bond';
  const annualRatePct = knownRate[campaign.id] ?? (fixedDebt ? 5 : null);
  return {
    campaignId: campaign.id,
    annualRatePct,
    couponModel: (campaign.overlays as readonly string[]).includes('convertible')
      ? 'conditional'
      : campaign.instrument === 'commercial-paper'
        ? 'implied'
        : annualRatePct === null
          ? 'variable'
          : 'fixed',
  };
});
