import { routeHash } from '../router';
import FundingBlock from './FundingBlock';

type Props = { mode: 'live' | 'sample' | 'unknown' };

export default function Hero({ mode }: Props) {
  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="hero-eyebrow">Tokenized real-world assets, on Stellar</p>
          <h1>
            Real assets. <span className="hero-accent">Shared possibilities.</span>
          </h1>
          <p className="hero-sub">
            Blockallisto is all-or-nothing crowdfunding enforced by a Soroban contract: every contribution is escrowed on Stellar and the funding-cap check
            executes in the same atomic transaction. The creator withdraws only if the goal is met by the deadline, otherwise every contributor signs their own
            refund. From Portugal to the world.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={routeHash({ name: 'investments' })}>
              Browse campaigns
            </a>
            <a className="btn btn-outline" href={routeHash({ name: 'how-it-works' })}>
              How it works
            </a>
          </div>
          <p className="hero-note">
            <strong>Stellar testnet prototype - no real funds.</strong>{' '}
            {mode === 'live' &&
              'Every campaign below is a live Soroban contract on Stellar testnet. Not audited, not production-ready. Hosted on a free tier: the first request after idle can take up to a minute while the instance wakes.'}
            {mode === 'sample' && 'The campaigns below are fixtures, not deployed contracts. Not audited, not production-ready.'}
            {mode === 'unknown' && 'Not audited, not production-ready.'}
          </p>
        </div>
        <FundingBlock />
      </div>
      <p className="hero-unavailable">
        Not available in this prototype: identity/KYC onboarding, secondary-market trading, transferable asset or receipt tokens, fiat payments, live investment
        offers. Contribution records are nontransferable - this is crowdfunding, not an investment exchange.
      </p>
    </section>
  );
}
