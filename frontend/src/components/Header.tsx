import { shorten } from '../format';
import { routeHash, type RouteName } from '../router';

type Props = {
  actor: string;
  busy: boolean;
  onConnect: () => void;
  current: RouteName;
};

const NAV: { route: RouteName; label: string }[] = [
  { route: 'home', label: 'Home' },
  { route: 'investments', label: 'Invest' },
  { route: 'how-it-works', label: 'How it works' },
  { route: 'learn', label: 'Learn' },
  { route: 'financing', label: 'Financing' },
  { route: 'faq', label: 'FAQ' },
  { route: 'about', label: 'About' },
  { route: 'account', label: 'My account' },
];

export default function Header({ actor, busy, onConnect, current }: Props) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href={routeHash({ name: 'home' })}>
          <svg className="brand-mark" viewBox="0 0 240 240" aria-hidden="true">
            <rect x="28" y="28" width="184" height="184" rx="26" fill="none" stroke="#FFFFFF" strokeWidth="13" />
            <rect x="50" y="150" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="100" y="150" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="150" y="150" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="50" y="100" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="100" y="100" width="40" height="40" rx="9" fill="#8B8EF0" />
            <rect x="50" y="50" width="40" height="40" rx="9" fill="#C7C8F9" />
          </svg>
          <span className="brand-name">Blockallisto</span>
        </a>
        <nav className="site-nav" aria-label="Main">
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
        <div className="header-side">
          <span className="badge badge-testnet">Stellar testnet</span>
          <div className="header-actions">
            {actor ? (
              <span className="wallet-chip" title={actor}>
                Connected: {shorten(actor)}
              </span>
            ) : (
              <button className="btn btn-primary" disabled={busy} onClick={onConnect}>
                Connect Freighter
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
