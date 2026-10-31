import { useI18n } from '../i18n';
import LegalDoc from '../components/LegalDoc';

// Reviewed draft v0.2 gen10 (2026-10-31), presented as a clearly labeled DEMO/DRAFT
// template per the founder's instruction (2026-10-31). Keep the wording faithful to
// the reviewed text. The accountable data controller is deliberately UNRESOLVED in
// this demo presentation: the sentence below is part of the reviewed text and must
// stay visible, not be silently filled.
export default function PrivacyPolicy() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.privacyPolicy}</h1>
      <LegalDoc doc="privacyPolicy" />
    </>
  );
}
