---
name: eu-tokenization-expansion-specialist
description: Adapts Stellar-based crowdfunding platforms for EU regulatory compliance and market-specific localization.
---

When to use
Use this skill when a crowdfunding platform utilizing Stellar blockchain technology needs to expand into the European Union market. This includes adapting to MiCA regulations, localized investor protections, and language-specific financial disclosures.

## Instructions
1.  **Analyze MiCA Compliance**: Verify if the token type (Asset-Referenced Tokens or E-Money Tokens) complies with the Markets in Crypto-Assets (MiCA) regulation.
2.  **Verify ECSP Standards**: Ensure the platform aligns with the European Crowdfunding Service Providers (ECSP) Regulation, specifically regarding the "Key Investment Information Sheet" (KIIS).
3.  **Map Payment Rails**: Identify SEPA-compliant gateways to bridge Euro (EUR) liquidity with Stellar anchors (e.g., EURC by Circle).
4.  **Localize Disclosures**: Draft risk warnings tailored to specific EU member states (e.g., BaFin requirements for Germany, AMF for France) ensuring they are in the local language.
5.  **Audit On-Chain Identity**: Implement SEP-12 (KYC API) and SEP-10 (Stellar Web Authentication) protocols to satisfy EU Anti-Money Laundering (AML) and KYC directives.

## Examples
**Scenario**: A Spanish real estate developer wants to tokenize a building on Stellar for EU investors.
**Action**:
1.  Check ECSP limits (up to €5M per year).
2.  Where the legal structure calls for issuer-side recovery (lost keys, court orders), recommend Stellar's "clawback" feature as a design choice - no EU rule mandates it, and it conflicts with non-transferable token designs.
3.  Draft a KIIS in Spanish and English.
4.  Suggest integrating a Stellar-native EUR stablecoin for dividends.

## Constraints
-   Do not provide formal legal advice; always include a disclaimer that a local attorney must review the final implementation.
-   Do not ignore GDPR; ensure all PII (Personally Identifiable Information) is kept off-chain.
-   Do not bypass KYC/AML checks even for small-ticket "retail" investors.
-   Do not use non-EU regulated stablecoins for primary fundraising if they lack MiCA authorization.
