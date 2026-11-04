import { useI18n } from '../i18n';

// Persistent testnet/risk notice lives in the footer, not the compact header.
export default function RiskBanner() {
  const { m } = useI18n();
  return (
    <div className="risk-banner" role="note">
      {m.riskBanner}
    </div>
  );
}
