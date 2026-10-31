import { useI18n } from '../i18n';
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from './legalMeta';

// Reviewed draft v0.2 gen10 (2026-10-31), presented as a clearly labeled DEMO/DRAFT
// template per the founder's instruction (2026-10-31). Keep the wording faithful to
// the reviewed text. COUNSEL GATE (from the reviewed draft, section 11 note): before
// any real launch, confirm with counsel which mandatory operator disclosures apply in
// the operator's jurisdiction (imprint/legal-notice or equivalent operator-identification
// duties under Portuguese and EU e-commerce, media or consumer rules) and add whatever
// is required here or on a linked page. No position is taken on whether such a duty
// applies to this prototype service; the DEMO operator particulars shown here are
// illustrative and do not satisfy any such duty.
export default function TermsOfService() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.termsOfService}</h1>
      <div lang="en" dir="ltr">
        <p className="legal-demo-notice">
          Demo template: this page is an illustrative document for the Blockallisto prototype, not legal advice. It has not been reviewed by a lawyer and it is
          not evidence of any company registration or regulatory authorisation. Company particulars marked [DEMO] are fictional demonstration data.
        </p>
        {LEGAL_LAST_UPDATED ? (
          <p>
            <strong>Last updated:</strong> {LEGAL_LAST_UPDATED}
          </p>
        ) : null}
        <p>
          These Terms of Service ("Terms") govern your use of the Blockallisto website and demo application (the "Service"), a prototype project operated by
          Blockallisto ("we", "us"). The corporate particulars shown for Blockallisto in these Terms are fictional demonstration data - legal form "Lda."
          [DEMO], registered address "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO], registration number "000 000 000" [DEMO]. Blockallisto's
          registered legal name, form, address and registration status have not been verified, and no registration is asserted. Contact: {LEGAL_CONTACT_EMAIL}.
        </p>
        <p>By using the Service you accept these Terms. If you do not agree, do not use the Service.</p>
        <h2>1. What Blockallisto is today</h2>
        <p>
          Blockallisto is a <strong>prototype demonstration</strong> of a tokenized real-world-asset crowdfunding concept, running entirely on the{' '}
          <strong>Stellar test network (testnet)</strong>.
        </p>
        <p>This means, plainly:</p>
        <ul>
          <li>
            The Service is <strong>not</strong> a crowdfunding platform in the legal sense. We are <strong>not</strong> an authorised crowdfunding service
            provider under Regulation (EU) 2020/1503 (ECSPR) or any other regime, and we make <strong>no live offers</strong> of any investment.
          </li>
          <li>Nothing on the Service is an offer, a solicitation, a recommendation, or investment, legal, tax or financial advice, in any jurisdiction.</li>
          <li>
            No real money is involved. Contributions on the demo use Stellar <strong>testnet tokens (test USDC) that have no monetary value</strong> and cannot
            be exchanged for real funds.
          </li>
          <li>
            Sample campaigns are fictional illustrations. Issuer identities, valuations, figures and outcomes shown on the demo are <strong>mock data</strong>,
            not real opportunities.
          </li>
        </ul>
        <h2>2. What the Service lets you do</h2>
        <ul>
          <li>Browse and filter sample investment campaigns and read their structured terms.</li>
          <li>Use the learning hub, glossary and FAQ to understand investment instruments.</li>
          <li>
            Connect a <strong>Freighter</strong> wallet (a browser extension) and make <strong>test contributions</strong> to the demo campaign on the Stellar
            testnet.
          </li>
        </ul>
        <p>
          Test contributions are handled by a Soroban smart contract with the following behaviour: all-or-nothing funding, payout to the campaign only after its
          deadline, contributions capped at the campaign target, and balances recorded in the contract. No transferable token is issued.
        </p>
        <h2>3. Planned features (not yet live)</h2>
        <p>
          Blockallisto is being designed against the compliance surfaces of established EU crowdfunding platforms. Future versions <strong>may</strong> include:
          user accounts and registration; identity verification (KYC/AML), including beneficial-owner and source-of-funds checks for company investors; investor
          categorisation with an entry knowledge test and a loss-bearing-capacity simulation; a pre-contractual reflection period for non-sophisticated
          investors; key investment information sheets per campaign; payments processed by licensed payment service providers (never by us holding client
          funds); complaints management and conflicts-of-interest policies; and jurisdiction-based selling restrictions.
        </p>
        <p>
          None of this exists today. The list above is indicative design direction drawn from our research corpus, not a specification: details, thresholds and
          whole features may change with design work and legal advice. These features will only launch under updated, legally reviewed terms, and only under the
          regulatory authorisations they require. Nothing in this section is a commitment to a launch date or a licence.
        </p>
        <h2>4. Eligibility and acceptable use</h2>
        <p>
          The Service is intended for adults (18+). It is not directed at any person in a jurisdiction where viewing crowdfunding-investment content of this
          kind would be restricted, and it must not be presented to US persons as an investment opportunity.
        </p>
        <p>
          You agree not to: attack, probe or disrupt the Service or its infrastructure; abuse, scrape at abusive rates, or interfere with other users;
          misrepresent the demo as a real investment service; or use the Service for anything unlawful.
        </p>
        <h2>5. Your wallet and your keys</h2>
        <ul>
          <li>
            Your wallet is <strong>non-custodial</strong>: your secret key and recovery phrase stay inside your own Freighter extension. We never see, store, or
            ask for them.
          </li>
          <li>
            <strong>Never</strong> enter your secret key or recovery phrase on any website, including this one. Anyone asking for it is trying to steal from
            you.
          </li>
          <li>
            Every transaction is signed by you in your wallet. Transactions on the Stellar testnet are recorded publicly and can be viewed on public testnet
            explorers.
          </li>
        </ul>
        <h2>6. Intellectual property</h2>
        <p>
          The Service, its content and its code are Copyright (c) 2026 Nuno Ribeiro, all rights reserved. No open-source licence or patent grant is given. You
          may view and use the demo for evaluation; you may not copy, republish or resell it.
        </p>
        <h2>7. Availability and changes</h2>
        <p>
          The Service runs on free-tier hosting and may be slow to start, unavailable, changed or withdrawn at any time without notice. Features labelled "not
          built" (accounts, KYC, fiat payments, investor dashboard) do not exist yet.
        </p>
        <h2>8. Disclaimers and limitation of liability</h2>
        <p>
          The Service is provided <strong>"as is" and "as available"</strong>, without warranties of any kind, express or implied, including accuracy, fitness
          for a particular purpose, or non-infringement. To the maximum extent permitted by law, we are not liable for any indirect, incidental or consequential
          damages, or for any loss arising from your use of the Service, your wallet, or the Stellar network. Nothing in these Terms excludes liability that
          cannot be excluded by law.
        </p>
        <h2>9. Governing law</h2>
        <p>
          These Terms are governed by the laws of <strong>Portugal</strong> and applicable European Union law, without prejudice to mandatory
          consumer-protection rules of your country of residence.
        </p>
        <h2>10. Changes to these Terms</h2>
        <p>
          We may update these Terms at any time. The "Last updated" date shows the current version. Continued use after a change means you accept the new Terms.
        </p>
        <h2>11. Contact</h2>
        <p>Questions about these Terms: {LEGAL_CONTACT_EMAIL}.</p>
        <p>
          <strong>Unresolved operator disclosures:</strong> the DEMO operator particulars in these Terms are illustrative and do not satisfy any mandatory
          operator-identification duty (such as an imprint or legal notice under Portuguese or EU e-commerce, media or consumer rules). Whether such a duty
          applies to this prototype service has not been determined; any required disclosures will be added here or on a linked page before any real launch.
        </p>
      </div>
    </>
  );
}
