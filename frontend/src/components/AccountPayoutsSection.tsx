// Account payout history: the wallet's COMPLETED money-back events (refunds,
// creator withdrawals) recorded by the platform journal. No return
// distributions exist in this prototype and none are fabricated; the empty
// state says so plainly.
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { formatAmount } from '../format';

type PayoutRow = {
  hash: string;
  campaign: string;
  action: string;
  amount: string | null;
  status: string;
  createdAt: string | null;
  updatedAt?: string | null;
};

export default function AccountPayoutsSection({ actor }: { actor: string }) {
  const { locale, m } = useI18n();
  const [payouts, setPayouts] = useState<PayoutRow[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/account/payouts?actor=${encodeURIComponent(actor)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (live) setPayouts(Array.isArray(j.payouts) ? j.payouts : []);
      })
      .catch(() => {
        if (live) setPayouts(null);
      });
    return () => {
      live = false;
    };
  }, [actor]);

  return (
    <section aria-label={m.account.payoutsAria}>
      <h2 className="section-title">{m.account.payoutsTitle}</h2>
      <p className="account-note">{m.account.payoutsNote}</p>
      {payouts === null ? (
        <p className="community-error" role="status">
          {m.account.payoutsUnavailable}
        </p>
      ) : payouts.length > 0 ? (
        <ul className="activity-list">
          {payouts.map((a) => (
            <li key={a.hash}>
              {m.intent.actionLabels[a.action] ?? a.action}
              {a.amount ? ` ${formatAmount(a.amount, locale)} USDC` : ''} - <code>{a.campaign}</code>
              {(a.updatedAt ?? a.createdAt) ? ` - ${new Date((a.updatedAt ?? a.createdAt) as string).toLocaleString(locale)}` : ''} (
              <a href={`https://stellar.expert/explorer/testnet/tx/${a.hash}`} target="_blank" rel="noreferrer">
                tx
              </a>
              )
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">{m.account.payoutsEmpty}</p>
      )}
    </section>
  );
}
