import { routeHash } from '../router';
import { useI18n } from '../i18n';
import EditorialCubes from './EditorialCubes';
import FundingIllustration from './FundingIllustration';

type Props = { mode: 'live' | 'sample' | 'unknown' };

export default function Hero({ mode }: Props) {
  const { m } = useI18n();
  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="hero-eyebrow">{m.hero.eyebrow}</p>
          <h1>
            {m.hero.titleA} {m.hero.titleB}
          </h1>
          <p className="hero-sub">{m.hero.intro}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={routeHash({ name: 'investments' })}>
              {m.hero.ctaBrowse}
            </a>
            <a className="btn btn-outline" href={routeHash({ name: 'how-it-works' })}>
              {m.hero.ctaHow}
            </a>
          </div>
          {/* User request 2026-11-04: the "Stellar testnet prototype - no real
              funds" line is removed from the homepage hero; the sample-data
              note stays in fixtures mode and transaction/wallet disclosures
              elsewhere are unchanged. */}
          {mode === 'sample' && <p className="hero-note">{m.card.demoNote}</p>}
        </div>
        <div className="hero-art hero-cubes">
          <EditorialCubes />
        </div>
      </div>
      <details className="hero-technical home-contract">
        <summary>{m.hero.technicalTitle}</summary>
        <div className="hero-interactive">
          <FundingIllustration />
        </div>
      </details>
    </section>
  );
}
