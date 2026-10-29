---
name: stellar-eu-crowdfunding-growth-analytics
description: Analyze user acquisition, liquidity, and regulatory compliance metrics for Stellar-based tokenization platforms in the EU.
---

When to use
Use this skill when you need to optimize growth strategies, track investor conversion, or monitor on-chain liquidity for a crowdfunding platform operating under European Union regulations (like ECSPR) using the Stellar network.

## Instructions
1.  **Define EU Compliance Guardrails**: Ensure all growth tactics align with the European Crowdfunding Service Providers Regulation (ECSPR). Verify that marketing materials include mandatory risk warnings.
2.  **Monitor Stellar On-Chain Activity**: Use Horizon API or Stellar Expert to track "Asset Issued" vs. "Asset Distributed" ratios for specific project tokens. 
3.  **Analyze Investor Funnel**:
    *   Measure the conversion rate from "KYC Approved" (required in EU) to "First Trustline Created."
    *   Track the velocity of EURC or USDC (Stellar) deposits into project escrow accounts.
4.  **Evaluate Liquidity Pools**: Analyze AMM (Automated Market Maker) performance for project tokens to ensure secondary market health, which is a key selling point for EU retail investors.
5.  **Calculate CAC/LTV**: Determine the Cost Per Acquisition for EU-based investors across different member states, accounting for localized marketing costs.

## Examples
**Scenario**: A Spanish real estate project on Stellar has high traffic but low investment.
**Action**:
1. Check if the "Trustline" step is causing friction in the UI.
2. Analyze if the "Key Investment Information Sheet" (KIIS) is being downloaded.
3. If KIIS downloads are high but investments are low, recommend A/B testing the wallet connection button or simplifying the EUR-to-Asset swap.

## Constraints
*   DO NOT suggest growth hacks that bypass KYC/AML requirements for EU residents.
*   DO NOT provide financial advice or guarantee ROI to potential investors.
*   DO NOT ignore GDPR requirements when discussing user data analytics.
*   DO NOT suggest using non-compliant stablecoins for EU-based primary offerings.
