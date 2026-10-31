import { useI18n } from '../i18n';
import { LEGAL_LAST_UPDATED } from './legalMeta';

// Draft v0.1 (2026-10-31) review template, presented as a clearly labeled
// DEMO/DRAFT page. Wording kept faithful to the draft markdown
// (legal/conflicts-of-interest.md). A conflicts-of-interest policy only becomes
// operative for an authorised platform; this describes intended policy, not
// current practice.
export default function ConflictsOfInterest() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.conflictsOfInterest}</h1>
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
        This policy template describes how Blockallisto intends to identify, prevent, manage and disclose conflicts of interest. Blockallisto today is a
        prototype demonstration on the Stellar testnet: there are no real investors, issuers, funds or offers, so no actual conflict can arise today. This
        document is a design artifact prepared against the compliance surfaces of established EU crowdfunding platforms and is <strong>not</strong> a
        description of a live compliance program.
      </p>
      <h2>1. Why this policy exists</h2>
      <p>
        Crowdfunding platforms sit between issuers seeking funds and investors providing them. Regulation (EU) 2020/1503 expects authorised platforms to avoid
        conflicts of interest and, where they cannot be avoided, to manage and disclose them. This template anticipates that expectation.
      </p>
      <h2>2. Potential conflicts considered</h2>
      <ul>
        <li>
          <strong>Platform vs investor:</strong> the platform earning fees from completed raises could be tempted to admit weak campaigns. Intended mitigation:
          published admission criteria, documented due-diligence steps per campaign, and fees that do not depend on campaign marketing claims.
        </li>
        <li>
          <strong>Related parties:</strong> the operator, its managers or their close relations acting as issuers or investors. Intended rule: [related parties
          may not act as issuers on the platform - to be confirmed by legal advice]; any related-party investing, if ever permitted, would be disclosed on the
          campaign page.
        </li>
        <li>
          <strong>Proprietary investing:</strong> intended rule: the platform does <strong>not</strong> invest in its own campaigns and does not hold
          contributed funds at any point; settlement flows through [licensed payment service providers - planned, not live].
        </li>
        <li>
          <strong>Staff incentives:</strong> intended rule: no remuneration tied to the funding success of specific campaigns.
        </li>
        <li>
          <strong>Information asymmetry:</strong> issuer-supplied content could mislead. Intended mitigation: key investment information sheets per campaign, a
          standardised campaign data structure, and clear separation between verified platform data and issuer-supplied content.
        </li>
      </ul>
      <h2>3. Identification, management, disclosure</h2>
      <p>
        Intended process: (1) conflicts register maintained by [the operator's compliance contact - to be appointed]; (2) assessment before any campaign
        admission and on any material change; (3) where a conflict cannot be avoided, disclosure to affected users in clear terms before they commit; (4)
        refusal to operate the conflicting business where avoidance and disclosure are insufficient.
      </p>
      <h2>4. Current status</h2>
      <p>
        None of the above is operative today. The prototype accepts no real funds, lists no real issuers and pays no fees. This page exists so the intended
        compliance surface is visible and reviewable before any real launch.
      </p>
    </>
  );
}
