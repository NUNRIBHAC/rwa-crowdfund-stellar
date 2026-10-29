---
name: stellar-eu-crowdfunding-gtm-strategy
description: Guidance for launching a compliant, tokenized crowdfunding platform in the European Union using Stellar.
---

When to use
Use this skill when you need to define or execute a Go-To-Market (GTM) strategy for a blockchain-based crowdfunding platform specifically targeting the European Union market and utilizing the Stellar network for asset tokenization.

## Instructions
1.  **Map Regulatory Compliance:** Ensure the strategy aligns with the European Crowdfunding Service Providers (ECSP) Regulation and MiCA (Markets in Crypto-Assets). Identify the specific national competent authority (NCA) for initial licensing (e.g., AMF in France, BaFin in Germany).
2.  **Define Token Architecture:** Specify how the Stellar network will be used. Focus on "Stellar Asset Essentials" (Trustlines, the native Clawback feature for issuer-side controls where the legal structure requires them, and SEP-24 for deposits/withdrawals). Note: SEP-20 is about validator self-verification, not self-custody - do not cite it as a custody mechanism.
3.  **Segment the EU Market:** Divide the approach by region, prioritizing "Tier 1" crypto-friendly jurisdictions (France, Lithuania, Luxembourg) versus "Tier 2" growth markets.
4.  **Structure the Value Proposition:** Highlight "Instant Settlement" via Stellar, "Fractional Ownership," and "Cross-Border Interoperability" within the Eurozone.
5.  **Design the Distribution Flywheel:** Plan a three-phase rollout:
    - Phase 1: Closed Beta with licensed "Anchors" (Stellar-based EUR stablecoin issuers).
    - Phase 2: Public launch under ECSP passporting rules across the EEA.
    - Phase 3: Secondary market liquidity via the Stellar Decentralized Exchange (DEX).

## Examples
**User:** "We want to launch a real estate tokenization platform in Berlin using Stellar. What's the first step?"
**Agent:** "First, we must align with the ECSP Regulation to allow for cross-border EU raises up to €5M. Where the legal structure requires issuer-side recovery (lost keys, court orders), we can enable Stellar's native 'Clawback' feature - a design choice, not a BaFin or EU requirement - and integrate a SEP-24 compliant EURC anchor for seamless Euro on-ramping."

## Constraints
- **NO Unregulated Advice:** Do not claim a platform is legal without advising the user to consult qualified EU legal counsel.
- **NO Generic Crypto Terms:** Always relate technical strategy back to specific Stellar Ecosystem Proposals (SEPs) or Stellar-specific features (e.g., Soroban smart contracts, Path Payments).
- **EEA Focus Only:** Do not include strategies for US (SEC) or UK (FCA) markets unless specifically requested as an expansion.
- **Privacy First:** Ensure all GTM data strategies mention GDPR compliance.
