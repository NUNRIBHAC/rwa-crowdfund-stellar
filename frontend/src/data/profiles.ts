// Presentation profiles for campaigns. Off-chain fields (issuer, instrument
// terms, documents) do not come from the Soroban contract. In this prototype
// profiles exist ONLY for the sample fixtures and are labeled sample data; a
// real deployment would load verified, issuer-attested data from the backend.
import type { Campaign } from '../types';
import type { SeniorityState } from './instruments';

export type InfoField = { label: string; value: string };

export type CampaignProfile = {
  campaignId: string;
  issuer: string;
  country: string;
  category: string;
  teaser: string;
  instrumentClass: string;
  instrumentSeniority?: SeniorityState;
  instrumentOverlays?: string[];
  interestRate: string;
  term: string;
  minInvestment: string;
  additionalInfo: InfoField[];
  overview: string[];
  documents: { label: string; note: string }[];
  news: { date: string; text: string }[];
};

const SAMPLE = 'Sample data - not a live offer';

export const SAMPLE_PROFILES: CampaignProfile[] = [
  {
    campaignId: 'fixture-lisbon-riverside',
    issuer: 'Riverside Development Lda (sample issuer)',
    country: 'PT',
    category: 'Construction',
    teaser: 'Refurbishment of a riverside apartment block in Lisbon, financed through a fixed-rate senior bond. All terms on this page are sample data.',
    instrumentClass: 'bond',
    instrumentSeniority: 'senior',
    interestRate: '6.5% p.a. (sample)',
    term: 'Until 2030-12-31 (sample)',
    minInvestment: '250 USDC testnet (sample)',
    additionalInfo: [
      { label: 'Investment product', value: `Senior bond (non-subordinated, unsecured). ${SAMPLE}` },
      { label: 'ISIN / WKN', value: 'Not issued - this prototype issues no securities identifiers' },
      { label: 'Nominal amount per unit', value: '250 USDC testnet (sample)' },
      { label: 'Minimum subscription', value: '1 unit (sample)' },
      { label: 'Funding threshold', value: 'Equals the campaign goal; all-or-nothing enforced by the contract in live mode' },
      { label: 'Issue volume', value: '250,000 USDC testnet goal (sample fixture)' },
      { label: 'Interest calculation', value: '30E/360 (sample)' },
      { label: 'Interest payment dates', value: 'Annually on 31 December, first payment 2027 (sample)' },
      { label: 'Repayment', value: 'At maturity (sample)' },
      { label: 'Offered in', value: 'No offering countries - sample data only' },
      { label: 'Intermediary', value: 'None. This prototype is not a crowdfunding service provider' },
    ],
    overview: [
      'This panel demonstrates how issuer-provided marketing content is separated from platform facts by the divider above.',
      `${SAMPLE}. The issuer description, team, business model and financials shown on a real platform would be issuer-supplied and clearly attributed.`,
    ],
    documents: [
      { label: 'Key investment information sheet (sample entry)', note: 'No file hosted in this prototype' },
      { label: 'Bond terms (sample entry)', note: 'No file hosted in this prototype' },
      { label: 'Pitch deck (sample entry)', note: 'No file hosted in this prototype' },
    ],
    news: [{ date: 'Sample', text: 'Campaign updates would appear here. This entry is a placeholder, not a real update.' }],
  },
  {
    campaignId: 'fixture-alentejo-solar',
    issuer: 'Alentejo Solar Cooperative (sample issuer)',
    country: 'PT',
    category: 'Energy and utilities',
    teaser:
      'Community solar installation in the Alentejo, financed through a subordinated bond with a cash interest variant. All terms on this page are sample data.',
    instrumentClass: 'bond',
    instrumentSeniority: 'subordinated',
    interestRate: '7.0% p.a. cash (sample)',
    term: 'Until 2032-06-30 (sample)',
    minInvestment: '250 USDC testnet (sample)',
    additionalInfo: [
      { label: 'Investment product', value: `Subordinated bond. ${SAMPLE}` },
      { label: 'ISIN / WKN', value: 'Not issued - this prototype issues no securities identifiers' },
      { label: 'Nominal amount per unit', value: '250 USDC testnet (sample)' },
      { label: 'Funding threshold', value: '900,000 USDC testnet goal (sample fixture); all-or-nothing in live mode' },
      { label: 'Subordination', value: 'Claims rank behind senior creditors in insolvency (sample terms)' },
      { label: 'Interest calculation', value: 'act/act (sample)' },
      { label: 'Interest payment dates', value: 'Annually on 30 June, first payment 2028 (sample)' },
      { label: 'Repayment', value: 'At maturity (sample)' },
      { label: 'Offered in', value: 'No offering countries - sample data only' },
      { label: 'Intermediary', value: 'None. This prototype is not a crowdfunding service provider' },
    ],
    overview: [`${SAMPLE}. A real campaign page would carry the issuer's own description of the cooperative, the site and the energy off-take.`],
    documents: [
      { label: 'Key investment information sheet (sample entry)', note: 'No file hosted in this prototype' },
      { label: 'Emission conditions (sample entry)', note: 'No file hosted in this prototype' },
    ],
    news: [],
  },
  {
    campaignId: 'fixture-porto-logistics',
    issuer: 'Porto Logistics Hub SA (sample issuer)',
    country: 'PT',
    category: 'Transportation and logistics',
    teaser:
      'Tokenization study for a logistics hub near Porto, structured as a convertible bond. This fixture shows a completed campaign. All terms are sample data.',
    instrumentClass: 'bond',
    instrumentSeniority: 'unspecified',
    instrumentOverlays: ['convertible'],
    interestRate: '8.0% p.a. until conversion (sample)',
    term: 'Until 2031-12-31 (sample)',
    minInvestment: '500 USDC testnet (sample)',
    additionalInfo: [
      { label: 'Investment product', value: `Bond with a conversion feature (convertible); seniority not specified in the sample terms. ${SAMPLE}` },
      { label: 'ISIN / WKN', value: 'Not issued - this prototype issues no securities identifiers' },
      { label: 'Nominal amount per unit', value: '500 USDC testnet (sample)' },
      { label: 'Funding threshold', value: '500,000 USDC testnet goal (sample fixture)' },
      { label: 'Conversion trigger', value: 'Configurable per issue; sample: a qualified financing event announced by the issuer' },
      { label: 'Conversion window', value: 'Configurable per issue; sample: 30 days after the trigger announcement' },
      { label: 'Interest stop', value: 'Interest accrues until the conversion day (sample)' },
      { label: 'Repayment if not converted', value: 'At maturity (sample)' },
      { label: 'Offered in', value: 'No offering countries - sample data only' },
      { label: 'Intermediary', value: 'None. This prototype is not a crowdfunding service provider' },
    ],
    overview: [`${SAMPLE}. Completed campaigns stay visible with their final funding status, like this one.`],
    documents: [{ label: 'Convertible bond terms (sample entry)', note: 'No file hosted in this prototype' }],
    news: [{ date: 'Sample', text: 'This campaign closed successfully in the fixture data. Post-funding issuer events would be tracked separately.' }],
  },
];

export function profileFor(campaign: Campaign | undefined, fixtureMode: boolean): CampaignProfile | undefined {
  if (!campaign || !fixtureMode) return undefined;
  return SAMPLE_PROFILES.find((p) => p.campaignId === campaign.id);
}

export function categoriesFor(campaigns: Campaign[], fixtureMode: boolean): string[] {
  const cats = new Set<string>();
  for (const c of campaigns) {
    const p = profileFor(c, fixtureMode);
    if (p) cats.add(p.category);
  }
  return [...cats].sort();
}
