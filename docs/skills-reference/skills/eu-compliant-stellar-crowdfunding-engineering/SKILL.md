---
name: eu-compliant-stellar-crowdfunding-engineering
description: Design and implement Soroban smart contracts for tokenized crowdfunding that adhere to EU MiCA and crowdfunding regulations.
---

When to use
Use this skill when designing, auditing, or implementing crowdfunding platforms on the Stellar network that must comply with European Union regulations (such as MiCA or the EU Crowdfunding Regulation 2020/1503). This applies to asset issuance, smart contract logic for investor limits, and automated compliance hooks.

## Instructions
1.  **Define Asset Standards**: Use the SEP-41 token interface standard for Soroban. Ensure the token contract includes an `authorized` flag or a whitelist mechanism to restrict transfers to KYC-verified wallets.
2.  **Implement Investor Caps**: Integrate logic within the Soroban contract to enforce the ECSPR Article 21(7) safeguard for non-sophisticated investors: each time an investment in an individual offer exceeds the higher of €1,000 or 5% of the investor's net worth, require a risk warning, the investor's explicit consent, and proof the investor understands the investment and its risks before accepting it.
3.  **Create "Reflection Period" Logic**: Program a mandatory withdrawal period (usually 4 days under EU law) where investors can cancel their commitment. Funds should be held in a contract-controlled escrow, not released to the issuer immediately.
4.  **Enforce Clawback Capabilities**: Utilize Stellar's native `clawback` feature where the legal structure calls for issuer-side recovery (e.g., court-ordered asset seizures or lost keys). No EU rule mandates clawback; treat it as a deliberate design choice, noting it conflicts with non-transferable token designs.
5.  **Audit for Transparency**: Ensure all "Key Investment Information Sheets" (KIIS) hashes are stored on-chain or in contract metadata to provide an immutable link between the token and the legal disclosure documents.

## Examples
**Scenario: Implementing a 4-day withdrawal period.**
*   *Action*: The engineer writes a Soroban `commit_funds` function that records the timestamp.
*   *Code Logic*: `if (current_time < commit_time + 4_days) { allow_refund(); } else { lock_for_project(); }`
*   *Outcome*: The platform remains compliant with the EU Crowdfunding Regulation's "pre-contractual reflection period."

## Constraints
-   Do NOT issue anonymous tokens; all tokens must be "Identified Assets" per EU AMLD5/6.
-   Do NOT allow global transfers without a whitelist check (Restricted Transfers).
-   Do NOT store PII (Personally Identifiable Information) directly on the Stellar ledger; store only hashes or references to off-chain KYC providers.
-   Do NOT bypass the "Atomic Swap" pattern for fundraising; ensure the swap of USDC/EURC for project tokens happens simultaneously to prevent counterparty risk.