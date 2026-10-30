// Instrument taxonomy presented in the UI. Definitions are our own plain-language
// summaries, written for this prototype; they are educational content, not legal
// or investment advice, and describe no live offer.
//
// Model: four participation-side parents and two debt parents (loan and bond),
// each debt parent issued senior, subordinated or with seniority unspecified.
// Zero-coupon and convertible are structure overlays that combine with a debt
// parent and never stand alone. "Junior", "qualified/qualifiziert" and "Mini
// Bond" are rank and label qualifiers found in platform wording.
export type InstrumentGroupId = 'participation' | 'debt';

export type SeniorityState = 'senior' | 'subordinated' | 'unspecified';

export type InstrumentClass = {
  id: string;
  label: string;
  subtypeOf?: string;
  note?: string;
  group: InstrumentGroupId;
  seniorityStates?: SeniorityState[];
  summary: string;
  opportunities: string[];
  risks: string[];
  suitableFor: string;
};

export type StructureOverlay = { id: string; label: string; summary: string };
export type LabelQualifier = { id: string; label: string; summary: string };

export const INSTRUMENT_GROUPS: { id: InstrumentGroupId; title: string; intro: string }[] = [
  {
    id: 'participation',
    title: 'Participation instruments',
    intro:
      "Instruments whose return depends on the issuer's business success: profit-participating rights and equity. Indirect participation is listed here as an ownership structure, not as a separate instrument.",
  },
  {
    id: 'debt',
    title: 'Debt instruments',
    intro:
      'Two generic parents - loan and bond - each issued in one of three seniority states: senior, subordinated, or seniority unspecified. Investors rank as creditors.',
  },
];

export const SENIORITY_LABELS: Record<SeniorityState, string> = {
  senior: 'Senior (non-subordinated)',
  subordinated: 'Subordinated (ranks behind senior creditors in insolvency)',
  unspecified: 'Seniority unspecified in the terms',
};

export const INSTRUMENT_CLASSES: InstrumentClass[] = [
  {
    id: 'participation-certificate',
    label: 'Participation right / certificate',
    group: 'participation',
    summary:
      'A right (often securitised as a participation certificate) to a profit share and to repayment of the nominal value, without the full governance rights of a shareholder.',
    opportunities: ['Share in profits without buying full equity', 'Often combines a base repayment claim with profit participation'],
    risks: ['Profit share depends entirely on issuer performance', 'Can rank behind ordinary creditors', 'Usually illiquid until maturity'],
    suitableFor: 'Investors who want upside tied to business results and accept equity-like risk.',
  },
  {
    id: 'substanzgenussrecht',
    label: 'Substanzgenussrecht',
    subtypeOf: 'Subtype of participation right / certificate',
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
    label: 'Share',
    note: 'A capital increase is the corporate action that creates new shares; it is not a separate instrument.',
    group: 'participation',
    summary:
      'Direct equity in the issuing company: dividend entitlement and participation in company value, with rights set by the articles. New shares reach investors through a capital increase.',
    opportunities: ['Full participation in company growth', 'Voting or information rights depending on share class'],
    risks: ['No fixed repayment claim; dividends are not guaranteed', 'Total loss possible', 'Crowdfunding shares are usually not tradable on an exchange'],
    suitableFor: 'Investors with a long horizon who want ownership and accept full entrepreneurial risk.',
  },
  {
    id: 'indirect-participation',
    label: 'Indirect participation',
    note: 'An ownership structure, not a distinct instrument: the investor holds the underlying participation through a vehicle or trustee, and the underlying interest decides the economics.',
    group: 'participation',
    summary:
      'Investors participate in an SME investment indirectly - for example through a vehicle or trustee - with simplified processing.',
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
    id: 'loan',
    label: 'Loan',
    group: 'debt',
    seniorityStates: ['senior', 'subordinated', 'unspecified'],
    summary:
      'A direct loan to the issuer with a defined interest rate and repayment schedule. The same loan parent can be senior, subordinated (including profit-participating variants), or leave seniority unspecified.',
    opportunities: ['Fixed schedule is easier to model than equity', 'Subordinated variants pay higher interest in exchange for the lower rank'],
    risks: ['Issuer default can mean total loss', 'Subordinated claims are paid only after senior creditors in insolvency', 'No deposit protection'],
    suitableFor: 'Investors who accept credit risk without bank-like protection.',
  },
  {
    id: 'bond',
    label: 'Bond',
    group: 'debt',
    seniorityStates: ['senior', 'subordinated', 'unspecified'],
    summary:
      'A securitised debt instrument with a defined coupon and term. Issued senior (non-subordinated), subordinated (including explicitly subordinated qualified bonds and subordinated Mini Bonds), or with seniority unspecified.',
    opportunities: ['Defined coupon and repayment calendar', 'Senior issues rank ahead of subordinated capital and equity in insolvency'],
    risks: [
      'Subordination raises loss severity in insolvency',
      'Still unsecured unless collateral is stated',
      'No participation in company growth',
    ],
    suitableFor: 'Yield-oriented investors who can bear a total loss and do not need the money back early.',
  },
];

export const STRUCTURE_OVERLAYS: StructureOverlay[] = [
  {
    id: 'zero-coupon',
    label: 'Zero-coupon (Zero Bond)',
    summary:
      'A coupon structure on a loan or bond, not a seniority: no periodic interest; the return comes from issuance below nominal value and repayment at par. Combines with a debt parent, never stands alone.',
  },
  {
    id: 'convertible',
    label: 'Convertible',
    summary:
      'A conversion feature on a bond: under configured terms (trigger event, exercise window, conversion price, interest-stop rules) the bond converts into shares. Combines with the bond parent, never stands alone.',
  },
];

export const LABEL_QUALIFIERS: LabelQualifier[] = [
  {
    id: 'junior',
    label: '"Junior"',
    summary:
      'A lower-rank label in platform wording. It indicates subordinated ranking but does not by itself establish contractual qualified subordination.',
  },
  {
    id: 'qualified',
    label: '"Qualified / qualifiziert"',
    summary:
      'Platform wording found on loans and bonds. On bonds, do not read it as qualified subordination unless the terms themselves say subordinated.',
  },
  {
    id: 'mini-bond',
    label: '"Mini Bond"',
    summary: 'Platform label for a small-denomination bond.',
  },
];

export function instrumentLabel(id: string): string {
  return INSTRUMENT_CLASSES.find((c) => c.id === id)?.label ?? id;
}

export function seniorityLabel(state: SeniorityState): string {
  return SENIORITY_LABELS[state];
}

// Short display label for chips and fact grids, e.g. "Senior bond" or
// "Convertible bond (seniority unspecified)".
export function composeInstrumentLabel(classId: string, seniority?: SeniorityState, overlays: string[] = []): string {
  const base = instrumentLabel(classId);
  const parts: string[] = [];
  if (overlays.includes('zero-coupon')) parts.push('Zero-coupon');
  if (overlays.includes('convertible')) parts.push('Convertible');
  if (seniority === 'senior') parts.push('Senior');
  if (seniority === 'subordinated') parts.push('Subordinated');
  const label = parts.length > 0 ? `${parts.join(' ')} ${base.toLowerCase()}` : base;
  return seniority === 'unspecified' ? `${label} (seniority unspecified)` : label;
}
