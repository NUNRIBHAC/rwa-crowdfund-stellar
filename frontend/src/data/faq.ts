export type FaqEntry = { q: string; a: string };

export const INVESTOR_FAQ: FaqEntry[] = [
  {
    q: 'Is this a real investment platform?',
    a: 'No. This is a technical prototype on Stellar testnet. It lists no live offers, accepts no real funds and is not an authorised crowdfunding service provider. Authorised EU providers are listed in the ESMA register.',
  },
  {
    q: 'What do I need to try it?',
    a: 'Install the Freighter wallet extension, switch it to testnet, fund it with free testnet XLM and testnet USDC from a faucet or friend, then connect it here. Testnet assets are worthless.',
  },
  {
    q: 'How does a contribution work?',
    a: 'You pick a campaign, enter an amount and sign one transaction in Freighter. The Soroban contract escrows your contribution and enforces the funding cap atomically. The app keeps the exact signed transaction so a network error never creates a duplicate.',
  },
  {
    q: 'How do refunds work?',
    a: 'If a campaign misses its goal by the deadline, each contributor signs their own refund transaction. If the goal is met, only the campaign creator can withdraw, and only after the deadline.',
  },
  {
    q: 'What are the risks of real crowdfunding?',
    a: 'Total loss is possible, investments are illiquid, and no deposit guarantee applies. A common rule of thumb is to invest only a small share of freely available funds and to diversify. The risk warnings page covers this in detail.',
  },
  {
    q: 'What is planned but not built yet?',
    a: 'Registration and login, identity verification (KYC), investor categorisation with knowledge test and loss simulation, reflection-period handling, fiat payments, dashboards, document hosting and per-investor limits. The How it works page marks each step as live or planned.',
  },
];

export const ISSUER_FAQ: FaqEntry[] = [
  {
    q: 'Can I list my company today?',
    a: 'No. Issuer onboarding is not open in this prototype. The campaign registry is configured by the operator and currently holds only the demo campaign.',
  },
  {
    q: 'Which financing models does the design cover?',
    a: 'Eight instrument classes: senior bonds, subordinated bonds and loans, convertible bonds, shares, participation certificates (including Substanzgenussrecht as a subtype), indirect participations and limited partnership interests. The Learn hub explains each.',
  },
  {
    q: 'What would a real launch require?',
    a: 'A licence path (own authorisation or a partnership with a licensed provider), a legally recognised register for each instrument and jurisdiction, payment processing through a licensed provider, KYC/AML, and the compliance pages and documents described in the project docs. These are open decisions, not implemented features.',
  },
  {
    q: 'What does it cost?',
    a: 'The prototype runs on free-tier hosting and testnet infrastructure. No fee model for issuers or investors is defined or charged.',
  },
];
