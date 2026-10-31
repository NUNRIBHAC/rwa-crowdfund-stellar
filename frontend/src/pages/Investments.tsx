import { useMemo, useState } from 'react';
import type { Market } from '../market';
import CampaignCard, { campaignStatus, type CampaignStatus } from '../components/CampaignCard';
import EmptyState from '../components/EmptyState';
import { categoriesFor, profileFor } from '../data/profiles';

export default function Investments({ market }: { market: Market }) {
  const { campaigns, loaded, fixtureMode } = market;
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'name'>('deadline');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const categories = useMemo(() => categoriesFor(campaigns, fixtureMode), [campaigns, fixtureMode]);

  const q = query.trim().toLowerCase();
  const shown = campaigns
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.contractId.toLowerCase().includes(q))
    .filter((c) => statusFilter === 'all' || campaignStatus(c) === statusFilter)
    .filter((c) => category === 'all' || profileFor(c, fixtureMode)?.category === category)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'progress') {
        const pa = Number((BigInt(a.raised) * 10000n) / BigInt(a.config.goal));
        const pb = Number((BigInt(b.raised) * 10000n) / BigInt(b.config.goal));
        return pb - pa;
      }
      return Number(a.config.deadline) - Number(b.config.deadline);
    });
  const active = shown.filter((c) => campaignStatus(c) === 'open');
  const completed = shown.filter((c) => campaignStatus(c) !== 'open');
  const showEmpty = loaded && !fixtureMode && campaigns.length === 0;

  const renderCard = (c: (typeof campaigns)[number]) => (
    <CampaignCard
      key={c.id}
      campaign={c}
      profile={profileFor(c, fixtureMode)}
      actor={market.actor}
      busy={market.busy}
      readOnly={fixtureMode}
      demo={fixtureMode}
      amount={market.amounts[c.id] ?? ''}
      onAmount={(v) => market.onAmount(c.id, v)}
      onPrepare={(action) => market.onPrepare(c, action)}
    />
  );

  return (
    <>
      <h1 className="page-title">All investments</h1>
      <div className="registry-bar">
        <p className="registry-note">
          {fixtureMode
            ? 'Sample campaigns demonstrate the layout. They are not deployed contracts and cannot accept contributions.'
            : 'Live campaigns are Soroban contracts on Stellar testnet. Testnet assets are worthless.'}
        </p>
        <button className="btn btn-ghost" disabled={market.busy || fixtureMode} onClick={market.onRefresh}>
          Refresh contract state
        </button>
      </div>

      {campaigns.length > 0 && (
        <div className="discovery-bar">
          <input
            className="discovery-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns by name or contract"
            aria-label="Search campaigns"
          />
          <div className="filter-chips" role="group" aria-label="Filter by status">
            {(['all', 'open', 'funded', 'ended'] as const).map((f) => (
              <button
                key={f}
                className={`chip ${statusFilter === f ? 'chip-active' : ''}`}
                aria-pressed={statusFilter === f}
                onClick={() => setStatusFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'open' ? 'Open' : f === 'funded' ? 'Funded' : 'Underfunded'}
              </button>
            ))}
          </div>
          {categories.length > 0 && (
            <div className="filter-chips" role="group" aria-label="Filter by industry">
              <button className={`chip ${category === 'all' ? 'chip-active' : ''}`} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
                All industries
              </button>
              {categories.map((cat) => (
                <button key={cat} className={`chip ${category === cat ? 'chip-active' : ''}`} aria-pressed={category === cat} onClick={() => setCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          )}
          <select
            className="discovery-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'deadline' | 'progress' | 'name')}
            aria-label="Sort campaigns"
          >
            <option value="deadline">Deadline soonest</option>
            <option value="progress">Most funded</option>
            <option value="name">Name A-Z</option>
          </select>
          <div className="filter-chips" role="group" aria-label="View mode">
            <button className={`chip ${view === 'grid' ? 'chip-active' : ''}`} aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
              Grid
            </button>
            <button className={`chip ${view === 'list' ? 'chip-active' : ''}`} aria-pressed={view === 'list'} onClick={() => setView('list')}>
              List
            </button>
          </div>
        </div>
      )}

      {campaigns.length > 0 && shown.length === 0 && (
        <p className="no-matches" role="status">
          No campaigns match the current search and filters.
        </p>
      )}

      {showEmpty && <EmptyState fixtureMode={false} onToggleFixtures={market.onToggleFixtures} />}
      {fixtureMode && <EmptyState fixtureMode onToggleFixtures={market.onToggleFixtures} />}

      {active.length > 0 && (
        <section aria-label="Active investments">
          <h2 className="section-title">Active investments</h2>
          <div className={view === 'grid' ? 'card-grid' : 'card-list'}>{active.map(renderCard)}</div>
        </section>
      )}
      {completed.length > 0 && (
        <section aria-label="Completed investments">
          <h2 className="section-title">Completed investments</h2>
          <div className={view === 'grid' ? 'card-grid' : 'card-list'}>{completed.map(renderCard)}</div>
        </section>
      )}
    </>
  );
}
