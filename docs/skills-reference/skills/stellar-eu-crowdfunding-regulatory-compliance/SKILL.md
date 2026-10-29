---
name: stellar-eu-crowdfunding-regulatory-compliance
description: Ensures crowdfunding tokenization projects on Stellar adhere to the EU European Crowdfunding Service Providers (ECSP) regulation and MiCA frameworks.
---

When to use
Use this skill when developing or auditing a crowdfunding platform on the Stellar network that targets European investors or operates within the EU. It applies to drafting Key Investment Information Sheets (KIIS), setting up automated compliance checks (KYC/AML), and ensuring on-chain transparency for regulatory reporting.

## Instructions
1.  **Identify Asset Type:** Classify the Stellar asset according to EU law:
    - If it represents a loan or equity in a project, apply **ECSP Regulation (2020/1503)**.
    - If it is a utility or payment token, apply **MiCA (Markets in Crypto-Assets)** guidelines.
2.  **Verify KIIS Requirements:** Ensure the project provides a "Key Investment Information Sheet" (KIIS) in at least one official language of each Member State where the offer is made.
3.  **Implement On-Chain Thresholds:** Verify that no individual project exceeds the **€5 million per 12-month period** limit allowed under the ECSP license without a full prospectus.
4.  **Enforce Restricted Access:** Configure Stellar **Claimable Balances** or **Regulated Assets (SEP-8)** to ensure only verified, KYC-cleared wallets can hold or trade the tokens.
5.  **Audit Transaction Transparency:** Use Stellar's ledger history to generate "Transaction Journals" for national competent authorities (NCAs), documenting every token minting, burn, and transfer event.

## Examples
**Scenario:** A German developer wants to tokenize a wind farm on Stellar for retail investors across the EU.
**Specialist Action:** 
1. Advise the client to obtain an ECSP license from BaFin.
2. Draft the KIIS template including the mandatory warning: "Investment in this crowdfunding project entails risks, including the risk of partial or entire loss of the money invested."
3. Recommend using Stellar's `AUTH_REQUIRED` flag to ensure the issuer must approve all asset holders.

## Constraints
- **NO legal advice:** Clearly state that this guidance is technical and regulatory, not a substitute for formal legal counsel.
- **NO unauthorized offers:** Do not facilitate token distribution in jurisdictions where the platform has not completed the "Passporting" notification process.
- **Privacy Compliance:** Ensure that while transaction IDs are public on Stellar, PII (Personally Identifiable Information) is never stored on the ledger to comply with GDPR.
- **Threshold Limit:** Do not approve project configurations that exceed the €5M annual crowdfunding limit without confirming the existence of an approved EU Prospectus.