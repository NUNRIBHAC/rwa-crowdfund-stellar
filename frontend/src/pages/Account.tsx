import ContributionRecordButton from '../components/ContributionRecordButton';
import DemoJourney from '../components/DemoJourney';
import { useCommunityAuth } from '../community/CommunityAuth';
import { accountReadActor } from '../account-read-actor';
import { useEffect, useMemo, useState } from 'react';
import type { Market } from '../market';
import { campaignStatus } from '../components/CampaignCard';
import type { Campaign } from '../types';
import { formatAmount, shorten } from '../format';
import { routeHash } from '../router';
import { useI18n } from '../i18n';
import AccountNewsSection from '../components/AccountNewsSection';
import DocumentsList from '../components/DocumentsList';
import AccountPayoutsSection from '../components/AccountPayoutsSection';
import AccountHoldingsSection from '../components/AccountHoldingsSection';
import AccountInvestmentDocuments from '../components/AccountInvestmentDocuments';
import SignInPanel from '../components/SignInPanel';
import MyCommunityActivity from '../components/MyCommunityActivity';
import CompanyAccountsSection from '../components/CompanyAccountsSection';
import NotificationsSection from '../components/NotificationsSection';
import SecuritySection from '../components/SecuritySection';
import OperatorSection from '../components/OperatorSection';
import SupportCenter from '../components/SupportCenter';
import InvestorOnboarding from '../components/InvestorOnboarding';
import AppropriatenessSection from '../components/AppropriatenessSection';
import IssuerApplicationForm from '../components/IssuerApplicationForm';

const INTENT_KEY = 'rwa-soroban-intent';

type PortfolioStatus = 'pending' | 'paid' | 'completed' | 'canceled';

type Row = {
  id: string;
  name: string;
  balance: string;
  status: PortfolioStatus;
};

// One recorded transaction intent from the platform journal (on-chain-public
// fields only; the API never returns envelope material).
type ActivityRow = {
  hash: string;
  campaign: string;
  action: string;
  amount: string | null;
  status: string;
  createdAt: string | null;
  updatedAt?: string | null;
};

// Prototype mapping from the contract lifecycle to the portfolio tabs. The
// reference platform (blueprint section 7A) uses All / Canceled / Pending /
// Paid / Completed; the label keys are kept, the meanings below are ours.
const TAB_IDS: (PortfolioStatus | 'all')[] = ['all', 'canceled', 'pending', 'paid', 'completed'];

function rowStatus(c: Campaign): PortfolioStatus {
  const s = campaignStatus(c);
  if (s === 'open') return 'pending';
  if (s === 'funded') return 'completed';
  return 'canceled';
}

