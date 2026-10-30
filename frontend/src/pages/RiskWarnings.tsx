export default function RiskWarnings() {
  return (
    <>
      <h1 className="page-title">Risk warnings</h1>
      <ol className="risk-list">
        <li>
          <h2>Total loss</h2>
          <p>Crowdfunding investments can lose their entire value. Never invest money you cannot afford to lose.</p>
        </li>
        <li>
          <h2>Illiquidity</h2>
          <p>These instruments are usually not tradable. Assume you cannot exit before maturity or a defined event.</p>
        </li>
        <li>
          <h2>Diversification</h2>
          <p>A common guideline is to invest no more than 10% of freely available funds in this asset class and to spread it across issuers.</p>
        </li>
        <li>
          <h2>No protection scheme</h2>
          <p>Crowdfunding investments are not covered by deposit-guarantee or investor-compensation schemes.</p>
        </li>
        <li>
          <h2>No advice</h2>
          <p>Nothing on this site is investment, legal or tax advice. This site is a software prototype on a test network and lists no live offers.</p>
        </li>
        <li>
          <h2>Prototype status</h2>
          <p>Testnet assets are worthless. Smart contracts here are not audited and must not be used with real funds.</p>
        </li>
      </ol>
    </>
  );
}
