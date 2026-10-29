---
name: stellar-eu-tokenized-crowdfunding-compliance
description: Manage financial operations for tokenized crowdfunding projects on the Stellar network within the EU regulatory framework.
---

When to use
Use this skill when an agent needs to structure, execute, or audit crowdfunding operations involving asset tokenization on the Stellar blockchain while adhering to European Union regulations, specifically MiCA (Markets in Crypto-Assets) and the EU Crowdfunding Regulation (ECSPR).

## Instructions
1.  **Verify Regulatory Perimeter**: Determine if the project falls under the EU Crowdfunding Regulation (up to €5M) or MiCA. Ensure the issuer is a legal entity registered in an EU Member State.
2.  **Asset Configuration**: Define the Stellar Asset (Trustline) parameters. Set the `AUTH_REQUIRED` and `AUTH_REVOCABLE` flags on the issuing account to ensure compliance with KYC/AML clawback requirements.
3.  **Investor Onboarding**: Validate that investors have undergone mandatory Knowledge Tests and Simulation of Loss as required by EU law before allowing them to hold the token.
4.  **Transaction Logic**: Execute primary issuance by sending tokens to validated investor wallets in exchange for SEPA/stablecoin payments. Record the hash of the Key Investment Information Sheet (KIIS) in the transaction memo or a dedicated data entry.
5.  **Compliance Reporting**: Generate a ledger-based report of all token holders for the National Competent Authority (NCA) of the relevant EU state.

## Examples
**Scenario: Issuing a Solar Farm Token in Spain**
- **Action**: Agent checks if the project has a KIIS (Key Investment Information Sheet).
- **Stellar Operation**: Sets `SetOptions` flags to `0x1` (Auth Required) on the issuing account `G...ABC`.
- **Compliance**: Restricts token transferability until the investor's wallet address is added to the allowlist following a successful KYC check via an EU-compliant provider.

## Constraints
- DO NOT issue tokens to non-EU investors without verifying specific cross-border marketing rules.
- DO NOT bypass the 4-day "reflection period" (cooling-off) for non-sophisticated investors if required by ECSPR.
- NEVER operate without the `AUTH_REVOCABLE` flag; EU regulators require the ability to freeze assets in cases of fraud or court orders.
- DO NOT exceed the €5,000,000 annual limit per issuer under the standard EU Crowdfunding Regulation without a full Prospectus.