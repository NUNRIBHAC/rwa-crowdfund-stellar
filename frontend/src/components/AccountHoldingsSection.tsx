// Investor holdings view: the wallet's per-campaign position from the same
// cap table the operator sees, for campaigns with a SUCCESS contribute or
// refund in the journal. INTENDED/on-chain basis and UNKNOWN are surfaced,
// never coerced to 0. No holder right, dividend or obligation is implied.
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { tpl } from '../format';
import { routeHash } from '../router';

type Holding = {
  campaignId: string;
  position: string; // decimal units string, or 'UNKNOWN'
  positionSource: 'on-chain' | 'journal-intended' | 'unknown';
  basisPoints: number | null;
  note?: string;
  registerComplete: boolean;
  basisMixed: boolean;
};

type Data = { holdings: Holding[]; unavailable: string[] };

export default function AccountHoldingsSection({ actor }: { actor: string }) {
  const { locale, m } = useI18n();
  const a = m.account;
  const [state, setState] = useState<'loading' | 'error' | Data>('loading');

  useEffect(() => {
    let live = true;
    setState('loading');
    fetch(`/api/account/holdings?actor=${encodeURIComponent(actor)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!live) return;
        setState({
          holdings: Array.isArray(j.holdings) ? j.holdings : [],
          unavailable: Array.isArray(j.unavailable) ? j.unavailable : [],
        });
      })
      .catch(() => {
        if (live) setState('error');
      });
    return () => {
      live = false;
    };
  }, [actor]);

  const sourceLabel = (s: Holding['positionSource']) =>
    s === 'on-chain' ? a.holdingsSourceOnchain : s === 'journal-intended' ? a.holdingsSourceJournal : a.holdingsSourceUnknown;

  return (
    <section aria-label={a.holdingsAria}>
      <h2 className="section-title">{a.holdingsTitle}</h2>
      <p className="account-note">{a.holdingsNote}</p>
      {state === 'loading' ? null : state === 'error' ? (
        <p className="community-error" role="status">
          {a.holdingsUnavailable}
        </p>
      ) : state.holdings.length === 0 && state.unavailable.length === 0 ? (
        <p className="empty-state">{a.holdingsEmpty}</p>
      ) : (
        <>
          <ul className="activity-list">
            {state.holdings.map((h) => (
              <li key={h.campaignId}>
                <a href={routeHash({ name: 'campaign', campaignId: h.campaignId })}>{h.campaignId}</a> -{' '}
                <strong>{h.position === 'UNKNOWN' ? a.holdingsUnknown : h.position}</strong> ({sourceLabel(h.positionSource)})
                {h.basisPoints !== null && ` - ${(h.basisPoints / 100).toLocaleString(locale, { maximumFractionDigits: 2 })}% ${a.holdingsShareLabel}`}
                {!h.registerComplete && ` - ${a.holdingsRegisterIncomplete}`}
                {h.basisMixed && ` ${a.holdingsBasisMixed}`}
              </li>
            ))}
          </ul>
          {state.unavailable.length > 0 && <p className="community-note">{tpl(a.holdingsUnavailableCampaigns, { list: state.unavailable.join(', ') })}</p>}
        </>
      )}
    </section>
  );
}
