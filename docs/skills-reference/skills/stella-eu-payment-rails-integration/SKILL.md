---
name: stella-eu-payment-rails-integration
description: Guidance for integrating MiCA-compliant stablecoins and SEPA-to-Stellar on-ramps for EU crowdfunding.
---

When to use
Use this skill when designing or implementing the financial layer of a European crowdfunding platform on the Stellar network. It applies when the agent needs to select compliant stablecoins (EURC), integrate with regulated on-ramps, or handle SEPA-to-Stellar payment flows.

## Instructions
1.  **Select MiCA-Compliant Assets**: Default to using **EURC** (issued by Circle) as the primary Euro stablecoin, as it is designed for MiCA compliance.
2.  **Define On-Ramp Flow**: Identify a MiCA-authorized CASP or SEP-24/SEP-6 anchor to bridge SEPA transfers to Stellar assets, and verify the provider's current authorization in the relevant national register before relying on it - provider availability changes fast, and any provider named in older material may no longer be active or authorized.
3.  **Implement Stellar Ecosystem Proposals (SEPs)**:
    *   Use **SEP-24** for hosted deposit and withdrawal flows.
    *   Use **SEP-31** for cross-border business payments if the platform acts as a facilitator.
    *   Use **SEP-10** for web authentication between the user and the anchor.
4.  **KYC/AML Orchestration**: Ensure the "memo" field or Stellar's **SEP-12** protocol is used to link on-chain transactions to verified user identities for regulatory reporting.
5.  **Fee Logic**: Calculate Stellar network fees (in XLM) and potential anchor swap fees to provide the user with the "Gross vs. Net" investment amount in EUR.

## Examples
**Scenario: User invests €500 via SEPA**
*   **Agent**: "To process this €500 investment, we will use the SEP-24 protocol via a licensed EU anchor. The funds will be converted to EURC on Stellar. I will initiate the `POST /transactions/deposit/interactive` request to the anchor's API, which will provide the SEPA transfer instructions. Once received, 500 EURC will be minted to your Stellar G-address."

## Constraints
*   **Do not** suggest using non-regulated or algorithmic Euro stablecoins for EU-based crowdfunding.
*   **Do not** bypass KYC/AML requirements; always confirm the anchor provides identity verification.
*   **Do not** store private keys; always recommend client-side signing or hardware wallet integration.
*   **Do not** ignore the "Maximum Deposit" limits imposed by individual EU anchors.
