// Holding structures: how an investor holds a participation (directly, or
// through a certificate, vehicle or partnership form). A holding structure
// qualifies the underlying instrument; it is never a separate instrument and
// does not change the economics by itself. These identifiers are descriptive
// metadata for issuer applications and campaign presentation. They are NOT a
// claim that any structure is offered, ECSPR-eligible or MiFID-compliant:
// Blockallisto has no registered company and no ECSPR licence, does not issue
// certificates and provides no depositary or custody service, and each
// structure awaits legal analysis before any real offer. The display strings
// live in the frontend i18n dictionaries (frontend/src/i18n/locales/*); keep
// the id lists in sync.
export const HOLDING_STRUCTURE_IDS = ['direct', 'depositary-receipt', 'llp', 'scp', 'lda-quotas', 'anonymous-partnership'] as const;

export type HoldingStructureId = (typeof HOLDING_STRUCTURE_IDS)[number];

export function isHoldingStructureId(value: unknown): value is HoldingStructureId {
  return typeof value === 'string' && (HOLDING_STRUCTURE_IDS as readonly string[]).includes(value);
}
