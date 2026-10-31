import { routeHash } from '../router';
import { useI18n } from '../i18n';

export default function Footer() {
  const { m } = useI18n();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h2 className="footer-heading">{m.footer.platform}</h2>
          <ul>
            <li>
              <a href={routeHash({ name: 'investments' })}>{m.footer.invest}</a>
            </li>
            <li>
              <a href={routeHash({ name: 'how-it-works' })}>{m.footer.howItWorks}</a>
            </li>
            <li>
              <a href={routeHash({ name: 'financing' })}>{m.footer.financingIssuers}</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer-heading">{m.footer.learn}</h2>
          <ul>
            <li>
              <a href={routeHash({ name: 'learn' })}>{m.footer.instrumentHub}</a>
            </li>
            <li>
              <a href={routeHash({ name: 'risk-warnings' })}>{m.footer.riskWarnings}</a>
            </li>
            <li>
              <a href={routeHash({ name: 'faq' })}>{m.footer.faq}</a>
            </li>
            <li>
              <a href={routeHash({ name: 'about' })}>{m.footer.aboutProject}</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer-heading">{m.footer.status}</h2>
          <p>{m.footer.statusText}</p>
        </div>
      </div>
      <p className="footer-legal">
        {m.footer.legalPre}{' '}
        <a href="https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_upreg" target="_blank" rel="noreferrer">
          {m.footer.legalLink}
        </a>
        {m.footer.legalPost}
      </p>
      <div className="footer-brand">
        <div className="footer-brand-inner">
          <div className="footer-brand-lockup">
            <img className="footer-brand-lockup-img" src="/blockallisto-lockup-horizontal-reversed.svg" alt="Blockallisto" />
          </div>
          <p className="footer-tagline">{m.footer.tagline}</p>
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
      </div>
    </footer>
  );
}
