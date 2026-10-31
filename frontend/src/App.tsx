import { useEffect, useState } from 'react';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import type { Campaign, Intent } from './types';
import { isTerminal } from './types';
import { api } from './api';
import { contributionError, formatAmount } from './format';
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
import Account from './pages/Account';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RiskDisclosure from './pages/RiskDisclosure';
import LegalNotice from './pages/LegalNotice';
import ConflictsOfInterest from './pages/ConflictsOfInterest';
import ComplaintsManagement from './pages/ComplaintsManagement';
import BusinessContinuity from './pages/BusinessContinuity';
import FeedbackTab from './components/FeedbackTab';
import { BlogPage, EventsPage, JobsPage, PressPage } from './components/ContentPages';
import { useI18n } from './i18n';
import { CommunityAuthProvider } from './community/CommunityAuth';

const INTENT_KEY = 'rwa-soroban-intent';

export default function App() {
  const { m, locale } = useI18n();
  const route = useRoute();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [actor, setActor] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [amountErrors, setAmountErrors] = useState<Record<string, string>>({});
  const [prepareErrors, setPrepareErrors] = useState<Record<string, string>>({});
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
    if (!conn.isConnected) throw new Error(m.errors.freighterMissing);
    const r = await requestAccess();
    if (r.error || !r.address) throw new Error(r.error?.message ?? m.errors.walletAccessFailed);
    setActor(r.address);
    setFixtureMode(false);
    await refresh(r.address);
  }

  function validateAmount(c: Campaign, raw: string): string {
    const code = contributionError(raw ?? '', c.config.goal, c.raised);
    if (code === 'required') return m.card.amountRequired;
    if (code === 'invalid') return m.card.amountInvalid;
    if (code === 'exceeds') return m.card.amountExceeds(formatAmount(String(BigInt(c.config.goal) - BigInt(c.raised)), locale));
    return '';
  }

  async function prepare(c: Campaign, action: 'contribute' | 'refund' | 'withdraw') {
    if (!actor) throw new Error(m.errors.connectFirst);
    if (action === 'contribute') {
      const msg = validateAmount(c, amounts[c.id] ?? '');
      setAmountErrors({ ...amountErrors, [c.id]: msg });
      if (msg) return;
    }
    if (intent && !isTerminal(intent.status)) {
      throw new Error(m.errors.resolveSaved);
    }
    setPrepareErrors((prev) => ({ ...prev, [c.id]: '' }));
    let result;
    try {
      result = await api(`/api/campaigns/${c.id}/soroban/build`, {
        actor,
        action,
        amount: amounts[c.id],
      });
    } catch (e) {
      // Build failures surface at the card, next to the button that failed,
      // not only in the page-top banner a scrolled-down user never sees.
      const detail = (e instanceof Error ? e.message : String(e)).split('\n')[0].slice(0, 200);
      setPrepareErrors((prev) => ({ ...prev, [c.id]: detail }));
      return;
    }
    retain({ ...result, campaign: c.id, actor, status: 'BUILT' });
    setFixtureMode(false);
  }

  async function submit() {
    if (!intent) return;
    if (actor !== intent.actor) throw new Error(m.errors.walletMismatch);
    let current = intent;
    if (!current.signedXdr) {
      const result = await signTransaction(current.xdr, {
        networkPassphrase: 'Test SDF Network ; September 2015',
      });
      if (result.error || !result.signedTxXdr) throw new Error(result.error?.message ?? m.errors.walletNoSign);
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
    amountErrors,
    prepareErrors,
    onAmount: (id, v) => {
      setAmounts({ ...amounts, [id]: v });
      const c = campaigns.find((x) => x.id === id);
      if (!c) return;
      setAmountErrors({ ...amountErrors, [id]: v.trim() === '' ? '' : validateAmount(c, v) });
    },
    onPrepare: (c, action) => run(() => prepare(c, action)),
    onRefresh: () => run(() => refresh()),
    onToggleFixtures: toggleFixtures,
  };

  return (
    <CommunityAuthProvider
      messages={{
        freighterMissing: m.errors.freighterMissing,
        walletNoSign: m.errors.walletNoSign,
      }}
    >
      <a className="skip-link" href="#main">
        {m.meta.skipLink}
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
        {route.name === 'financing' && <Financing market={market} />}
        {route.name === 'account' && <Account market={market} />}
        {route.name === 'terms-of-service' && <TermsOfService />}
        {route.name === 'privacy-policy' && <PrivacyPolicy />}
        {route.name === 'risk-disclosure' && <RiskDisclosure />}
        {route.name === 'legal-notice' && <LegalNotice />}
        {route.name === 'conflicts-of-interest' && <ConflictsOfInterest />}
        {route.name === 'complaints-management' && <ComplaintsManagement />}
        {route.name === 'business-continuity' && <BusinessContinuity />}
        {route.name === 'events' && <EventsPage />}
        {route.name === 'blog' && <BlogPage />}
        {route.name === 'press' && <PressPage />}
        {route.name === 'jobs' && <JobsPage />}

        <Footer />
        <FeedbackTab />
      </main>
    </CommunityAuthProvider>
  );
}
