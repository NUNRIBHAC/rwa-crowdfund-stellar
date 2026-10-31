import { useI18n } from '../i18n';
import LegalDoc from '../components/LegalDoc';

// Reviewed draft v0.2 gen10 (2026-10-31), presented as a clearly labeled DEMO/DRAFT
// template per the founder's instruction (2026-10-31). Keep the wording faithful to
// the reviewed text. COUNSEL GATE (from the reviewed draft, section 11 note): before
// any real launch, confirm with counsel which mandatory operator disclosures apply in
// the operator's jurisdiction (imprint/legal-notice or equivalent operator-identification
// duties under Portuguese and EU e-commerce, media or consumer rules) and add whatever
// is required here or on a linked page. No position is taken on whether such a duty
// applies to this prototype service; the DEMO operator particulars shown here are
// illustrative and do not satisfy any such duty.
export default function TermsOfService() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.termsOfService}</h1>
      <LegalDoc doc="termsOfService" />
    </>
  );
}
