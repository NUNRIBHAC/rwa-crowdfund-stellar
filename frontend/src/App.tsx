import { useEffect, useState } from 'react';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import type { Campaign, Intent } from './types';
import { isTerminal } from './types';
import { api } from './api';
import { contributionError, formatAmount, tpl } from './format';
import type { ContributionError } from './format';
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
import CampaignBuilderDraft from './components/CampaignBuilderDraft';
import Account from './pages/Account';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RiskDisclosure from './pages/RiskDisclosure';
import LegalNotice from './pages/LegalNotice';
import ConflictsOfInterest from './pages/ConflictsOfInterest';
import ComplaintsManagement from './pages/ComplaintsManagement';
import BusinessContinuity from './pages/BusinessContinuity';
import FeedbackTab from './components/FeedbackTab';
import { BlogPage, EventsPage, JobsPage, PodcastPage, PressPage } from './components/ContentPages';
import { useI18n } from './i18n';
import { CommunityAuthProvider } from './community/CommunityAuth';

const INTENT_KEY = 'rwa-soroban-intent';

export default function App() {
  const { m, locale } = useI18n();
  const route = useRoute();
  // Fresh-fragment navigation: the browser's native anchor scroll runs before
  // React renders the target (and sections may mount later behind async
  // data), so /path#section must be scrolled by the app once the element
  // exists. Same-document hash changes are already handled natively; this
  // effect runs on route change/mount only. The sticky-header offset is the
  // CSS scroll-margin-top on the target (#72), so a plain scrollIntoView is
  // enough. jsdom has no scrollIntoView - the optional call is deliberate.
  useEffect(() => {
    const raw = window.location.hash;
    if (!raw || raw.startsWith('#/')) return;
    let id: string;
    try {
      id = decodeURIComponent(raw.slice(1));
    } catch {
      return;
    }
    if (!id) return;
    let cancelled = false;
    let attempts = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const headerH = () => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sticky-header-h'));
      return Number.isFinite(v) ? v : 0;
    };
    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (!el) {
        if (++attempts < 20) timers.push(setTimeout(tryScroll, 150));
        return;
      }
      el.scrollIntoView?.();
      // The sticky header can still grow after the first scroll (locale
      // fonts settle, nav wraps to a second row), and scroll-margin-top uses
      // the height at scroll time - re-apply the scroll once the header has
      // settled, but only while the target is actually clipped behind it,
      // so a user scroll in between is never undone.
      for (const ms of [400, 1200]) {
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            const top = el.getBoundingClientRect().top;
            if (top >= 0 && top < headerH()) el.scrollIntoView?.();
          }, ms),
        );
      }
    };
    tryScroll();
    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
    };
  }, [route]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [actor, setActor] = useState('');
  const [error, setError] = useState<{ code?: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  // Per-card errors store machine codes (not localized strings) so a locale
  // switch retranslates them at render with the rest of the page, same rule
  // as the top banner. '' clears the slot.
  const [amountErrorCodes, setAmountErrorCodes] = useState<Record<string, ContributionError | ''>>({});
  const [prepareErrorCodes, setPrepareErrorCodes] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [fixtureMode, setFixtureMode] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(INTENT_KEY) ?? 'null');
    } catch {
      return null;
    }
  });

  // Store the failure, not a localized string: the banner resolves known
  // codes against the ACTIVE dictionary at render, so a locale switch after
  // the error appears retranslates the banner with the rest of the page.
  function bannerError(e: unknown): { code?: string; text: string } {
    const text = e instanceof Error ? e.message : String(e);
    const code = (e as { code?: string } | null)?.code;
    return code ? { code, text } : { text };
  }

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
    refresh().catch((e) => setError(bannerError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retain(i: Intent) {
    setIntent(i);
    localStorage.setItem(INTENT_KEY, JSON.stringify(i));
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(bannerError(e));
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

  function amountErrorText(code: ContributionError, c: Campaign): string {
    if (code === 'required') return m.card.amountRequired;
    if (code === 'invalid') return m.card.amountInvalid;
    return tpl(m.card.amountExceeds, { remaining: formatAmount(String(BigInt(c.config.goal) - BigInt(c.raised)), locale) });
  }

  function prepareErrorText(code: string): string {
    // Known failures localize from their stable code; unknown ones get the
    // generic message and keep their detail in the console, never parsed or
    // partially translated server text.
    const known: Record<string, string> = {
      SIM_TRUSTLINE_MISSING: m.errors.prepareTrustlineMissing,
      SIM_ACCOUNT_MISSING: m.errors.prepareAccountMissing,
      SIM_INSUFFICIENT_BALANCE: m.errors.prepareInsufficientBalance,
      SIM_REJECTED: m.errors.prepareFailed,
      API_UNAVAILABLE: m.errors.apiUnavailable,
    };
    return known[code] ?? m.errors.prepareFailed;
  }

  async function prepare(c: Campaign, action: 'contribute' | 'refund' | 'withdraw') {
    if (!actor) throw new Error(m.errors.connectFirst);
    if (action === 'contribute') {
      const code = contributionError(amounts[c.id] ?? '', c.config.goal, c.raised) ?? '';
      setAmountErrorCodes({ ...amountErrorCodes, [c.id]: code });
      if (code) return;
    }
    if (intent && !isTerminal(intent.status)) {
      throw new Error(m.errors.resolveSaved);
    }
    setPrepareErrorCodes((prev) => ({ ...prev, [c.id]: '' }));
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
      // The stored code is resolved against the active dictionary at render.
      const code = (e as { code?: string }).code ?? 'UNKNOWN';
      const KNOWN = ['SIM_TRUSTLINE_MISSING', 'SIM_ACCOUNT_MISSING', 'SIM_INSUFFICIENT_BALANCE', 'SIM_REJECTED', 'API_UNAVAILABLE'];
      if (!KNOWN.includes(code)) console.warn('prepare failed', e);
      setPrepareErrorCodes((prev) => ({ ...prev, [c.id]: code }));
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
  const amountErrors: Record<string, string> = {};
  for (const [id, code] of Object.entries(amountErrorCodes)) {
    if (!code) continue;
    const c = base.find((x) => x.id === id);
    if (c) amountErrors[id] = amountErrorText(code, c);
  }
  const prepareErrors: Record<string, string> = {};
  for (const [id, code] of Object.entries(prepareErrorCodes)) {
    if (code) prepareErrors[id] = prepareErrorText(code);
  }
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
      setAmountErrorCodes({ ...amountErrorCodes, [id]: v.trim() === '' ? '' : (contributionError(v, c.config.goal, c.raised) ?? '') });
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
        community: m.community,
      }}
    >
      <a className="skip-link" href="#main">
        {m.meta.skipLink}
      </a>
      <RiskBanner />
      <Header actor={actor} busy={busy} onConnect={() => run(connect)} onDisconnect={() => setActor('')} current={route.name} />
      <main className="page" id="main">
        {error && (
          <p role="alert" className="error-banner">
            {(error.code === 'API_UNAVAILABLE' && m.errors.apiUnavailable) || error.text}
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
        {route.name === 'campaign-builder' && <CampaignBuilderDraft />}
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
        {route.name === 'podcast' && <PodcastPage />}

        <FeedbackTab actor={actor} onConnect={connect} />
        <Footer />
      </main>
    </CommunityAuthProvider>
  );
}
