import bindings from './testnetCatalog.json';

// Exact created identities, not inferred from names, route prefixes or balances.
// No goals, progress or lifecycle values are copied into the fictional preview.
export function testnetContractFor(campaignId: string): string | undefined {
  return bindings.find((entry) => entry.id === campaignId)?.contractId;
}
