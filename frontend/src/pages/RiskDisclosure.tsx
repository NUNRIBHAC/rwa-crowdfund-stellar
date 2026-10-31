import { useI18n } from '../i18n';
import LegalDoc from '../components/LegalDoc';

// Reviewed draft v0.2 (2026-10-31). Keep the wording faithful to the reviewed text.
export default function RiskDisclosure() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.riskDisclosure}</h1>
      <LegalDoc doc="riskDisclosure" />
    </>
  );
}
