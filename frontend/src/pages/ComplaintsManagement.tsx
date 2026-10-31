import { useI18n } from '../i18n';
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from './legalMeta';

// Draft v0.1 (2026-10-31) review template, presented as a clearly labeled
// DEMO/DRAFT page. Wording kept faithful to the draft markdown
// (legal/complaints-management.md). The timelines below are template values,
// not commitments; the formal framework they mirror applies only to an
// authorised platform.
export default function ComplaintsManagement() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.complaintsManagement}</h1>
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
        This page explains how to complain about the Blockallisto prototype and how complaints are handled. Blockallisto today is a demo on the Stellar testnet
        with no real funds involved; the handling process below is real for the demo, while the formal regulatory framework it mirrors applies only to an
        authorised platform.
      </p>
      <h2>1. How to complain</h2>
      <p>
        Email {LEGAL_CONTACT_EMAIL} with the subject "Complaint". Include: what happened, when, the page or feature involved, and what outcome you are asking
        for. Complaints are free of charge.
      </p>
      <p>For the prototype there is also a support ticket form on the site; complaints sent there are handled the same way.</p>
      <h2>2. What happens next</h2>
      <ul>
        <li>
          <strong>Acknowledgement:</strong> we confirm receipt within [10 business days - template value].
        </li>
        <li>
          <strong>Investigation:</strong> the operator reviews the complaint against records (page content, contract events, support history). You may be asked
          for clarification.
        </li>
        <li>
          <strong>Answer:</strong> a reasoned reply within [20 business days - template value] of acknowledgement. If more time is needed, we say so and explain
          why.
        </li>
        <li>
          <strong>Record:</strong> complaints and outcomes are logged in a complaints register kept for [5 years - template value], containing the complaint,
          the investigation and the resolution.
        </li>
      </ul>
      <p>Template timelines are indicative values drawn from common EU platform practice, not legal commitments; final values require legal advice.</p>
      <h2>3. If you are not satisfied</h2>
      <p>
        For the prototype there is no supervisory escalation path, because the operator is not an authorised crowdfunding service provider and no real
        investment service exists. For a future authorised platform, this section will name the competent authority's complaint channel (in Portugal, the CMVM)
        and any applicable out-of-court dispute-resolution body before any real offer is made.
      </p>
      <h2>4. Using complaints to improve</h2>
      <p>
        Recurring complaint themes are reviewed and feed into product and content fixes. The prototype's own roadmap treats complaints data as an input to
        design changes, not just case-by-case resolution.
      </p>
    </>
  );
}
