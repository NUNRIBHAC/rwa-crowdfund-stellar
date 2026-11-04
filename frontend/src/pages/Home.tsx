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
    <>
      <Hero mode={mode} />

      {latest.length > 0 && (
        <section aria-label={m.home.latestAria}>
          <div className="registry-bar">
            <h2 className="section-title">{m.home.latestTitle}</h2>
            <a className="btn btn-ghost" href={routeHash({ name: 'investments' })}>
              {m.home.allInvestments}
            </a>
          </div>
          <div className="card-grid home-editorial-cards">
            {latest.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                profile={profileFor(c, fixtureMode, m.profiles.list)}
                actor={market.actor}
                busy={market.busy}
                readOnly={fixtureMode}
                demo={fixtureMode}
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

      <section aria-label={m.home.instrumentsAria}>
        <h2 className="section-title">{m.home.instrumentsTitle}</h2>
        <p>{m.home.instrumentsIntro}</p>
        <details className="instrument-disclosure">
          <summary>{m.home.instrumentsTitle}</summary>
          <div className="instrument-grid">
            {m.instruments.classes.map((c) => (
              <a key={c.id} className="instrument-tile" href={routeHash({ name: 'learn' })}>
                <h3>{c.label}</h3>
                {c.subtypeOf && <p className="instrument-sub">{c.subtypeOf}</p>}
                <p>{c.summary}</p>
              </a>
            ))}
          </div>
        </details>
      </section>

      <section aria-label={m.home.whyAria}>
        <h2 className="section-title">{m.home.whyTitle}</h2>
        <ul className="why-list">
          {m.home.whyPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
