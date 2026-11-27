import { useI18n } from '../i18n';
export type AutomaticRefundView = { status: 'pending' | 'submitted' | 'paid' | 'blocked'; amount?: string };
export type AutomaticRefundMessages = {
  title: string;
  testnetOnly: string;
  pending: string;
  submitted: string;
  paid: string;
  blocked: string;
  manualFallback: string;
  unavailable: string;
};

// All visible status text comes from the Weblate-backed locale catalog.
export function LocalizedAutomaticRefundStatus(props: { view?: AutomaticRefundView; formatAmount: (raw: string) => string; manualRefundHref?: string }) {
  const { m } = useI18n();
  return <AutomaticRefundStatus {...props} messages={m.automaticRefund} />;
}

// This component receives an authenticated account-specific read model only.
// It never triggers a refund, requests a wallet signature, or exposes the payer
// journal. No English fallback or raw server error.
export default function AutomaticRefundStatus({
  view,
  messages,
  formatAmount,
  manualRefundHref,
}: {
  view?: AutomaticRefundView;
  messages: AutomaticRefundMessages;
  formatAmount: (raw: string) => string;
  manualRefundHref?: string;
}) {
  const paid = view?.status === 'paid' && view.amount && /^[1-9][0-9]*$/.test(view.amount);
  const validManualLink = manualRefundHref?.startsWith('/campaign/') && !manualRefundHref.includes('\\') && !/[\r\n]/.test(manualRefundHref);
  const state = !view ? 'unavailable' : view.status === 'paid' && !paid ? 'blocked' : view.status;
  return (
    <section className="automatic-refund-status" aria-label={messages.title}>
      <h3>{messages.title}</h3>
      <p className="account-note">{messages.testnetOnly}</p>
      <p role="status" aria-live="polite">
        {messages[state]}
      </p>
      {paid && (
        <p>
          <bdi>{formatAmount(view.amount!)}</bdi>
        </p>
      )}
      {validManualLink && state !== 'paid' && <a href={manualRefundHref}>{messages.manualFallback}</a>}
    </section>
  );
}
