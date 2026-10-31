import type { Campaign } from '../types';
import { deadlineInfo, formatAmount, percent, shorten } from '../format';
import { fundingState } from '../funding-math';
import FundingGrid from './FundingGrid';
import type { CampaignProfile } from '../data/profiles';
import { composeInstrumentLabel } from '../data/instruments';
import { routeHash } from '../router';

export type CampaignStatus = 'open' | 'funded' | 'ended';

export function campaignStatus(c: Campaign): CampaignStatus {
  if (percent(c.raised, c.config.goal) >= 100) return 'funded';
  if (deadlineInfo(c.config.deadline).state === 'ended') return 'ended';
  return 'open';
}

type Props = {
  campaign: Campaign;
  profile?: CampaignProfile;
  actor: string;
  busy: boolean;
  readOnly: boolean;
  amount: string;
  /** True when the campaign is sample fixture data; renders the DEMO badge and disclaimer. */
  demo?: boolean;
  onAmount: (v: string) => void;
  onPrepare: (action: 'contribute' | 'refund' | 'withdraw') => void;
};

export default function CampaignCard({ campaign: c, profile, actor, busy, readOnly, amount, demo, onAmount, onPrepare }: Props) {
  const pct = percent(c.raised, c.config.goal);
  const dl = deadlineInfo(c.config.deadline);
  const status = campaignStatus(c);
  const state = fundingState(c.raised, c.config.goal, 16);
  return (
    <article className="card">
      <div className="card-top">
        <div className="card-id">
          <svg className="card-mark" viewBox="0 0 240 240" aria-hidden="true">
            <rect x="28" y="28" width="184" height="184" rx="26" fill="none" stroke="#14163A" strokeWidth="13" />
            <rect x="50" y="150" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="100" y="150" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="150" y="150" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="50" y="100" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="100" y="100" width="40" height="40" rx="9" fill="#8B8EF0" />
            <rect x="50" y="50" width="40" height="40" rx="9" fill="#C7C8F9" />
            <rect x="196" y="6" width="38" height="38" rx="9" fill="#4B4FE2" />
          </svg>
          <div>
            <h3 className="card-title">
              <a href={routeHash({ name: 'campaign', campaignId: c.id })}>{c.name}</a>
            </h3>
            {profile && <p className="card-location">{profile.country}</p>}
          </div>
        </div>
        <div className="card-tags">
          {demo && <span className="status-chip chip-demo">Demo</span>}
          {profile && (
            <span className="status-chip chip-instrument">
              {composeInstrumentLabel(profile.instrumentClass, profile.instrumentSeniority, profile.instrumentOverlays)}
            </span>
          )}
          <span className={`status-chip ${status === 'funded' ? 'status-funded' : status === 'ended' ? 'status-ended' : 'status-open'}`}>
            {status === 'funded' ? 'Funded' : status === 'ended' ? 'Underfunded' : 'Open'}
          </span>
          {c.withdrawn && <span className="status-chip status-withdrawn">Withdrawn</span>}
        </div>
      </div>

      {profile && <p className="card-teaser">{profile.teaser}</p>}

      <FundingGrid raised={c.raised} goal={c.config.goal} />

      <p className="card-funded">
        {state.kind === 'ready' ? (
          <>
            <span className="card-funded-pct">{state.percent}% funded</span> <span className="card-funded-blocks">{state.filled} of 16 blocks</span>
          </>
        ) : (
          <span className="card-funded-blocks">Progress unavailable - on-chain data not loaded</span>
        )}
      </p>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Funding progress: ${pct}% of goal`}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {profile && (
        <dl className="metric-chips">
          <div>
            <dt>Interest</dt>
            <dd>{profile.interestRate}</dd>
          </div>
          <div>
            <dt>Term</dt>
            <dd>{profile.term}</dd>
          </div>
          <div>
            <dt>Minimum</dt>
            <dd>{profile.minInvestment}</dd>
          </div>
        </dl>
      )}

      <dl className="stat-grid">
        <div>
          <dt>Raised</dt>
          <dd>
            {formatAmount(c.raised)} <span className="stat-unit">USDC (testnet)</span>
          </dd>
        </div>
        <div>
          <dt>Goal</dt>
          <dd>
            {formatAmount(c.config.goal)} <span className="stat-unit">USDC (testnet)</span>
          </dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>{dl.date}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd className={dl.state === 'closing' ? 'deadline-closing' : ''}>{dl.label}</dd>
        </div>
      </dl>

      {c.balance !== null && (
        <p className="your-position">
          Your contribution record: <strong>{formatAmount(c.balance)} USDC (testnet)</strong>
        </p>
      )}

      <p className="card-details-link">
        <a href={routeHash({ name: 'campaign', campaignId: c.id })}>View details</a>
      </p>

      {demo && <p className="card-demo-note">Illustrative demo data - not a real offering.</p>}

      <details className="card-details">
        <summary>Contract data</summary>
        <dl>
          <div>
            <dt>Contract</dt>
            <dd>
              <code>{c.contractId}</code>
            </dd>
          </div>
          <div>
            <dt>Creator</dt>
            <dd>
              <code>{c.config.creator}</code>
            </dd>
          </div>
          <div>
            <dt>Asset contract</dt>
            <dd>
              <code>{shorten(c.config.token, 10, 6)}</code> (validated by the API as testnet USDC)
            </dd>
          </div>
          <div>
            <dt>Exact raised / goal</dt>
            <dd>
              <code>
                {c.raised} / {c.config.goal}
              </code>{' '}
              (7-decimal units)
            </dd>
          </div>
          <div>
            <dt>Creator withdrawn</dt>
            <dd>{c.withdrawn ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </details>

      {!readOnly && (
        <div className="card-actions">
          <label className="amount-label">
            Contribution amount (testnet USDC)
            <input value={amount} onChange={(e) => onAmount(e.target.value)} placeholder="10.00" inputMode="decimal" />
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
            Contribute before the deadline, up to the remaining goal. After the deadline the creator withdraws only if fully funded; otherwise each contributor
            signs their own refund. The contract enforces these rules atomically.
          </p>
        </div>
      )}
    </article>
  );
}
