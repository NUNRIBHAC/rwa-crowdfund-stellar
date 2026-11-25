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
      'This policy template describes how Blockallisto intends to identify, prevent, manage and disclose conflicts of interest. Blockallisto today is a prototype demonstration on the Stellar testnet: there are no real investors, issuers, funds or offers, so no actual conflict can arise today. This document is a design artifact prepared against the compliance surfaces of established EU crowdfunding platforms and is ',
      {
        b: ['not'],
      },
      ' a description of a live compliance program.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Why this policy exists'],
  },
  {
    t: 'p',
    text: [
      'Crowdfunding platforms sit between issuers seeking funds and investors providing them. Regulation (EU) 2020/1503 expects authorised platforms to avoid conflicts of interest and, where they cannot be avoided, to manage and disclose them. This template anticipates that expectation.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Potential conflicts considered'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Platform vs investor:'],
        },
        ' the platform earning fees from completed raises could be tempted to admit weak campaigns. Intended mitigation: published admission criteria, documented due-diligence steps per campaign, and fees that do not depend on campaign marketing claims.',
      ],
      [
        {
          b: ['Related parties:'],
        },
        ' the operator, its managers or their close relations acting as issuers or investors. Intended rule: [related parties may not act as issuers on the platform - to be confirmed by legal advice]; any related-party investing, if ever permitted, would be disclosed on the campaign page.',
      ],
      [
        {
          b: ['Proprietary investing:'],
        },
        ' intended rule: the platform does ',
        {
          b: ['not'],
        },
        ' invest in its own campaigns and does not hold contributed funds at any point; settlement flows through [licensed payment service providers - planned, not live].',
      ],
      [
        {
          b: ['Staff incentives:'],
        },
        ' intended rule: no remuneration tied to the funding success of specific campaigns.',
      ],
      [
        {
          b: ['Information asymmetry:'],
        },
        ' issuer-supplied content could mislead. Intended mitigation: key investment information sheets per campaign, a standardised campaign data structure, and clear separation between verified platform data and issuer-supplied content.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['3. Identification, management, disclosure'],
  },
  {
    t: 'p',
    text: [
      "Intended process: (1) conflicts register maintained by [the operator's compliance contact - to be appointed]; (2) assessment before any campaign admission and on any material change; (3) where a conflict cannot be avoided, disclosure to affected users in clear terms before they commit; (4) refusal to operate the conflicting business where avoidance and disclosure are insufficient.",
    ],
  },
  {
    t: 'h2',
    text: ['4. Current status'],
  },
  {
    t: 'p',
    text: [
      'None of the above is operative today. The prototype accepts no real funds, lists no real issuers and pays no fees. This page exists so the intended compliance surface is visible and reviewable before any real launch.',
    ],
  },
];
