import { pluralText } from '../format';
import { useEffect, useState, type ReactNode } from 'react';
import type { Market } from '../market';
import CampaignCard, { campaignStatus, type CampaignStatus } from '../components/CampaignCard';
import { compareCampaigns } from '../sort-campaigns';
import { instrumentLabel } from '../data/instruments';
import EmptyState from '../components/EmptyState';
import { profileFor } from '../data/profiles';
import { fetchCampaignMetadata } from '../community/api';
import { useI18n } from '../i18n';
import { sampleIndustry, sampleInstrument, sampleState } from '../data/sampleCatalog';

export default function Investments({ market, loadStatus }: { market: Market; loadStatus?: ReactNode }) {
  const { m } = useI18n();
  const { campaigns, loaded, fixtureMode } = market;
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus | 'refunded' | 'withdrawn'>('all');
  const [category, setCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'name'>('deadline');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Industry classification: fixture mode uses the localized sample profiles;
  // live mode surfaces the operator-curated backend metadata
  // (/api/campaigns/:id/metadata). Campaigns without curated metadata have no
  // industry - the chips simply do not offer them, nothing is invented.
  const [industries, setIndustries] = useState<Record<string, { key: string; label: string }>>({});
  useEffect(() => {
    if (fixtureMode || campaigns.length === 0) {
      setIndustries({});
      return;
    }
    let cancelled = false;
    Promise.all(
      campaigns.map((c) =>
        fetchCampaignMetadata(c.id)
          .then((r) => [c.id, r.metadata] as const)
          .catch(() => [c.id, null] as const),
      ),
    ).then((entries) => {
      if (cancelled) return;
      const map: Record<string, { key: string; label: string }> = {};
      for (const [id, md] of entries) {
        if (md && md.industry) map[id] = { key: md.industry, label: md.industryLabel };
      }
      setIndustries(map);
    });
    return () => {
      cancelled = true;
    };
  }, [campaigns, fixtureMode]);

  const categoryOf = (c: (typeof campaigns)[number]): string | undefined => {
    if (!fixtureMode) return industries[c.id]?.key;
    return sampleIndustry(c.id);
  };
  // Types describe the 44 fictional business examples. Educational concepts
  // belong to Learn and never become catalog options or result counts.
  const typeOf = (c: (typeof campaigns)[number]): string | undefined => (fixtureMode ? sampleInstrument(c.id) : undefined);
  const typeOptions: { value: string; label: string }[] = [];
  if (fixtureMode) {
    const seen = new Set<string>();
    for (const instrument of campaigns.map((c) => sampleInstrument(c.id))) {
      if (instrument && !seen.has(instrument)) {
        seen.add(instrument);
        typeOptions.push({ value: instrument, label: instrumentLabel(m, instrument) });
      }
    }
  }
  const categories = Object.entries(m.invest.industryLabels);
  useEffect(() => {
    if (!fixtureMode) {
      setStatusFilter((f) => (f === 'refunded' || f === 'withdrawn' ? 'all' : f));
      setTypeFilter('all');
    }
  }, [fixtureMode]);
  const filterKeys = fixtureMode ? (['all', 'open', 'funded', 'ended', 'refunded', 'withdrawn'] as const) : (['all', 'open', 'funded', 'ended'] as const);
  const matchesStatus = (filter: string, status: CampaignStatus, scenario?: string) =>
    filter === 'all' || (filter === 'refunded' || filter === 'withdrawn' ? fixtureMode && scenario === filter : status === filter);

  const q = query.trim().toLowerCase();
  const shown = campaigns
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.contractId.toLowerCase().includes(q))
    .filter((c) => matchesStatus(statusFilter, campaignStatus(c), sampleState(c.id)))
    .filter((c) => category === 'all' || categoryOf(c) === category)
    .filter((c) => typeFilter === 'all' || typeOf(c) === typeFilter)
    .sort(compareCampaigns(sortBy));
  const sampleResultCount = shown.length;
  const sampleFilterCount = (filter: string) =>
    campaigns.filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q) || c.contractId.toLowerCase().includes(q)) &&
        (category === 'all' || categoryOf(c) === category) &&
        (typeFilter === 'all' || typeOf(c) === typeFilter) &&
        matchesStatus(filter, campaignStatus(c), sampleState(c.id)),
    ).length;

  // Exact checked-in staging fixture identity, never inferred from campaign names.
  const testing = shown.filter((c) => c.id === 'staging-load');
  const catalog = shown.filter((c) => c.id !== 'staging-load');
  const active = catalog.filter((c) => campaignStatus(c) === 'open');
  const completed = catalog.filter((c) => campaignStatus(c) !== 'open');
  const showEmpty = loaded && !fixtureMode && campaigns.length === 0;

  const firstVisibleId = active[0]?.id ?? testing[0]?.id ?? (statusFilter === 'ended' || statusFilter === 'funded' ? completed[0]?.id : undefined);
  const renderCard = (c: (typeof campaigns)[number]) => (
    <CampaignCard
      key={c.id}
      campaign={c}
      profile={profileFor(c, fixtureMode, m.profiles.list)}
      actor={market.actor}
      busy={market.busy}
      readOnly={fixtureMode}
      demo={fixtureMode}
      discoveryOnly
      firstVisibleImage={c.id === firstVisibleId}
      amount={market.amounts[c.id] ?? ''}
      amountError={market.amountErrors[c.id]}
      prepareError={market.prepareErrors[c.id]}
      onAmount={(v) => market.onAmount(c.id, v)}
      onPrepare={(action) => market.onPrepare(c, action)}
    />
  );

  return (
    <div className={`campaign-registry-page registry-discovery-v2 ${filtersOpen ? 'filters-open' : ''}`}>
      <h1 className="page-title">{m.invest.exploreTitle}</h1>
      <div className="registry-bar">
        <p className="registry-note">{fixtureMode ? m.invest.noteFixture : m.invest.noteLive}</p>
        <button className="btn btn-ghost" disabled={market.busy || fixtureMode} onClick={market.onRefresh}>
          {m.invest.refresh}
        </button>
      </div>

      {loadStatus}
      <div className={`registry-content-layout${!loaded && !fixtureMode ? ' registry-loading-space' : ''}${campaigns.length ? ' has-filters' : ''}`}>
        {campaigns.length > 0 && (
          <aside className="discovery-bar registry-filter-panel" aria-label={m.invest.filters}>
            <input
              className="discovery-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={m.invest.searchAria}
              title={m.invest.searchPlaceholder}
              aria-label={m.invest.searchAria}
            />
            <button
              className="btn registry-filter-toggle"
              aria-expanded={filtersOpen}
              aria-controls="registry-filter-controls"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              {m.invest.filters}
            </button>
            <div id="registry-filter-controls" className="registry-filter-controls">
              <div className="filter-chips" role="group" aria-label={m.invest.filterStatusAria}>
                {filterKeys.map((f) => (
                  <button
                    key={f}
                    className={`chip ${statusFilter === f ? 'chip-active' : ''}`}
                    aria-pressed={statusFilter === f}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === 'all'
                      ? m.invest.all
                      : f === 'open'
                        ? m.invest.open
                        : f === 'funded'
                          ? m.invest.funded
                          : f === 'refunded'
                            ? m.sampleConcepts.filterRefund
                            : f === 'withdrawn'
                              ? m.sampleConcepts.filterWithdrawal
                              : m.invest.underfunded}
                    {fixtureMode && <span aria-hidden="true"> ({sampleFilterCount(f)})</span>}
                  </button>
                ))}
              </div>
              <label className="registry-industry-select">
                <span>{m.invest.filterIndustryAria}</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={m.invest.filterIndustryAria}>
                  <option value="all">{m.invest.allIndustries}</option>
                  {categories.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {/* Stable wrapper: browser automation layers and some extensions
              wrap native selects in an injected container, moving the select
              out of its React parent; if React's sibling anchor is the select
              itself, the next conditional insertion (industry chips) throws
              NotFoundError and unmounts the page. The anchor must be a node
              only React manages. display:contents keeps the wrapper
              layout-neutral. */}
              {fixtureMode && (
                <label className="registry-industry-select registry-type-select">
                  <span>{m.invest.filterTypeAria}</span>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label={m.invest.filterTypeAria}>
                    <option value="all">{m.invest.allTypes}</option>
                    {typeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="discovery-sort-slot">
                <select
                  className="discovery-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'deadline' | 'progress' | 'name')}
                  aria-label={m.invest.sortAria}
                >
                  <option value="deadline">{m.invest.sortDeadline}</option>
                  <option value="progress">{m.invest.sortProgress}</option>
                  <option value="name">{m.invest.sortName}</option>
                </select>
              </div>
              <div className="filter-chips" role="group" aria-label={m.invest.viewAria}>
                <button className={`chip ${view === 'grid' ? 'chip-active' : ''}`} aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
                  {m.invest.grid}
                </button>
                <button className={`chip ${view === 'list' ? 'chip-active' : ''}`} aria-pressed={view === 'list'} onClick={() => setView('list')}>
                  {m.invest.list}
                </button>
              </div>
            </div>
          </aside>
        )}

        <div className="registry-main-content">
          {campaigns.length > 0 && (
            <p className={sampleResultCount === 0 ? 'no-matches' : 'sr-only'} role="status">
              {sampleResultCount === 0 ? m.invest.noMatches : pluralText(m.invest.resultCount, sampleResultCount)}
            </p>
          )}

          {showEmpty && <EmptyState fixtureMode={false} onToggleFixtures={market.onToggleFixtures} />}
          {fixtureMode && <EmptyState fixtureMode onToggleFixtures={market.onToggleFixtures} />}

          {active.length > 0 && (
            <section className="registry-results" aria-label={m.invest.activeAria}>
              <h2 className="section-title">{m.invest.activeTitle}</h2>
              <div className={view === 'grid' ? `card-grid ${active.length > 2 ? 'registry-many' : ''}` : 'card-list'}>{active.map(renderCard)}</div>
            </section>
          )}
          {testing.length > 0 && (
            <section className="registry-results registry-testing" aria-label={m.invest.testingTitle}>
              <h2 className="section-title">{m.invest.testingTitle}</h2>
              <div className={view === 'grid' ? 'card-grid' : 'card-list'}>{testing.map(renderCard)}</div>
            </section>
          )}
          {completed.length > 0 && (
            <section className="registry-results" aria-label={m.invest.completedAria}>
              <details
                className="registry-closed"
                open={statusFilter === 'ended' || statusFilter === 'funded' || statusFilter === 'refunded' || statusFilter === 'withdrawn' || undefined}
              >
                <summary>
                  {m.invest.closedTitle} ({completed.length})
                </summary>
                <div className={view === 'grid' ? 'card-grid' : 'card-list'}>
                  {completed.map((c) => (
                    <div key={c.id}>
                      <p className="registry-outcome">{campaignStatus(c) === 'funded' ? m.hero.goalReached : m.hero.goalMissed}</p>
                      {renderCard(c)}
                    </div>
                  ))}
                </div>
              </details>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
