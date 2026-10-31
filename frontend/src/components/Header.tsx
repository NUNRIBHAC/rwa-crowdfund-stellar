import { shorten } from '../format';
import { routeHash, type RouteName } from '../router';
import { LOCALES, useI18n, type Locale } from '../i18n';
import { lockupFor, setTheme, useTheme } from '../theme';

type Props = {
  actor: string;
  busy: boolean;
  onConnect: () => void;
  current: RouteName;
};

export default function Header({ actor, busy, onConnect, current }: Props) {
  const theme = useTheme();
  const { locale, setLocale, m } = useI18n();
  const NAV: { route: RouteName; label: string }[] = [
    { route: 'home', label: m.nav.home },
    { route: 'investments', label: m.nav.investments },
    { route: 'how-it-works', label: m.nav.howItWorks },
    { route: 'learn', label: m.nav.learn },
    { route: 'financing', label: m.nav.financing },
    { route: 'faq', label: m.nav.faq },
    { route: 'about', label: m.nav.about },
    { route: 'account', label: m.nav.account },
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-main">
          <a className="brand" href={routeHash({ name: 'home' })}>
            <img className="brand-lockup" src={lockupFor(theme)} alt="Blockallisto" />
          </a>
          <nav className="site-nav" aria-label={m.nav.ariaMain}>
            {NAV.map((item) => {
              const active = item.route === current || (item.route === 'investments' && current === 'campaign');
              return (
                <a
                  key={item.route}
                  className={`nav-link ${active ? 'nav-link-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  href={routeHash({ name: item.route })}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
        <div className="header-side">
          <select className="lang-select" value={locale} onChange={(e) => setLocale(e.target.value as Locale)} aria-label={m.header.languageLabel}>
            {LOCALES.map((l) => (
              <option key={l.id} value={l.id} aria-label={l.accessibleLabel}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="badge badge-testnet">{m.header.testnetBadge}</span>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'navy' : 'light')}
            aria-label={theme === 'light' ? m.header.themeToDark : m.header.themeToLight}
            title={theme === 'light' ? m.header.themeToDark : m.header.themeToLight}
          >
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M20.6 14.5A8.5 8.5 0 0 1 9.5 3.4a8.5 8.5 0 1 0 11.1 11.1Z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle cx="12" cy="12" r="4.4" fill="currentColor" />
                <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" />
                </g>
              </svg>
            )}
          </button>
          <div className="header-actions">
            {actor ? (
              <span className="wallet-chip" title={actor}>
                {m.header.connectedPrefix}: {shorten(actor)}
              </span>
            ) : (
              <button className="btn btn-primary" disabled={busy} onClick={onConnect}>
                {m.header.connect}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
