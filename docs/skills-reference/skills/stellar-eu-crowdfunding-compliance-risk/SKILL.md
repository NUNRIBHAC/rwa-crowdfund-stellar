---
name: stellar-eu-crowdfunding-compliance-risk
description: Detects fraud and ensures MiCA/Stellar compliance for EU-based tokenized crowdfunding.
---

When to use
Use this skill when evaluating potential projects, token issuers, or suspicious transactions on a Stellar-based crowdfunding platform operating within the European Union. It is specifically designed to address MiCA (Markets in Crypto-Assets) requirements and Stellar network-specific risk factors.

## Instructions
1.  **Verify Issuer Identity (KYB):** Ensure the project lead provides a valid EU VAT number or VIES registration. Cross-reference the "stellar.toml" file for a verified `DOMAIN` and `DOCUMENTATION_SIGNING_KEY`.
2.  **Analyze Asset Trustlines:** Check the Stellar ledger for the proposed asset. Flag as high-risk if the `AUTH_REQUIRED` or `AUTH_REVOCABLE` flags are disabled, as EU compliance generally requires the ability to freeze assets under court order.
3.  **Audit the Whitepaper (MiCA Compliance):** Verify the whitepaper includes the mandatory "Liability of the Issuer" statement and, where the offer is in scope, a clear explanation of the 14-day retail right of withdrawal under MiCA Article 13 (crypto-assets other than ARTs/EMTs bought directly from the offeror or a placing CASP; not applicable after admission to trading or after a time-limited subscription period ends).
4.  **Transaction Monitoring:** Flag any transaction lacking full KYC verification. Under the Transfer of Funds Regulation, CASP transfers carry originator and beneficiary information at any amount; the €1,000 threshold only applies to verifying self-hosted wallets. On Stellar, monitor for "Circular Payments" or sudden liquidity spikes in low-volume SDEX pairs that suggest wash trading.
5.  **Risk Scoring:** Assign a risk score (1-10). If the score is > 7, generate a "Suspicious Activity Report" (SAR) template for the compliance officer.

## Examples
**Scenario:** A project claims to tokenize Spanish real estate on Stellar but hasn't set an `issuer` address on their website.
**Specialist Action:** "Flagging Project X. Risk: High. Reason: Missing `stellar.toml` verification and lack of mandatory MiCA risk warnings. Recommended Action: Block asset listing until legal entity proof is provided via VIES."

## Constraints
*   Do not provide legal advice; only provide operational risk assessments based on EU regulations.
*   Do not approve any asset that lacks a clear "clawback" or "freeze" capability for regulatory compliance.
*   Never share specific user PII (Personally Identifiable Information) in logs.
*   Do not bypass the applicable withdrawal rules: the 4-day pre-contractual reflection period for non-sophisticated investors under ECSPR, and the 14-day retail withdrawal right under MiCA Article 13 for in-scope crypto-assets.