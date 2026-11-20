import { useI18n } from '../i18n';
import LegalDoc from '../components/LegalDoc';

// Factual prototype notice, maintained in the legal locale catalogs.
export default function PrivacyPolicy() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.privacyPolicy}</h1>
      <LegalDoc doc="privacyPolicy" />
    </>
  );
}
