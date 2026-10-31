import { routeHash } from '../router';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <div className="footer-brand-lockup">
          <svg className="footer-brand-mark" viewBox="0 0 240 240" aria-hidden="true">
            <rect x="28" y="28" width="184" height="184" rx="26" fill="none" stroke="#FFFFFF" strokeWidth="13" />
            <rect x="50" y="150" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="100" y="150" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="150" y="150" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="50" y="100" width="40" height="40" rx="9" fill="#4B4FE2" />
            <rect x="100" y="100" width="40" height="40" rx="9" fill="#8B8EF0" />
            <rect x="150" y="100" width="40" height="40" rx="9" fill="none" stroke="#C7C8F9" strokeWidth="6" strokeDasharray="8 7" />
            <rect x="50" y="50" width="40" height="40" rx="9" fill="#C7C8F9" />
            <rect x="196" y="6" width="38" height="38" rx="9" fill="#4B4FE2" />
          </svg>
          <span className="brand-name footer-brand-name">
            <span className="brand-name-strong">Block</span>
            <span className="brand-name-light">allisto</span>
          </span>
        </div>
        <p className="footer-tagline">Real assets. Shared possibilities.</p>
        <svg className="footer-tiles" viewBox="0 0 320 200" aria-hidden="true">
          <rect x="238" y="8" width="64" height="64" rx="14" fill="#8B8EF0" transform="rotate(8 270 40)" />
          <rect x="292" y="60" width="44" height="44" rx="10" fill="none" stroke="#E6E6FB" strokeWidth="4" transform="rotate(12 314 82)" />
          <rect x="210" y="92" width="72" height="72" rx="16" fill="#4B4FE2" transform="rotate(-6 246 128)" />
          <rect x="120" y="120" width="48" height="48" rx="11" fill="#C7C8F9" transform="rotate(-14 144 144)" />
          <rect x="60" y="140" width="40" height="40" rx="9" fill="#4B4FE2" transform="rotate(-24 80 160)" />
          <rect x="170" y="150" width="44" height="44" rx="10" fill="none" stroke="#E6E6FB" strokeWidth="4" transform="rotate(10 192 172)" />
          <rect x="96" y="80" width="36" height="36" rx="8" fill="#8B8EF0" transform="rotate(-30 114 98)" />
        </svg>
      </div>
      <div className="footer-grid">
        <div>
          <h2 className="footer-heading">Platform</h2>
          <ul>
            <li>
              <a href={routeHash({ name: 'investments' })}>Invest</a>
            </li>
            <li>
              <a href={routeHash({ name: 'how-it-works' })}>How it works</a>
            </li>
            <li>
              <a href={routeHash({ name: 'financing' })}>Financing for issuers</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer-heading">Learn</h2>
          <ul>
            <li>
              <a href={routeHash({ name: 'learn' })}>Instrument hub</a>
            </li>
            <li>
              <a href={routeHash({ name: 'risk-warnings' })}>Risk warnings</a>
            </li>
            <li>
              <a href={routeHash({ name: 'faq' })}>FAQ</a>
            </li>
            <li>
              <a href={routeHash({ name: 'about' })}>About this project</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer-heading">Status</h2>
          <p>
            Testnet prototype. No automatic deployment or legacy balance conversion. Existing classic intents and balances are preserved, not cleared. The
            separate identity/valuation infrastructure remains mock-only.
          </p>
        </div>
      </div>
      <p className="footer-legal">
        Market context: the EU regulates crowdfunding under ECSPR; authorised providers are listed in the{' '}
        <a href="https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_upreg" target="_blank" rel="noreferrer">
          ESMA register
        </a>
        . This app is not an authorised crowdfunding service provider and lists no live offers.
      </p>
    </footer>
  );
}
