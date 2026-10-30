// Investor and issuer journey. Every step is honestly marked: live in this
// prototype, or planned and not implemented. Nothing planned is made to look live.
type Step = { title: string; text: string; state: 'live' | 'planned' };

const INVESTOR_STEPS: Step[] = [
  {
    title: 'Registration and login',
    text: 'A production platform requires an account with email confirmation and credentials. This prototype has no accounts: the Freighter wallet is the only identity.',
    state: 'planned',
  },
  {
    title: 'Identity verification (KYC)',
    text: 'Document and selfie verification with a verification provider, plus AML data where required. Not implemented; no personal data is collected here.',
    state: 'planned',
  },
  {
    title: 'Investor categorisation',
    text: 'Where the applicable regime requires it: knowledge test and loss-bearing-capacity simulation before investing, with stricter warnings above statutory thresholds.',
    state: 'planned',
  },
  {
    title: 'Discover campaigns',
    text: 'Browse the registry, filter and sort, and read the structured terms on each campaign page.',
    state: 'live',
  },
  {
    title: 'Invest',
    text: 'Connect Freighter, enter an amount and sign one transaction. The contract escrows the contribution and enforces the cap atomically. On a production platform the click is a binding offer to the issuer.',
    state: 'live',
  },
  {
    title: 'Reflection period',
    text: 'Where the applicable regime requires it, covered investors can revoke an offer within a configured period (4 calendar days under the EU regime for non-sophisticated investors). Not implemented; testnet contributions are not offers.',
    state: 'planned',
  },
  {
    title: 'Payment',
    text: 'A production platform settles through a licensed payment provider with per-investment references. Here the Stellar testnet transaction is the settlement, with worthless assets.',
    state: 'live',
  },
  {
    title: 'Dashboard and payouts',
    text: 'A personal dashboard with investment status, documents and interest payouts. Not implemented; contribution records are readable per campaign when the wallet is connected.',
    state: 'planned',
  },
  {
    title: 'Transfers and exit',
    text: 'Transferring positions between verified users, and possibly a bulletin-board marketplace. Contribution records in this prototype are deliberately nontransferable.',
    state: 'planned',
  },
];

const ISSUER_STEPS: Step[] = [
  { title: 'Application and review', text: 'Issuer applies, passes eligibility and document review, and signs the platform terms.', state: 'planned' },
  { title: 'Campaign build', text: 'Instrument terms, thresholds, documents and marketing content are configured and reviewed.', state: 'planned' },
  { title: 'Live campaign', text: 'The demo shows the public campaign page with live on-chain funding state.', state: 'live' },
  { title: 'Settlement', text: 'All-or-nothing: the creator withdraws only if the goal is met by the deadline, enforced by the contract.', state: 'live' },
  {
    title: 'Post-funding duties',
    text: 'Reporting, interest and redemption payments, and a separate issuer-lifecycle status. Not implemented.',
    state: 'planned',
  },
];

function StepList({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <section aria-label={title}>
      <h2 className="section-title">{title}</h2>
      <ol className="journey-list">
        {steps.map((s) => (
          <li key={s.title} className="journey-item">
            <div className="journey-head">
              <h3>{s.title}</h3>
              <span className={`status-chip ${s.state === 'live' ? 'status-funded' : 'status-pending'}`}>
                {s.state === 'live' ? 'Live in prototype' : 'Planned - not built'}
              </span>
            </div>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function HowItWorks() {
  return (
    <>
      <h1 className="page-title">How it works</h1>
      <p>
        The journey a real crowdfunding platform must support, and exactly which parts this prototype already implements. Steps marked planned do not exist in
        the code and nothing on this site pretends they do.
      </p>
      <StepList title="Investor journey" steps={INVESTOR_STEPS} />
      <StepList title="Issuer journey" steps={ISSUER_STEPS} />
    </>
  );
}
