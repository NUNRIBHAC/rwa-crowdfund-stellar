---
name: eu-crowdfunding-tokenization-compliance-advisor
description: Guidance for structuring Stellar-based asset tokenization platforms under the EU Crowdfunding Regulation (ECSP) and MiCAR.
---

When to use
Use this skill when a user is designing a crowdfunding platform in the EU that utilizes the Stellar blockchain to tokenize assets (Transferable Securities or Utility Tokens). This applies to platforms seeking to comply with the European Crowdfunding Service Providers Regulation (ECSPR) and the Markets in Crypto-Assets Regulation (MiCAR).

## Instructions
1.  **Classify the Asset:** Determine if the token represents a "Transferable Security" (equity/debt) under MiFID II or a "Crypto-asset" under MiCAR.
2.  **Verify ECSPR Limits:** Ensure the offer does not exceed €5,000,000 over a 12-month period. If it does, follow the Prospectus Regulation instead.
3.  **Stellar Asset Setup:**
    *   Set the `AUTH_REQUIRED` and `AUTH_REVOCABLE` flags on the Stellar issuing account to ensure KYC/AML control.
    *   Map the "Key Investment Information Sheet" (KIIS) to a permanent link stored in the asset's `manageData` or a memo field for transparency.
4.  **Investor Categorization:** Separate users into "Sophisticated" and "Non-sophisticated" investors as per ECSPR requirements.
5.  **Implement Guardrails:** For non-sophisticated investors, verify the "Pre-contractual Reflection Period" (4 days right of withdrawal) is enforced via smart contract logic or platform-side escrow.
6.  **Disclosure:** Generate a checklist for the KIIS including risk warnings, fees, and the specific rights attached to the Stellar-based tokens.

## Examples
**Scenario:** A startup wants to raise €2M by issuing "SolarTokens" on Stellar representing debt in a green energy project.
**Advisor Response:** 
"Since this is under the €5M threshold, you must apply for an ECSP license. On Stellar, you must use the `SEP-8` standard for regulated assets to ensure every trade is authorized by your compliance server. You are required to provide a Key Investment Information Sheet (KIIS) to all investors, with the content set by ECSPR Article 23 and its technical standards (there is no fixed page count) and implement a 4-day cooling-off period where their USDC/XLM remains in an escrow balance before the 'SolarTokens' are finalized."

## Constraints
*   Do NOT provide specific legal advice that replaces a qualified EU lawyer's review.
*   Do NOT suggest bypassing KYC/AML requirements or using anonymous liquidity pools for regulated securities.
*   Do NOT ignore the local National Competent Authority (NCA) requirements of the specific EU Member State where the platform is headquartered.
*   Do NOT approve any token sale exceeding €5M without a full EU Prospectus.