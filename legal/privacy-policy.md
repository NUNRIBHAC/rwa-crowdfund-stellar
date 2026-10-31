<!--
DRAFT v0.2 (2026-10-31) - FOR REVIEW ONLY. Delete this comment block before publishing.
Prepared as an honest prototype-stage draft. It is not legal advice and has not been
reviewed by a lawyer. Placeholders in [square brackets] must be filled before
publication. Data-flow statements reflect the repository as audited on 2026-10-31;
the planned-features section reflects the competitor platform blueprints in docs/.
Operator particulars are DEMO/illustrative values per the founder's instruction (2026-10-31);
replace them with real registered data before any real launch. Re-verify before
publication if the code changes.
-->

# Privacy Policy

**Last updated:** [date to be set on publication]

This Privacy Policy explains what personal data the Blockallisto prototype (the "Service") processes, why, and what rights you have. The Service is a prototype project operated under the name Blockallisto. The corporate particulars shown for Blockallisto in these documents are fictional demonstration data ([DEMO] legal form "Lda.", [DEMO] registered address "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal", [DEMO] registration number "000 000 000"); the registered legal identity behind the Blockallisto name has not been verified, and naming the project does not by itself identify the accountable data controller. [The controller - the person or entity actually responsible for this processing - is to be confirmed before publication.] Privacy requests are answered at blockallisto@gmail.com.

## 1. Scope: what the demo does not collect

The current prototype has **no user accounts, no registration, no KYC, no newsletters and no payments**. We do not ask for your name, email address, phone number, identity documents or payment card. We do not use analytics or advertising trackers, and the site's fonts and assets are self-hosted.

## 2. Data we process

**a) Wallet and contribution data.** If you connect a Freighter wallet and make a test contribution, the backend records, in a Postgres database (hosted by Neon), a safety journal containing: your Stellar **public key** (never your secret key), the campaign id, the action, the contribution amount, transaction envelopes, the transaction hash and status, and timestamps. A Stellar public key is pseudonymous data; we do not link it to your identity.

*Retention:* unsigned prepared transactions expire after 24 hours; completed or failed transactions are pruned after 30 days; a signed transaction whose outcome is unresolved is kept until it resolves, because deleting it could lose track of a broadcast transaction. Signed envelopes are scrubbed once the transaction reaches a final state. These are the cleanup rules configured in the application's own code: they describe what the application deletes. Our hosting providers' own server logs and backups may keep data for different periods under their own privacy policies, and are not covered by these rules.

**b) Public blockchain data.** Test contributions are recorded publicly on the Stellar **testnet** and are visible on public explorers. Blockchain records cannot be altered or deleted by us.

**c) Device preferences.** Your theme (light/dark) and language choices are stored in your browser's local storage. This data stays on your device and is not sent to us.

**d) Technical logs.** Our hosting provider (Render, Frankfurt region) processes standard server logs (such as IP address and request metadata) to deliver and protect the Service.

## 3. Data we plan to process in future versions (not collected today)

The indicative design for future versions of Blockallisto - following the compliance surfaces of established EU crowdfunding platforms - is to process additional categories of personal data **when and if** those features launch. Exact categories, providers and thresholds may change with design work and legal advice:

- **Registration data:** full name (exactly as on your identity document), email address, country of residence and tax residency.
- **Identity verification (KYC/AML):** identity-document images, a selfie, mobile number, and verification results, processed with specialised third-party verification providers; for company investors, beneficial owners (typically anyone owning more than 25%) and source of funds; politically-exposed-person (PEP) declarations.
- **Payment and payout data:** bank account details (such as IBAN) handled by licensed payment service providers, not by us holding client funds.

None of this data is collected by the current demo. If these features launch, this Policy will be updated first, with the providers, purposes, legal bases and retention periods for each category.

## 4. Purposes and legal bases (GDPR)

We process the data in section 2 to operate, secure and demonstrate the prototype: preparing and tracking test transactions, preventing double-spends and resolving ambiguous transactions, and keeping the Service reliable. The legal basis is our legitimate interest (Art. 6(1)(f) GDPR) in running a safe technical demonstration. We do not use your data for marketing, profiling or sale.

## 5. Who processes data

- **Render** (hosting, Frankfurt, EU) - runs the application.
- **Neon** (managed Postgres; AWS Europe (Frankfurt) region, EU - verified in the Neon console on 2026-10-31) - stores the contribution journal.
- **Stellar testnet** (public network operated by the Stellar Development Foundation, global) - records public test transactions.
- **GitHub** - hosts the source code (no user data).

Where processing occurs outside the EU/EEA (for example the global Stellar network), it involves pseudonymous testnet data only.

## 6. Your rights under the GDPR

You have the right to access, rectify, erase, restrict or object to the processing of your personal data, and to data portability, under Regulation (EU) 2016/679 (GDPR / RGPD). You also have the right to lodge a complaint with the Portuguese supervisory authority, the **CNPD** (Comissao Nacional de Protecao de Dados).

Because the demo does not collect identifying information, we can usually only find your data if you tell us your Stellar public key. Data already written to a public blockchain cannot be erased; we can erase or de-link off-chain journal records on request.

## 7. Brazil (LGPD)

The demo is operated from Portugal. Brazil's Lei Geral de Protecao de Dados (Lei no 13.709/2018 - LGPD) can apply to processing that targets or involves people in Brazil; whether it applies to this prototype is a legal question [to confirm with counsel before publication]. If and to the extent the LGPD applies, it grants you rights over your personal data similar to those above, and you may contact the ANPD (Autoridade Nacional de Protecao de Dados). Use the same contact above for any request.

## 8. Security

Your wallet keys never leave your Freighter extension; the Service is designed so it cannot access them. The application is served over TLS, and administrative endpoints are disabled by default (fail-closed). No method is absolute, but the prototype's design minimises the data that exists to be attacked.

## 9. Children

The Service is a technical demonstration and is not directed at children.

## 10. Changes

We may update this Policy as the prototype evolves. The "Last updated" date shows the current version. Material changes will be reflected here before they take effect.

## 11. Contact

Privacy questions and requests: blockallisto@gmail.com.
