import { useI18n } from '../i18n';
import LegalDoc from '../components/LegalDoc';

// Draft v0.1 (2026-10-31) review template, presented as a clearly labeled
// DEMO/DRAFT page. Wording kept faithful to the draft markdown
// (legal/complaints-management.md). The timelines below are template values,
// not commitments; the formal framework they mirror applies only to an
// authorised platform.
export default function ComplaintsManagement() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.complaintsManagement}</h1>
      <LegalDoc doc="complaintsManagement" />
    </>
  );
}
