import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { formatAmount } from '../format';
import { LocalizedAutomaticRefundStatus, type AutomaticRefundView } from './AutomaticRefundStatus';
type Row = AutomaticRefundView & { campaign: string };
const unknownView = (row: unknown): boolean => {
  if (!row || typeof row !== 'object') return true;
  const value = row as Record<string, unknown>;
  return (
    typeof value.campaign !== 'string' ||
    !/^C[A-Z2-7]{55}$/.test(value.campaign) ||
    typeof value.status !== 'string' ||
    !['pending', 'submitted', 'paid', 'blocked'].includes(value.status) ||
    (value.amount !== undefined && (typeof value.amount !== 'string' || !/^[1-9][0-9]*$/.test(value.amount)))
  );
};
export default function AccountAutomaticRefunds({ wallet, token }: { wallet: string; token: string }) {
  const { locale, m } = useI18n();
  const [read, setRead] = useState<{ wallet: string; token: string; rows: Row[] | null; disabled?: boolean } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setRead(null);
    fetch('/api/auth/automatic-refunds', {
      signal: controller.signal,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: token === 'cookie-session' ? {} : { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw Error('unavailable');
        const value = await r.json();
        if (value.enabled === false && ['not_configured', 'unsupported_network'].includes(value.reason)) {
          if (!controller.signal.aborted) setRead({ wallet, token, rows: [], disabled: true });
          return;
        }
        if (value.network !== 'testnet' || value.productionEligible !== false || !Array.isArray(value.refunds) || value.refunds.some(unknownView))
          throw Error('invalid');
        if (!controller.signal.aborted) setRead({ wallet, token, rows: value.refunds });
      })
      .catch(() => {
        if (!controller.signal.aborted) setRead({ wallet, token, rows: null });
      });
    return () => controller.abort();
  }, [wallet, token]);
  // Hide stale data immediately on account/session changes, before effects run.
  if (!read || read.wallet !== wallet || read.token !== token) return null;
  if (read.disabled) return null;
  if (read.rows === null) return <LocalizedAutomaticRefundStatus formatAmount={(n) => n} />;
  return (
    <>
      {read.rows.map((row) => (
        <div className="automatic-refund-account-row" key={row.campaign}>
          <code>{row.campaign}</code>
          <LocalizedAutomaticRefundStatus view={row} formatAmount={(n) => `${formatAmount(n, locale)} ${m.intent.xlmTestnet}`} />
        </div>
      ))}
    </>
  );
}
