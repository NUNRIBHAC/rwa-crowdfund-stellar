import { useEffect, useState, type ReactNode } from 'react';
import RiskBanner from './RiskBanner';
import { routeHash } from '../router';
import { useI18n } from '../i18n';
import { lockupFor, useTheme } from '../theme';

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  const [mobile, setMobile] = useState(() => window.matchMedia?.('(max-width: 560px)').matches ?? false);
  const [open, setOpen] = useState(() => !mobile);
  useEffect(() => {
    const query = window.matchMedia?.('(max-width: 560px)');
    if (!query) return;
    const update = () => {
      setMobile(query.matches);
      setOpen(!query.matches);
    };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return (
    <details className="footer-nav-group" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary
        tabIndex={mobile ? 0 : -1}
        onClick={(event) => {
          if (!mobile) event.preventDefault();
        }}
      >
        <h2 className="footer-heading">{title}</h2>
      </summary>
      {children}
    </details>
  );
}

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
            {/* Social icons link verified brand destinations, including the Facebook
              Page verified 2026-11-03. Discord links the user-created server
              (never-expiring, unlimited-use invite confirmed by the owner on 2026-11-02);
              Telegram links the authorized public brand channel (public page and
              t.me/s preview verified on 2026-11-02). Farcaster links the registered
              @blockallisto profile; the owner chose to link it before the profile
              bio/avatar are filled in (2026-11-02). LinkedIn links the brand
              company page created 2026-11-02 and pixel-verified in an authenticated
              member view (anonymous fetches return ENTITY_NOT_FOUND; the crawler
              response is not absence). aria-labels are hardcoded English until the
              locale batch adds footer keys. All platform glyphs are the user-provided set
              (brand/icons/social, Simple Icons geometry); linkedin.png is the official [in]
              Bug (InBug-Black, padded to a square transparent canvas) from LinkedIn's brand
              download: https://brand.linkedin.com/downloads -> in-logo.zip (content.linkedin.com). */}
            <div className="footer-social" aria-label="Blockallisto social media profiles">
              <a href="https://x.com/blockallisto" target="_blank" rel="noopener" aria-label="Blockallisto on X">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/x.svg" alt="" />
              </a>
              <a href="https://www.instagram.com/blockallisto/" target="_blank" rel="noopener" aria-label="Blockallisto on Instagram">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/instagram.svg" alt="" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61595902542764" target="_blank" rel="noopener" aria-label="Blockallisto on Facebook">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/facebook.svg" alt="" />
              </a>
              <a href="https://www.threads.com/@blockallisto" target="_blank" rel="noopener" aria-label="Blockallisto on Threads">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/threads.svg" alt="" />
              </a>
              <a href="https://www.youtube.com/@blockallisto" target="_blank" rel="noopener" aria-label="Blockallisto on YouTube">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/youtube.svg" alt="" />
              </a>
              <a href="https://t.me/blockallisto" target="_blank" rel="noopener" aria-label="Blockallisto on Telegram">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/telegram.svg" alt="" />
              </a>
              <a href="https://discord.gg/BdXATtWNXJ" target="_blank" rel="noopener" aria-label="Blockallisto on Discord">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/discord.svg" alt="" />
              </a>
              <a href="https://farcaster.xyz/blockallisto" target="_blank" rel="noopener" aria-label="Blockallisto on Farcaster">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/farcaster.svg" alt="" />
              </a>
              <a href="https://www.linkedin.com/company/blockallisto/" target="_blank" rel="noopener" aria-label="Blockallisto on LinkedIn">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/linkedin.png" alt="" />
              </a>
              <a href="mailto:blockallisto@gmail.com" aria-label="Email Blockallisto">
                <img src="https://blockallisto-media.nunrib-df6.workers.dev/social/email.svg" alt="" />
              </a>
            </div>
          </div>
          <div className="footer-grid">
            <FooterGroup title={m.footer.platform}>
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
            </FooterGroup>
            <FooterGroup title={m.footer.legal}>
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
            </FooterGroup>
            <FooterGroup title={m.footer.learn}>
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
            </FooterGroup>
            <FooterGroup title={m.footer.communication}>
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
            </FooterGroup>
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
                <RiskBanner />
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
