export type GlossaryEntry = { term: string; definition: string };

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'All-or-nothing funding',
    definition:
      'The issuer receives the funds only if the goal is reached by the deadline; otherwise contributions are returned. The Soroban contract in this prototype enforces this on-chain.',
  },
  { term: 'Funding threshold', definition: 'The minimum amount an issue must raise to close. Distinct from the per-investor minimum investment.' },
  { term: 'Minimum investment', definition: 'The smallest amount one investor can subscribe, usually one unit.' },
  { term: 'Subordination', definition: 'A ranking rule: subordinated claims are paid only after senior creditors in insolvency, which raises the loss risk.' },
  { term: 'ISIN', definition: 'International Securities Identification Number. Identifies a security. This prototype issues no securities and no ISINs.' },
  {
    term: 'Key investment information sheet (KIIS)',
    definition: 'A standardised short document with the key facts and risks of an offer, required for many EU crowdfunding offers.',
  },
  {
    term: 'Reflection period',
    definition:
      'A window after an investment offer during which certain investors can revoke free of charge where the applicable regime requires it. Length and applicability depend on investor class and regime.',
  },
  {
    term: 'Knowledge test',
    definition: "A check of an investor's understanding of crowdfunding risks that some regimes require before non-sophisticated investors can invest.",
  },
  {
    term: 'Loss-bearing simulation',
    definition: 'An estimate of whether an investor can bear the loss of the investment, required by some regimes for non-sophisticated investors.',
  },
  {
    term: 'ECSPR',
    definition:
      'Regulation (EU) 2020/1503 on European crowdfunding service providers. Authorised providers appear in the ESMA register. This prototype is not an authorised provider.',
  },
  {
    term: 'Escrow',
    definition: 'Funds held by a neutral mechanism until conditions are met. Here the campaign contract itself escrows contributions on Stellar testnet.',
  },
  { term: 'Soroban', definition: 'The smart-contract platform on the Stellar network used by this prototype.' },
  { term: 'Testnet', definition: 'A public test network with worthless assets, used to try software without real money.' },
  { term: 'Nominal value', definition: 'The face value of one unit of an instrument, against which interest and repayment are calculated.' },
  { term: 'Bullet repayment', definition: 'Repayment of the full nominal amount in one payment at maturity.' },
  { term: 'act/act, 30E/360', definition: 'Day-count conventions that define how interest accrues between payment dates.' },
];
