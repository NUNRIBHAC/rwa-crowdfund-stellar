import { useI18n } from '../i18n';

// Persistent testnet/risk notice remains visible above the navigation.
export default function RiskBanner() {
  const { m } = useI18n();
  return (
    <div className="risk-banner" role="note">
      {m.riskBanner}
    </div>
  );
}
