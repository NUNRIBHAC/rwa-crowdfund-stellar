// Persistent risk banner shown on every page, adapted to what this app
// actually is: a testnet prototype with no live offers.
export default function RiskBanner() {
  return (
    <div className="risk-banner" role="note">
      Crowdfunding investments carry a risk of total loss. This is a Stellar testnet prototype: no live offers, no real funds, no investment advice.
    </div>
  );
}
