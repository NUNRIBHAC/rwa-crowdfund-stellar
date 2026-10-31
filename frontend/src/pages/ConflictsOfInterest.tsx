import { useI18n } from '../i18n';
import LegalDoc from '../components/LegalDoc';

// Draft v0.1 (2026-10-31) review template, presented as a clearly labeled
// DEMO/DRAFT page. Wording kept faithful to the draft markdown
// (legal/conflicts-of-interest.md). A conflicts-of-interest policy only becomes
// operative for an authorised platform; this describes intended policy, not
// current practice.
export default function ConflictsOfInterest() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.conflictsOfInterest}</h1>
      <LegalDoc doc="conflictsOfInterest" />
    </>
  );
}
