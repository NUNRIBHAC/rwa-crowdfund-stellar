export type FaqState = 'live' | 'planned' | 'info';

export type FaqEntry = { q: string; a: string; state: FaqState };

export type FaqCategory = { id: string; title: string; entries: FaqEntry[] };

// State labels follow the same honesty rule as the How it works page:
// "live" describes this testnet prototype as built, "planned" is not
// implemented anywhere in the code, and "info" is general crowdfunding
// background that does not describe this platform.
export const FAQ_STATE_LABELS: Record<FaqState, string> = {
  live: 'Live in prototype',
  planned: 'Planned - not built',
  info: 'General background',
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'about',
    title: 'About this platform',
    entries: [
      {
        q: 'Is this a real investment platform?',
        a: 'No. This is a technical prototype on Stellar testnet. It lists no live offers, accepts no real funds and is not an authorised crowdfunding service provider. Authorised EU providers are listed in the ESMA register.',
        state: 'info',
      },
      {
        q: 'What do I need to try it?',
        a: 'Install the Freighter wallet extension, switch it to testnet, fund it with free testnet XLM and testnet USDC from a faucet or friend, then connect it here. Testnet assets are worthless.',
        state: 'live',
      },
      {
        q: 'Do I need my own wallet?',
        a: 'Yes. This design keeps keys with the user: the Freighter wallet is the only identity and signs every transaction. The platform holds no keys and no balances of its own. Some production platforms instead custody assets through specialised partners; this prototype deliberately does not.',
        state: 'live',
      },
      {
        q: 'Who can invest on a platform like this in production?',
        a: 'A production platform must verify each investor\'s identity (KYC) and, where the regime requires it, test knowledge and simulate loss-bearing capacity before larger amounts. Residence restrictions can also apply. None of that exists here, because testnet funds are worthless.',
        state: 'info',
      },
    ],
  },
  {
    id: 'contributing',
    title: 'Contributing and payments',
    entries: [
      {
        q: 'How does a contribution work?',
        a: 'You pick a campaign, enter an amount and sign one transaction in Freighter. The Soroban contract escrows your contribution and enforces the funding cap atomically. The app keeps the exact signed transaction so a network error never creates a duplicate.',
        state: 'live',
      },
      {
        q: 'Which payment methods can I use?',
        a: 'Only testnet USDC sent through your Freighter wallet. There are no cards, no bank transfers and no fiat at all. A production version would settle through a licensed payment provider with a per-investment reference; that step is planned, not built.',
        state: 'live',
      },
      {
        q: 'Can I contribute more than once to the same campaign?',
        a: 'Yes. Each contribution is its own signed transaction, and the contract checks the remaining room under the funding cap on every one. An amount that would push the campaign past its goal is rejected by the contract, not by platform bookkeeping.',
        state: 'live',
      },
      {
        q: 'What happens when a campaign reaches its goal?',
        a: 'The cap is enforced by the contract, so there is no oversubscription: once the goal is met, further contributions are rejected. After the deadline has passed, the campaign creator can withdraw the escrowed funds.',
        state: 'live',
      },
      {
        q: 'How do I check that my contribution went through?',
        a: 'Connect your wallet and open the campaign page to see the escrowed totals the contract reports. Because settlement is a Stellar testnet transaction, you can also verify it independently on a public testnet explorer.',
        state: 'live',
      },
    ],
  },
  {
    id: 'refunds',
    title: 'Refunds and cancellation',
    entries: [
      {
        q: 'How do refunds work?',
        a: 'If a campaign misses its goal by the deadline, each contributor signs their own refund transaction. If the goal is met, only the campaign creator can withdraw, and only after the deadline.',
        state: 'live',
      },
      {
        q: 'Can I cancel a contribution after signing?',
        a: 'Not in this prototype: a signed testnet transaction is final. Cancellation is a planned step. For comparison, the EU crowdfunding regime gives non-sophisticated investors a reflection period of 4 calendar days to withdraw a binding offer on a real platform.',
        state: 'planned',
      },
      {
        q: 'Who holds the money while a campaign is running?',
        a: 'The Soroban contract itself escrows contributions until the deadline. No operator account can move them: the code allows only a creator withdrawal after a successful deadline, or contributor refunds after a failed one.',
        state: 'live',
      },
    ],
  },
  {
    id: 'tokenization',
    title: 'Tokenization on Stellar',
    entries: [
      {
        q: 'What does tokenization mean here?',
        a: 'Tokenization means representing the rights and obligations of an investment digitally, so ownership and transfers can be recorded and checked on a shared ledger. This prototype takes a first step: contribution records live in a Soroban smart contract on the Stellar test network, enforced by code rather than platform bookkeeping.',
        state: 'info',
      },
      {
        q: 'What does the smart contract actually enforce?',
        a: 'Escrow of contributions, the funding cap on every transaction, the campaign deadline, all-or-nothing settlement (creator withdrawal only after a successful deadline) and contributor-signed refunds after a failed one. What it does not do is covered by the planned steps on the How it works page.',
        state: 'live',
      },
      {
        q: 'Is there a tradable token?',
        a: 'No. Contribution balances in this first contract are deliberately nontransferable. A transferable security token would need a legally recognised register, verified holders and the compliance surface described in the project documents before it could represent a real investment.',
        state: 'planned',
      },
      {
        q: 'Where are my contributions held?',
        a: 'In the contract\'s escrow on the public test network, not with the platform operator. Your wallet keys stay in Freighter on your own device; losing them would lose access to the contribution record, exactly like any self-custody setup.',
        state: 'live',
      },
    ],
  },
  {
    id: 'risks',
    title: 'Risks and eligibility',
    entries: [
      {
        q: 'What are the risks of real crowdfunding?',
        a: 'Total loss is possible, investments are illiquid, and no deposit guarantee applies. A common rule of thumb is to invest only a small share of freely available funds and to diversify. The risk warnings page covers this in detail.',
        state: 'info',
      },
      {
        q: 'Why should investors diversify?',
        a: 'Spreading money across several projects, sectors and instrument types reduces the impact when one project fails. Concentrating everything in a single offer makes the outcome depend on one company.',
        state: 'info',
      },
      {
        q: 'Is this platform regulated?',
        a: 'No. It is not an authorised crowdfunding service provider and lists no live offers. In the EU, crowdfunding providers are authorised under the ECSPR regime and listed in the public ESMA register, which is linked in the footer of every page.',
        state: 'info',
      },
    ],
  },
  {
    id: 'transfers',
    title: 'Transfers and selling',
    entries: [
      {
        q: 'Can I sell, gift or transfer a contribution?',
        a: 'No. Contribution records in this prototype are nontransferable by design. On production platforms, transfers depend on the contractual terms of each instrument, often need issuer consent, and always require the receiving person to be identified. There is no secondary market here.',
        state: 'live',
      },
      {
        q: 'Will transfers be possible later?',
        a: 'Transfers between verified users, and possibly a bulletin-board style marketplace, are planned design steps. They need identity verification and per-instrument contractual rules first, neither of which exists in the code today.',
        state: 'planned',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account and data',
    entries: [
      {
        q: 'Do I need an account?',
        a: 'No. There is no registration, no login and no password. The Freighter wallet is the only identity, and connecting it never shares your keys with the site.',
        state: 'live',
      },
      {
        q: 'What personal data does this prototype collect?',
        a: 'None. No name, email or identity document is asked for. Your browser keeps only a local record of a pending transaction so it cannot be duplicated, and the backend keeps a technical journal of requests. A production platform would have to meet GDPR duties: access, correction, erasure and portability of your data.',
        state: 'live',
      },
    ],
  },
  {
    id: 'documents',
    title: 'Documents and taxes',
    entries: [
      {
        q: 'Where are my contractual documents and receipts?',
        a: 'Nowhere yet: document hosting and a personal portfolio are planned steps. A production platform stores the contractual documents per investment and issues a confirmation once an investment is concluded.',
        state: 'planned',
      },
      {
        q: 'Are taxes deducted from returns?',
        a: 'This prototype pays no returns, so nothing is taxed or withheld. On real platforms the treatment depends on your country of residence, the instrument and the issuer\'s country; some providers withhold tax or issue annual certificates, and the investor stays responsible for correct declaration.',
        state: 'info',
      },
    ],
  },
  {
    id: 'issuers',
    title: 'For companies',
    entries: [
      {
        q: 'Can I list my company today?',
        a: 'No. Issuer onboarding is not open in this prototype. The campaign registry is configured by the operator and currently holds only the demo campaign.',
        state: 'planned',
      },
      {
        q: 'Which financing models does the design cover?',
        a: 'Four participation-side parents - participation right / certificate (with Substanzgenussrecht as a subtype), share, indirect participation as an ownership structure, and limited partnership interest - and two debt parents, loan and bond, each issued senior, subordinated or with seniority unspecified. Zero-coupon and convertible are structure overlays on debt. The Learn hub explains each.',
        state: 'info',
      },
      {
        q: 'How would an issuer receive the funds?',
        a: 'All-or-nothing: the campaign creator can withdraw the escrowed funds only if the goal is met, and only after the deadline. The rule is enforced by the smart contract, not by a platform promise.',
        state: 'live',
      },
      {
        q: 'What would a real launch require?',
        a: 'A licence path (own authorisation or a partnership with a licensed provider), a legally recognised register for each instrument and jurisdiction, payment processing through a licensed provider, KYC/AML, and the compliance pages and documents described in the project docs. These are open decisions, not implemented features.',
        state: 'info',
      },
      {
        q: 'What does it cost?',
        a: 'The prototype runs on free-tier hosting and testnet infrastructure. No fee model for issuers or investors is defined or charged.',
        state: 'info',
      },
    ],
  },
];
