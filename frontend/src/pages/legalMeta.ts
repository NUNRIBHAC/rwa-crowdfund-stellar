// Contact and revision metadata are separate from the dated operational evidence.
// Revisions for other legal documents remain in their existing catalog text.
import type { LegalDocId } from '../i18n/legal/types';

export const LEGAL_CONTACT_EMAIL = 'blockallisto@gmail.com';
export const LEGAL_FACTUAL_REVISIONS: Partial<Record<LegalDocId, string>> = {
  privacyPolicy: '2026-11-24',
  businessContinuity: '2026-11-24',
};
export const HOSTING_CONFIGURATION_VERIFIED_ON = '2026-11-19';
export const DATABASE_RESTORE_PROOF_ON = '2026-11-20';

// No current hosting, data-region, backup schedule or recovery guarantee is
// inferred from these historical dates. Unreviewed documents have no fallback
// revision: their own catalog date is preserved.
export function legalRevisionFor(doc: LegalDocId): string {
  return LEGAL_FACTUAL_REVISIONS[doc] ?? '';
}
