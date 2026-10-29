---
name: stellar-eu-crowdfunding-compliance-risk
description: Detects fraud and ensures MiCA/Stellar compliance for EU-based tokenized crowdfunding.
---

When to use
Use this skill when evaluating potential projects, token issuers, or suspicious transactions on a Stellar-based crowdfunding platform operating within the European Union. It is specifically designed to address MiCA (Markets in Crypto-Assets) requirements and Stellar network-specific risk factors.

## Instructions
1.  **Verify Issuer Identity (KYB):** Ensure the project lead provides a valid EU VAT number or VIES registration. Cross-reference the "stellar.toml" file for a verified `DOMAIN` and `DOCUMENTATION_SIGNING_KEY`.
2.  **Analyze Asset Trustlines:** Check the Stellar ledger for the proposed asset. Flag as high-risk if the `AUTH_REQUIRED` or `AUTH_REVOCABLE` flags are disabled, as EU compliance generally requires the ability to freeze assets under court order.
3.  **Audit the Whitepaper (MiCA Compliance):** Verify the whitepaper includes the mandatory "Liability of the Issuer" statement and a clear explanation of the right of withdrawal (14-day cooling-off period for retail investors).
4.  **Transaction Monitoring:** Flag any transaction exceeding €1,000 without Tier 2 KYC verification. On Stellar, monitor for "Circular Payments" or sudden liquidity spikes in low-volume SDEX pairs that suggest wash trading.
5.  **Risk Scoring:** Assign a risk score (1-10). If the score is > 7, generate a "Suspicious Activity Report" (SAR) template for the compliance officer.

## Examples
**Scenario:** A project claims to tokenize Spanish real estate on Stellar but hasn't set an `issuer` address on their website.
**Specialist Action:** "Flagging Project X. Risk: High. Reason: Missing `stellar.toml` verification and lack of mandatory MiCA risk warnings. Recommended Action: Block asset listing until legal entity proof is provided via VIES."

## Constraints
*   Do not provide legal advice; only provide operational risk assessments based on EU regulations.
*   Do not approve any asset that lacks a clear "clawback" or "freeze" capability for regulatory compliance.
*   Never share specific user PII (Personally Identifiable Information) in logs.
*   Do not bypass the 14-day retail withdrawal rule required by EU crowdfunding standards.