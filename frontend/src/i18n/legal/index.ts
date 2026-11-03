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
import { blocks as termsOfServicept } from './termsOfService.pt';
import { blocks as termsOfServicees } from './termsOfService.es';
import { blocks as termsOfServicefr } from './termsOfService.fr';
import { blocks as termsOfServicede } from './termsOfService.de';
import { blocks as termsOfServicezhCN } from './termsOfService.zh-CN';
import { blocks as termsOfServicezhTW } from './termsOfService.zh-TW';
import { blocks as termsOfServiceja } from './termsOfService.ja';
import { blocks as termsOfServiceko } from './termsOfService.ko';
import { blocks as termsOfServicear } from './termsOfService.ar';
import { blocks as termsOfServicehi } from './termsOfService.hi';
import { blocks as privacyPolicypt } from './privacyPolicy.pt';
import { blocks as privacyPolicyes } from './privacyPolicy.es';
import { blocks as privacyPolicyfr } from './privacyPolicy.fr';
import { blocks as privacyPolicyde } from './privacyPolicy.de';
import { blocks as privacyPolicyzhCN } from './privacyPolicy.zh-CN';
import { blocks as privacyPolicyzhTW } from './privacyPolicy.zh-TW';
import { blocks as privacyPolicyja } from './privacyPolicy.ja';
import { blocks as privacyPolicyko } from './privacyPolicy.ko';
import { blocks as privacyPolicyar } from './privacyPolicy.ar';
import { blocks as privacyPolicyhi } from './privacyPolicy.hi';
import { blocks as riskDisclosurept } from './riskDisclosure.pt';
import { blocks as riskDisclosurees } from './riskDisclosure.es';
import { blocks as riskDisclosurefr } from './riskDisclosure.fr';
import { blocks as riskDisclosurede } from './riskDisclosure.de';
import { blocks as riskDisclosurezhCN } from './riskDisclosure.zh-CN';
import { blocks as riskDisclosurezhTW } from './riskDisclosure.zh-TW';
import { blocks as riskDisclosureja } from './riskDisclosure.ja';
import { blocks as riskDisclosureko } from './riskDisclosure.ko';
import { blocks as riskDisclosurear } from './riskDisclosure.ar';
import { blocks as riskDisclosurehi } from './riskDisclosure.hi';
import { blocks as legalNoticept } from './legalNotice.pt';
import { blocks as legalNoticees } from './legalNotice.es';
import { blocks as legalNoticefr } from './legalNotice.fr';
import { blocks as legalNoticede } from './legalNotice.de';
import { blocks as legalNoticezhCN } from './legalNotice.zh-CN';
import { blocks as legalNoticezhTW } from './legalNotice.zh-TW';
import { blocks as legalNoticeja } from './legalNotice.ja';
import { blocks as legalNoticeko } from './legalNotice.ko';
import { blocks as legalNoticear } from './legalNotice.ar';
import { blocks as legalNoticehi } from './legalNotice.hi';
import { blocks as conflictsOfInterestpt } from './conflictsOfInterest.pt';
import { blocks as conflictsOfInterestes } from './conflictsOfInterest.es';
import { blocks as conflictsOfInterestfr } from './conflictsOfInterest.fr';
import { blocks as conflictsOfInterestde } from './conflictsOfInterest.de';
import { blocks as conflictsOfInterestzhCN } from './conflictsOfInterest.zh-CN';
import { blocks as conflictsOfInterestzhTW } from './conflictsOfInterest.zh-TW';
import { blocks as conflictsOfInterestja } from './conflictsOfInterest.ja';
import { blocks as conflictsOfInterestko } from './conflictsOfInterest.ko';
import { blocks as conflictsOfInterestar } from './conflictsOfInterest.ar';
import { blocks as conflictsOfInteresthi } from './conflictsOfInterest.hi';
import { blocks as complaintsManagementpt } from './complaintsManagement.pt';
import { blocks as complaintsManagementes } from './complaintsManagement.es';
import { blocks as complaintsManagementfr } from './complaintsManagement.fr';
import { blocks as complaintsManagementde } from './complaintsManagement.de';
import { blocks as complaintsManagementzhCN } from './complaintsManagement.zh-CN';
import { blocks as complaintsManagementzhTW } from './complaintsManagement.zh-TW';
import { blocks as complaintsManagementja } from './complaintsManagement.ja';
import { blocks as complaintsManagementko } from './complaintsManagement.ko';
import { blocks as complaintsManagementar } from './complaintsManagement.ar';
import { blocks as complaintsManagementhi } from './complaintsManagement.hi';
import { blocks as businessContinuitypt } from './businessContinuity.pt';
import { blocks as businessContinuityes } from './businessContinuity.es';
import { blocks as businessContinuityfr } from './businessContinuity.fr';
import { blocks as businessContinuityde } from './businessContinuity.de';
import { blocks as businessContinuityzhCN } from './businessContinuity.zh-CN';
import { blocks as businessContinuityzhTW } from './businessContinuity.zh-TW';
import { blocks as businessContinuityja } from './businessContinuity.ja';
import { blocks as businessContinuityko } from './businessContinuity.ko';
import { blocks as businessContinuityar } from './businessContinuity.ar';
import { blocks as businessContinuityhi } from './businessContinuity.hi';

