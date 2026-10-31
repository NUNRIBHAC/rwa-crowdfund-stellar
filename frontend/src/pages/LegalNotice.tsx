import { useI18n } from '../i18n';
import LegalDoc from '../components/LegalDoc';

// Draft v0.1 (2026-10-31) review template, presented as a clearly labeled
// DEMO/DRAFT page. Wording kept faithful to the draft markdown
// (legal/legal-notice.md). Operator particulars marked [DEMO] are fictional
// demonstration data; a qualified lawyer should review before any real
// (mainnet) launch.
export default function LegalNotice() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.legalNotice}</h1>
      <LegalDoc doc="legalNotice" />
    </>
  );
}
