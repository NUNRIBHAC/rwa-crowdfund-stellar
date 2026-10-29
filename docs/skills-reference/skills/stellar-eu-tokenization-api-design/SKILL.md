---
name: stellar-eu-tokenization-api-design
description: Designing developer-friendly, MiCA-compliant RESTful APIs for crowdfunding platforms on the Stellar network within the European Union.
---

When to use
Use this skill when designing or documenting API endpoints for platforms that issue, trade, or manage security tokens (Asset-Backed Tokens) on the Stellar blockchain specifically for the European market. This involves reconciling Stellar's technical primitives (Trustlines, SEP-10) with EU regulatory requirements (MiCA, GDPR).

## Instructions
1.  **Define Regulatory Metadata**: Map Stellar asset codes to MiCA-required fields. Ensure every token issuance API call includes parameters for the "Crypto-Asset White Paper" URI.
2.  **Enforce Mandatory KYC/AML Hooks**: Design endpoints that require a verified `Account ID` linked to an off-chain KYC provider before a Stellar `Trustline` can be established.
3.  **Implement SEP-Standard Compliance**: Use Stellar Ecosystem Proposals (SEPs) as the backbone:
    *   Use **SEP-10** for user authentication via wallets.
    *   Use **SEP-24** or **SEP-31** for deposit/withdrawal flows.
    *   Use **SEP-8** for regulated assets to intercept and authorize every transaction based on EU compliance rules.
4.  **Localize Data Handling**: Ensure all API logging and data storage endpoints comply with GDPR (e.g., provide routes for data portability and the right to erasure for off-chain metadata).
5.  **Currency & Stablecoin Integration**: Default to `EURC` (Circle's Euro Stablecoin) or other MiCA-compliant e-money tokens for crowdfunding contributions.
6.  **Developer Experience (DX) Focus**: Use standard HTTP status codes and provide a "Stellar Sandbox" environment link in every documentation header.

## Examples
**Scenario: Designing a Crowdfunding Investment Endpoint**
*   **Endpoint**: `POST /v1/projects/{project_id}/invest`
*   **Logic**: 
    1. Validate `investor_stellar_address` has an active KYC flag in the DB.
    2. Check if the investor has a `Trustline` for the project token.
    3. Return a pre-signed `Transaction Envelope` (XDR) using the project's issuing account.
    4. Include a `memo` field containing the hash of the investment agreement.

## Constraints
*   **Never** store private keys; APIs must only handle public keys and unsigned XDRs.
*   **Never** bypass SEP-8 authorization for security tokens; centralized compliance checks are mandatory in the EU.
*   **Do not** use non-standard Stellar assets for public crowdfunding; stick to Alpha-numeric 4 or 12 codes.
*   **Avoid** complex smart contract logic; leverage Stellar's native features (multisig, clawbacks) to ensure high performance and lower audit risk.
