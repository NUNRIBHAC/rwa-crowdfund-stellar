import { useState } from 'react';
import FundingGrid from '../components/FundingGrid';
import type { Market } from '../market';
import { campaignStatus } from '../components/CampaignCard';
import { deadlineInfo, formatAmount, regionName, shorten } from '../format';
import { profileFor, type CampaignProfile } from '../data/profiles';
import { composeInstrumentLabel } from '../data/instruments';
import { routeHash } from '../router';
import { useI18n } from '../i18n';
import DocumentsList from '../components/DocumentsList';
import NewsList from '../components/NewsList';
import Comments from '../components/Comments';
import type { Messages } from '../i18n/locales/en';

const TAB_IDS = ['overview', 'details', 'documents', 'news'] as const;

export default function CampaignDetail({ market, campaignId }: { market: Market; campaignId: string }) {
  const { locale, m } = useI18n();
  const [tab, setTab] = useState<(typeof TAB_IDS)[number]>('overview');
  const campaign = market.campaigns.find((c) => c.id === campaignId);

  if (!campaign) {
    if (!market.loaded) {
      // Registry still loading: never claim "not found" before the fetch settles.
      return (
        <section aria-live="polite">
          <h1 className="page-title">{m.campaign.loading}</h1>
        </section>
      );
    }
    return (
      <section>
        <h1 className="page-title">{m.campaign.notFound}</h1>
        <p>
          {m.campaign.notFoundText} <code>{campaignId}</code>
          {market.fixtureMode ? m.campaign.notFoundFixtureSuffix : ''}.
        </p>
        <p>
          <a href={routeHash({ name: 'investments' })}>{m.campaign.backToAll}</a>
        </p>
      </section>
    );
  }

  const profile = profileFor(campaign, market.fixtureMode, m.profiles.list);
  const dl = deadlineInfo(campaign.config.deadline, m.time);
  const status = campaignStatus(campaign);
  const statusLabel = status === 'funded' ? m.campaign.statusFunded : status === 'ended' ? m.campaign.statusEnded : dl.label;

  return (
    <article className="campaign-page">
      <p className="breadcrumb">
        <a href={routeHash({ name: 'investments' })}>{m.campaign.backToAll}</a> / {campaign.name}
      </p>

      <header className="campaign-head">
        <div className="card-tags">
          {profile && <span className="status-chip">{profile.category}</span>}
          {profile && (
            <span className="status-chip chip-instrument">
              {composeInstrumentLabel(m, profile.instrumentClass, profile.instrumentSeniority, profile.instrumentOverlays)}
            </span>
          )}
          {profile && <span className="status-chip chip-country">{regionName(profile.country, locale)}</span>}
          <span className={`status-chip ${status === 'funded' ? 'status-funded' : status === 'ended' ? 'status-ended' : 'status-open'}`}>{statusLabel}</span>
        </div>
        <h1 className="page-title">{campaign.name}</h1>
        {campaign.id === 'demo-solar' && (
          <figure className="campaign-photo">
            <img src="/demo-solar-farm.jpg" alt={m.card.photoAlt} loading="lazy" />
            <figcaption>{m.card.photoCaption}</figcaption>
          </figure>
        )}
        {profile ? <p className="campaign-issuer">{profile.issuer}</p> : <p className="campaign-issuer">{m.campaign.issuerMissing}</p>}
      </header>

      <dl className="metric-cards">
        <div className="metric-card">
          <dt>{m.campaign.assetClass}</dt>
          <dd>
            {profile ? composeInstrumentLabel(m, profile.instrumentClass, profile.instrumentSeniority, profile.instrumentOverlays) : m.campaign.escrowTestnet}
          </dd>
        </div>
        <div className="metric-card">
          <dt>{m.campaign.interestRate}</dt>
          <dd>{profile ? profile.interestRate : m.campaign.noInterest}</dd>
        </div>
        <div className="metric-card">
          <dt>{m.campaign.term}</dt>
          <dd>{profile ? profile.term : `${m.campaign.termDeadlinePrefix} ${dl.date}`}</dd>
        </div>
        <div className="metric-card">
          <dt>{m.campaign.minInvestment}</dt>
          <dd>{profile ? profile.minInvestment : m.campaign.minNote}</dd>
        </div>
      </dl>

      {profile && (
        <p className="instrument-explainer">
          {instrumentExplainer(m, profile)} {m.campaign.explainerSuffix}
        </p>
      )}

      <div className="campaign-columns">
        <div className="campaign-main">
          <section aria-label={m.campaign.factsAria}>
            <h2 className="section-title">{m.campaign.additionalInfo}</h2>
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
                  <dt>{m.campaign.fundingModel}</dt>
                  <dd>{m.campaign.aonEnforced}</dd>
                </div>
                <div>
                  <dt>{m.campaign.goal}</dt>
                  <dd>
                    {formatAmount(campaign.config.goal, locale)} {m.campaign.usdcTestnet}
                  </dd>
                </div>
                <div>
                  <dt>{m.campaign.deadline}</dt>
                  <dd>{dl.date}</dd>
                </div>
                <div>
                  <dt>{m.campaign.contract}</dt>
                  <dd>
                    <code>{campaign.contractId}</code>
                  </dd>
                </div>
                <div>
                  <dt>{m.campaign.asset}</dt>
                  <dd>
                    <code>{shorten(campaign.config.token, 10, 6)}</code> ({m.campaign.assetValidated})
                  </dd>
                </div>
                <div>
                  <dt>{m.campaign.interestIsinDocs}</dt>
                  <dd>{m.campaign.interestIsinDocsNote}</dd>
                </div>
              </dl>
            )}
          </section>

          <div className="marketing-divider" role="separator" aria-label={m.campaign.marketingDividerAria}>
            <span>{m.campaign.marketingDivider}</span>
          </div>

          <div className="tab-bar" role="group" aria-label={m.campaign.tabsAria}>
            {TAB_IDS.map((id, i) => (
              <button key={id} className={`chip ${tab === id ? 'chip-active' : ''}`} aria-pressed={tab === id} onClick={() => setTab(id)}>
                {m.campaign.tabs[i]}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <section aria-label={m.campaign.tabs[0]}>
              {(profile?.overview ?? []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {!profile && <p>{m.campaign.overviewMissing}</p>}
            </section>
          )}
          {tab === 'details' && (
            <section aria-label={m.campaign.tabs[1]}>
              <p>
                {m.campaign.detailsPre} {profile ? m.campaign.detailsSample : m.campaign.detailsMissing}
              </p>
            </section>
          )}
          {tab === 'documents' && (
            <section aria-label={m.campaign.tabs[2]}>
              <DocumentsList
                campaignId={campaign.id}
                fallback={
                  profile ? (
                    <ul className="doc-list">
                      {profile.documents.map((d) => (
                        <li key={d.label}>
                          <strong>{d.label}</strong>
                          <span className="doc-note"> - {d.note}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{m.campaign.documentsMissing}</p>
                  )
                }
              />
            </section>
          )}
          {tab === 'news' && (
            <section aria-label={m.campaign.tabs[3]}>
              <NewsList
                campaignId={campaign.id}
                fallback={
                  profile && profile.news.length > 0 ? (
                    <ul className="doc-list">
                      {profile.news.map((n, i) => (
                        <li key={i}>
                          <strong>{n.date}</strong>
                          <span className="doc-note"> - {n.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{m.campaign.newsEmpty}</p>
                  )
                }
              />
            </section>
          )}

          <Comments campaignId={campaign.id} />
        </div>

        <aside className="invest-widget" aria-label={m.nav.investments}>
          <h2 className="widget-title">{status === 'open' ? m.campaign.widgetContribute : m.campaign.widgetOverview}</h2>
          <FundingGrid raised={campaign.raised} goal={campaign.config.goal} layout="block" />
          <dl className="stat-grid">
            <div>
              <dt>{m.campaign.raised}</dt>
              <dd>
                {formatAmount(campaign.raised, locale)} {m.campaign.usdcTestnet}
              </dd>
            </div>
            <div>
              <dt>{m.campaign.goal}</dt>
              <dd>
                {formatAmount(campaign.config.goal, locale)} {m.campaign.usdcTestnet}
              </dd>
            </div>
          </dl>

          {market.fixtureMode ? (
            <p className="widget-note">{m.campaign.widgetFixture}</p>
          ) : status === 'open' ? (
            <div className="card-actions">
              <label className="amount-label">
                {m.card.amountLabel}
                <input
                  value={market.amounts[campaign.id] ?? ''}
                  onChange={(e) => market.onAmount(campaign.id, e.target.value)}
                  placeholder="10.00"
                  inputMode="decimal"
                />
              </label>
              <div className="btn-row">
                <button className="btn btn-primary" disabled={market.busy || !market.actor} onClick={() => market.onPrepare(campaign, 'contribute')}>
                  {m.card.contribute}
                </button>
                <button
                  className="btn"
                  disabled={market.busy || !market.actor || campaign.balance === null}
                  onClick={() => market.onPrepare(campaign, 'refund')}
                >
                  {m.card.refundMe}
                </button>
                <button
                  className="btn"
                  disabled={market.busy || market.actor !== campaign.config.creator}
                  onClick={() => market.onPrepare(campaign, 'withdraw')}
                >
                  {m.card.creatorWithdraw}
                </button>
              </div>
            </div>
          ) : (
            <p className="widget-note">{m.campaign.widgetEnded}</p>
          )}

          <p className="widget-risk">{m.campaign.widgetRisk}</p>
        </aside>
      </div>
    </article>
  );
}

function instrumentExplainer(m: Messages, profile: CampaignProfile): string {
  const convertible = (profile.instrumentOverlays ?? []).includes('convertible');
  if (convertible) return m.campaign.explainerConvertible;
  if (profile.instrumentClass === 'bond' && profile.instrumentSeniority === 'senior') return m.campaign.explainerSeniorBond;
  if (profile.instrumentClass === 'bond' && profile.instrumentSeniority === 'subordinated') return m.campaign.explainerSubBond;
  return m.campaign.explainerDefault;
}
