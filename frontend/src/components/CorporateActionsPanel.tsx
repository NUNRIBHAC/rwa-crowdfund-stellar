// Operator corporate-actions prototype panel: cap table with its basis and a
// distribution preview. Unknown positions are shown as UNKNOWN (never zero);
// the preview is withheld when positions are unknown or mixed-basis and is
// never declarable. Nothing is saved and no funds move.
import { useState } from 'react';
import { fetchOperatorCapTable, postOperatorDistributionPreview, type CapTableResponse, type DistributionPreviewResponse } from '../community/api';
import { useI18n } from '../i18n';
import { tpl } from '../format';

type Props = { token: string; campaigns: { id: string; name: string }[] };

export default function CorporateActionsPanel({ token, campaigns }: Props) {
  const { m } = useI18n();
  const l = m.community.operator.corp;
  const [campaign, setCampaign] = useState('');
  const [table, setTable] = useState<CapTableResponse | null>(null);
  const [preview, setPreview] = useState<DistributionPreviewResponse | null>(null);
  const [total, setTotal] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const guard = (p: Promise<void>) => {
    setBusy(true);
    setError('');
    p.catch((e) => setError(e instanceof Error ? e.message : String(e))).finally(() => setBusy(false));
  };
  const load = () => {
    if (!campaign) return;
    setPreview(null);
    guard(fetchOperatorCapTable(token, campaign).then(setTable));
  };
  const runPreview = () => {
    if (!campaign || !total.trim()) return;
    guard(postOperatorDistributionPreview(token, campaign, total.trim()).then(setPreview));
  };
  const sourceLabel = (s: string) => (s === 'on-chain' ? l.onChain : s === 'journal-intended' ? l.journal : l.unknown);

  return (
    <div className="corp-panel">
      <p className="community-note">{l.note}</p>
      {campaigns.length === 0 ? (
        <p className="community-note">{l.empty}</p>
      ) : (
        <div className="corp-controls">
          <label>
            {l.campaign}
            <select value={campaign} onChange={(e) => setCampaign(e.target.value)}>
              <option value="" />
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" disabled={!campaign || busy} onClick={load}>
            {l.load}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
      {table && (
        <>
          <p className="community-note">
            {l.basis}: {l.onChain} {table.basis.onChain}, {l.journal} {table.basis.journalIntended}, {l.unknown} {table.basis.unknown}
            {table.basis.mixed ? ` - ${l.mixed}` : ''}
          </p>
          <div className="table-scroll">
            <table className="operator-table">
              <thead>
                <tr>
                  <th>{l.colHolder}</th>
                  <th>{l.colPosition}</th>
                  <th>{l.colSource}</th>
                  <th>{l.colShare}</th>
                  <th>{l.cashflow}</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r) => (
                  <tr key={r.publicKey}>
                    <td className="cell-mono" dir="ltr">
                      {r.publicKey.slice(0, 6)}…{r.publicKey.slice(-4)}
                    </td>
                    <td dir="ltr">{r.position === 'UNKNOWN' ? l.unknown.toUpperCase() : r.position}</td>
                    <td>{sourceLabel(r.positionSource)}</td>
                    <td dir="ltr">{r.basisPoints === null ? '-' : `${(r.basisPoints / 100).toFixed(2)}%`}</td>
                    <td>
                      {r.confirmedCashflow ? (
                        <>
                          <span dir="ltr">
                            {r.confirmedCashflow.contributed} / {r.confirmedCashflow.refunded} / {r.confirmedCashflow.net}
                          </span>
                          <small className="community-note" style={{ display: 'block' }}>
                            {l.cashflowNote}
                          </small>
                        </>
                      ) : (
                        l.unknown.toUpperCase()
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="corp-controls">
            <label>
              {l.total}
              <input inputMode="decimal" dir="ltr" value={total} onChange={(e) => setTotal(e.target.value)} />
            </label>
            <button className="btn" disabled={!total.trim() || busy} onClick={runPreview}>
              {l.preview}
            </button>
          </div>
        </>
      )}
      {preview && (
        <div role="status">
          {preview.status === 'unavailable' ? (
            <p className="community-note">{tpl(l.unavailable, { n: String(preview.excludedUnknownHolderCount) })}</p>
          ) : (
            <>
              <p className="community-note">{l.illustration}</p>
              {preview.excludedUnknownHolderCount > 0 && <p className="community-note">{tpl(l.excluded, { n: String(preview.excludedUnknownHolderCount) })}</p>}
              <div className="table-scroll">
                <table className="operator-table">
                  <thead>
                    <tr>
                      <th>{l.colHolder}</th>
                      <th>{l.colAmount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr key={r.publicKey}>
                        <td className="cell-mono" dir="ltr">
                          {r.publicKey.slice(0, 6)}…{r.publicKey.slice(-4)}
                        </td>
                        <td dir="ltr">{r.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
