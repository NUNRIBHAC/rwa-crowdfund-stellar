import { useI18n } from '../i18n';
import { LEGAL_LAST_UPDATED } from './legalMeta';

// Reviewed draft v0.2 (2026-10-31). Keep the wording faithful to the reviewed text.
export default function RiskDisclosure() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.riskDisclosure}</h1>
      <p className="legal-demo-notice">
        Demo template: this page is an illustrative document for the Blockallisto prototype, not legal advice. It has not been reviewed by a lawyer and it is
        not evidence of any company registration or regulatory authorisation. Company particulars marked [DEMO] are fictional demonstration data.
      </p>
      {LEGAL_LAST_UPDATED ? (
        <p>
          <strong>Last updated:</strong> {LEGAL_LAST_UPDATED}
        </p>
      ) : null}
      <h2>Read this first: today's demo involves no real money</h2>
      <p>
        Blockallisto is currently a <strong>prototype on the Stellar testnet</strong>. All contributions use test tokens with <strong>no monetary value</strong>
        . You cannot lose real money on this demo, and nothing on it is a real investment opportunity.
      </p>
      <p>
        The warnings below explain the risks that <strong>would</strong> apply to the kind of investing Blockallisto demonstrates - crowdfunding into real-world
        assets through crypto-asset infrastructure. They are published now so that the risk conversation is part of the product from day one.
      </p>
      <h2>General warning</h2>
      <p>
        Investing in crowdfunding projects - whether in real-world assets such as property or businesses, or through crypto-assets and tokens - is{' '}
        <strong>high risk</strong>. You could lose <strong>all of the money you invest</strong>. Such investments are typically <strong>not covered</strong> by
        deposit-guarantee schemes or investor-compensation schemes.
      </p>
      <p>
        <strong>Never invest money you cannot afford to lose.</strong> For a sense of scale, the reference platforms in our research corpus carry concrete
        diversification guidance: CONDA's risk-warnings page advises investing no more than about 10% of your freely available funds in this asset class, and
        the standard Austrian crowdfunding investor sheet (AltFG regime, observed on dagobertinvest) warns against investing more than 10% of net assets. This
        is the observed risk-communication practice of established platforms, cited as a reference point - it is not a rule of law that applies to this demo,
        and not a guarantee that any percentage is safe for your situation. Spreading a smaller amount across several projects reduces, but never removes, the
        risk of total loss.
      </p>
      <h2>Specific risks</h2>
      <ul>
        <li>
          <strong>Capital loss.</strong> The project you back may fail, underperform or become worthless. Issuers can and do become insolvent after successful
          fundraises. Returns are never guaranteed.
        </li>
        <li>
          <strong>Illiquidity.</strong> Crowdfunded and tokenized positions can be hard or impossible to sell. There may be no secondary market, transfers can
          require the issuer's or platform's consent and a verified recipient, and you may have to hold until the project ends - or longer. (On the current
          prototype no transferable token exists at all.)
        </li>
        <li>
          <strong>Subordination.</strong> Subordinated or "junior" instruments rank behind other creditors; with qualified subordination you may receive nothing
          while the issuer is over-indebted, and interest or repayment claims can be suspended entirely.
        </li>
        <li>
          <strong>Term and extension risk.</strong> Loans and bonds may be extended beyond their stated term under their contracts, delaying repayment.
        </li>
        <li>
          <strong>Valuation risk.</strong> Real-world assets are hard to value; stated valuations may be wrong or stale. (On this demo, all valuations and
          issuer identities are mock data.)
        </li>
        <li>
          <strong>Smart-contract risk.</strong> Code can contain bugs or be exploited, and transactions on a blockchain are generally irreversible.
        </li>
        <li>
          <strong>Network risk.</strong> Blockchain networks can suffer congestion, outages, forks or protocol changes outside anyone's control.
        </li>
        <li>
          <strong>Key and wallet risk.</strong> If you lose your wallet's secret key or recovery phrase, or someone steals them, your funds are gone and no one
          can restore them.
        </li>
        <li>
          <strong>Regulatory risk.</strong> Rules for crowdfunding (ECSPR in the EU) and crypto-assets (MiCA) are evolving. A structure that is possible today
          may change, and offerings may be restricted where you live.
        </li>
        <li>
          <strong>Volatility and currency risk.</strong> Crypto-asset prices can move sharply; stablecoins can de-peg; exchange rates move.
        </li>
        <li>
          <strong>Counterparty and fraud risk.</strong> Issuers may mismanage funds or misrepresent their projects. Platform checks reduce but cannot eliminate
          this.
        </li>
      </ul>
      <h2>About future investor protections</h2>
      <p>
        EU crowdfunding regulation (the ECSPR, Regulation (EU) 2020/1503) requires authorised platforms to offer investor categorisation, an entry knowledge
        test, a simulation of the ability to bear loss, and a pre-contractual reflection period of four calendar days for non-sophisticated investors before an
        offer becomes binding; the reference platforms in our research corpus implement these under their own authorisations. Blockallisto's demo has none of
        these mechanisms, because no real investment is possible. If a regulated version ever launches, those protections - and their limits - will be described
        in its own legally reviewed documents. Protections like reflection periods let you withdraw an offer; they do not reduce the underlying investment risk.
      </p>
      <h2>No advice</h2>
      <p>
        Nothing on this Service is investment, legal or tax advice, or a recommendation to buy or sell anything. Past performance - real or simulated - does not
        predict future results. Consider independent professional advice, and diversify: do not concentrate your savings in any single project or asset type.
      </p>
      <h2>Acknowledgement</h2>
      <p>
        By using this demo you acknowledge that you have read and understood this Risk Disclosure. Before any future real launch, a fuller, legally reviewed
        risk statement will apply.
      </p>
    </>
  );
}
