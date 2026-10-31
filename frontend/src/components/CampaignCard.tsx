import type { Campaign } from '../types';
import { deadlineInfo, deadlineState, formatAmount, percent, regionName, shorten } from '../format';
import { fundingState } from '../funding-math';
import FundingGrid from './FundingGrid';
import type { CampaignProfile } from '../data/profiles';
import { composeInstrumentLabel } from '../data/instruments';
import { routeHash } from '../router';
import { useI18n } from '../i18n';

export type CampaignStatus = 'open' | 'funded' | 'ended';

export function campaignStatus(c: Campaign): CampaignStatus {
  if (percent(c.raised, c.config.goal) >= 100) return 'funded';
  if (deadlineState(c.config.deadline) === 'ended') return 'ended';
  return 'open';
}

type Props = {
  campaign: Campaign;
  profile?: CampaignProfile;
  actor: string;
  busy: boolean;
  readOnly: boolean;
  amount: string;
  amountError?: string;
  /** True when the campaign is sample fixture data; renders the DEMO badge and disclaimer. */
  demo?: boolean;
  onAmount: (v: string) => void;
  onPrepare: (action: 'contribute' | 'refund' | 'withdraw') => void;
};

export default function CampaignCard({ campaign: c, profile, actor, busy, readOnly, amount, amountError, demo, onAmount, onPrepare }: Props) {
  const { locale, m } = useI18n();
  const pct = percent(c.raised, c.config.goal);
  const dl = deadlineInfo(c.config.deadline, m.time);
  const status = campaignStatus(c);
  const state = fundingState(c.raised, c.config.goal, 20);
  return (
    <article className="card">
      {c.id === 'demo-solar' && (
        <figure className="card-photo">
          <img src="/demo-solar-farm.jpg" alt={m.card.photoAlt} loading="lazy" />
          <figcaption>{m.card.photoCaption}</figcaption>
        </figure>
      )}
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
            {profile && <p className="card-location">{regionName(profile.country, locale)}</p>}
          </div>
        </div>
        <div className="card-tags">
          {demo && <span className="status-chip chip-demo">{m.card.demo}</span>}
          {profile && (
            <span className="status-chip chip-instrument">
              {composeInstrumentLabel(m, profile.instrumentClass, profile.instrumentSeniority, profile.instrumentOverlays)}
            </span>
          )}
          <span className={`status-chip ${status === 'funded' ? 'status-funded' : status === 'ended' ? 'status-ended' : 'status-open'}`}>
            {status === 'funded' ? m.card.statusFunded : status === 'ended' ? m.card.statusEnded : m.card.statusOpen}
          </span>
          {c.withdrawn && <span className="status-chip status-withdrawn">{m.card.withdrawn}</span>}
        </div>
      </div>

      {profile && <p className="card-teaser">{profile.teaser}</p>}

      <FundingGrid raised={c.raised} goal={c.config.goal} />

      <p className="card-funded">
        {state.kind === 'ready' ? (
          <span className="card-funded-pct">{m.card.fundedPct(state.percent)}</span>
        ) : (
          <span className="card-funded-blocks">{m.card.progressUnavailable}</span>
        )}
      </p>
      <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={m.card.progressAria(pct)}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {profile && (
        <dl className="metric-chips">
          <div>
            <dt>{m.card.interest}</dt>
            <dd>{profile.interestRate}</dd>
          </div>
          <div>
            <dt>{m.card.term}</dt>
            <dd>{profile.term}</dd>
          </div>
          <div>
            <dt>{m.card.minimum}</dt>
            <dd>{profile.minInvestment}</dd>
          </div>
        </dl>
      )}

      <dl className="stat-grid">
        <div>
          <dt>{m.card.raised}</dt>
          <dd>
            {formatAmount(c.raised, locale)} <span className="stat-unit">{m.card.usdcTestnet}</span>
          </dd>
        </div>
        <div>
          <dt>{m.card.goal}</dt>
          <dd>
            {formatAmount(c.config.goal, locale)} <span className="stat-unit">{m.card.usdcTestnet}</span>
          </dd>
        </div>
        <div>
          <dt>{m.card.deadline}</dt>
          <dd>{dl.date}</dd>
        </div>
        <div>
          <dt>{m.card.status}</dt>
          <dd className={dl.state === 'closing' ? 'deadline-closing' : ''}>{dl.label}</dd>
        </div>
      </dl>

      {c.balance !== null && (
        <p className="your-position">
          {m.card.yourPosition} <strong>{formatAmount(c.balance, locale)} USDC (testnet)</strong>
        </p>
      )}

      <p className="card-details-link">
        <a href={routeHash({ name: 'campaign', campaignId: c.id })}>{m.card.viewDetails}</a>
      </p>

      {demo && <p className="card-demo-note">{m.card.demoNote}</p>}

      <details className="card-details">
        <summary>{m.card.contractData}</summary>
        <dl>
          <div>
            <dt>{m.card.contract}</dt>
            <dd>
              <code>{c.contractId}</code>
            </dd>
          </div>
          <div>
            <dt>{m.card.creator}</dt>
            <dd>
              <code>{c.config.creator}</code>
            </dd>
          </div>
          <div>
            <dt>{m.card.assetContract}</dt>
            <dd>
              <code>{shorten(c.config.token, 10, 6)}</code> ({m.card.assetValidated})
            </dd>
          </div>
          <div>
            <dt>{m.card.exactRaisedGoal}</dt>
            <dd>
              <code>
                {c.raised} / {c.config.goal}
              </code>{' '}
              ({m.card.unitsNote})
            </dd>
          </div>
          <div>
            <dt>{m.card.creatorWithdrawn}</dt>
            <dd>{c.withdrawn ? m.card.yes : m.card.no}</dd>
          </div>
        </dl>
      </details>

      {!readOnly && (
        <div className="card-actions">
          <label className="amount-label">
            {m.card.amountLabel}
            <input
              value={amount}
              onChange={(e) => onAmount(e.target.value)}
              placeholder="10.00"
              inputMode="decimal"
              aria-invalid={amountError ? true : undefined}
            />
          </label>
          {amountError ? <p className="field-error">{amountError}</p> : null}
          <div className="btn-row">
            <button className="btn btn-primary" disabled={busy || !actor} onClick={() => onPrepare('contribute')}>
              {m.card.contribute}
            </button>
            <button className="btn" disabled={busy || !actor || c.balance === null} onClick={() => onPrepare('refund')}>
              {m.card.refundMe}
            </button>
            <button className="btn" disabled={busy || actor !== c.config.creator} onClick={() => onPrepare('withdraw')}>
              {m.card.creatorWithdraw}
            </button>
          </div>
          <p className="card-rules">{m.card.rules}</p>
        </div>
      )}
    </article>
  );
}
