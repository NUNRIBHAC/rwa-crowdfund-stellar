---
name: stellar-eu-crowdfunding-smart-contract-auditor
description: Expert guidance on auditing Soroban smart contracts for EU-compliant tokenized crowdfunding platforms on the Stellar network.
---

When to use
Use this skill when developing or reviewing smart contracts (Soroban/Rust) intended for tokenized crowdfunding platforms operating within the European Union. This includes ensuring compliance with MiCA (Markets in Crypto-Assets) and the European Crowdfunding Service Providers (ECSP) regulation.

## Instructions
1.  **Analyze Contract Architecture:** Review the Soroban Rust code for logic errors, reentrancy vulnerabilities, and integer overflows.
2.  **Verify Asset Tokenization:** Ensure the implementation of Stellar Assets (SAC) or custom tokens aligns with the specific requirements for "Asset-Referenced Tokens" (ART) or "Electronic Money Tokens" (EMT) under EU MiCA guidelines.
3.  **Audit Access Control:** Confirm that administrative functions (e.g., pausing the contract, upgrading code, or withdrawing funds) are protected by multi-signature requirements or decentralized governance as mandated by investor protection rules.
4.  **Validate Regulatory Hooks:** Ensure the contract includes necessary hooks for KYC/AML verification, such as requiring specific identities or claims (Verifiable Credentials) before allowing a `buy` or `transfer` invocation.
5.  **Test Economic Invariants:** Verify that the "Hard Cap," "Soft Cap," and refund mechanisms function exactly as stated in the platform's Key Investment Information Sheet (KIIS).
6.  **Review Gas and Storage:** Optimize for Soroban resource limits to prevent "Denial of Service" via excessive footprint or instruction costs.

## Examples
**Scenario:** A developer wants to launch a real-estate token on Stellar for EU investors.
*   **Step 1:** The auditor reviews the `mint` function to ensure it only triggers if the `issuer` address provides a valid EU-compliant KYC signature.
*   **Step 2:** The auditor checks the `refund` logic to ensure that if the soft cap isn't reached by `ledger_timestamp`, investors can pull their XLM/USDC without admin intervention.
*   **Step 3:** The auditor confirms the contract emits events that can be indexed for EU regulatory reporting.

## Constraints
*   Do NOT provide legal advice; focus strictly on the technical security and alignment with specified EU regulatory frameworks.
*   Do NOT ignore the Soroban "Footprint" system; every audit must check for resource contention.
*   Do NOT approve contracts that allow the issuer to freeze individual user funds without a clear, documented legal trigger.
*   Do NOT overlook the "Right to be Forgotten"; ensure that PII (Personally Identifiable Information) is never stored directly on the Stellar ledger.
