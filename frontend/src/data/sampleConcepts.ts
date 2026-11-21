// Educational concepts are deliberately NOT Campaigns, contracts or supported instrument classes.
// Their IDs are never included in FIXTURE_CAMPAIGNS or any operational state/filter count.
export const SAMPLE_CONCEPTS = [
  { id: 'concept-safe', name: 'Lumen Future Equity', subtype: 'safe', nonFinancial: false },
  { id: 'concept-co-ownership', name: 'Stonebridge Shared Workshop', subtype: 'co-ownership', nonFinancial: false },
  { id: 'concept-equipment-use', name: 'Forge Equipment Access', subtype: 'equipment-use', nonFinancial: false },
  { id: 'concept-share-certificate', name: 'Bridge Share Certificate', subtype: 'share-certificate', nonFinancial: false },
  { id: 'concept-llc-holding', name: 'Juniper LLC Holding', subtype: 'llc-holding', nonFinancial: false },
  { id: 'concept-revenue-share', name: 'Brook Revenue Share', subtype: 'revenue-share', nonFinancial: false },
  { id: 'concept-royalty', name: 'Aurora Studio Royalties', subtype: 'royalty', nonFinancial: false },
  { id: 'concept-donation', name: 'Neighbourhood Library Donation', subtype: 'donation', nonFinancial: true },
  { id: 'concept-reward', name: 'Makers Reward', subtype: 'reward', nonFinancial: true },
  { id: 'concept-pre-sale', name: 'Workshop Lamp Pre-sale', subtype: 'pre-sale', nonFinancial: true },
] as const;

export function sampleConceptIndex(id: string): number {
  return SAMPLE_CONCEPTS.findIndex((concept) => concept.id === id);
}
