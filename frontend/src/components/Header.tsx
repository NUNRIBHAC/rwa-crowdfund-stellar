import { shorten } from '../format';
import { routeHash, type RouteName } from '../router';
import { LOCALES, useI18n, type Locale } from '../i18n';
import { lockupFor, useTheme } from '../theme';
import { useCommunityAuth } from '../community/CommunityAuth';

type Props = {
  actor: string;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  current: RouteName;
};

// Header arrangement (user target, 2026-10-31): brand at the left spanning both
// rows; the right column carries the testnet badge + Connect on the top row and
// the language selector directly below; the nav sits on the lower middle row.
// The theme toggle lives in the risk banner above, not here.
export default function Header({ actor, busy, onConnect, onDisconnect, current }: Props) {
  const theme = useTheme();
  const { signOut } = useCommunityAuth();
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
          <div className="header-side-top">
            <span className="badge badge-testnet">{m.header.testnetBadge}</span>
            <div className="header-actions">
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
                <button className="btn btn-primary" disabled={busy} onClick={onConnect}>
                  {m.header.connect}
                </button>
              )}
            </div>
          </div>
          <select className="lang-select" value={locale} onChange={(e) => setLocale(e.target.value as Locale)} aria-label={m.header.languageLabel}>
            {LOCALES.map((l) => (
              <option key={l.id} value={l.id} aria-label={l.accessibleLabel}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
