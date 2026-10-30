---
name: stellar-eu-tokenization-treasury-management
description: Manage treasury reserves and token liquidity for EU-compliant crowdfunding platforms using the Stellar network.
---

When to use
Use this skill when managing capital reserves, liquidity pools, or tokenized asset distributions for crowdfunding projects registered in the European Union. This applies to monitoring MiCA compliance for asset-referenced tokens and executing Stellar-specific treasury operations.

## Instructions
1.  **Verify Regulatory Perimeter**: Ensure all treasury movements align with the EU Crowdfunding Regulation (ECSPR) and MiCA (Markets in Crypto-Assets). Confirm the project has a valid Prospectus or Key Investment Information Sheet (KIIS).
2.  **Monitor Reserve Ratios**: Maintain a minimum 1:1 reserve for fiat-backed stablecoins or asset-backed tokens on Stellar. Check balances in segregated custody accounts vs. on-chain supply.
3.  **Execute Batch Payouts**: Use Stellar's batching capability to distribute returns or dividends to investors to minimize transaction fees.
4.  **Maintain Liquidity**: Manage offers on the Stellar Decentralized Exchange (DEX) or Automated Market Maker (AMM) pools to ensure investors have an exit path, staying within the "market making" limits defined by EU law.
5.  **Audit Trail Generation**: Export Stellar transaction hashes and link them to internal fiat bank statements for quarterly regulatory reporting.
6.  **SEPA Integration Coordination**: Map incoming SEPA and SEPA Instant payments to the minting of Stellar assets, ensuring the Memo ID matches the user's public key and the internal reserve ledger reflects 100% backing.

## Examples
**Scenario: Dividend Distribution**
*   **Trigger**: A tokenized real estate project in France earns €10,000 in rent.
*   **Action**: Convert EUR to EURC (Stellar-based Euro). Batch a `payment` operation to 500 investor public keys.
*   **Record**: "Transaction ID [Hash] - Distribution of Q3 rental income."

**Scenario: Processing a New Investment**
*   **Trigger**: An investor sends €1,000 via SEPA.
*   **Action**: Verify funds in the safeguarded bank account. Call the Stellar anchor service to mint 1,000 tokens. Transfer tokens to the user's wallet with the "Investment" memo. Update the internal reserve ledger to reflect 100% backing.

## Constraints
*   **NO Unregulated Assets**: Do not provide liquidity for tokens that lack a required EU Whitepaper.
*   **NO Co-mingling**: Never mix platform operational funds with investor reserve funds.
*   **NO Private Key Exposure**: Never request or store raw secret keys; use hardware security modules (HSM) or Stellar native multisig for all treasury movements.
*   **Strict KYC**: Only interact with Stellar accounts that have passed KYC/AML verification via SEP-12.
*   **XLM Operations Reserve**: Never exhaust the XLM reserve required for network operations and base reserves; periodically rebalance a small XLM allocation for transaction fees while keeping the bulk of reserves in low-risk Euro-denominated assets.
