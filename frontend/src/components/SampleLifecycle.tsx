import { sampleState } from '../data/sampleCatalog';
import { useI18n } from '../i18n';

// Presentation-only lifecycle examples. Never inferred from a wallet balance,
// emitted as a contract status, or used to enable a transaction.
export default function SampleLifecycle({ campaignId }: { campaignId: string }) {
  const { m } = useI18n();
  const state = sampleState(campaignId);
  if (!state) return null;
  return (
    <div className="sample-lifecycle" data-sample-lifecycle={state}>
      <p>{m.sampleLifecycle[state]}</p>
      <small>{m.sampleLifecycle.notice}</small>
    </div>
  );
}
