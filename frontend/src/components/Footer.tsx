import { routeHash } from '../router';

export default function Footer() {
  return (
    <footer className="site-footer">
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
