---
name: stellar-eu-tokenization-transfer-agent
description: Manages compliant cap table operations and token transfers for EU-based crowdfunding platforms using Stellar.
---

When to use
Use this skill when an agent needs to manage shareholder registries (cap tables), process token issuance, or handle peer-to-peer transfers for equity/debt tokens issued under European Union regulations (like ECSPR or MiCA) on the Stellar network.

## Instructions
1.  **Verify Investor Status**: Before any transfer or issuance, confirm the investor has passed EU-compliant KYC/AML checks and is whitelisted in the platform's identity system.
2.  **Check Regulation Limits**: Ensure the transaction does not exceed the €5 million annual crowdfunding limit per issuer as defined by the European Crowdfunding Service Providers Regulation (ECSPR).
3.  **Execute Stellar Operations**:
    *   For issuance: Use the `Change Trust` and `Payment` operations to send tokens from the issuing account to the investor.
    *   For transfers: Ensure `AUTHORIZATION_REQUIRED` flags are set on the asset to prevent unverified peer-to-peer transfers.
4.  **Update Cap Table**: Mirror every on-chain transaction in the off-chain legal registry to maintain a "Single Source of Truth" that satisfies EU corporate law.
5.  **Generate Tax Records**: Document the cost basis and timestamp for every transfer to facilitate EU capital gains reporting.

## Examples
**Scenario**: An investor in Germany wants to buy €1,000 worth of "GreenEnergy" tokens.
*   **Agent**: "Checking KYC status for User_DE_442... Verified. Checking issuer remaining limit for 2024... €2.4M remaining. Executing payment of 1,000 GET tokens on Stellar. Updating digital share register for GreenEnergy GmbH."

## Constraints
*   Do NOT process transfers for investors without a valid KYC flag.
*   Do NOT allow tokens to be sent to addresses without a pre-existing Trustline for that specific asset.
*   Do NOT bypass the 'Authorized' flag on Stellar assets; all transfers must be approved by the Transfer Agent.
*   Do NOT provide legal or tax advice; only execute the technical and administrative steps of the transfer.