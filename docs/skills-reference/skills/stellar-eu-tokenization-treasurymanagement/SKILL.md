---
name: stellar-eu-tokenization-treasurymanagement
description: Manage treasury reserves and liquidity for EU-compliant crowdfunding platforms tokenized on the Stellar network.
---

When to use
Use this skill when managing the financial reserves, liquidity pools, or MiCA-compliant stablecoin backing for a crowdfunding platform operating in the European Union and utilizing the Stellar blockchain.

## Instructions
1.  **Monitor Reserve Ratios:** Regularly audit the ratio between off-chain fiat (Euro) held in safeguarded accounts and on-chain tokenized representations (e.g., EURC or custom assets).
2.  **Liquidity Provisioning:** Ensure sufficient liquidity exists on the Stellar Decentralized Exchange (DEX) or Automated Market Makers (AMMs) to facilitate secondary market trading for crowdfunding investors.
3.  **SEPA Integration Coordination:** Map incoming SEPA/instant payments to the minting of Stellar assets, ensuring the Memo ID matches the user's public key.
4.  **Compliance Check:** Before executing any treasury move, verify that the transaction aligns with the European Union's Markets in Crypto-Assets (MiCA) regulation regarding asset-referenced tokens.
5.  **Rebalancing:** Execute periodic rebalancing of the treasury to cover operational costs in XLM (for transaction fees) while maintaining the bulk of reserves in low-risk Euro-denominated assets.

## Examples
**Scenario: Processing a New Investment**
- **Action:** User sends €1,000 via SEPA. 
- **Treasury Step:** Verify funds in the safeguarded bank account. Call the Stellar anchor service to mint 1,000 tokens. Transfer tokens to the user's wallet with the "Investment" memo. Update the internal reserve ledger to reflect 100% backing.

## Constraints
- **Do not** invest treasury reserves in high-volatility crypto assets; stick to Euro-denominated cash or high-quality liquid assets (HQLA) as per EU mandates.
- **Do not** mint tokens without confirmed fiat receipt.
- **Do not** bypass KYC/AML checks before allowing tokens to be sent to a user's Stellar address.
- **Do not** exhaust the XLM reserve required for network operations and base reserves.