// Client-only catalog identities. Never used to configure a contract or registry.
// Structures and coupon/conversion features qualify an underlying instrument.
export const SAMPLE_CATALOG = [
  {
    id: 'fixture-lisbon-riverside',
    name: 'Lisbon Riverside Apartments - Series A',
    industry: 'real-estate',
    instrument: 'bond',
    seniority: 'senior',
    overlays: [],
    state: 'open',
    indirect: false,
  },
  {
    id: 'fixture-alentejo-solar',
    name: 'Alentejo Solar Cooperative',
    industry: 'energy-utilities',
    instrument: 'bond',
    seniority: 'subordinated',
    overlays: [],
    state: 'closing',
    indirect: false,
  },
  {
    id: 'fixture-porto-logistics',
    name: 'Porto Logistics Hub Tokenization',
    industry: 'transport-logistics',
    instrument: 'bond',
    seniority: 'unspecified',
    overlays: ['convertible'],
    state: 'successful',
    indirect: false,
  },
  {
    id: 'fixture-atlas-participation',
    name: 'Atlas Workshop Participation',
    industry: 'industrial-manufacturing',
    instrument: 'participation-certificate',
    seniority: '',
    overlays: [],
    state: 'open',
    indirect: false,
  },
  {
    id: 'fixture-cedar-substance',
    name: 'Cedar Asset Participation',
    industry: 'real-estate',
    instrument: 'substanzgenussrecht',
    seniority: '',
    overlays: [],
    state: 'unsuccessful',
    indirect: false,
  },
  {
    id: 'fixture-orbit-shares',
    name: 'Orbit Circular Materials',
    industry: 'industrial-manufacturing',
    instrument: 'share',
    seniority: '',
    overlays: [],
    state: 'withdrawn',
    indirect: true,
  },
  {
    id: 'fixture-meadow-partnership',
    name: 'Meadow Partnership',
    industry: 'agriculture-environment',
    instrument: 'limited-partnership',
    seniority: '',
    overlays: [],
    state: 'refunded',
    indirect: false,
  },
  {
    id: 'fixture-harbor-senior-loan',
    name: 'Harbor Equipment Loan',
    industry: 'transport-logistics',
    instrument: 'loan',
    seniority: 'senior',
    overlays: [],
    state: 'funded',
    indirect: false,
  },
  {
    id: 'fixture-grove-subordinated-loan',
    name: 'Grove Community Energy Loan',
    industry: 'energy-utilities',
    instrument: 'loan',
    seniority: 'subordinated',
    overlays: [],
    state: 'open',
    indirect: false,
  },
  {
    id: 'fixture-mosaic-loan',
    name: 'Mosaic Workshop Loan',
    industry: 'industrial-manufacturing',
    instrument: 'loan',
    seniority: 'unspecified',
    overlays: [],
    state: 'closing',
    indirect: false,
  },
  {
    id: 'fixture-beacon-bond',
    name: 'Beacon Mobility Bond',
    industry: 'transport-logistics',
    instrument: 'bond',
    seniority: 'unspecified',
    overlays: [],
    state: 'unsuccessful',
    indirect: false,
  },
  {
    id: 'fixture-horizon-zero-coupon',
    name: 'Horizon Zero-Coupon Bond',
    industry: 'energy-utilities',
    instrument: 'bond',
    seniority: 'senior',
    overlays: ['zero-coupon'],
    state: 'open',
    indirect: false,
  },
  {
    id: 'fixture-library-donation',
    name: 'Neighbourhood Library Donation',
    industry: 'education-aviation',
    instrument: 'donation',
    seniority: '',
    overlays: [],
    state: 'refunded',
    indirect: false,
  },
  {
    id: 'fixture-makers-reward',
    name: 'Makers Reward',
    industry: 'industrial-manufacturing',
    instrument: 'reward',
    seniority: '',
    overlays: [],
    state: 'withdrawn',
    indirect: false,
  },
  {
    id: 'fixture-lamp-pre-sale',
    name: 'Workshop Lamp Pre-sale',
    industry: 'consumer-retail',
    instrument: 'pre-sale',
    seniority: '',
    overlays: [],
    state: 'refunded',
    indirect: false,
  },
  {
    id: 'fixture-atlas-warrants',
    name: 'Atlas Mobility Warrants',
    industry: 'light-mobility',
    instrument: 'warrant',
    seniority: 'unspecified',
    overlays: [],
    state: 'open',
    indirect: false,
  },
  {
    id: 'fixture-douro-share-dr',
    name: 'Douro Textiles Share Depositary Receipts',
    industry: 'industrial-manufacturing',
    instrument: 'share-depositary-receipt',
    seniority: 'unspecified',
    overlays: [],
    state: 'funded',
    indirect: true,
  },
  {
    id: 'fixture-tejo-commercial-paper',
    name: 'Tejo Packaging Commercial Paper',
    industry: 'consumer-retail',
    instrument: 'commercial-paper',
    seniority: 'unspecified',
    overlays: [],
    state: 'open',
    indirect: false,
  },
  {
    id: 'fixture-costa-revenue-loan',
    name: 'Costa Restaurants Revenue-Linked Loan',
    industry: 'restaurants-gastronomy',
    instrument: 'revenue-linked-loan',
    seniority: 'unspecified',
    overlays: [],
    state: 'open',
    indirect: false,
  },
] as const;

export function sampleInstrument(campaignId: string): string | undefined {
  return SAMPLE_CATALOG.find((sample) => sample.id === campaignId)?.instrument;
}

// Instruments verified for Portugal under the national crowdfunding regime
// (Lei 102/2015, outside ECSPR): the only non-financial formats presented as
// platform sample offers rather than educational concepts.
export const NATIONAL_SAMPLE_INSTRUMENTS = ['donation', 'reward', 'pre-sale'] as const;

export function isNationalRegimeSample(campaignId: string): boolean {
  const instrument = sampleInstrument(campaignId);
  return instrument !== undefined && (NATIONAL_SAMPLE_INSTRUMENTS as readonly string[]).includes(instrument);
}

export function sampleIndustry(campaignId: string): string | undefined {
  return SAMPLE_CATALOG.find((sample) => sample.id === campaignId)?.industry;
}

export function isSampleCampaign(campaignId: string): boolean {
  return SAMPLE_CATALOG.some((sample) => sample.id === campaignId);
}

export function sampleState(campaignId: string) {
  return SAMPLE_CATALOG.find((sample) => sample.id === campaignId)?.state;
}
