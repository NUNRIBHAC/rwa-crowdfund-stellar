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
      'This Privacy Policy explains what personal data the Blockallisto prototype (the "Service") processes, why, and what rights you have. The Service is a prototype project operated under the name Blockallisto. The corporate particulars shown for Blockallisto in these documents are fictional demonstration data ([DEMO] legal form "Lda.", [DEMO] registered address "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal", [DEMO] registration number "000 000 000"); the registered legal identity behind the Blockallisto name has not been verified, and naming the project does not by itself identify the accountable data controller. [The controller - the person or entity actually responsible for this processing - is to be confirmed before publication.] Privacy requests are answered at ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Scope: what the demo does not collect'],
  },
  {
    t: 'p',
    text: [
      'The current prototype has ',
      {
        b: ['no KYC, no newsletters and no payments'],
      },
      ". Community sign-in is wallet-based: it uses a Stellar wallet signature, not a password or an email address. We do not ask for your full name, phone number, identity documents or payment card. The community features do collect the data described in section 2b: a public key, an optional display name, free-text content you choose to submit, and an optional contact email on issuer applications. We do not use analytics or advertising trackers, and the site's fonts and assets are self-hosted.",
    ],
  },
  {
    t: 'h2',
    text: ['2. Data we process'],
  },
  {
    t: 'p',
    text: [
      {
        b: ['a) Wallet and contribution data.'],
      },
      ' If you connect a Freighter wallet and make a test contribution, the backend records, in a Postgres database (hosted by Neon), a safety journal containing: your Stellar ',
      {
        b: ['public key'],
      },
      ' (never your secret key), the campaign id, the action, the contribution amount, transaction envelopes, the transaction hash and status, and timestamps. A Stellar public key is pseudonymous data; we do not link it to your identity.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        i: ['Retention:'],
      },
      " unsigned prepared transactions expire after 24 hours; completed or failed transactions are pruned after 30 days; a signed transaction whose outcome is unresolved is kept until it resolves, because deleting it could lose track of a broadcast transaction. Signed envelopes are scrubbed once the transaction reaches a final state. These are the cleanup rules configured in the application's own code: they describe what the application deletes. Our hosting providers' own server logs and backups may keep data for different periods under their own privacy policies, and are not covered by these rules.",
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['b) Community account and community content.'],
      },
      ' If you sign in to the community features, the backend stores, in the same Neon Postgres database: your Stellar ',
      {
        b: ['public key'],
      },
      ', an account creation timestamp, and an optional ',
      {
        b: ['display name'],
      },
      " (up to 40 characters). Sign-in works by signing a one-time server challenge with your wallet (5-minute validity, single use); no password or email is required and your secret key never leaves the wallet. The server keeps only a SHA-256 hash of the session token; the raw token lives in your browser's local storage. Sessions last 30 days, logout deletes the session, and expired challenges and sessions are pruned hourly.",
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Comments'],
      },
      ' are public: each comment stores your public key, your display name if set, the body (up to 1000 characters), the campaign and a timestamp, and the latest 100 comments per campaign are shown to every visitor. A comment hidden by the operator leaves the public list immediately and is hard-deleted 30 days after hiding. ',
      {
        b: ['Support/feedback tickets'],
      },
      ' (kind, subject up to 120 characters, body up to 4000 characters, status, timestamps) and ',
      {
        b: ['issuer applications'],
      },
      " (project name, country, instrument type, target amount, description and an optional contact email) are visible only to your wallet account and to the operator's administrator; both are hard-deleted after 90 days (retention window configurable in the application code). Campaign ",
      {
        b: ['news'],
      },
      ' items are written by the operator and labeled as platform demo content. Your IP address is used in memory for rate limiting and swept within 24 hours; the application does not persist it (hosting logs are covered in item e).',
    ],
  },
  {
    t: 'p',
    text: [
      'A caution: public keys, display names and free-text content can identify you even though we never ask for your name. Do not submit sensitive personal information in community fields.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['c) Public blockchain data.'],
      },
      ' Test contributions are recorded publicly on the Stellar ',
      {
        b: ['testnet'],
      },
      ' and are visible on public explorers. Blockchain records cannot be altered or deleted by us.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['d) Device preferences.'],
      },
      " Your theme (light/dark) and language choices are stored in your browser's local storage. This data stays on your device and is not sent to us.",
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['e) Technical logs.'],
      },
      ' Our hosting provider (Render, Frankfurt region) processes standard server logs (such as IP address and request metadata) to deliver and protect the Service.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Data we plan to process in future versions (not collected today)'],
  },
  {
    t: 'p',
    text: [
      'The indicative design for future versions of Blockallisto - following the compliance surfaces of established EU crowdfunding platforms - is to process additional categories of personal data ',
      {
        b: ['when and if'],
      },
      ' those features launch. Exact categories, providers and thresholds may change with design work and legal advice:',
    ],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Registration data:'],
        },
        ' full name (exactly as on your identity document), email address, country of residence and tax residency.',
      ],
      [
        {
          b: ['Identity verification (KYC/AML):'],
        },
        ' identity-document images, a selfie, mobile number, and verification results, processed with specialised third-party verification providers; for company investors, beneficial owners (typically anyone owning more than 25%) and source of funds; politically-exposed-person (PEP) declarations.',
      ],
      [
        {
          b: ['Payment and payout data:'],
        },
        ' bank account details (such as IBAN) handled by licensed payment service providers, not by us holding client funds.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'With the exception of the optional issuer contact email described in section 2b, none of this data is collected by the current demo. If these features launch, this Policy will be updated first, with the providers, purposes, legal bases and retention periods for each category.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Purposes and legal bases (GDPR)'],
  },
  {
    t: 'p',
    text: [
      'We process the data in section 2 to operate, secure and demonstrate the prototype: preparing and tracking test transactions, preventing double-spends and resolving ambiguous transactions, keeping the Service reliable, and operating the community features (publishing and moderating comments, answering support and feedback tickets, and reviewing issuer applications). The legal basis is our legitimate interest (Art. 6(1)(f) GDPR) in running a safe technical demonstration. We do not use your data for marketing, profiling or sale.',
    ],
  },
  {
    t: 'h2',
    text: ['5. Who processes data'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Render'],
        },
        ' (hosting, Frankfurt, EU) - runs the application.',
      ],
      [
        {
          b: ['Neon'],
        },
        ' (managed Postgres; AWS Europe (Frankfurt) region, EU - verified in the Neon console on ',
        {
          v: 'lastUpdated',
        },
        ') - stores the contribution journal and the community data store.',
      ],
      [
        {
          b: ['Stellar testnet'],
        },
        ' (public network operated by the Stellar Development Foundation, global) - records public test transactions.',
      ],
      [
        {
          b: ['GitHub'],
        },
        ' - hosts the source code (no user data).',
      ],
    ],
  },
  {
    t: 'p',
    text: ['Where processing occurs outside the EU/EEA (for example the global Stellar network), it involves pseudonymous testnet data only.'],
  },
  {
    t: 'h2',
    text: ['6. Your rights under the GDPR'],
  },
  {
    t: 'p',
    text: [
      'You have the right to access, rectify, erase, restrict or object to the processing of your personal data, and to data portability, under Regulation (EU) 2016/679 (GDPR / RGPD). You also have the right to lodge a complaint with the Portuguese supervisory authority, the ',
      {
        b: ['CNPD'],
      },
      ' (Comissao Nacional de Protecao de Dados).',
    ],
  },
  {
    t: 'p',
    text: [
      'We can locate the data tied to you only through your Stellar public key (and any display name or free-text content you chose to submit). Data already written to a public blockchain cannot be erased; we can correct or erase off-chain records (the contribution journal, your community account, comments, tickets and applications) on request, subject to the retention rules in section 2.',
    ],
  },
  {
    t: 'h2',
    text: ['7. Brazil (LGPD)'],
  },
  {
    t: 'p',
    text: [
      "The demo is operated from Portugal. Brazil's Lei Geral de Protecao de Dados (Lei no 13.709/2018 - LGPD) can apply to processing that targets or involves people in Brazil; whether it applies to this prototype is a legal question to be confirmed with counsel. If and to the extent the LGPD applies, it grants you rights over your personal data similar to those above, and you may contact the ANPD (Autoridade Nacional de Protecao de Dados). Use the same contact above for any request.",
    ],
  },
  {
    t: 'h2',
    text: ['8. Security'],
  },
  {
    t: 'p',
    text: [
      "Your wallet keys never leave your Freighter extension; the Service is designed so it cannot access them. The application is served over TLS, and administrative endpoints are disabled by default (fail-closed). No method is absolute, but the prototype's design minimises the data that exists to be attacked.",
    ],
  },
  {
    t: 'h2',
    text: ['9. Children'],
  },
  {
    t: 'p',
    text: ['The Service is a technical demonstration and is not directed at children.'],
  },
  {
    t: 'h2',
    text: ['10. Changes'],
  },
  {
    t: 'p',
    text: [
      'We may update this Policy as the prototype evolves. The "Last updated" date shows the current version. Material changes will be reflected here before they take effect.',
    ],
  },
  {
    t: 'h2',
    text: ['11. Contact'],
  },
  {
    t: 'p',
    text: [
      'Privacy questions and requests: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
];
