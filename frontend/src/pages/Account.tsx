import { useMemo, useState } from 'react';
import type { Market } from '../market';
import { campaignStatus } from '../components/CampaignCard';
import type { Campaign } from '../types';
import { formatAmount, shorten } from '../format';
import { routeHash } from '../router';

const INTENT_KEY = 'rwa-soroban-intent';

type PortfolioStatus = 'pending' | 'paid' | 'completed' | 'canceled';

type Row = { id: string; name: string; balance: string; status: PortfolioStatus };

// Prototype mapping from the contract lifecycle to the portfolio tabs. The
// reference platform (blueprint section 7A) uses All / Canceled / Pending /
// Paid / Completed; the labels are kept, the meanings below are ours.
const TABS: { id: PortfolioStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'canceled', label: 'Canceled' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'completed', label: 'Completed' },
];

function rowStatus(c: Campaign): PortfolioStatus {
  const s = campaignStatus(c);
  if (s === 'open') return 'pending';
  if (s === 'funded') return 'completed';
  return 'canceled';
}

const CHECKLIST: { label: string; note: string }[] = [
  { label: 'Personal data', note: 'Not collected in this prototype.' },
  { label: 'Address data', note: 'Not collected in this prototype.' },
  { label: 'Contact details', note: 'Not collected in this prototype.' },
  { label: 'Security', note: 'Wallet-based access (Freighter). No password or two-factor app in this prototype.' },
  { label: 'Investor qualification', note: 'Knowledge test and loss-capacity check are planned compliance steps; not implemented here.' },
  { label: 'Verification (KYC)', note: 'Not implemented. This testnet prototype verifies no identity.' },
  { label: 'Bank details', note: 'Not collected. Contributions and refunds move as testnet USDC on-chain.' },
  { label: 'Depot data', note: 'Optional securities-account reference on the reference platform; not collected here.' },
  {
    label: 'Digital locker',
    note: 'Planned custody view of held positions. Here, positions live in each campaign contract and are read per connected wallet.',
  },
  { label: 'Company accounts', note: 'The reference platform lets a verified investor add a company account; not implemented in this prototype.' },
];

function readIntent(): { action?: string; campaign?: string; status?: string } | null {
  try {
    const raw = localStorage.getItem(INTENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Account({ market }: { market: Market }) {
  const { campaigns, actor, fixtureMode } = market;
  const [tab, setTab] = useState<PortfolioStatus | 'all'>('all');
  const intent = useMemo(readIntent, []);

  const rows: Row[] = useMemo(
    () =>
      campaigns.filter((c) => c.balance && BigInt(c.balance) > 0n).map((c) => ({ id: c.id, name: c.name, balance: c.balance as string, status: rowStatus(c) })),
    [campaigns],
  );
  const total = rows.reduce((acc, r) => acc + BigInt(r.balance), 0n);
  const active = rows.filter((r) => r.status === 'pending' || r.status === 'paid').length;
  const shown = tab === 'all' ? rows : rows.filter((r) => r.status === tab);
  const hasPositions = actor && !fixtureMode;

  return (
    <>
      <h1 className="page-title">My account</h1>
      <p className="account-note" role="note">
        Prototype layout of an investor account area, modeled on the logged-in dashboard documented in{' '}
        <code>docs/conda-capital-platform-blueprint-2026-10-30.md</code> (section 7A). No personal data is collected on this page; positions come from your
        connected Freighter wallet on Stellar testnet and are worthless.
      </p>

      <section aria-label="Portfolio summary">
        <div className="account-stats">
          <div className="account-stat">
            <h2>Total contributed</h2>
            <p className="account-stat-value">{hasPositions ? `${formatAmount(total.toString())} USDC` : '\u2014'}</p>
            <p className="account-stat-sub">Escrowed on-chain, summed over campaigns</p>
          </div>
          <div className="account-stat">
            <h2>Return received</h2>
            <p className="account-stat-value">Not available</p>
            <p className="account-stat-sub">This prototype tracks no payout history</p>
          </div>
          <div className="account-stat">
            <h2>Active investments</h2>
            <p className="account-stat-value">{hasPositions ? String(active) : '\u2014'}</p>
            <p className="account-stat-sub">Escrowed positions in open or funded campaigns</p>
          </div>
        </div>
        {!actor && <p>Connect your Freighter wallet to see your testnet positions. Without a wallet this page shows the layout only.</p>}
        {fixtureMode && <p>Sample campaigns are on screen; sample data carries no per-wallet positions.</p>}
      </section>

      <section aria-label="My investments">
        <div className="registry-bar">
          <h2 className="section-title">My investments</h2>
          <a className="btn btn-ghost" href={routeHash({ name: 'investments' })}>
            New investments
          </a>
        </div>
        <div className="filter-chips" role="group" aria-label="Filter portfolio by status">
          {TABS.map((t) => {
            const count = t.id === 'all' ? rows.length : rows.filter((r) => r.status === t.id).length;
            return (
              <button key={t.id} className={`chip ${tab === t.id ? 'chip-active' : ''}`} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label} ({count})
              </button>
            );
          })}
        </div>
        <p className="account-tabnote">
          Prototype mapping: Pending = contribution escrowed, campaign open. Paid = campaign funded, still running. Completed = campaign ended after funding.
          Canceled = ended without reaching the goal; a contributor-signed refund is available on the campaign page.
        </p>
        {shown.length === 0 ? (
          <p className="empty-state">No investments found.</p>
        ) : (
          <ul className="portfolio-list">
            {shown.map((r) => (
              <li key={r.id} className="portfolio-row">
                <a href={routeHash({ name: 'campaign', campaignId: r.id })}>{r.name}</a>
                <span className="portfolio-amount">{formatAmount(r.balance)} USDC</span>
                <span className={`status-chip status-${r.status}`}>{TABS.find((t) => t.id === r.status)?.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Recent activity">
        <h2 className="section-title">Recent activity</h2>
        {intent ? (
          <p>
            Saved transaction: {intent.action ?? 'action'} on campaign <code>{intent.campaign ?? 'unknown'}</code> - status{' '}
            <strong>{intent.status ?? 'unknown'}</strong>. Resume or clear it from the transaction panel above.
          </p>
        ) : (
          <p>No activity found.</p>
        )}
      </section>

      <section aria-label="Wallet">
        <h2 className="section-title">My wallet</h2>
        {actor ? (
          <p>
            Connected: <code title={actor}>{shorten(actor)}</code>. Contributions are escrowed by the campaign contracts; refunds are contributor-signed
            on-chain. No platform-held funds exist in this prototype.
          </p>
        ) : (
          <p>No wallet connected.</p>
        )}
      </section>

      <section aria-label="Account and profile checklist">
        <h2 className="section-title">Account overview and profile data</h2>
        <p>
          The reference platform gates investing behind profile completion, verification and bank details. This prototype collects none of them; the checklist
          shows the structure as planned placeholders.
        </p>
        <ul className="account-checklist">
          {CHECKLIST.map((item) => (
            <li key={item.label} className="account-checklist-item">
              <span className="account-checklist-marker" aria-hidden="true" />
              <div>
                <h3>{item.label}</h3>
                <p>{item.note}</p>
              </div>
              <span className="status-chip status-ended">Not set up</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
