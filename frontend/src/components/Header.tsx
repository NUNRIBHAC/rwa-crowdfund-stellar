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
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          <span className="brand-name">RWA Crowdfund</span>
          <span className="badge badge-testnet">Stellar testnet</span>
        </a>
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
    </header>
  );
}
