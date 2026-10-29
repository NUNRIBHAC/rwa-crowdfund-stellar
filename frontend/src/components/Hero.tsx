export default function Hero() {
  return (
    <section className="hero">
      <h1>All-or-nothing crowdfunding, enforced by a Soroban contract</h1>
      <p className="hero-sub">
        Each campaign is a contract on Stellar testnet. Contributions and the funding-cap
        check execute in one atomic transaction: the creator withdraws only if the goal is
        met by the deadline, otherwise every contributor signs their own refund. Contribution
        records are nontransferable - this is crowdfunding, not an investment exchange.
      </p>
      <div className="hero-badges">
        <span className="badge">Contract escrow</span>
        <span className="badge">Atomic cap enforcement</span>
        <span className="badge">Contributor-signed refunds</span>
        <span className="badge">Nontransferable records</span>
      </div>
      <p className="hero-note">
        Testnet demo. Every campaign shown is a live Soroban contract on Stellar
        testnet. Not audited, not production-ready, no real funds.
      </p>
      <p className="hero-unavailable">
        Not available in this prototype: identity/KYC onboarding, secondary-market trading,
        transferable asset or receipt tokens, fiat payments, live investment offers.
      </p>
    </section>
  );
}
