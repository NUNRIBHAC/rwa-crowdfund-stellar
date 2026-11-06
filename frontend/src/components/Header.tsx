import { shorten } from '../format';
import { routeHash, type RouteName } from '../router';
import { LOCALES, useI18n, type Locale } from '../i18n';
import { lockupFor, setTheme, useTheme } from '../theme';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useEffect, useRef, useState } from 'react';

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    home: 'M3 11 12 3l9 8M5 10v11h14V10',
    investments: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z',
    'how-it-works': 'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    learn: 'M12 5c-3-2-6-2-10 0v15c4-2 7-2 10 0 3-2 6-2 10 0V5c-4-2-7-2-10 0ZM12 5v15',
    financing: 'M3 7h18v14H3zM8 7V3h8v4M3 12c6 3 12 3 18 0M10 13h4',
    about: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    faq: 'M7 18 3 22l1-7a9 9 0 1 1 3 3M8 11h.01M12 11h.01M16 11h.01',
    account: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3',
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] || 'M3 11 12 3l9 8v10H3z'} />
    </svg>
  );
}

type Props = {
  actor: string;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  current: RouteName;
};

// Header arrangement (user target, 2026-10-31): brand at the left spanning both
// rows; the right column carries Connect on the top row and the language
// selector directly below; the nav sits on the lower middle row. The testnet
// badge was removed from the header/drawer at the user's request (2026-11-04);
// page-level demo and no-real-funds disclosures stay. The current user
// reference places account, compact locale, theme and wallet after More.
export default function Header({ actor, busy, onConnect, onDisconnect, current }: Props) {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !moreRef.current?.contains(event.target)) setMoreOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  useEffect(() => setMoreOpen(false), [current]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  // Publish the real sticky-header height so anchored sections clear it on
  // hash jumps. The height varies with viewport, locale string lengths and
  // nav wrapping, so it is measured, never hardcoded.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty('--sticky-header-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    };
    publish();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', publish);
      return () => window.removeEventListener('resize', publish);
    }
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { account, signOut, busy: sessionBusy } = useCommunityAuth();
  const { locale, setLocale, m } = useI18n();
  const NAV: { route: RouteName; label: string }[] = [
    { route: 'home', label: m.nav.home },
    { route: 'investments', label: m.home.campaignsNav },
    { route: 'how-it-works', label: m.nav.howItWorks },
    { route: 'learn', label: m.nav.learn },
    { route: 'financing', label: m.home.forBusinesses },
  ];
  return (
    <header
      className={`site-header${current === 'home' ? ' header-home' : ''}${menuOpen ? ' mobile-menu-open' : ''}`}
      ref={headerRef}
      onKeyDown={(e) => {
        if (e.key === 'Tab' && menuOpen && window.matchMedia('(max-width: 960px)').matches) {
          const controls = Array.from(headerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), select') || []).filter(
            (el) => el.getClientRects().length > 0,
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
        if (e.key === 'Escape' && moreOpen) {
          setMoreOpen(false);
          moreButtonRef.current?.focus();
          e.stopPropagation();
        } else if (e.key === 'Escape' && menuOpen) {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        }
      }}
    >
      <div className="header-inner">
        <div className="header-main">
          <a className="brand" href={routeHash({ name: 'home' })} onClick={() => setMenuOpen(false)}>
            <img className="brand-lockup" src={lockupFor(theme)} alt="Blockallisto" />
          </a>
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={m.nav.ariaMain}
            aria-expanded={menuOpen}
            aria-controls="header-navigation header-controls"
            onClick={() => {
              setMenuOpen((open) => !open);
              setMoreOpen(false);
            }}
            ref={menuButtonRef}
          >
            {!menuOpen && <span className="mobile-menu-label">{m.nav.menu}</span>}
            <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
          </button>
          <nav className="site-nav" id="header-navigation" aria-label={m.nav.ariaMain}>
            {NAV.map((item) => {
              const active = item.route === current || (item.route === 'investments' && current === 'campaign');
              return (
                <a
                  key={item.route}
                  className={`nav-link ${['faq', 'about', 'account'].includes(item.route) ? 'nav-link-secondary' : ''} ${active ? 'nav-link-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  href={routeHash({ name: item.route })}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="mobile-nav-icon">
                    <NavIcon name={item.route} />
                  </span>
                  {item.label}
                </a>
              );
            })}
            <div className="nav-more" ref={moreRef}>
              <button
                className={`nav-link nav-more-toggle ${['about', 'faq'].includes(current) ? 'nav-link-active' : ''}`}
                type="button"
                ref={moreButtonRef}
                aria-expanded={moreOpen}
                aria-controls="header-more-links"
                onClick={() => setMoreOpen((open) => !open)}
              >
                {m.nav.more}{' '}
                <svg
                  className="nav-more-chevron"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m3 6 5 5 5-5" />
                </svg>
              </button>
              <div className={`nav-more-panel ${moreOpen ? 'is-open' : ''}`} id="header-more-links">
                {(
                  [
                    { route: 'about', label: m.nav.about, icon: 'ⓘ' },
                    { route: 'faq', label: m.nav.faq, icon: '⋯' },
                  ] as const
                ).map((item) => (
                  <a
                    key={item.route}
                    href={routeHash({ name: item.route })}
                    aria-current={current === item.route ? 'page' : undefined}
                    onClick={() => {
                      setMoreOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <span className="nav-more-icon" aria-hidden="true">
                      <NavIcon name={item.route} />
                    </span>
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </nav>
        </div>
        <div className="header-side" id="header-controls">
          <a
            className={`nav-link nav-link-secondary ${current === 'account' ? 'nav-link-active' : ''}`}
            href={routeHash({ name: 'account' })}
            aria-current={current === 'account' ? 'page' : undefined}
            onClick={() => setMenuOpen(false)}
          >
            <span className="mobile-nav-icon">
              <NavIcon name="account" />
            </span>
            {m.nav.account}
          </a>
          <select className="lang-select" value={locale} onChange={(e) => setLocale(e.target.value as Locale)} aria-label={m.header.languageLabel}>
            {LOCALES.map((l) => (
              <option key={l.id} value={l.id} aria-label={l.accessibleLabel}>
                {l.id.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="theme-toggle header-theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'navy' : 'light')}
            aria-label={theme === 'light' ? m.header.themeToDark : m.header.themeToLight}
            title={theme === 'light' ? m.header.themeToDark : m.header.themeToLight}
          >
            <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
          </button>

          <div className="header-side-top">
            <div className="header-actions" style={account ? { gap: 8, flexWrap: 'wrap' } : undefined}>
              {account && (
                <button
                  className="btn btn-disconnect"
                  disabled={sessionBusy}
                  onClick={() => {
                    void signOut();
                    setMenuOpen(false);
                  }}
                >
                  {m.community.signOutButton}
                </button>
              )}

              {actor ? (
                <>
                  <span className="wallet-chip" title={actor}>
                    <span className="wallet-chip-prefix">{m.header.connectedPrefix}:</span> {shorten(actor)}
                  </span>
                  <button
                    className="btn btn-disconnect"
                    disabled={busy}
                    onClick={() => {
                      // Clears this browser's app connection and community
                      // session only; wallet-side site permissions and other
                      // browsers' sessions are untouched.
                      void signOut();
                      onDisconnect();
                    }}
                  >
                    {m.header.disconnect}
                  </button>
                </>
              ) : (
                <button className={`btn ${current === 'home' ? 'btn-outline' : 'btn-primary'}`} disabled={busy} onClick={onConnect}>
                  {m.header.connectWallet}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
