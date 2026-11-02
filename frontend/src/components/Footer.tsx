import { routeHash } from '../router';
import { useI18n } from '../i18n';
import { lockupFor, useTheme } from '../theme';

export default function Footer() {
  const { m } = useI18n();
  const theme = useTheme();
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <div className="footer-brand-inner">
          <div className="footer-brand-word">
            <div className="footer-brand-lockup">
              <img className="footer-brand-lockup-img" src={lockupFor(theme)} alt="Blockallisto" />
            </div>
            <p className="footer-tagline">{m.footer.tagline}</p>
            {/* Social icons. Verified profiles are linked (YouTube, Instagram, Threads, email);
              the remaining platforms stay as visual presence only until their real profile
              URLs exist - no placeholder links. aria-labels are hardcoded English until the
              locale batch adds footer keys. All platform glyphs are the user-provided set
              (brand/icons/social, Simple Icons geometry); linkedin.png is the official [in]
              Bug (InBug-Black, padded to a square transparent canvas) from LinkedIn's brand
              download: https://brand.linkedin.com/downloads -> in-logo.zip (content.linkedin.com). */}
            <div className="footer-social" aria-label="Blockallisto social media profiles">
              <a href="https://x.com/blockallisto" target="_blank" rel="noopener" aria-label="Blockallisto on X">
                <img src="/social/x.svg" alt="" />
              </a>
              <a href="https://www.instagram.com/blockallisto/" target="_blank" rel="noopener" aria-label="Blockallisto on Instagram">
                <img src="/social/instagram.svg" alt="" />
              </a>
              <img src="/social/facebook.svg" alt="" />
              <a href="https://www.threads.com/@blockallisto" target="_blank" rel="noopener" aria-label="Blockallisto on Threads">
                <img src="/social/threads.svg" alt="" />
              </a>
              <a href="https://www.youtube.com/@blockallisto" target="_blank" rel="noopener" aria-label="Blockallisto on YouTube">
                <img src="/social/youtube.svg" alt="" />
              </a>
              <img src="/social/telegram.svg" alt="" />
              <img src="/social/discord.svg" alt="" />
              <img src="/social/farcaster.svg" alt="" />
              <img src="/social/linkedin.png" alt="LinkedIn" />
              <a href="mailto:blockallisto@gmail.com" aria-label="Email Blockallisto">
                <img src="/social/email.svg" alt="" />
              </a>
            </div>
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
              <h2 className="footer-heading">{m.footer.legal}</h2>
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
                <li>
                  <a href={routeHash({ name: 'legal-notice' })}>{m.footer.legalNotice}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'conflicts-of-interest' })}>{m.footer.conflictsOfInterest}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'complaints-management' })}>{m.footer.complaintsManagement}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'business-continuity' })}>{m.footer.businessContinuity}</a>
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
            <div>
              <h2 className="footer-heading">{m.footer.communication}</h2>
              <ul>
                <li>
                  <a href={routeHash({ name: 'events' })}>{m.contentPages.eventsTitle}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'blog' })}>{m.contentPages.blogTitle}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'press' })}>{m.contentPages.pressTitle}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'jobs' })}>{m.contentPages.jobsTitle}</a>
                </li>
                <li>
                  <a href={routeHash({ name: 'podcast' })}>{m.contentPages.podcastTitle}</a>
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
