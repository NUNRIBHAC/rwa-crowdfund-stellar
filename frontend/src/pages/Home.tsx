import type { Market } from '../market';
import Hero from '../components/Hero';
import CampaignCard from '../components/CampaignCard';
import { profileFor } from '../data/profiles';
import { INSTRUMENT_CLASSES } from '../data/instruments';
import { routeHash } from '../router';

const STEPS = [
  { n: 1, title: 'Connect', text: 'Connect a Freighter wallet on Stellar testnet. No account, no personal data in this prototype.' },
  { n: 2, title: 'Discover', text: 'Browse campaigns and read the structured terms on each campaign page.' },
  { n: 3, title: 'Contribute', text: 'Sign one transaction. The contract escrows your contribution and enforces the funding cap atomically.' },
  { n: 4, title: 'Track', text: 'Follow the funding state here. Refunds are contributor-signed if the goal is missed.' },
];

export default function Home({ market }: { market: Market }) {
  const { campaigns, loaded, fixtureMode } = market;
  const mode = fixtureMode ? 'sample' : loaded && campaigns.length > 0 ? 'live' : 'unknown';
  const latest = [...campaigns].sort((a, b) => Number(a.config.deadline) - Number(b.config.deadline)).slice(0, 3);

  return (
    <>
      <Hero mode={mode} />

      <section aria-label="Behind the name" className="behind-name">
        <svg className="star-accent" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M20 6 L22.5 15.5 L32 18 L22.5 20.5 L20 30 L17.5 20.5 L8 18 L17.5 15.5 Z" fill="#4B4FE2" />
          <path d="M44 28 L45.6 34.4 L52 36 L45.6 37.6 L44 44 L42.4 37.6 L36 36 L42.4 34.4 Z" fill="#8B8EF0" />
          <path d="M36 48 L37.1 52.9 L42 54 L37.1 55.1 L36 60 L34.9 55.1 L30 54 L34.9 52.9 Z" fill="#C7C8F9" />
        </svg>
        <div>
          <h2 className="behind-name-title">Behind the name</h2>
          <p>
            A celestial connection: Callisto is a moon of Jupiter. In Greek mythology, the figure Callisto became Ursa Major, the Great Bear. For Blockallisto,
            that offers a visual metaphor: individual points coming together into a greater whole.
          </p>
        </div>
      </section>

      <section aria-label="How investing works">
        <h2 className="section-title">4 steps to your first contribution</h2>
        <ol className="step-cards">
          {STEPS.map((s) => (
            <li key={s.n} className="step-card">
              <span className="step-num" aria-hidden="true">
                {s.n}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="section-link">
          <a href={routeHash({ name: 'how-it-works' })}>Full investor journey, with each step marked live or planned</a>
        </p>
      </section>

      {latest.length > 0 && (
        <section aria-label="Latest campaigns">
          <div className="registry-bar">
            <h2 className="section-title">Latest campaigns</h2>
            <a className="btn btn-ghost" href={routeHash({ name: 'investments' })}>
              All investments
            </a>
          </div>
          <div className="card-grid">
            {latest.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                profile={profileFor(c, fixtureMode)}
                actor={market.actor}
                busy={market.busy}
                readOnly={fixtureMode}
                amount={market.amounts[c.id] ?? ''}
                onAmount={(v) => market.onAmount(c.id, v)}
                onPrepare={(action) => market.onPrepare(c, action)}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Instrument classes">
        <h2 className="section-title">Instrument classes this design covers</h2>
        <p>
          The platform design covers four participation-side parents (participation right / certificate - with Substanzgenussrecht as a subtype - share,
          indirect participation as an ownership structure, and limited partnership interest) and two debt parents, loan and bond, each issued senior,
          subordinated or with seniority unspecified, plus structure overlays such as zero-coupon and convertible. This prototype implements contract escrow
          only; the classes below are educational.
        </p>
        <div className="instrument-grid">
          {INSTRUMENT_CLASSES.map((c) => (
            <a key={c.id} className="instrument-tile" href={routeHash({ name: 'learn' })}>
              <h3>{c.label}</h3>
              {c.subtypeOf && <p className="instrument-sub">{c.subtypeOf}</p>}
              <p>{c.summary}</p>
            </a>
          ))}
        </div>
      </section>

      <section aria-label="Why this platform">
        <h2 className="section-title">Why this approach</h2>
        <ul className="why-list">
          <li>Funding rules enforced by a public contract, not by platform bookkeeping.</li>
          <li>All-or-nothing protection: contributors sign their own refund if the goal is missed.</li>
          <li>Every transaction is verifiable on a public test network.</li>
          <li>Open design: instrument classes, investor journey and compliance surface documented in the repository.</li>
        </ul>
      </section>
    </>
  );
}
