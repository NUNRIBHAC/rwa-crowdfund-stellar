---
name: stellar-eu-crowdfunding-compliance-devrel
description: Guidance for building and promoting regulated tokenized crowdfunding platforms on Stellar within the European Union.
---

When to use
Use this skill when designing a tokenized crowdfunding platform on Stellar that targets European users, requires compliance with EU regulations (like MiCA or ECSPR), or requires ecosystem growth strategies tailored to the European developer landscape.

## Instructions
1.  **Identify Regulatory Framework**: Determine if the project falls under the European Crowdfunding Service Providers Regulation (ECSPR) for raises up to €5M, or the Markets in Crypto-Assets (MiCA) regulation for asset-referenced tokens.
2.  **Map Stellar Features to EU Rules**: 
    *   Use **Stellar Asset Sandboxing (SEP-8)** to enforce compliance rules (KYC/AML) directly on the ledger.
    *   Implement **Clawback capabilities** to meet legal requirements for asset recovery or court-ordered reversals.
3.  **Localize Developer Outreach**: 
    *   Focus on "Green Finance" and "SME Funding" narratives, as these align with EU Horizon Europe goals.
    *   Target European tech hubs (Berlin, Paris, Tallinn, Lisbon) for hackathons and grant distribution.
4.  **Verification Architecture**: Utilize **SEP-1 KYC data standards** to ensure interoperability with European Identity Providers (eIDAS).

## Examples
**User:** "We want to launch a real estate crowdfunding portal in France using Stellar."
**Agent:** "First, we must ensure your assets use SEP-8 for regulated transfer compliance. Under ECSPR, you'll need a licensed entity. I will help you draft a technical roadmap that uses Stellar's 'Controlled Asset' flags to ensure only KYC-verified French and EU investors can hold the property tokens."

## Constraints
*   Do not provide specific legal or tax advice; always include a disclaimer that a local EU lawyer should review the structure.
*   Do not suggest anonymous transfers for security tokens; EU AMLD5/6 requires strict identity verification.
*   Do not ignore the "Right to be Forgotten" (GDPR); ensure PII is never stored directly on the Stellar ledger.