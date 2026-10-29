---
name: eu-data-privacy-for-tokenized-crowdfunding
description: Guidance on ensuring GDPR compliance and data sovereignty for European crowdfunding platforms utilizing Stellar tokenization.
---

When to use
Use this skill when developing or auditing a crowdfunding platform based in the European Union that uses the Stellar blockchain. It specifically applies to handling Investor PII (Personally Identifiable Information), KYC data storage, and the intersection of blockchain immutability with the "Right to Erasure."

## Instructions
1.  **Classify Data Flows:** Separate on-chain data (public/immutable) from off-chain data (private/mutable). Identify which actors are Data Controllers (the platform) and Data Processors (KYC providers).
2.  **Implement Off-Chain PII Storage:** Never store raw PII (names, addresses, IDs) in Stellar memo fields or account data. Store these in an encrypted, GDPR-compliant database.
3.  **Hash-Linking:** If a link between a Stellar transaction and a user identity is required for regulatory reporting, store only a salted hash of the transaction ID in the private database.
4.  **Manage Tokenized Assets:** Ensure that asset descriptors (TOML files) do not contain personal information. Use `SEP-12` for managing customer data exchanges securely.
5.  **Address the Right to Erasure:** Since blockchain entries cannot be deleted, ensure that the legal basis for processing (e.g., "Legal Obligation" under MiCA or Prospectus Regulation) is clearly documented in the Privacy Policy to justify the retention of transaction hashes.
6.  **Verify Data Residency:** Confirm that cloud servers hosting the off-chain data are located within the EEA or in a jurisdiction with an Adequacy Decision.

## Examples
**Scenario:** A user requests their account be deleted from a French crowdfunding platform using Stellar.
*   **Action:** The agent advises the developer to delete the user's profile, email, and KYC documents from the local database. 
*   **Result:** The Stellar ledger retains the transaction history (public address and amount), but without the local database link, the data is pseudonymized and the platform no longer "identifies" the individual.

## Constraints
*   Do not store unencrypted PII on the Stellar ledger.
*   Do not claim that blockchain technology exempts a platform from GDPR Article 17 (Right to be Forgotten).
*   Do not provide legal advice; always include a disclaimer that this guidance must be reviewed by qualified EU legal counsel.
*   Do not suggest using public keys as the sole method of anonymization, as they are considered pseudonymized data under EU law.
