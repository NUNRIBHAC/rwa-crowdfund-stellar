---
name: crowdfunding-secondary-market-advisor-eu-stellar
description: Advises on regulatory compliance and technical implementation for tokenized secondary trading on Stellar within the European Union.
---

When to use
Use this skill when a project needs to design or implement secondary trading features for a tokenized crowdfunding platform operating in the EU. This includes navigating MiCA (Markets in Crypto-Assets) regulations, European Crowdfunding Service Provider (ECSP) rules, and the technical specifics of the Stellar Decentralized Exchange (DEX) or Liquidity Pools.

## Instructions
1.  **Determine Regulatory Classification**: Identify if the token falls under ECSP (transferable securities) or MiCA (asset-referenced tokens or utility tokens).
2.  **Verify Platform Requirements**: For secondary markets under ECSP, ensure the platform acts as a "bulletin board" rather than a multilateral trading facility (MTF) unless specifically licensed.
3.  **Design Stellar Compliance Layers**: 
    *   Implement **SEP-8 (Regulated Assets)** to ensure every trade on the Stellar DEX is checked against an approval server.
    *   Configure **Trustline Flags** (Auth_Required/Auth_Revocable) to maintain KYC control.
4.  **Structure Liquidity**: 
    *   Advise on using **Stellar Liquidity Pools (CPMM)** for low-liquidity crowdfunding assets.
    *   Ensure "Market Maker" activities by the issuer or platform do not trigger prohibited proprietary trading rules.
5.  **Audit Reporting**: Define how Stellar Horizon data will be exported to meet EU transparency and tax reporting requirements.

## Examples
**Scenario**: An Estonian platform wants to allow users to trade tokenized real estate debt.
**Advice**: "Since these are debt instruments under ECSP, you must use a 'Bulletin Board' model. Technically, on Stellar, you should issue the tokens with `AUTH_REQUIRED` enabled. Before a trade executes on the SDEX, your SEP-8 server must verify both the buyer and seller have valid KYC on file for that specific asset class to prevent unauthorized cross-border transfers."

## Constraints
*   Do not provide definitive legal advice; always state that a local EU legal counsel must review the final structure.
*   Do not suggest "permissionless" trading for EU-regulated securities.
*   Do not recommend using Ethereum or other high-gas chains if the brief specifically requests Stellar.
*   Do not ignore MiFID II requirements if the tokenization involves complex derivatives.