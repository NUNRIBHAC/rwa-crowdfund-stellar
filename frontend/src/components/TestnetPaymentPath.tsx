import type { Intent } from '../types';
import { useI18n } from '../i18n';
import { formatAmount } from '../format';
import { paymentPath } from '../payment-path';

/** Read-only breakdown for the exact saved testnet transaction. */
export default function TestnetPaymentPath({ intent }: { intent: Intent }) {
  const { m, locale } = useI18n();
  const t = m.paymentPath;
  const view = paymentPath(intent);
  const amountLabel = view.direction === 'wallet' ? t.refundAmount : t.escrowAmount;
  return (
    <section className="testnet-payment-path" aria-label={t.title}>
      <h3>{t.title}</h3>
      <p>{t.note}</p>
      <dl className="intent-facts">
        {view.direction !== 'unknown' && (
          <div>
            <dt>{amountLabel}</dt>
            <dd dir="ltr">{view.preparedAmount ? `${view.preparedAmount} ${m.intent.usdcTestnet}` : t.unknown}</dd>
          </div>
        )}
        <div>
          <dt>{m.intent.maxFee}</dt>
          <dd dir="ltr">{view.maximumFeeStroops !== null ? `${formatAmount(view.maximumFeeStroops, locale)} ${m.intent.xlmTestnet}` : t.unknown}</dd>
        </div>
        <div>
          <dt>{t.finalAmount}</dt>
          <dd dir="ltr">{view.confirmedTransferAmount ? `${view.confirmedTransferAmount} ${m.intent.usdcTestnet}` : t.unknown}</dd>
        </div>
        <div>
          <dt>{t.actualFee}</dt>
          <dd>{t.unknown}</dd>
        </div>
      </dl>
      <p className="community-note">{t.estimateNote}</p>
      <p className="community-note">{t.separateAssets}</p>
    </section>
  );
}