function readIntent(): {
  action?: string;
  campaign?: string;
  status?: string;
} | null {
  try {
    const raw = localStorage.getItem(INTENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Account({ market }: { market: Market }) {
  const { locale, m } = useI18n();
  const { campaigns, actor, fixtureMode } = market;
  const { account, token } = useCommunityAuth();
  const readActor = accountReadActor(actor, account);
  const [tab, setTab] = useState<PortfolioStatus | 'all'>('all');
  const intent = useMemo(readIntent, []);
  const [activityRead, setActivityRead] = useState<{
    actor: string;
    data: ActivityRow[] | 'loading' | 'error';
    network?: unknown;
    productionEligible?: unknown;
  } | null>(null);
  const activity = !readActor ? null : activityRead?.actor === readActor ? activityRead.data : 'loading';
  // Positions for the selected proven read actor: the same public /api/campaigns?actor= read the connected-wallet
  // path uses, never fabricated rows. Transaction paths still require the
  // connected wallet - this feeds only the read-only portfolio/invested-news
  // sections.
  const [positionsRead, setPositionsRead] = useState<{ actor: string; data: Campaign[] | 'loading' | 'error' } | null>(null);

  // Real activity feed: the wallet's recorded intents from the platform
  // journal. Falls back to the locally saved intent when the feed is
  // unavailable or empty, so the section never shows fabricated history.
  useEffect(() => {
    setActivityRead(null);
    if (!readActor) {
      return;
    }
    let live = true;
    setActivityRead({ actor: readActor, data: 'loading' });
    fetch(`/api/account/activity?actor=${encodeURIComponent(readActor)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (live)
          setActivityRead({
            actor: readActor,
            data: Array.isArray(j.activity) ? j.activity : [],
            network: j.network,
            productionEligible: j.productionEligible,
          });
      })
      .catch(() => {
        if (live) setActivityRead({ actor: readActor, data: 'error' });
      });
    return () => {
      live = false;
    };
  }, [readActor]);

  useEffect(() => {
    setPositionsRead(null);
    if (!readActor) {
      return;
    }
    let live = true;
    setPositionsRead({ actor: readActor, data: 'loading' });
    fetch(`/api/campaigns?actor=${encodeURIComponent(readActor)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!Array.isArray(j.campaigns)) throw new Error('invalid campaign response');
        if (live) setPositionsRead({ actor: readActor, data: j.campaigns });
      })
      .catch(() => {
        if (live) setPositionsRead({ actor: readActor, data: 'error' });
      });
    return () => {
      live = false;
    };
  }, [readActor]);

  const positions = !readActor ? null : positionsRead?.actor === readActor ? positionsRead.data : 'loading';
  const positionCampaigns = useMemo(() => (Array.isArray(positions) ? positions : []), [positions]);
  const positionsReady = Array.isArray(positions);
  const positionsStatus = positions === 'loading' ? m.community.loading : positions === 'error' ? m.errors.apiUnavailable : '';

  const rows: Row[] = useMemo(
    () =>
      positionCampaigns
        .filter((c) => c.balance && BigInt(c.balance) > 0n)
        .map((c) => ({
          id: c.id,
          name: c.name,
          balance: c.balance as string,
          status: rowStatus(c),
        })),
    [positionCampaigns],
  );
  const total = rows.reduce((acc, r) => acc + BigInt(r.balance), 0n);
  const active = rows.filter((r) => r.status === 'pending' || r.status === 'paid').length;
  const shown = tab === 'all' ? rows : rows.filter((r) => r.status === tab);
  const hasPositions = Boolean(readActor) && !fixtureMode;

  return (
    <>
      <h1 className="page-title">{m.account.title}</h1>
      <p className="account-note" role="note">
        {m.account.note}
      </p>

      <section aria-label={m.account.summaryAria}>
        <div className="account-stats">
          <div className="account-stat">
            <h2>{m.account.totalContributed}</h2>
            <p className="account-stat-value">{hasPositions && positionsReady ? `${formatAmount(total.toString(), locale)} USDC` : '—'}</p>
            <p className="account-stat-sub">{m.account.totalSub}</p>
          </div>
          <div className="account-stat">
            <h2>{m.account.returnReceived}</h2>
            <p className="account-stat-value">{m.account.returnNa}</p>
            <p className="account-stat-sub">{m.account.returnSub}</p>
          </div>
          <div className="account-stat">
            <h2>{m.account.activeInvestments}</h2>
            <p className="account-stat-value">{hasPositions && positionsReady ? String(active) : '—'}</p>
            <p className="account-stat-sub">{m.account.activeSub}</p>
          </div>
        </div>
        {!readActor && <p>{m.account.connectNote}</p>}
        {fixtureMode && <p>{m.account.fixtureNote}</p>}
      </section>

      <section aria-label={m.account.investmentsAria}>
        <div className="registry-bar">
          <h2 className="section-title">{m.account.myInvestments}</h2>
          <a className="btn btn-ghost" href={routeHash({ name: 'investments' })}>
            {m.account.newInvestments}
          </a>
        </div>
        <div className="filter-chips" role="group" aria-label={m.account.filterAria}>
          {TAB_IDS.map((id) => {
            const count = id === 'all' ? rows.length : rows.filter((r) => r.status === id).length;
            return (
              <button key={id} className={`chip ${tab === id ? 'chip-active' : ''}`} aria-pressed={tab === id} onClick={() => setTab(id)}>
                {m.account.tabs[id]} ({count})
              </button>
            );
          })}
        </div>
        <p className="account-tabnote">{m.account.tabNote}</p>
        {positionsStatus ? (
          <p role="status">{positionsStatus}</p>
        ) : shown.length === 0 ? (
          <p className="empty-state">{m.account.noInvestments}</p>
        ) : (
          <ul className="portfolio-list">
            {shown.map((r) => (
              <li key={r.id} className="portfolio-row">
                <a href={routeHash({ name: 'campaign', campaignId: r.id })}>{r.name}</a>
                <span className="portfolio-amount">{formatAmount(r.balance, locale)} USDC</span>
                <span className={`status-chip status-${r.status}`}>{m.account.tabs[r.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {hasPositions && positionsReady && (
        <AccountNewsSection
          key={`news:${readActor}:${account?.publicKey ?? ''}:${account?.authMethod ?? ''}`}
          campaigns={rows.map((r) => ({ id: r.id, name: r.name }))}
        />
      )}

      {readActor && <AccountPayoutsSection key={`payouts:${readActor}`} actor={readActor} />}

      {readActor && <AccountHoldingsSection key={`holdings:${readActor}`} actor={readActor} />}

      {hasPositions && rows.length > 0 && (
        <section aria-label={m.account.documentsAria}>
          <h2 className="section-title">{m.account.documentsTitle}</h2>
          {rows.map((r) => (
            <div key={`${readActor}:${account?.publicKey ?? ''}:${r.id}`}>
              <h3>{r.name}</h3>
              <DocumentsList campaignId={r.id} fallback={<p className="empty-state">{m.account.documentsEmpty}</p>} />
              <AccountInvestmentDocuments campaignId={r.id} token={token} />
            </div>
          ))}
        </section>
      )}

      <section aria-label={m.account.activityAria}>
        <h2 className="section-title">{m.account.recentActivity}</h2>
        {Array.isArray(activity) && activity.some((a) => a.action === 'contribute' && a.status === 'SUCCESS') && (
          <p className="account-note">{m.account.contributionRecordNote}</p>
        )}
        {activity === 'loading' ? (
          <p className="community-loading" role="status">
            {m.community.loading}
          </p>
        ) : activity === 'error' ? (
          <p className="community-error" role="status">
            {m.errors.apiUnavailable}
          </p>
        ) : activity && activity.length > 0 ? (
          <ul className="activity-list">
            {activity.map((a) => (
              <li key={a.hash}>
                {m.intent.actionLabels[a.action] ?? a.action}
                {a.amount ? ` ${a.amount} USDC` : ''} - <code>{a.campaign}</code> - <strong>{m.intent.statusLabels[a.status] ?? a.status}</strong>
                {a.createdAt ? ` - ${new Date(a.createdAt).toLocaleString(locale)}` : ''} (
                <a href={`https://stellar.expert/explorer/testnet/tx/${a.hash}`} target="_blank" rel="noreferrer">
                  tx
                </a>
                ) <ContributionRecordButton row={a} actor={readActor} network={activityRead?.network} productionEligible={activityRead?.productionEligible} />
              </li>
            ))}
          </ul>
        ) : intent ? (
          <p>
            {m.account.savedTxPre} {m.intent.actionLabels[intent.action ?? ''] ?? intent.action ?? 'action'} {m.account.savedTxOn}{' '}
            <code>{intent.campaign ?? m.account.savedTxUnknown}</code> - {m.account.savedTxStatus}{' '}
            <strong>{m.intent.statusLabels[intent.status ?? ''] ?? intent.status ?? m.account.savedTxUnknown}</strong>. {m.account.savedTxPost}
          </p>
        ) : (
          <p>{m.account.noActivity}</p>
        )}
      </section>

      <section aria-label={m.account.walletAria}>
        <h2 className="section-title">{m.account.myWallet}</h2>
        {actor ? (
          <p>
            {m.account.walletConnectedPre} <code title={actor}>{shorten(actor)}</code>. {m.account.walletConnectedPost}
          </p>
        ) : (
          <p>{m.account.noWallet}</p>
        )}
      </section>

      <DemoJourney />

      <InvestorOnboarding />

      <NotificationsSection />

      <SecuritySection />

      <CompanyAccountsSection />

      <div id="investor-assessment">
        <AppropriatenessSection />
      </div>

      <OperatorSection
        campaignsLoading={!market.loaded}
        campaignsUnavailable={market.campaignLoadError}
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
      />

      <MyCommunityActivity />
      <SignInPanel actor={actor} />
      <SupportCenter />
      <IssuerApplicationForm />
    </>
  );
}