type PerLocale = { en: LegalBlock[] } & Partial<Record<Locale, LegalBlock[]>>;

export const LEGAL_REGISTRY: Record<LegalDocId, PerLocale> = {
  termsOfService: {
    en: termsOfServiceEn,
    pt: termsOfServicept,
    es: termsOfServicees,
    fr: termsOfServicefr,
    de: termsOfServicede,
    'zh-CN': termsOfServicezhCN,
    'zh-TW': termsOfServicezhTW,
    ja: termsOfServiceja,
    ko: termsOfServiceko,
    ar: termsOfServicear,
    hi: termsOfServicehi,
  },
  privacyPolicy: {
    en: privacyPolicyEn,
    pt: privacyPolicypt,
    es: privacyPolicyes,
    fr: privacyPolicyfr,
    de: privacyPolicyde,
    'zh-CN': privacyPolicyzhCN,
    'zh-TW': privacyPolicyzhTW,
    ja: privacyPolicyja,
    ko: privacyPolicyko,
    ar: privacyPolicyar,
    hi: privacyPolicyhi,
  },
  riskDisclosure: {
    en: riskDisclosureEn,
    pt: riskDisclosurept,
    es: riskDisclosurees,
    fr: riskDisclosurefr,
    de: riskDisclosurede,
    'zh-CN': riskDisclosurezhCN,
    'zh-TW': riskDisclosurezhTW,
    ja: riskDisclosureja,
    ko: riskDisclosureko,
    ar: riskDisclosurear,
    hi: riskDisclosurehi,
  },
  legalNotice: {
    en: legalNoticeEn,
    pt: legalNoticept,
    es: legalNoticees,
    fr: legalNoticefr,
    de: legalNoticede,
    'zh-CN': legalNoticezhCN,
    'zh-TW': legalNoticezhTW,
    ja: legalNoticeja,
    ko: legalNoticeko,
    ar: legalNoticear,
    hi: legalNoticehi,
  },
  conflictsOfInterest: {
    en: conflictsOfInterestEn,
    pt: conflictsOfInterestpt,
    es: conflictsOfInterestes,
    fr: conflictsOfInterestfr,
    de: conflictsOfInterestde,
    'zh-CN': conflictsOfInterestzhCN,
    'zh-TW': conflictsOfInterestzhTW,
    ja: conflictsOfInterestja,
    ko: conflictsOfInterestko,
    ar: conflictsOfInterestar,
    hi: conflictsOfInteresthi,
  },
  complaintsManagement: {
    en: complaintsManagementEn,
    pt: complaintsManagementpt,
    es: complaintsManagementes,
    fr: complaintsManagementfr,
    de: complaintsManagementde,
    'zh-CN': complaintsManagementzhCN,
    'zh-TW': complaintsManagementzhTW,
    ja: complaintsManagementja,
    ko: complaintsManagementko,
    ar: complaintsManagementar,
    hi: complaintsManagementhi,
  },
  businessContinuity: {
    en: businessContinuityEn,
    pt: businessContinuitypt,
    es: businessContinuityes,
    fr: businessContinuityfr,
    de: businessContinuityde,
    'zh-CN': businessContinuityzhCN,
    'zh-TW': businessContinuityzhTW,
    ja: businessContinuityja,
    ko: businessContinuityko,
    ar: businessContinuityar,
    hi: businessContinuityhi,
  },
};

export function legalBlocks(doc: LegalDocId, locale: Locale): { blocks: LegalBlock[]; renderedLocale: Locale } {
  // The older nine translations predate real email-account processing.
  // Until updated, use truthful English content with its real language tag.
  if (doc === 'privacyPolicy' && locale !== 'en' && locale !== 'pt') return { blocks: privacyPolicyEn, renderedLocale: 'en' };
  const per = LEGAL_REGISTRY[doc];
  const translated = per[locale];
  if (translated) return { blocks: translated, renderedLocale: locale };
  return { blocks: per.en, renderedLocale: 'en' };
}
