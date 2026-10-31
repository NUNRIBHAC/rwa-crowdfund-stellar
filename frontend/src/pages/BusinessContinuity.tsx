import { useI18n } from '../i18n';
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from './legalMeta';

// Draft v0.1 (2026-10-31) review template, presented as a clearly labeled
// DEMO/DRAFT page. Wording kept faithful to the draft markdown
// (legal/business-continuity.md). Section 1 is factual about the running demo;
// section 2 is design intent, not current practice.
export default function BusinessContinuity() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.businessContinuity}</h1>
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
          This page describes what keeps the Blockallisto prototype available and recoverable, and what continuity planning is intended for a future authorised
          platform. The first section is factual about the running demo; the second is design intent, not current practice.
        </p>
        <h2>1. Prototype continuity posture (current)</h2>
        <ul>
          <li>
            <strong>No client assets at risk:</strong> the demo holds no money, no client funds and no custody. Contributions are testnet tokens with no
            monetary value, settled by a Soroban smart contract on the public Stellar testnet. Contract state lives on the testnet ledger, independent of this
            website.
          </li>
          <li>
            <strong>Hosting:</strong> the site and API run on Render's free tier; operational data (transaction journal, community data) lives in a Neon
            Postgres database on its free tier. Both are third-party services with their own availability properties; no uptime is guaranteed for the demo.
          </li>
          <li>
            <strong>Backups:</strong> [backup schedule and retention to be defined - the free tiers provide no managed backups; testnet contract state is
            recoverable from the public ledger].
          </li>
          <li>
            <strong>Staging separation:</strong> user-facing demo, a separate staging environment, and disposable database copies are kept apart so testing
            cannot corrupt the demo.
          </li>
          <li>
            <strong>If the demo is unavailable:</strong> no user loses anything of value. Campaign state remains readable on public Stellar testnet explorers,
            and contributions remain governed by the contract, not by this site.
          </li>
        </ul>
        <h2>2. Intended continuity plan for an authorised platform (not live)</h2>
        <p>
          A real platform handling regulated offers would need, before launch: documented recovery time and recovery point objectives [RTO/RPO values to be set
          with legal and infrastructure advice]; managed backups with tested restore procedures; a payment-services arrangement in which client funds are never
          held by the platform, so platform failure cannot strand investor money; an orderly wind-down plan ensuring ongoing campaigns can complete or refund if
          the platform ceases operating; and communication procedures for incidents affecting users.
        </p>
        <p>None of this is operative today. Publishing it as a template keeps the intended compliance surface visible and reviewable.</p>
        <h2>3. Incident contact</h2>
        <p>To report a security or availability incident affecting the prototype: {LEGAL_CONTACT_EMAIL}, subject "Incident".</p>
      </div>
    </>
  );
}
