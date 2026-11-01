// Generated from frontend/i18n-json/ by scripts/i18n-import.mjs.
// Edit the JSON (Weblate) or this file, then run npm run i18n:export / i18n:import to sync.

import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      'Demo template: this page is an illustrative document for the Blockallisto prototype, not legal advice. It has not been reviewed by a lawyer and it is not evidence of any company registration or regulatory authorisation. Company particulars marked [DEMO] are fictional demonstration data.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Last updated:'],
      },
      ' ',
      {
        v: 'lastUpdated',
      },
    ],
  },
  {
    t: 'p',
    text: [
      'These Terms of Service ("Terms") govern your use of the Blockallisto website and demo application (the "Service"), a prototype project operated by Blockallisto ("we", "us"). The corporate particulars shown for Blockallisto in these Terms are fictional demonstration data - legal form "Lda." [DEMO], registered address "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO], registration number "000 000 000" [DEMO]. Blockallisto\'s registered legal name, form, address and registration status have not been verified, and no registration is asserted. Contact: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ['By using the Service you accept these Terms. If you do not agree, do not use the Service.'],
  },
  {
    t: 'h2',
    text: ['1. What Blockallisto is today'],
  },
  {
    t: 'p',
    text: [
      'Blockallisto is a ',
      {
        b: ['prototype demonstration'],
      },
      ' of a tokenized real-world-asset crowdfunding concept, running entirely on the ',
      {
        b: ['Stellar test network (testnet)'],
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ['This means, plainly:'],
  },
  {
    t: 'ul',
    items: [
      [
        'The Service is ',
        {
          b: ['not'],
        },
        ' a crowdfunding platform in the legal sense. We are ',
        {
          b: ['not'],
        },
        ' an authorised crowdfunding service provider under Regulation (EU) 2020/1503 (ECSPR) or any other regime, and we make ',
        {
          b: ['no live offers'],
        },
        ' of any investment.',
      ],
      ['Nothing on the Service is an offer, a solicitation, a recommendation, or investment, legal, tax or financial advice, in any jurisdiction.'],
      [
        'No real money is involved. Contributions on the demo use Stellar ',
        {
          b: ['testnet tokens (test USDC) that have no monetary value'],
        },
        ' and cannot be exchanged for real funds.',
      ],
      [
        'Sample campaigns are fictional illustrations. Issuer identities, valuations, figures and outcomes shown on the demo are ',
        {
          b: ['mock data'],
        },
        ', not real opportunities.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. What the Service lets you do'],
  },
  {
    t: 'ul',
    items: [
      ['Browse and filter sample investment campaigns and read their structured terms.'],
      ['Use the learning hub, glossary and FAQ to understand investment instruments.'],
      [
        'Connect a ',
        {
          b: ['Freighter'],
        },
        ' wallet (a browser extension) and make ',
        {
          b: ['test contributions'],
        },
        ' to the demo campaign on the Stellar testnet.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'Test contributions are handled by a Soroban smart contract with the following behaviour: all-or-nothing funding, payout to the campaign only after its deadline, contributions capped at the campaign target, and balances recorded in the contract. No transferable token is issued.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Planned features (not yet live)'],
  },
  {
    t: 'p',
    text: [
      'Blockallisto is being designed against the compliance surfaces of established EU crowdfunding platforms. Future versions ',
      {
        b: ['may'],
      },
      ' include: full user accounts with email registration (beyond the optional community sign-in); identity verification (KYC/AML), including beneficial-owner and source-of-funds checks for company investors; investor categorisation with an entry knowledge test and a loss-bearing-capacity simulation; a pre-contractual reflection period for non-sophisticated investors; key investment information sheets per campaign; payments processed by licensed payment service providers (never by us holding client funds); complaints management and conflicts-of-interest policies; and jurisdiction-based selling restrictions.',
    ],
  },
  {
    t: 'p',
    text: [
      'None of this exists today. The list above is indicative design direction drawn from our research corpus, not a specification: details, thresholds and whole features may change with design work and legal advice. These features will only launch under updated, legally reviewed terms, and only under the regulatory authorisations they require. Nothing in this section is a commitment to a launch date or a licence.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Eligibility and acceptable use'],
  },
  {
    t: 'p',
    text: [
      'The Service is intended for adults (18+). It is not directed at any person in a jurisdiction where viewing crowdfunding-investment content of this kind would be restricted, and it must not be presented to US persons as an investment opportunity.',
    ],
  },
  {
    t: 'p',
    text: [
      'You agree not to: attack, probe or disrupt the Service or its infrastructure; abuse, scrape at abusive rates, or interfere with other users; misrepresent the demo as a real investment service; or use the Service for anything unlawful.',
    ],
  },
  {
    t: 'h2',
    text: ['5. Your wallet and your keys'],
  },
  {
    t: 'ul',
    items: [
      [
        'Your wallet is ',
        {
          b: ['non-custodial'],
        },
        ': your secret key and recovery phrase stay inside your own Freighter extension. We never see, store, or ask for them.',
      ],
      [
        {
          b: ['Never'],
        },
        ' enter your secret key or recovery phrase on any website, including this one. Anyone asking for it is trying to steal from you.',
      ],
      [
        'Every transaction is signed by you in your wallet. Transactions on the Stellar testnet are recorded publicly and can be viewed on public testnet explorers.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['6. Intellectual property'],
  },
  {
    t: 'p',
    text: [
      'The Service, its content and its code are Copyright (c) 2026 Nuno Ribeiro, all rights reserved. No open-source licence or patent grant is given. You may view and use the demo for evaluation; you may not copy, republish or resell it.',
    ],
  },
  {
    t: 'h2',
    text: ['7. Availability and changes'],
  },
  {
    t: 'p',
    text: [
      'The Service runs on free-tier hosting and may be slow to start, unavailable, changed or withdrawn at any time without notice. Features labelled "not built" (accounts, KYC, fiat payments, investor dashboard) do not exist yet.',
    ],
  },
  {
    t: 'h2',
    text: ['8. Disclaimers and limitation of liability'],
  },
  {
    t: 'p',
    text: [
      'The Service is provided ',
      {
        b: ['"as is" and "as available"'],
      },
      ', without warranties of any kind, express or implied, including accuracy, fitness for a particular purpose, or non-infringement. To the maximum extent permitted by law, we are not liable for any indirect, incidental or consequential damages, or for any loss arising from your use of the Service, your wallet, or the Stellar network. Nothing in these Terms excludes liability that cannot be excluded by law.',
    ],
  },
  {
    t: 'h2',
    text: ['9. Governing law'],
  },
  {
    t: 'p',
    text: [
      'These Terms are governed by the laws of ',
      {
        b: ['Portugal'],
      },
      ' and applicable European Union law, without prejudice to mandatory consumer-protection rules of your country of residence.',
    ],
  },
  {
    t: 'h2',
    text: ['10. Changes to these Terms'],
  },
  {
    t: 'p',
    text: [
      'We may update these Terms at any time. The "Last updated" date shows the current version. Continued use after a change means you accept the new Terms.',
    ],
  },
  {
    t: 'h2',
    text: ['11. Contact'],
  },
  {
    t: 'p',
    text: [
      'Questions about these Terms: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Unresolved operator disclosures:'],
      },
      ' the DEMO operator particulars in these Terms are illustrative and do not satisfy any mandatory operator-identification duty (such as an imprint or legal notice under Portuguese or EU e-commerce, media or consumer rules). Whether such a duty applies to this prototype service has not been determined; any required disclosures will be added here or on a linked page before any real launch.',
    ],
  },
];
