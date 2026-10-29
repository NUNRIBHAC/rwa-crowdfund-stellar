---
name: eu-crypto-crowdfunding-compliance-integration
description: Guidance for integrating KYC/KYB vendors for Stellar-based tokenization platforms operating under EU MiCA and crowdfunding regulations.
---

When to use
Use this skill when designing or implementing the onboarding flow for a European crowdfunding platform that issues tokens on the Stellar network. It applies specifically to selecting and technical integration of identity verification (KYC/KYB) vendors that comply with EU Anti-Money Laundering (AML) directives and the Markets in Crypto-Assets (MiCA) regulation.

## Instructions
1.  **Identify Regulatory Requirements**: Verify if the platform operates under the European Crowdfunding Service Providers (ECSP) regulation or MiCA. Ensure the vendor supports "Liveness" checks and EIDAS-compliant electronic signatures.
2.  **Select EU-Compatible Vendors**: Prioritize vendors with local EU presence or specialized API modules for:
    *   **KYC**: Automatic ID document recognition (EU passports/ID cards) and biometric matching.
    *   **KYB**: Retrieval of UBO (Ultimate Beneficial Owner) data from European commercial registries (e.g., Transparency Registers).
3.  **Define the Stellar Handshake**: 
    *   Map the user's verified identity to their Stellar Public Key (G...).
    *   Use Stellar's **SEP-12** (Customer Information Protocol) standard to facilitate the exchange of KYC data between the wallet/frontend and the compliance server.
4.  **Implement On-Chain Restrictions**: Use Stellar **Trustline Flags** (specifically `AUTHORIZATION_REQUIRED`) to ensure only KYC-verified accounts can hold or trade the platform's asset tokens.
5.  **Audit Trail Setup**: Ensure the integration logs the "Verification ID" and timestamp without storing raw PII (Personally Identifiable Information) on the public blockchain, maintaining GDPR compliance.

## Examples
**Scenario**: An SME in France wants to raise capital via a tokenized bond on Stellar.
1.  **Agent Action**: Recommends an API integration with a vendor like Onfido or Sumsub using their EU-specific data centers.
2.  **Logic**: The agent specifies that the KYB check must verify the French *Siren/Siret* number before the issuer's Stellar account is "Authorized" to mint tokens.
3.  **Result**: Only users who pass the SEP-12 flow and reside in the EEA receive the `set_flags` permission to buy the tokens.

## Constraints
*   Do NOT store clear-text PII (names, addresses, ID photos) on the Stellar ledger or in public metadata.
*   Do NOT bypass the "manual review" flag for high-risk jurisdictions or transactions exceeding €1,000 (standard EU AML trigger).
*   Do NOT use vendors that do not offer GDPR-compliant Data Processing Agreements (DPA).
*   Do NOT issue tokens to a Stellar address until the `SEP-12` status is officially marked as `APPROVED`.