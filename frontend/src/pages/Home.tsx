import type { Market } from '../market';
import Hero from '../components/Hero';
import CampaignCard from '../components/CampaignCard';
import { profileFor } from '../data/profiles';
import { routeHash } from '../router';
import { useI18n } from '../i18n';

export default function Home({ market }: { market: Market }) {
  const { m } = useI18n();
  const { campaigns, loaded, fixtureMode } = market;
  const mode = fixtureMode ? 'sample' : loaded && campaigns.length > 0 ? 'live' : 'unknown';
  const latest = [...campaigns].sort((a, b) => Number(a.config.deadline) - Number(b.config.deadline)).slice(0, 3);

  return (
    <div className="home-introduction">
      <Hero mode={mode} />

      {latest.length > 0 && (
        <section aria-label={m.home.latestAria}>
          <div className="registry-bar">
            <h2 className="section-title">{m.home.latestTitle}</h2>
            <a className="btn btn-ghost" href={routeHash({ name: 'investments' })}>
              {m.home.allInvestments}
            </a>
          </div>
          <div className={`card-grid home-editorial-cards ${latest.length === 1 ? 'home-single-campaign' : ''}`}>
            {latest.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                profile={profileFor(c, fixtureMode, m.profiles.list)}
                actor={market.actor}
                busy={market.busy}
                readOnly={fixtureMode}
                demo={fixtureMode}
                discoveryOnly
                amount={market.amounts[c.id] ?? ''}
                amountError={market.amountErrors[c.id]}
                prepareError={market.prepareErrors[c.id]}
                onAmount={(v) => market.onAmount(c.id, v)}
                onPrepare={(action) => market.onPrepare(c, action)}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-label={m.home.stepsAria}>
        <h2 className="section-title">{m.home.stepsTitle}</h2>
        <ol className="step-cards">
          {m.home.steps.map((s, i) => (
            <li key={i} className="step-card">
              <span className="step-num" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="section-link">
          <a href={routeHash({ name: 'how-it-works' })}>{m.home.fullJourneyLink}</a>
        </p>
      </section>

      <section className="home-funding-rules" aria-label={m.home.rulesTitle}>
        <h2 className="section-title">{m.home.rulesTitle}</h2>
        <p className="hero-unavailable">{m.hero.unavailable}</p>
        <details className="hero-technical">
          <summary>{m.hero.technicalTitle}</summary>
          <p>{m.hero.sub}</p>
          <p>{m.card.rules}</p>
        </details>
        <details className="hero-technical">
          <summary>{m.hero.goalMissed}</summary>
          <p>{m.hero.missedOutcome}</p>
        </details>
        <details className="hero-technical">
          <summary>{m.riskWarnings.title}</summary>
          <p>{m.hero.noteUnknown}</p>
          <p>{mode === 'live' ? m.hero.noteLive : mode === 'sample' ? m.hero.noteSample : m.hero.noteUnknown}</p>
          <a href="/risk-disclosure">{m.footer.riskDisclosure}</a>
        </details>
      </section>
      <section className="home-final-cta">
        <a className="btn btn-primary" href={routeHash({ name: 'investments' })}>
          {m.hero.ctaBrowse}
        </a>
      </section>
    </div>
  );
}
