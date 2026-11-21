import type { Campaign } from './types';
import { SAMPLE_CATALOG } from './data/sampleCatalog';

// Client-only sample data so the marketplace layout can be previewed while the
// real registry is empty. This is NOT a deployed campaign, NOT live data and
// must stay clearly labeled wherever it is shown.
const inDays = (days: number) => String(Math.floor(Date.now() / 1000) + days * 86400);
const units = (n: number) => String(BigInt(n) * 10000000n);

export const FIXTURE_CAMPAIGNS: Campaign[] = [
  {
    id: 'fixture-lisbon-riverside',
    name: 'Lisbon Riverside Apartments - Series A',
    contractId: 'CFIXTURE000000000000000000000000000000000000000000000000000001',
    raised: units(155400),
    balance: null,
    withdrawn: false,
    config: {
      creator: 'GCREATOR00000000000000000000000000000000000000000000000000001',
      token: 'CUSDC0000000000000000000000000000000000000000000000000000001',
      goal: units(250000),
      deadline: inDays(23),
    },
  },
  {
    id: 'fixture-alentejo-solar',
    name: 'Alentejo Solar Cooperative',
    contractId: 'CFIXTURE000000000000000000000000000000000000000000000000000002',
    raised: units(342000),
    balance: null,
    withdrawn: false,
    config: {
      creator: 'GCREATOR00000000000000000000000000000000000000000000000000001',
      token: 'CUSDC0000000000000000000000000000000000000000000000000000001',
      goal: units(900000),
      deadline: inDays(1),
    },
  },
  {
    id: 'fixture-porto-logistics',
    name: 'Porto Logistics Hub Tokenization',
    contractId: 'CFIXTURE000000000000000000000000000000000000000000000000000003',
    raised: units(500000),
    balance: null,
    withdrawn: false,
    config: {
      creator: 'GCREATOR00000000000000000000000000000000000000000000000000001',
      token: 'CUSDC0000000000000000000000000000000000000000000000000000001',
      goal: units(500000),
      deadline: inDays(-2),
    },
  },
  ...SAMPLE_CATALOG.slice(3).map((sample, index): Campaign => ({
    id: sample.id,
    name: sample.name,
    // Deliberately invalid network identifiers: presentation, never a contract.
    contractId: `SAMPLE-NOT-A-CONTRACT-${sample.id}`,
    raised: units(sample.state === 'funded' || sample.state === 'withdrawn' ? 100000 + index * 10000 : 10000 + index * 2500),
    balance: null,
    withdrawn: sample.state === 'withdrawn',
    config: {
      creator: 'SAMPLE-NOT-A-WALLET',
      token: 'SAMPLE-NOT-AN-ASSET',
      goal: units(100000 + index * 10000),
      deadline: inDays(['unsuccessful', 'refunded', 'withdrawn'].includes(sample.state) ? -3 : sample.state === 'closing' ? 1 : 28 + index),
    },
  })),
];
