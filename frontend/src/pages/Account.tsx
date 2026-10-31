import { useMemo, useState } from 'react';
import type { Market } from '../market';
import { campaignStatus } from '../components/CampaignCard';
import type { Campaign } from '../types';
import { formatAmount, shorten } from '../format';
import { routeHash } from '../router';
import { useI18n } from '../i18n';
import SignInPanel from '../components/SignInPanel';
import MyCommunityActivity from '../components/MyCommunityActivity';
import CompanyAccountsSection from '../components/CompanyAccountsSection';
import NotificationsSection from '../components/NotificationsSection';
import SecuritySection from '../components/SecuritySection';
import OperatorSection from '../components/OperatorSection';
import SupportCenter from '../components/SupportCenter';
import InvestorCategorisation from '../components/InvestorCategorisation';
import IssuerApplicationForm from '../components/IssuerApplicationForm';

const INTENT_KEY = 'rwa-soroban-intent';

type PortfolioStatus = 'pending' | 'paid' | 'completed' | 'canceled';

type Row = {
  id: string;
  name: string;
  balance: string;
  status: PortfolioStatus;
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
  const [tab, setTab] = useState<PortfolioStatus | 'all'>('all');
  const intent = useMemo(readIntent, []);

  const rows: Row[] = useMemo(
    () =>
      campaigns
        .filter((c) => c.balance && BigInt(c.balance) > 0n)
        .map((c) => ({
          id: c.id,
          name: c.name,
          balance: c.balance as string,
          status: rowStatus(c),
        })),
    [campaigns],
  );
  const total = rows.reduce((acc, r) => acc + BigInt(r.balance), 0n);
  const active = rows.filter((r) => r.status === 'pending' || r.status === 'paid').length;
  const shown = tab === 'all' ? rows : rows.filter((r) => r.status === tab);
  const hasPositions = actor && !fixtureMode;

  return (
    <>
      <h1 className="page-title">{m.account.title}</h1>
      <p className="account-note" role="note">
        {m.account.notePre} <code>docs/conda-capital-platform-blueprint-2026-10-30.md</code> {m.account.notePost}
      </p>

      <section aria-label={m.account.summaryAria}>
        <div className="account-stats">
          <div className="account-stat">
            <h2>{m.account.totalContributed}</h2>
            <p className="account-stat-value">{hasPositions ? `${formatAmount(total.toString(), locale)} USDC` : '—'}</p>
            <p className="account-stat-sub">{m.account.totalSub}</p>
          </div>
          <div className="account-stat">
            <h2>{m.account.returnReceived}</h2>
            <p className="account-stat-value">{m.account.returnNa}</p>
            <p className="account-stat-sub">{m.account.returnSub}</p>
          </div>
          <div className="account-stat">
            <h2>{m.account.activeInvestments}</h2>
            <p className="account-stat-value">{hasPositions ? String(active) : '—'}</p>
            <p className="account-stat-sub">{m.account.activeSub}</p>
          </div>
        </div>
        {!actor && <p>{m.account.connectNote}</p>}
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
        {shown.length === 0 ? (
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

      <section aria-label={m.account.activityAria}>
        <h2 className="section-title">{m.account.recentActivity}</h2>
        {intent ? (
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

      <section aria-label={m.account.checklistAria}>
        <h2 className="section-title">{m.account.checklistTitle}</h2>
        <p>{m.account.checklistIntro}</p>
        <ul className="account-checklist">
          {m.account.checklist.map((item) => (
            <li key={item.label} className="account-checklist-item">
              <span className="account-checklist-marker" aria-hidden="true" />
              <div>
                <h3>{item.label}</h3>
                <p>{item.note}</p>
              </div>
              <span className="status-chip status-ended">{m.account.notSetUp}</span>
            </li>
          ))}
        </ul>
      </section>

      <NotificationsSection />

      <SecuritySection />

      <CompanyAccountsSection />

      <InvestorCategorisation />

      <OperatorSection campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))} />

      <MyCommunityActivity />
      <SignInPanel actor={actor} />
      <SupportCenter />
      <IssuerApplicationForm />
    </>
  );
}
