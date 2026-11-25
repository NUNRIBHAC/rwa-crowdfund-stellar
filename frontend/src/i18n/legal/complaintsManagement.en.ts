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
      'This page explains how to complain about the Blockallisto prototype and how complaints are handled. Blockallisto today is a demo on the Stellar testnet with no real funds involved; the handling process below is real for the demo, while the formal regulatory framework it mirrors applies only to an authorised platform.',
    ],
  },
  {
    t: 'h2',
    text: ['1. How to complain'],
  },
  {
    t: 'p',
    text: [
      'Email ',
      {
        v: 'contactEmail',
      },
      ' with the subject "Complaint". Include: what happened, when, the page or feature involved, and what outcome you are asking for. Complaints are free of charge.',
    ],
  },
  {
    t: 'p',
    text: ['For the prototype there is also a support ticket form on the site; complaints sent there are handled the same way.'],
  },
  {
    t: 'h2',
    text: ['2. What happens next'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Acknowledgement:'],
        },
        ' we confirm receipt within [10 business days - template value].',
      ],
      [
        {
          b: ['Investigation:'],
        },
        ' the operator reviews the complaint against records (page content, contract events, support history). You may be asked for clarification.',
      ],
      [
        {
          b: ['Answer:'],
        },
        ' a reasoned reply within [20 business days - template value] of acknowledgement. If more time is needed, we say so and explain why.',
      ],
      [
        {
          b: ['Record:'],
        },
        ' complaints and outcomes are logged in a complaints register kept for [5 years - template value], containing the complaint, the investigation and the resolution.',
      ],
    ],
  },
  {
    t: 'p',
    text: ['Template timelines are indicative values drawn from common EU platform practice, not legal commitments; final values require legal advice.'],
  },
  {
    t: 'h2',
    text: ['3. If you are not satisfied'],
  },
  {
    t: 'p',
    text: [
      "For the prototype there is no supervisory escalation path, because the operator is not an authorised crowdfunding service provider and no real investment service exists. For a future authorised platform, this section will name the competent authority's complaint channel (in Portugal, the CMVM) and any applicable out-of-court dispute-resolution body before any real offer is made.",
    ],
  },
  {
    t: 'h2',
    text: ['4. Using complaints to improve'],
  },
  {
    t: 'p',
    text: [
      "Recurring complaint themes are reviewed and feed into product and content fixes. The prototype's own roadmap treats complaints data as an input to design changes, not just case-by-case resolution.",
    ],
  },
];
