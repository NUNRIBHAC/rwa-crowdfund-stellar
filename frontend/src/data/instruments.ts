// Instrument taxonomy presented in the UI. Definitions are our own plain-language
// summaries, written for this prototype; they are educational content, not legal
// or investment advice, and describe no live offer.
export type InstrumentGroupId = 'interest-bearing' | 'participation' | 'mezzanine';

export type InstrumentClass = {
  id: string;
  label: string;
  subtypeOf?: string;
  group: InstrumentGroupId;
  summary: string;
  opportunities: string[];
  risks: string[];
  suitableFor: string;
};

export const INSTRUMENT_GROUPS: { id: InstrumentGroupId; title: string; intro: string }[] = [
  {
    id: 'interest-bearing',
    title: 'Interest-bearing investments',
    intro: 'Debt instruments with a defined interest rate and repayment schedule. Investors rank as creditors.',
  },
  {
    id: 'participation',
    title: 'Company participations',
    intro: "Instruments whose return depends on the issuer's business success: equity and profit-participating rights.",
  },
  {
    id: 'mezzanine',
    title: 'Mezzanine investments',
    intro: 'Hybrid forms between debt and equity, typically subordinated: higher potential return, higher loss risk.',
  },
];

export const INSTRUMENT_CLASSES: InstrumentClass[] = [
  {
    id: 'participation-certificate',
    label: 'Participation certificate',
    group: 'participation',
    summary: 'A securitised right to a profit share and to repayment of the nominal value, without the full governance rights of a shareholder.',
    opportunities: ['Share in profits without buying full equity', 'Often combines a base repayment claim with profit participation'],
    risks: ['Profit share depends entirely on issuer performance', 'Can rank behind ordinary creditors', 'Usually illiquid until maturity'],
    suitableFor: 'Investors who want upside tied to business results and accept equity-like risk.',
  },
  {
    id: 'substanzgenussrecht',
    label: 'Substanzgenussrecht',
    subtypeOf: 'Subtype of participation rights',
    group: 'participation',
    summary:
      'A participation right linked to the issuer\'s asset base ("substance") rather than only its annual profit. Structuring and eligible issuers vary by jurisdiction and statute.',
    opportunities: ["Participation in the issuer's asset value", 'Can be structured for smaller issuers where statutes allow'],
    risks: [
      'Legal form and investor protection differ strongly by jurisdiction',
      'May involve a trustee or vehicle between investor and issuer',
      'Usually illiquid',
    ],
    suitableFor: 'Investors comfortable with bespoke structures who read the exact contract terms first.',
  },
  {
    id: 'share',
    label: 'Share / capital increase',
    group: 'participation',
    summary: 'Direct equity in the issuing company: dividend entitlement and participation in company value, with rights set by the articles.',
    opportunities: ['Full participation in company growth', 'Voting or information rights depending on share class'],
    risks: ['No fixed repayment claim; dividends are not guaranteed', 'Total loss possible', 'Crowdfunding shares are usually not tradable on an exchange'],
    suitableFor: 'Investors with a long horizon who want ownership and accept full entrepreneurial risk.',
  },
  {
    id: 'indirect-participation',
    label: 'Indirect participation',
    group: 'participation',
    summary: 'Investors participate in an SME investment indirectly - for example through a vehicle or trustee - with simplified processing.',
    opportunities: ['Access to deals that would be hard to hold directly', 'Simplified administration through the intermediary structure'],
    risks: ['An extra layer sits between investor and issuer', 'Return depends on issuer performance', 'Terms of the vehicle govern payouts and exit'],
    suitableFor: 'Investors who want participation economics without holding the underlying interest directly.',
  },
  {
    id: 'limited-partnership',
    label: 'Limited partnership interest',
    group: 'participation',
    summary:
      'An interest as limited partner in a partnership: profit and loss participation per the partnership agreement, liability limited to the contribution.',
    opportunities: ['Direct pass-through of partnership results', 'Liability capped at the contribution'],
    risks: [
      'Loss participation can reduce or wipe out the interest',
      'Exit often restricted by the partnership agreement',
      'Tax and reporting duties can be more involved',
    ],
    suitableFor: 'Investors who understand partnership structures and accept entrepreneurial risk.',
  },
  {
    id: 'subordinated-loan',
    label: 'Subordinated loan',
    group: 'mezzanine',
    summary: 'A loan whose claims rank behind senior creditors in insolvency, often profit-participating, with fixed interest components.',
    opportunities: ['Higher interest than senior debt in exchange for the lower rank', 'Fixed schedule is easier to model than equity'],
    risks: ['In insolvency, senior creditors are paid first', 'Profit-participating variants can cut interest in bad years', 'No deposit protection'],
    suitableFor: 'Investors who accept bank-like credit risk without bank-like protection.',
  },
  {
    id: 'subordinated-bond',
    label: 'Subordinated bond',
    group: 'mezzanine',
    summary: 'A securitised subordinated debt instrument: defined interest (sometimes cash vs in-kind variants), defined term, repaid after senior creditors.',
    opportunities: ['Defined coupon and term', 'Variants (cash vs in-kind interest) can offer a higher rate'],
    risks: [
      'Subordination raises loss severity in insolvency',
      'Higher-rate in-kind variants depend on issuer performance and are not guaranteed',
      'No participation in company growth',
    ],
    suitableFor: 'Yield-oriented investors who can bear a total loss and do not need the money back early.',
  },
  {
    id: 'senior-bond',
    label: 'Senior bond',
    group: 'interest-bearing',
    summary:
      'A non-subordinated bond: bondholders rank ahead of subordinated capital and equity in insolvency, with a fixed coupon and repayment at maturity or on a schedule.',
    opportunities: ['Creditor rank ahead of subordinated capital', 'Predictable coupon and repayment calendar'],
    risks: ['Still unsecured unless collateral is stated', 'Issuer default can mean total loss', 'No participation in growth'],
    suitableFor: 'Investors who want the most defensive instrument class crowdfunding typically offers.',
  },
  {
    id: 'convertible-bond',
    label: 'Convertible bond',
    group: 'mezzanine',
    summary:
      'A bond that can convert into shares under configured terms: trigger event, exercise window, conversion price and interest-stop rules are set per issue.',
    opportunities: ['Coupon until conversion, equity upside after', 'Defined fallback (repayment) if conversion does not happen'],
    risks: ['Conversion terms may be unfavourable or never trigger', 'Subordinated ranking is common', 'After conversion the investor holds full equity risk'],
    suitableFor: 'Investors who want debt now with an optional equity path, and who read the conversion terms closely.',
  },
];

export function instrumentLabel(id: string): string {
  return INSTRUMENT_CLASSES.find((c) => c.id === id)?.label ?? id;
}
