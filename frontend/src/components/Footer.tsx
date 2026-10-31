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
              <h2 className="footer-heading footer-legal-heading">{m.footer.legal}</h2>
              <ul>
                <li>
                  <a href={routeHash({ name: 'terms-of-service' })}>{m.footer.termsOfService}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'privacy-policy' })}>{m.footer.privacyPolicy}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'risk-disclosure' })}>{m.footer.riskDisclosure}</a>
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
          <div className="footer-tiles" aria-hidden="true">
            {/* Each shape is its own svg whose box has slack around the rotated
                rect, so no corner is ever clipped by an internal boundary; the
                only clipping that can occur is at the footer's own edges. */}
            <svg className="ft ft-1" viewBox="-7 -7 80 80">
              <rect x="0" y="0" width="66" height="66" rx="15" fill="#8B8EF0" transform="rotate(8 33 33)" />
            </svg>
            <svg className="ft ft-2" viewBox="-7 -7 50 50">
              <rect x="0" y="0" width="36" height="36" rx="8" fill="none" stroke="#E6E6FB" strokeWidth="4" transform="rotate(12 18 18)" />
            </svg>
            <svg className="ft ft-3" viewBox="-7 -7 84 84">
              <rect x="0" y="0" width="70" height="70" rx="16" fill="#4B4FE2" transform="rotate(-6 35 35)" />
            </svg>
            <svg className="ft ft-4" viewBox="-7 -7 60 60">
              <rect x="0" y="0" width="46" height="46" rx="11" fill="#C7C8F9" transform="rotate(-14 23 23)" />
            </svg>
            <svg className="ft ft-5" viewBox="-8 -8 54 54">
              <rect x="0" y="0" width="38" height="38" rx="9" fill="#4B4FE2" transform="rotate(-24 19 19)" />
            </svg>
            <svg className="ft ft-6" viewBox="-4 -4 36 36">
              <rect x="0" y="0" width="28" height="28" rx="7" fill="#8B8EF0" transform="rotate(10 14 14)" />
            </svg>
            <svg className="ft ft-7" viewBox="-6 -6 52 52">
              <rect x="0" y="0" width="40" height="40" rx="10" fill="none" stroke="#E6E6FB" strokeWidth="4" transform="rotate(10 20 20)" />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
