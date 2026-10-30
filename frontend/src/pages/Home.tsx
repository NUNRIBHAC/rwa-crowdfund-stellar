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
          The platform design covers four participation-side parents (participation right / certificate - with Substanzgenussrecht as a subtype -
          share, indirect participation as an ownership structure, and limited partnership interest) and two debt parents, loan and bond, each
          issued senior, subordinated or with seniority unspecified, plus structure overlays such as zero-coupon and convertible. This prototype
          implements contract escrow only; the classes below are educational.
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
