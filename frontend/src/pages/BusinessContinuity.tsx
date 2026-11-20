import { useI18n } from '../i18n';
import LegalDoc from '../components/LegalDoc';

// Current prototype facts remain separate from non-operative future intent.
export default function BusinessContinuity() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.businessContinuity}</h1>
      <LegalDoc doc="businessContinuity" />
    </>
  );
}
