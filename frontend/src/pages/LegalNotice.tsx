import { useI18n } from '../i18n';
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from './legalMeta';

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
          This Legal Notice identifies the operator of the Blockallisto website and demo application (the "Service"). The corporate particulars shown below are
          fictional demonstration data: legal form "Lda." [DEMO], registered address "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO], registration
          number "000 000 000" [DEMO], share capital "EUR 0" [DEMO], managing director "Nome Demonstracao" [DEMO]. Blockallisto's registered legal name, form,
          address and registration status have not been verified, and no registration is asserted. Contact: {LEGAL_CONTACT_EMAIL}.
        </p>
        <h2>1. Operator</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Trading name</td>
              <td>Blockallisto</td>
            </tr>
            <tr>
              <td>Legal form</td>
              <td>"Lda." [DEMO]</td>
            </tr>
            <tr>
              <td>Registered address</td>
              <td>"Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO]</td>
            </tr>
            <tr>
              <td>Commercial register</td>
              <td>"Registo Comercial de [Lisboa], number 000 000 000" [DEMO]</td>
            </tr>
            <tr>
              <td>VAT number</td>
              <td>"PT 000 000 000" [DEMO]</td>
            </tr>
            <tr>
              <td>Managing director</td>
              <td>"Nome Demonstracao" [DEMO]</td>
            </tr>
            <tr>
              <td>Contact</td>
              <td>{LEGAL_CONTACT_EMAIL}</td>
            </tr>
          </tbody>
        </table>
        <p>Replace every [DEMO] value with the operator's real registered particulars before any publication beyond the prototype.</p>
        <h2>2. Regulatory status</h2>
        <p>
          Blockallisto today is a <strong>prototype demonstration</strong> running entirely on the Stellar test network (testnet). The operator is{' '}
          <strong>not</strong> authorised as a crowdfunding service provider under Regulation (EU) 2020/1503 (ECSPR), is <strong>not</strong> supervised by the
          CMVM or any other competent authority in that capacity, and makes <strong>no offer</strong> of any investment. Nothing on the Service is an offer,
          solicitation, recommendation, or investment, legal, tax or financial advice. No real money is involved; testnet tokens have no monetary value.
        </p>
        <p>
          If and when a real launch is prepared, this notice will be updated with the operator's authorisation status, its competent supervisory authority, and
          any required single-market disclosures before any real offer is made.
        </p>
        <h2>3. Content and liability</h2>
        <p>
          The Service's content is provided as-is for evaluation of a prototype. Sample campaigns, issuers, figures and outcomes are fictional illustrations.
          The operator accepts no liability for decisions taken on the basis of demo content. External links, where present, lead to third-party content the
          operator does not control.
        </p>
        <h2>4. Intellectual property</h2>
        <p>
          The Service, its content and its code are Copyright (c) 2026 Nuno Ribeiro, all rights reserved. No open-source licence or patent grant is given. You
          may view and use the demo for evaluation; you may not copy, republish or resell it.
        </p>
        <h2>5. Applicable framework [to be reviewed]</h2>
        <p>
          Governing law and jurisdiction clauses for a real launch require legal advice and depend on the operator's final registration. This template
          deliberately makes no governing-law assertion for the prototype.
        </p>
      </div>
    </>
  );
}
