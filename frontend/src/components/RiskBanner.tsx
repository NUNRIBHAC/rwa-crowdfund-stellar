import { useI18n } from '../i18n';

// Persistent risk banner shown on every page, adapted to what this app
// actually is: a testnet prototype with no live offers.
export default function RiskBanner() {
  const { m } = useI18n();
  return (
    <div className="risk-banner" role="note">
      {m.riskBanner}
    </div>
  );
}
