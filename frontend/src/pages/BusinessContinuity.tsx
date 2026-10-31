import { useI18n } from '../i18n';
import LegalDoc from '../components/LegalDoc';

// Draft v0.1 (2026-10-31) review template, presented as a clearly labeled
// DEMO/DRAFT page. Wording kept faithful to the draft markdown
// (legal/business-continuity.md). Section 1 is factual about the running demo;
// section 2 is design intent, not current practice.
export default function BusinessContinuity() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.businessContinuity}</h1>
      <LegalDoc doc="businessContinuity" />
    </>
  );
}
