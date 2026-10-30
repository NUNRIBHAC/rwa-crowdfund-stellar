import { useEffect, useState } from 'react';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import type { Campaign, Intent } from './types';
import { isTerminal } from './types';
import { api } from './api';
import { FIXTURE_CAMPAIGNS } from './fixtures';
import type { Market } from './market';
import { useRoute } from './router';
import RiskBanner from './components/RiskBanner';
import Header from './components/Header';
import IntentPanel from './components/IntentPanel';
import Footer from './components/Footer';
import Home from './pages/Home';
import Investments from './pages/Investments';
import CampaignDetail from './pages/CampaignDetail';
import HowItWorks from './pages/HowItWorks';
import Learn from './pages/Learn';
import Glossary from './pages/Glossary';
import RiskWarnings from './pages/RiskWarnings';
import Faq from './pages/Faq';
import About from './pages/About';
import Financing from './pages/Financing';

const INTENT_KEY = 'rwa-soroban-intent';

export default function App() {
  const route = useRoute();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [actor, setActor] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [fixtureMode, setFixtureMode] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(INTENT_KEY) ?? 'null');
    } catch {
      return null;
    }
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
    refresh().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retain(i: Intent) {
    setIntent(i);
    localStorage.setItem(INTENT_KEY, JSON.stringify(i));
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
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
  const market: Market = {
    campaigns: base,
    loaded,
    fixtureMode,
    actor,
    busy,
    amounts,
    onAmount: (id, v) => setAmounts({ ...amounts, [id]: v }),
    onPrepare: (c, action) => run(() => prepare(c, action)),
    onRefresh: () => run(() => refresh()),
    onToggleFixtures: toggleFixtures,
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <RiskBanner />
      <Header actor={actor} busy={busy} onConnect={() => run(connect)} current={route.name} />
      <main className="page" id="main">
        {error && (
          <p role="alert" className="error-banner">
            {error}
          </p>
        )}

        {intent && (
          <IntentPanel
            intent={intent}
            busy={busy}
            onSubmit={() => run(submit)}
            onCheck={() => run(check)}
            onCancel={() => retain({ ...intent, status: 'CANCELLED_UNSIGNED' })}
            onClear={() => {
              if (isTerminal(intent.status)) {
                setIntent(null);
                localStorage.removeItem(INTENT_KEY);
              }
            }}
          />
        )}

        {route.name === 'home' && <Home market={market} />}
        {route.name === 'investments' && <Investments market={market} />}
        {route.name === 'campaign' && <CampaignDetail market={market} campaignId={route.campaignId ?? ''} />}
        {route.name === 'how-it-works' && <HowItWorks />}
        {route.name === 'learn' && <Learn />}
        {route.name === 'glossary' && <Glossary />}
        {route.name === 'risk-warnings' && <RiskWarnings />}
        {route.name === 'faq' && <Faq />}
        {route.name === 'about' && <About />}
        {route.name === 'financing' && <Financing />}

        <Footer />
      </main>
    </>
  );
}
