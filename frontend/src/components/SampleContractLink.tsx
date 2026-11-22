import { useI18n } from '../i18n';
import { routeHash } from '../router';
import { shorten } from '../format';
import { testnetContractFor } from '../data/testnetCatalog';

// A presentation scenario is not the contract's state. Open the real registry
// in a separate tab with an explicit mode so sample amounts never cross over.
export default function SampleContractLink({ campaignId }: { campaignId: string }) {
  const { m } = useI18n();
  const contractId = testnetContractFor(campaignId);
  if (!contractId) return null;
  return (
    <p className="sample-contract-link">
      <a href={routeHash({ name: 'campaign', campaignId }) + '?fixtures=0'} target="_blank" rel="noopener noreferrer" data-testnet-contract={contractId}>
        {m.card.contractData} · Stellar Testnet <code>{shorten(contractId, 8, 6)}</code>
      </a>
    </p>
  );
}
