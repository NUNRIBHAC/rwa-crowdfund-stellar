---
name: eu-crowdfunding-investor-suitability-assessment
description: Evaluates whether a retail investor has the knowledge and experience to invest in tokenized assets under EU MiFID II and ECSP regulations.
---

When to use
Use this skill when a prospective investor on a European crowdfunding platform needs to be onboarded for tokenized asset investments on the Stellar network. This is mandatory for compliance with the European Crowdfunding Service Providers (ECSP) regulation.

## Instructions
1. **Gather Financial Background**: Ask the investor about their net worth, annual income, and liquid assets to determine their "non-sophisticated" vs "sophisticated" status.
2. **Assess Experience**: Prompt the investor for their history with financial instruments, specifically high-risk investments, crypto-assets, or DLT-based tokens.
3. **Test Knowledge**: Present 3-5 specific scenarios involving Stellar-based assets (e.g., liquidity risks, private key loss, or secondary market volatility) to gauge their understanding of the risks.
4. **Run the Loss-Bearing Simulation**: Simulate the investor's ability to bear loss, calculated as 10% of their net worth (ECSPR Article 21(5)). This is a simulation input, not a hard investment limit - failing it does not by itself bar investing (Article 21(6)). Separately, each investment in an individual offer above the higher of €1,000 or 5% of net worth requires a risk warning, explicit consent, and proof the investor understands the investment and its risks (Article 21(7)); without that proof, the platform must prevent the investment.
5. **Issue Warning or Clearance**: 
    - If the investor lacks knowledge: Issue a mandatory risk warning stating the service is "inappropriate" and require an explicit acknowledgement of risk before proceeding.
    - If the investor passes: Confirm their suitability for specific asset classes.
6. **Log for Compliance**: Format the results into a summary including the date, investor profile, and the suitability outcome.

## Examples
**Scenario: A retail investor wants to buy tokenized real estate on Stellar.**
*Agent*: "To ensure compliance with EU regulations, I need to assess if this investment is right for you. Have you traded crypto-assets or DLT tokens before? Also, are you aware that if you lose your Stellar secret key, the platform may not be able to recover your funds?"
*Investor*: "I've only used savings accounts and don't know what a secret key is."
*Agent*: "Based on your response, this investment is deemed 'Inappropriate' for your current knowledge level. You face a high risk of total capital loss. Do you wish to proceed despite this warning?"

## Constraints
- **Do NOT provide investment advice**: Never tell the user *which* token to buy; only assess their *ability* to understand the risk.
- **EU Jurisdiction only**: This skill applies strictly to the European Union regulatory framework (ECSP/MiFID II).
- **Risk Warning Mandatory**: If a user fails the assessment, you MUST display a clear, bold warning before allowing them to move to the payment/Stellar transaction phase.
- **Privacy**: Do not store plain-text financial data; only process it to reach the suitability conclusion.