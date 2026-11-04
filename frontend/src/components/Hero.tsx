import { routeHash } from '../router';
import { useI18n } from '../i18n';
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
          <p className="hero-note">
            <strong>{m.hero.noteStrong}</strong> {mode === 'sample' && m.card.demoNote}
          </p>
        </div>
        <div className="hero-art hero-interactive">
          <FundingIllustration />
        </div>
      </div>
    </section>
  );
}
