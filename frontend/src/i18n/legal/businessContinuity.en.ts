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
      'This page describes what keeps the Blockallisto prototype available and recoverable, and what continuity planning is intended for a future authorised platform. The first section is factual about the running demo; the second is design intent, not current practice.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Prototype continuity posture (current)'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['No client assets at risk:'],
        },
        ' the demo holds no money, no client funds and no custody. Contributions are testnet tokens with no monetary value, settled by a Soroban smart contract on the public Stellar testnet. Contract state lives on the testnet ledger, independent of this website.',
      ],
      [
        {
          b: ['Hosting:'],
        },
        " the site and API run on Render's free tier; operational data (transaction journal, community data) lives in a Neon Postgres database on its free tier. Both are third-party services with their own availability properties; no uptime is guaranteed for the demo.",
      ],
      [
        {
          b: ['Backups:'],
        },
        ' [backup schedule and retention to be defined - the free tiers provide no managed backups; testnet contract state is recoverable from the public ledger].',
      ],
      [
        {
          b: ['Staging separation:'],
        },
        ' user-facing demo, a separate staging environment, and disposable database copies are kept apart so testing cannot corrupt the demo.',
      ],
      [
        {
          b: ['If the demo is unavailable:'],
        },
        ' no user loses anything of value. Campaign state remains readable on public Stellar testnet explorers, and contributions remain governed by the contract, not by this site.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. Intended continuity plan for an authorised platform (not live)'],
  },
  {
    t: 'p',
    text: [
      'A real platform handling regulated offers would need, before launch: documented recovery time and recovery point objectives [RTO/RPO values to be set with legal and infrastructure advice]; managed backups with tested restore procedures; a payment-services arrangement in which client funds are never held by the platform, so platform failure cannot strand investor money; an orderly wind-down plan ensuring ongoing campaigns can complete or refund if the platform ceases operating; and communication procedures for incidents affecting users.',
    ],
  },
  {
    t: 'p',
    text: ['None of this is operative today. Publishing it as a template keeps the intended compliance surface visible and reviewable.'],
  },
  {
    t: 'h2',
    text: ['3. Incident contact'],
  },
  {
    t: 'p',
    text: [
      'To report a security or availability incident affecting the prototype: ',
      {
        v: 'contactEmail',
      },
      ', subject "Incident".',
    ],
  },
];
