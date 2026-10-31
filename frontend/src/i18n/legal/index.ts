// Registry + resolver for legal document bodies. A missing per-locale file
// falls back to English; the resolver reports the ACTUALLY rendered language
// so the wrapper can set correct lang/dir (an English fallback under an
// Arabic UI must not be labeled Arabic).
import type { Locale } from '../index';
import type { LegalBlock, LegalDocId } from './types';
import { blocks as termsOfServiceEn } from './termsOfService.en';
import { blocks as privacyPolicyEn } from './privacyPolicy.en';
import { blocks as riskDisclosureEn } from './riskDisclosure.en';
import { blocks as legalNoticeEn } from './legalNotice.en';
import { blocks as conflictsOfInterestEn } from './conflictsOfInterest.en';
import { blocks as complaintsManagementEn } from './complaintsManagement.en';
import { blocks as businessContinuityEn } from './businessContinuity.en';

type PerLocale = { en: LegalBlock[] } & Partial<Record<Locale, LegalBlock[]>>;

export const LEGAL_REGISTRY: Record<LegalDocId, PerLocale> = {
  termsOfService: { en: termsOfServiceEn },
  privacyPolicy: { en: privacyPolicyEn },
  riskDisclosure: { en: riskDisclosureEn },
  legalNotice: { en: legalNoticeEn },
  conflictsOfInterest: { en: conflictsOfInterestEn },
  complaintsManagement: { en: complaintsManagementEn },
  businessContinuity: { en: businessContinuityEn },
};

export function legalBlocks(doc: LegalDocId, locale: Locale): { blocks: LegalBlock[]; renderedLocale: Locale } {
  const per = LEGAL_REGISTRY[doc];
  const translated = per[locale];
  if (translated) return { blocks: translated, renderedLocale: locale };
  return { blocks: per.en, renderedLocale: 'en' };
}
