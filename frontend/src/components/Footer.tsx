import { routeHash } from '../router';
import { useI18n } from '../i18n';
import { FOOTER_LOCKUP } from '../theme';

export default function Footer() {
  const { m } = useI18n();
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <div className="footer-brand-inner">
          <div className="footer-brand-word">
            <div className="footer-brand-lockup">
              <img className="footer-brand-lockup-img" src={FOOTER_LOCKUP} alt="Blockallisto" />
            </div>
            <p className="footer-tagline">{m.footer.tagline}</p>
          </div>
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
                  <a href={routeHash({ name: 'glossary' })}>{m.footer.glossary}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'faq' })}>{m.footer.faq}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'about' })}>{m.footer.aboutProject}</a>
                </li>
              </ul>
            </div>
            <div className="footer-context">
              <p className="footer-legal">
                {m.footer.legalPre}{' '}
                <a href="https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_upreg" target="_blank" rel="noreferrer">
                  {m.footer.legalLink}
                </a>
                {m.footer.legalPost}
              </p>
              <div className="footer-status">
                <h2 className="footer-heading">{m.footer.status}</h2>
                <p>{m.footer.statusText}</p>
              </div>
            </div>
          </div>
          <svg className="footer-tiles" viewBox="0 0 400 280" aria-hidden="true">
            <rect x="140" y="34" width="66" height="66" rx="15" fill="#8B8EF0" transform="rotate(8 173 67)" />
            <rect x="328" y="36" width="36" height="36" rx="8" fill="none" stroke="#E6E6FB" strokeWidth="4" transform="rotate(12 346 54)" />
            <rect x="250" y="104" width="70" height="70" rx="16" fill="#4B4FE2" transform="rotate(-6 285 139)" />
            <rect x="100" y="110" width="46" height="46" rx="11" fill="#C7C8F9" transform="rotate(-14 123 133)" />
            <rect x="30" y="170" width="38" height="38" rx="9" fill="#4B4FE2" transform="rotate(-24 49 189)" />
            <rect x="150" y="206" width="28" height="28" rx="7" fill="#8B8EF0" transform="rotate(10 164 220)" />
            <rect x="240" y="186" width="40" height="40" rx="10" fill="none" stroke="#E6E6FB" strokeWidth="4" transform="rotate(10 260 206)" />
          </svg>
        </div>
      </div>
    </footer>
  );
}
