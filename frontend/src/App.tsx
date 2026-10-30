import { useEffect, useState } from 'react';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import type { Campaign, Intent } from './types';
import { isTerminal } from './types';
import { api } from './api';
import { FIXTURE_CAMPAIGNS } from './fixtures';
import Header from './components/Header';
import Hero from './components/Hero';
import CampaignCard, { campaignStatus, type CampaignStatus } from './components/CampaignCard';
import IntentPanel from './components/IntentPanel';
import EmptyState from './components/EmptyState';
import Footer from './components/Footer';

const INTENT_KEY = 'rwa-soroban-intent';

export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [actor, setActor] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [fixtureMode, setFixtureMode] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'name'>('deadline');
  const [intent, setIntent] = useState<Intent | null>(() => {
    try { return JSON.parse(localStorage.getItem(INTENT_KEY) ?? 'null'); } catch { return null; }
  });

  async function refresh(address = actor) {
    const data = await api(`/api/campaigns${address ? `?actor=${encodeURIComponent(address)}` : ''}`);
    setCampaigns(data.campaigns);
    setLoaded(true);
  }

  useEffect(() => {
    localStorage.removeItem('rwa-admin-key');
    // ?fixtures=1 shows the clearly labeled sample-data preview on load.
    if (new URLSearchParams(window.location.search).get('fixtures') === '1') {
      setFixtureMode(true);
      setLoaded(true);
    }
    refresh().catch(e => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retain(i: Intent) {
    setIntent(i);
    localStorage.setItem(INTENT_KEY, JSON.stringify(i));
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try { await fn(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function connect() {
    // Without the extension, requestAccess waits indefinitely (only the
    // connection-status probe has a timeout), so fail with a clear error first.
    const conn = await isConnected();
    if (!conn.isConnected) throw new Error('Freighter wallet extension not detected. Install Freighter, then retry Connect.');
    const r = await requestAccess();
    if (r.error || !r.address) throw new Error(r.error?.message ?? 'Wallet access failed');
    setActor(r.address);
    setFixtureMode(false);
    await refresh(r.address);
  }

  async function prepare(c: Campaign, action: 'contribute' | 'refund' | 'withdraw') {
    if (!actor) throw new Error('Connect Freighter first.');
    if (intent && !isTerminal(intent.status)) {
      throw new Error('Resolve the saved transaction before preparing another.');
    }
    const result = await api(`/api/campaigns/${c.id}/soroban/build`, { actor, action, amount: amounts[c.id] });
    retain({ ...result, campaign: c.id, actor, status: 'BUILT' });
    setFixtureMode(false);
  }

  async function submit() {
    if (!intent) return;
    if (actor !== intent.actor) throw new Error('Connect the wallet that prepared this transaction.');
    let current = intent;
    if (!current.signedXdr) {
      const result = await signTransaction(current.xdr, { networkPassphrase: 'Test SDF Network ; September 2015' });
      if (result.error || !result.signedTxXdr) throw new Error(result.error?.message ?? 'Wallet did not sign');
      current = { ...current, signedXdr: result.signedTxXdr, status: 'SIGNED' };
      retain(current);
    }
    // Persist exact signed XDR before the first send. Network errors retain it.
    const result = await api(`/api/campaigns/${current.campaign}/soroban/submit`, { actor: current.actor, xdr: current.signedXdr });
    retain({ ...current, status: result.status });
  }

  async function check() {
    if (!intent) return;
    const r = await api(`/api/soroban/transactions/${intent.hash}`);
    retain({ ...intent, status: r.status });
    await refresh();
  }

  function toggleFixtures() {
    if (fixtureMode) {
      setFixtureMode(false);
      run(() => refresh());
    } else {
      setFixtureMode(true);
      setLoaded(true);
    }
  }

  const base = fixtureMode ? FIXTURE_CAMPAIGNS : campaigns;
  const q = query.trim().toLowerCase();
  const shown = base
    .filter(c => !q || c.name.toLowerCase().includes(q) || c.contractId.toLowerCase().includes(q))
    .filter(c => statusFilter === 'all' || campaignStatus(c) === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'progress') {
        const pa = Number((BigInt(a.raised) * 10000n) / BigInt(a.config.goal));
        const pb = Number((BigInt(b.raised) * 10000n) / BigInt(b.config.goal));
        return pb - pa;
      }
      return Number(a.config.deadline) - Number(b.config.deadline);
    });
  const showEmpty = loaded && !fixtureMode && campaigns.length === 0;

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <Header actor={actor} busy={busy} onConnect={() => run(connect)} />
      <main className="page" id="main">
        <Hero mode={fixtureMode ? 'sample' : loaded && campaigns.length > 0 ? 'live' : 'unknown'} />

        {error && <p role="alert" className="error-banner">{error}</p>}

        {intent && (
          <IntentPanel
            intent={intent}
            busy={busy}
            onSubmit={() => run(submit)}
            onCheck={() => run(check)}
            onCancel={() => retain({ ...intent, status: 'CANCELLED_UNSIGNED' })}
            onClear={() => { if (isTerminal(intent.status)) { setIntent(null); localStorage.removeItem(INTENT_KEY); } }}
          />
        )}

        <div className="registry-bar">
          <h2 className="section-title">Campaigns</h2>
          <button className="btn btn-ghost" disabled={busy || fixtureMode} onClick={() => run(() => refresh())}>
            Refresh contract state
          </button>
        </div>

        {base.length > 0 && (
          <div className="discovery-bar">
            <input
              className="discovery-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search campaigns by name or contract"
              aria-label="Search campaigns"
            />
            <div className="filter-chips" role="group" aria-label="Filter by status">
              {(['all', 'open', 'funded', 'ended'] as const).map(f => (
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
            <select
              className="discovery-sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'deadline' | 'progress' | 'name')}
              aria-label="Sort campaigns"
            >
              <option value="deadline">Deadline soonest</option>
              <option value="progress">Most funded</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        )}

        {base.length > 0 && shown.length === 0 && (
          <p className="no-matches" role="status">No campaigns match the current search and filters.</p>
        )}

        {showEmpty && <EmptyState fixtureMode={false} onToggleFixtures={toggleFixtures} />}
        {fixtureMode && <EmptyState fixtureMode onToggleFixtures={toggleFixtures} />}

        <div className="card-grid">
          {shown.map(c => (
            <CampaignCard
              key={c.id}
              campaign={c}
              actor={actor}
              busy={busy}
              readOnly={fixtureMode}
              amount={amounts[c.id] ?? ''}
              onAmount={v => setAmounts({ ...amounts, [c.id]: v })}
              onPrepare={action => run(() => prepare(c, action))}
            />
          ))}
        </div>

        <Footer />
      </main>
    </>
  );
}
