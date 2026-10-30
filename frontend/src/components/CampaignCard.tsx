import type { Campaign } from '../types';
import { deadlineInfo, formatAmount, percent, shorten } from '../format';

export type CampaignStatus = 'open' | 'funded' | 'ended';

export function campaignStatus(c: Campaign): CampaignStatus {
  if (percent(c.raised, c.config.goal) >= 100) return 'funded';
  if (deadlineInfo(c.config.deadline).state === 'ended') return 'ended';
  return 'open';
}

type Props = {
  campaign: Campaign;
  actor: string;
  busy: boolean;
  readOnly: boolean;
  amount: string;
  onAmount: (v: string) => void;
  onPrepare: (action: 'contribute' | 'refund' | 'withdraw') => void;
};

export default function CampaignCard({ campaign: c, actor, busy, readOnly, amount, onAmount, onPrepare }: Props) {
  const pct = percent(c.raised, c.config.goal);
  const dl = deadlineInfo(c.config.deadline);
  const status = campaignStatus(c);
  return (
    <article className="card">
      <div className="card-top">
        <h3 className="card-title">{c.name}</h3>
        <div className="card-tags">
          <span className={`status-chip ${status === 'funded' ? 'status-funded' : status === 'ended' ? 'status-ended' : 'status-open'}`}>
            {status === 'funded' ? 'Funded' : status === 'ended' ? 'Underfunded' : 'Open'}
          </span>
          {c.withdrawn && <span className="status-chip status-withdrawn">Withdrawn</span>}
        </div>
      </div>

      <div className="progress-row">
        <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Funding progress: ${pct}% of goal`}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-pct">{pct}%</span>
      </div>

      <dl className="stat-grid">
        <div><dt>Raised</dt><dd>{formatAmount(c.raised)} <span className="stat-unit">USDC (testnet)</span></dd></div>
        <div><dt>Goal</dt><dd>{formatAmount(c.config.goal)} <span className="stat-unit">USDC (testnet)</span></dd></div>
        <div><dt>Deadline</dt><dd>{dl.date}</dd></div>
        <div><dt>Status</dt><dd className={dl.state === 'closing' ? 'deadline-closing' : ''}>{dl.label}</dd></div>
      </dl>

      {c.balance !== null && (
        <p className="your-position">Your contribution record: <strong>{formatAmount(c.balance)} USDC (testnet)</strong></p>
      )}

      <details className="card-details">
        <summary>Campaign details</summary>
        <dl>
          <div><dt>Contract</dt><dd><code>{c.contractId}</code></dd></div>
          <div><dt>Creator</dt><dd><code>{c.config.creator}</code></dd></div>
          <div><dt>Asset contract</dt><dd><code>{shorten(c.config.token, 10, 6)}</code> (validated by the API as testnet USDC)</dd></div>
          <div><dt>Exact raised / goal</dt><dd><code>{c.raised} / {c.config.goal}</code> (7-decimal units)</dd></div>
          <div><dt>Creator withdrawn</dt><dd>{c.withdrawn ? 'Yes' : 'No'}</dd></div>
        </dl>
      </details>

      {!readOnly && (
        <div className="card-actions">
          <label className="amount-label">
            Contribution amount (testnet USDC)
            <input
              value={amount}
              onChange={e => onAmount(e.target.value)}
              placeholder="10.00"
              inputMode="decimal"
            />
          </label>
          <div className="btn-row">
            <button className="btn btn-primary" disabled={busy || !actor} onClick={() => onPrepare('contribute')}>
              Contribute
            </button>
            <button className="btn" disabled={busy || !actor || c.balance === null} onClick={() => onPrepare('refund')}>
              Refund me
            </button>
            <button className="btn" disabled={busy || actor !== c.config.creator} onClick={() => onPrepare('withdraw')}>
              Creator withdraw
            </button>
          </div>
          <p className="card-rules">
            Contribute before the deadline, up to the remaining goal. After the deadline the
            creator withdraws only if fully funded; otherwise each contributor signs their own
            refund. The contract enforces these rules atomically.
          </p>
        </div>
      )}
    </article>
  );
}
