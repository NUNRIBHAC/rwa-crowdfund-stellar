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
    t: 'h2',
    text: ["Read this first: today's demo involves no real money"],
  },
  {
    t: 'p',
    text: [
      'Blockallisto is currently a ',
      {
        b: ['prototype on the Stellar testnet'],
      },
      '. All contributions use test tokens with ',
      {
        b: ['no monetary value'],
      },
      '. You cannot lose real money on this demo, and nothing on it is a real investment opportunity.',
    ],
  },
  {
    t: 'p',
    text: [
      'The warnings below explain the risks that ',
      {
        b: ['would'],
      },
      ' apply to the kind of investing Blockallisto demonstrates - crowdfunding into real-world assets through crypto-asset infrastructure. They are published now so that the risk conversation is part of the product from day one.',
    ],
  },
  {
    t: 'h2',
    text: ['General warning'],
  },
  {
    t: 'p',
    text: [
      'Investing in crowdfunding projects - whether in real-world assets such as property or businesses, or through crypto-assets and tokens - is ',
      {
        b: ['high risk'],
      },
      '. You could lose ',
      {
        b: ['all of the money you invest'],
      },
      '. Such investments are typically ',
      {
        b: ['not covered'],
      },
      ' by deposit-guarantee schemes or investor-compensation schemes.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Never invest money you cannot afford to lose.'],
      },
      " For a sense of scale, the reference platforms in our research corpus carry concrete diversification guidance: CONDA's risk-warnings page advises investing no more than about 10% of your freely available funds in this asset class, and the standard Austrian crowdfunding investor sheet (AltFG regime, observed on dagobertinvest) warns against investing more than 10% of net assets. This is the observed risk-communication practice of established platforms, cited as a reference point - it is not a rule of law that applies to this demo, and not a guarantee that any percentage is safe for your situation. Spreading a smaller amount across several projects reduces, but never removes, the risk of total loss.",
    ],
  },
  {
    t: 'h2',
    text: ['Specific risks'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Capital loss.'],
        },
        ' The project you back may fail, underperform or become worthless. Issuers can and do become insolvent after successful fundraises. Returns are never guaranteed.',
      ],
      [
        {
          b: ['Illiquidity.'],
        },
        " Crowdfunded and tokenized positions can be hard or impossible to sell. There may be no secondary market, transfers can require the issuer's or platform's consent and a verified recipient, and you may have to hold until the project ends - or longer. (On the current prototype no transferable token exists at all.)",
      ],
      [
        {
          b: ['Subordination.'],
        },
        ' Subordinated or "junior" instruments rank behind other creditors; with qualified subordination you may receive nothing while the issuer is over-indebted, and interest or repayment claims can be suspended entirely.',
      ],
      [
        {
          b: ['Term and extension risk.'],
        },
        ' Loans and bonds may be extended beyond their stated term under their contracts, delaying repayment.',
      ],
      [
        {
          b: ['Valuation risk.'],
        },
        ' Real-world assets are hard to value; stated valuations may be wrong or stale. (On this demo, all valuations and issuer identities are mock data.)',
      ],
      [
        {
          b: ['Smart-contract risk.'],
        },
        ' Code can contain bugs or be exploited, and transactions on a blockchain are generally irreversible.',
      ],
      [
        {
          b: ['Network risk.'],
        },
        " Blockchain networks can suffer congestion, outages, forks or protocol changes outside anyone's control.",
      ],
      [
        {
          b: ['Key and wallet risk.'],
        },
        " If you lose your wallet's secret key or recovery phrase, or someone steals them, your funds are gone and no one can restore them.",
      ],
      [
        {
          b: ['Regulatory risk.'],
        },
        ' Rules for crowdfunding (ECSPR in the EU) and crypto-assets (MiCA) are evolving. A structure that is possible today may change, and offerings may be restricted where you live.',
      ],
      [
        {
          b: ['Volatility and currency risk.'],
        },
        ' Crypto-asset prices can move sharply; stablecoins can de-peg; exchange rates move.',
      ],
      [
        {
          b: ['Counterparty and fraud risk.'],
        },
        ' Issuers may mismanage funds or misrepresent their projects. Platform checks reduce but cannot eliminate this.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['About investor protections and this prototype'],
  },
  {
    t: 'p',
    text: [
      'The prototype includes demo investor categorisation, a knowledge test and loss simulation; real-data collection remains restricted. These screens are not legally validated protections. No real investment is possible, and no legally effective reflection period is active. Any regulated service would need separate legal review and authorisations. These mechanisms do not remove investment risk.',
    ],
  },
  {
    t: 'h2',
    text: ['No advice'],
  },
  {
    t: 'p',
    text: [
      'Nothing on this Service is investment, legal or tax advice, or a recommendation to buy or sell anything. Past performance - real or simulated - does not predict future results. Consider independent professional advice, and diversify: do not concentrate your savings in any single project or asset type.',
    ],
  },
  {
    t: 'h2',
    text: ['Acknowledgement'],
  },
  {
    t: 'p',
    text: [
      'By using this demo you acknowledge that you have read and understood this Risk Disclosure. Before any future real launch, a fuller, legally reviewed risk statement will apply.',
    ],
  },
];
