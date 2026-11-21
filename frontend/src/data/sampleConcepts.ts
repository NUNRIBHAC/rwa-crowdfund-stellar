// Educational concepts are deliberately NOT Campaigns, contracts or supported instrument classes.
// Their IDs are never included in FIXTURE_CAMPAIGNS or any live-mode state/filter count. Sample-mode filters include their scenario metadata.
export const SAMPLE_CONCEPTS = [
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
    id: 'concept-donation',
    name: 'Neighbourhood Library Donation',
    subtype: 'donation',
    industry: 'education-aviation',
    sampleState: 'refunded',
    nonFinancial: true,
  },
  { id: 'concept-reward', name: 'Makers Reward', subtype: 'reward', industry: 'industrial-manufacturing', sampleState: 'withdrawn', nonFinancial: true },
  { id: 'concept-pre-sale', name: 'Workshop Lamp Pre-sale', subtype: 'pre-sale', industry: 'consumer-retail', sampleState: 'refunded', nonFinancial: true },
  {
    id: 'concept-lda-quotas',
    name: 'Tagus Workshop Lda Quotas',
    subtype: 'lda-quotas',
    industry: 'financial-services',
    sampleState: 'funded',
    nonFinancial: false,
  },
] as const;

export function sampleConceptIndex(id: string): number {
  return SAMPLE_CONCEPTS.findIndex((concept) => concept.id === id);
}

export function sampleConceptStatus(concept: (typeof SAMPLE_CONCEPTS)[number]): 'open' | 'funded' | 'ended' {
  return concept.sampleState === 'open' ? 'open' : concept.sampleState === 'funded' || concept.sampleState === 'withdrawn' ? 'funded' : 'ended';
}
