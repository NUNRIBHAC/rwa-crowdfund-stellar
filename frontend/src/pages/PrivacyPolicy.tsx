import { useI18n } from '../i18n';
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED, NEON_REGION } from './legalMeta';

// Reviewed draft v0.2 gen10 (2026-10-31), presented as a clearly labeled DEMO/DRAFT
// template per the founder's instruction (2026-10-31). Keep the wording faithful to
// the reviewed text. The accountable data controller is deliberately UNRESOLVED in
// this demo presentation: the sentence below is part of the reviewed text and must
// stay visible, not be silently filled.
export default function PrivacyPolicy() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.footer.privacyPolicy}</h1>
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
          This Privacy Policy explains what personal data the Blockallisto prototype (the "Service") processes, why, and what rights you have. The Service is a
          prototype project operated under the name Blockallisto. The corporate particulars shown for Blockallisto in these documents are fictional
          demonstration data ([DEMO] legal form "Lda.", [DEMO] registered address "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal", [DEMO] registration number
          "000 000 000"); the registered legal identity behind the Blockallisto name has not been verified, and naming the project does not by itself identify
          the accountable data controller. [The controller - the person or entity actually responsible for this processing - is to be confirmed before
          publication.] Privacy requests are answered at {LEGAL_CONTACT_EMAIL}.
        </p>
        <h2>1. Scope: what the demo does not collect</h2>
        <p>
          The current prototype has <strong>no KYC, no newsletters and no payments</strong>. Community sign-in is wallet-based: it uses a Stellar wallet
          signature, not a password or an email address. We do not ask for your full name, phone number, identity documents or payment card. The community
          features do collect the data described in section 2b: a public key, an optional display name, free-text content you choose to submit, and an optional
          contact email on issuer applications. We do not use analytics or advertising trackers, and the site's fonts and assets are self-hosted.
        </p>
        <h2>2. Data we process</h2>
        <p>
          <strong>a) Wallet and contribution data.</strong> If you connect a Freighter wallet and make a test contribution, the backend records, in a Postgres
          database (hosted by Neon), a safety journal containing: your Stellar <strong>public key</strong> (never your secret key), the campaign id, the action,
          the contribution amount, transaction envelopes, the transaction hash and status, and timestamps. A Stellar public key is pseudonymous data; we do not
          link it to your identity.
        </p>
        <p>
          <em>Retention:</em> unsigned prepared transactions expire after 24 hours; completed or failed transactions are pruned after 30 days; a signed
          transaction whose outcome is unresolved is kept until it resolves, because deleting it could lose track of a broadcast transaction. Signed envelopes
          are scrubbed once the transaction reaches a final state. These are the cleanup rules configured in the application's own code: they describe what the
          application deletes. Our hosting providers' own server logs and backups may keep data for different periods under their own privacy policies, and are
          not covered by these rules.
        </p>
        <p>
          <strong>b) Community account and community content.</strong> If you sign in to the community features, the backend stores, in the same Neon Postgres
          database: your Stellar <strong>public key</strong>, an account creation timestamp, and an optional <strong>display name</strong> (up to 40
          characters). Sign-in works by signing a one-time server challenge with your wallet (5-minute validity, single use); no password or email is required
          and your secret key never leaves the wallet. The server keeps only a SHA-256 hash of the session token; the raw token lives in your browser's local
          storage. Sessions last 30 days, logout deletes the session, and expired challenges and sessions are pruned hourly.
        </p>
        <p>
          <strong>Comments</strong> are public: each comment stores your public key, your display name if set, the body (up to 1000 characters), the campaign
          and a timestamp, and the latest 100 comments per campaign are shown to every visitor. A comment hidden by the operator leaves the public list
          immediately and is hard-deleted 30 days after hiding. <strong>Support/feedback tickets</strong> (kind, subject up to 120 characters, body up to 4000
          characters, status, timestamps) and <strong>issuer applications</strong> (project name, country, instrument type, target amount, description and an
          optional contact email) are visible only to your wallet account and to the operator's administrator; both are hard-deleted after 90 days (retention
          window configurable in the application code). Campaign <strong>news</strong> items are written by the operator and labeled as platform demo content.
          Your IP address is used in memory for rate limiting and swept within 24 hours; the application does not persist it (hosting logs are covered in item
          e).
        </p>
        <p>
          A caution: public keys, display names and free-text content can identify you even though we never ask for your name. Do not submit sensitive personal
          information in community fields.
        </p>
        <p>
          <strong>c) Public blockchain data.</strong> Test contributions are recorded publicly on the Stellar <strong>testnet</strong> and are visible on public
          explorers. Blockchain records cannot be altered or deleted by us.
        </p>
        <p>
          <strong>d) Device preferences.</strong> Your theme (light/dark) and language choices are stored in your browser's local storage. This data stays on
          your device and is not sent to us.
        </p>
        <p>
          <strong>e) Technical logs.</strong> Our hosting provider (Render, Frankfurt region) processes standard server logs (such as IP address and request
          metadata) to deliver and protect the Service.
        </p>
        <h2>3. Data we plan to process in future versions (not collected today)</h2>
        <p>
          The indicative design for future versions of Blockallisto - following the compliance surfaces of established EU crowdfunding platforms - is to process
          additional categories of personal data <strong>when and if</strong> those features launch. Exact categories, providers and thresholds may change with
          design work and legal advice:
        </p>
        <ul>
          <li>
            <strong>Registration data:</strong> full name (exactly as on your identity document), email address, country of residence and tax residency.
          </li>
          <li>
            <strong>Identity verification (KYC/AML):</strong> identity-document images, a selfie, mobile number, and verification results, processed with
            specialised third-party verification providers; for company investors, beneficial owners (typically anyone owning more than 25%) and source of
            funds; politically-exposed-person (PEP) declarations.
          </li>
          <li>
            <strong>Payment and payout data:</strong> bank account details (such as IBAN) handled by licensed payment service providers, not by us holding
            client funds.
          </li>
        </ul>
        <p>
          With the exception of the optional issuer contact email described in section 2b, none of this data is collected by the current demo. If these features
          launch, this Policy will be updated first, with the providers, purposes, legal bases and retention periods for each category.
        </p>
        <h2>4. Purposes and legal bases (GDPR)</h2>
        <p>
          We process the data in section 2 to operate, secure and demonstrate the prototype: preparing and tracking test transactions, preventing double-spends
          and resolving ambiguous transactions, keeping the Service reliable, and operating the community features (publishing and moderating comments,
          answering support and feedback tickets, and reviewing issuer applications). The legal basis is our legitimate interest (Art. 6(1)(f) GDPR) in running
          a safe technical demonstration. We do not use your data for marketing, profiling or sale.
        </p>
        <h2>5. Who processes data</h2>
        <ul>
          <li>
            <strong>Render</strong> (hosting, Frankfurt, EU) - runs the application.
          </li>
          <li>
            <strong>Neon</strong> (managed Postgres; {NEON_REGION}) - stores the contribution journal and the community data store.
          </li>
          <li>
            <strong>Stellar testnet</strong> (public network operated by the Stellar Development Foundation, global) - records public test transactions.
          </li>
          <li>
            <strong>GitHub</strong> - hosts the source code (no user data).
          </li>
        </ul>
        <p>Where processing occurs outside the EU/EEA (for example the global Stellar network), it involves pseudonymous testnet data only.</p>
        <h2>6. Your rights under the GDPR</h2>
        <p>
          You have the right to access, rectify, erase, restrict or object to the processing of your personal data, and to data portability, under Regulation
          (EU) 2016/679 (GDPR / RGPD). You also have the right to lodge a complaint with the Portuguese supervisory authority, the <strong>CNPD</strong>{' '}
          (Comissao Nacional de Protecao de Dados).
        </p>
        <p>
          We can locate the data tied to you only through your Stellar public key (and any display name or free-text content you chose to submit). Data already
          written to a public blockchain cannot be erased; we can correct or erase off-chain records (the contribution journal, your community account,
          comments, tickets and applications) on request, subject to the retention rules in section 2.
        </p>
        <h2>7. Brazil (LGPD)</h2>
        <p>
          The demo is operated from Portugal. Brazil's Lei Geral de Protecao de Dados (Lei no 13.709/2018 - LGPD) can apply to processing that targets or
          involves people in Brazil; whether it applies to this prototype is a legal question to be confirmed with counsel. If and to the extent the LGPD
          applies, it grants you rights over your personal data similar to those above, and you may contact the ANPD (Autoridade Nacional de Protecao de Dados).
          Use the same contact above for any request.
        </p>
        <h2>8. Security</h2>
        <p>
          Your wallet keys never leave your Freighter extension; the Service is designed so it cannot access them. The application is served over TLS, and
          administrative endpoints are disabled by default (fail-closed). No method is absolute, but the prototype's design minimises the data that exists to be
          attacked.
        </p>
        <h2>9. Children</h2>
        <p>The Service is a technical demonstration and is not directed at children.</p>
        <h2>10. Changes</h2>
        <p>
          We may update this Policy as the prototype evolves. The "Last updated" date shows the current version. Material changes will be reflected here before
          they take effect.
        </p>
        <h2>11. Contact</h2>
        <p>Privacy questions and requests: {LEGAL_CONTACT_EMAIL}.</p>
      </div>
    </>
  );
}
