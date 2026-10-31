// Legal document bodies as structured data. One renderer (components/LegalDoc)
// renders every locale's blocks; legalMeta constants are bound through the
// {v} inline variant and are never translated or forked.
// The parity test asserts every locale's block sequence and inline skeleton
// match the English source, and that [DEMO] / bracketed placeholders survive.
export type LegalVar = 'contactEmail' | 'lastUpdated' | 'neonRegion';
export type LegalInline = string | { b: LegalInline[] } | { i: LegalInline[] } | { v: LegalVar };
export type LegalBlock =
  | { t: 'notice'; text: LegalInline[] }
  | { t: 'p'; text: LegalInline[] }
  | { t: 'h2'; text: LegalInline[] }
  | { t: 'ul'; items: LegalInline[][] }
  | { t: 'table'; head: LegalInline[][][]; rows: LegalInline[][][] };

export type LegalDocId =
  'termsOfService' | 'privacyPolicy' | 'riskDisclosure' | 'legalNotice' | 'conflictsOfInterest' | 'complaintsManagement' | 'businessContinuity';
