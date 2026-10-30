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
  {
    term: 'Zero-coupon bond (Zero Bond)',
    definition:
      'A bond with no periodic interest: it is issued below its nominal value and repaid at par, so the return is the difference. A coupon structure, not a seniority.',
  },
  {
    term: 'Convertible bond',
    definition:
      'A bond with a conversion feature: under the issue terms (trigger, window, conversion price) it can convert into shares. A structure overlay on a bond, not a standalone instrument.',
  },
  {
    term: 'Junior debt',
    definition:
      'Platform wording for a lower-rank claim. It indicates subordinated ranking but does not by itself establish contractual qualified subordination.',
  },
  {
    term: 'Qualified subordination',
    definition:
      'A contractual form of subordination under which interest and sometimes principal payments stop when the issuer would become over-indebted. Platform wording such as "qualified" alone does not prove it; the terms must say subordinated.',
  },
  { term: 'Mini Bond', definition: 'Platform label for a small-denomination bond.' },
  {
    term: 'Know your customer (KYC)',
    definition: 'Identity verification that regulated platforms must complete before an investor can invest. This prototype performs no KYC.',
  },
  {
    term: 'Politically exposed person (PEP)',
    definition: 'A person holding a prominent public function, subject to enhanced checks under anti-money-laundering rules.',
  },
  {
    term: 'Digital locker',
    definition:
      'A custody view where a platform shows an investor their held securities, tied to their verified identity. This prototype holds positions in the campaign contract itself, visible per wallet.',
  },
];
