// Educational concepts are deliberately NOT Campaigns, contracts or supported instrument classes.
// Donation, reward and pre-sale moved out of this list: they are verified under the
// Portuguese national crowdfunding regime (Lei 102/2015) and now appear as sample
// campaigns in SAMPLE_CATALOG, alongside loans and shares.
// Their IDs are never included in FIXTURE_CAMPAIGNS or any live-mode state/filter count. Sample-mode filters include their scenario metadata.
type SampleConceptState = 'open' | 'funded' | 'unsuccessful' | 'refunded' | 'withdrawn';

export type SampleConcept = {
  id: string;
  name: string;
  subtype: string;
  industry: string;
  sampleState: SampleConceptState;
  nonFinancial: boolean;
};

// Explicit state union: every state stays representable even when no current
// concept uses it (scenarios rotate as formats move to the sample catalog).
export const SAMPLE_CONCEPTS: SampleConcept[] = [
  { id: 'concept-safe', name: 'Lumen Future Equity', subtype: 'safe', industry: 'information-technology', sampleState: 'open', nonFinancial: false },
  {
    id: 'concept-co-ownership',
    name: 'Stonebridge Shared Workshop',
    subtype: 'co-ownership',
    industry: 'real-estate',
    sampleState: 'open',
    nonFinancial: false,
  },
  {
    id: 'concept-equipment-use',
    name: 'Forge Equipment Access',
    subtype: 'equipment-use',
    industry: 'industrial-manufacturing',
    sampleState: 'funded',
    nonFinancial: false,
  },
  {
    id: 'concept-revenue-share',
    name: 'Brook Revenue Share',
    subtype: 'revenue-share',
    industry: 'consumer-retail',
    sampleState: 'unsuccessful',
    nonFinancial: false,
  },
  { id: 'concept-royalty', name: 'Aurora Studio Royalties', subtype: 'royalty', industry: 'sports-leisure', sampleState: 'withdrawn', nonFinancial: false },
  {
    id: 'concept-lda-quotas',
    name: 'Tagus Workshop Lda Quotas',
    subtype: 'lda-quotas',
    industry: 'financial-services',
    sampleState: 'funded',
    nonFinancial: false,
  },
  {
    id: 'concept-share-certificate',
    name: 'Bridge Share Certificate',
    subtype: 'share-certificate',
    industry: 'financial-services',
    sampleState: 'unsuccessful',
    nonFinancial: false,
  },
];

export function sampleConceptIndex(id: string): number {
  return SAMPLE_CONCEPTS.findIndex((concept) => concept.id === id);
}

export function sampleConceptStatus(concept: (typeof SAMPLE_CONCEPTS)[number]): 'open' | 'funded' | 'ended' {
  return concept.sampleState === 'open' ? 'open' : concept.sampleState === 'funded' || concept.sampleState === 'withdrawn' ? 'funded' : 'ended';
}
