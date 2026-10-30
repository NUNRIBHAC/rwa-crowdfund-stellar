import { useState } from 'react';
import type { Market } from '../market';
import { campaignStatus } from '../components/CampaignCard';
import { deadlineInfo, formatAmount, percent, shorten } from '../format';
import { profileFor } from '../data/profiles';
import { instrumentLabel } from '../data/instruments';
import { routeHash } from '../router';

const TABS = ['Overview', 'Details', 'Documents', 'News'] as const;
type Tab = (typeof TABS)[number];

export default function CampaignDetail({ market, campaignId }: { market: Market; campaignId: string }) {
  const [tab, setTab] = useState<Tab>('Overview');
  const campaign = market.campaigns.find((c) => c.id === campaignId);

  if (!campaign) {
    return (
      <section>
        <h1 className="page-title">Campaign not found</h1>
        <p>
          No campaign with id <code>{campaignId}</code> is in the current registry{market.fixtureMode ? ' of sample campaigns' : ''}.
        </p>
        <p>
          <a href={routeHash({ name: 'investments' })}>Back to all investments</a>
        </p>
      </section>
    );
  }

  const profile = profileFor(campaign, market.fixtureMode);
  const pct = percent(campaign.raised, campaign.config.goal);
  const dl = deadlineInfo(campaign.config.deadline);
  const status = campaignStatus(campaign);
  const statusLabel = status === 'funded' ? 'Successfully financed' : status === 'ended' ? 'Unsuccessful' : dl.label;

  return (
    <article className="campaign-page">
      <p className="breadcrumb">
        <a href={routeHash({ name: 'investments' })}>All investments</a> / {campaign.name}
      </p>

      <header className="campaign-head">
        <div className="card-tags">
          {profile && <span className="status-chip">{profile.category}</span>}
          {profile && <span className="status-chip chip-instrument">{instrumentLabel(profile.instrumentClass)}</span>}
          {profile && <span className="status-chip chip-country">{profile.country}</span>}
          <span className={`status-chip ${status === 'funded' ? 'status-funded' : status === 'ended' ? 'status-ended' : 'status-open'}`}>{statusLabel}</span>
        </div>
        <h1 className="page-title">{campaign.name}</h1>
        {profile ? (
          <p className="campaign-issuer">{profile.issuer}</p>
        ) : (
          <p className="campaign-issuer">
            Issuer identity and off-chain terms are not available in this prototype; the data below comes from the on-chain contract.
          </p>
        )}
      </header>

      <dl className="metric-cards">
        <div className="metric-card">
          <dt>Asset class</dt>
          <dd>{profile ? instrumentLabel(profile.instrumentClass) : 'Contract escrow (testnet)'}</dd>
        </div>
        <div className="metric-card">
          <dt>Interest rate</dt>
          <dd>{profile ? profile.interestRate : 'None - contribution escrow only'}</dd>
        </div>
        <div className="metric-card">
          <dt>Term</dt>
          <dd>{profile ? profile.term : `Deadline ${dl.date}`}</dd>
        </div>
        <div className="metric-card">
          <dt>Minimum investment</dt>
          <dd>{profile ? profile.minInvestment : 'Set per transaction, capped at remaining goal'}</dd>
        </div>
      </dl>

      {profile && (
        <p className="instrument-explainer">{instrumentExplainer(profile.instrumentClass)} This is sample educational text, not terms of a live offer.</p>
      )}

      <div className="campaign-columns">
        <div className="campaign-main">
          <section aria-label="Platform facts">
            <h2 className="section-title">Additional info</h2>
            {profile ? (
              <dl className="info-grid">
                {profile.additionalInfo.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <dl className="info-grid">
                <div>
                  <dt>Funding model</dt>
                  <dd>All-or-nothing, enforced by the Soroban contract</dd>
                </div>
                <div>
                  <dt>Goal</dt>
                  <dd>{formatAmount(campaign.config.goal)} USDC (testnet)</dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd>{dl.date}</dd>
                </div>
                <div>
                  <dt>Contract</dt>
                  <dd>
                    <code>{campaign.contractId}</code>
                  </dd>
                </div>
                <div>
                  <dt>Asset</dt>
                  <dd>
                    <code>{shorten(campaign.config.token, 10, 6)}</code> (validated by the API as testnet USDC)
                  </dd>
                </div>
                <div>
                  <dt>Interest, ISIN, documents</dt>
                  <dd>Not available - this prototype records contributions only and issues no securities</dd>
                </div>
              </dl>
            )}
          </section>

          <div className="marketing-divider" role="separator" aria-label="Marketing content below">
            <span>Issuer-provided content below - not verified by the platform</span>
          </div>

          <div className="tab-bar" role="group" aria-label="Campaign sections">
            {TABS.map((t) => (
              <button key={t} className={`chip ${tab === t ? 'chip-active' : ''}`} aria-pressed={tab === t} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'Overview' && (
            <section aria-label="Overview">
              {(profile?.overview ?? []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {!profile && (
                <p>
                  Issuer marketing content is not available in this prototype. On a production platform this area would carry the issuer&apos;s own description,
                  team and business model, clearly separated from platform facts by the divider above.
                </p>
              )}
            </section>
          )}
          {tab === 'Details' && (
            <section aria-label="Details">
              <p>
                Business model, market, financials and milestones would appear here as issuer-provided sections.{' '}
                {profile ? 'This sample campaign ships no detail content.' : 'Not available in this prototype.'}
              </p>
            </section>
          )}
          {tab === 'Documents' && (
            <section aria-label="Documents">
              {profile ? (
                <ul className="doc-list">
                  {profile.documents.map((d) => (
                    <li key={d.label}>
                      <strong>{d.label}</strong>
                      <span className="doc-note"> - {d.note}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Document hosting is not available in this prototype. A production platform would host the key information sheet and issue terms here.</p>
              )}
            </section>
          )}
          {tab === 'News' && (
            <section aria-label="News">
              {profile && profile.news.length > 0 ? (
                <ul className="doc-list">
                  {profile.news.map((n, i) => (
                    <li key={i}>
                      <strong>{n.date}</strong>
                      <span className="doc-note"> - {n.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No updates. Campaign news would appear here.</p>
              )}
            </section>
          )}
        </div>

        <aside className="invest-widget" aria-label="Invest">
          <h2 className="widget-title">{status === 'open' ? 'Contribute' : 'Investment overview'}</h2>
          <div className="progress-row">
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
            <span className="progress-pct">{pct}%</span>
          </div>
          <dl className="stat-grid">
            <div>
              <dt>Raised</dt>
              <dd>{formatAmount(campaign.raised)} USDC (testnet)</dd>
            </div>
            <div>
              <dt>Goal</dt>
              <dd>{formatAmount(campaign.config.goal)} USDC (testnet)</dd>
            </div>
          </dl>

          {market.fixtureMode ? (
            <p className="widget-note">Sample preview. This campaign is a fixture, not a deployed contract, and cannot accept contributions.</p>
          ) : status === 'open' ? (
            <div className="card-actions">
              <label className="amount-label">
                Contribution amount (testnet USDC)
                <input
                  value={market.amounts[campaign.id] ?? ''}
                  onChange={(e) => market.onAmount(campaign.id, e.target.value)}
                  placeholder="10.00"
                  inputMode="decimal"
                />
              </label>
              <div className="btn-row">
                <button className="btn btn-primary" disabled={market.busy || !market.actor} onClick={() => market.onPrepare(campaign, 'contribute')}>
                  Contribute
                </button>
                <button
                  className="btn"
                  disabled={market.busy || !market.actor || campaign.balance === null}
                  onClick={() => market.onPrepare(campaign, 'refund')}
                >
                  Refund me
                </button>
                <button
                  className="btn"
                  disabled={market.busy || market.actor !== campaign.config.creator}
                  onClick={() => market.onPrepare(campaign, 'withdraw')}
                >
                  Creator withdraw
                </button>
              </div>
            </div>
          ) : (
            <p className="widget-note">This campaign has ended. Refunds remain available below the deadline rules described on the investments page.</p>
          )}

          <p className="widget-risk">Crowdfunding investments carry a risk of total loss and are illiquid. This prototype uses worthless testnet assets.</p>
        </aside>
      </div>
    </article>
  );
}

function instrumentExplainer(id: string): string {
  switch (id) {
    case 'senior-bond':
      return 'A senior bond is non-subordinated debt: bondholders rank ahead of subordinated capital and equity in insolvency and receive a fixed coupon, with no participation in company growth.';
    case 'subordinated-bond':
      return 'A subordinated bond pays a defined coupon but ranks behind senior creditors in insolvency and carries no participation in company growth.';
    case 'convertible-bond':
      return 'A convertible bond pays interest until a configured trigger lets holders convert into shares under the issue terms.';
    default:
      return 'This instrument class is described in the Learn hub.';
  }
}
