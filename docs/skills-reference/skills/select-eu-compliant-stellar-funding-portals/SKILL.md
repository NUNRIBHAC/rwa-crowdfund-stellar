---
name: select-eu-compliant-stellar-funding-portals
description: Identifying and evaluating EU-regulated partners (ECSPs, CASPs, or MiFID II investment firms) for EU-based tokenized crowdfunding on the Stellar network.
---

When to use
Use this skill when a project needs to launch a tokenized crowdfunding campaign within the European Union using the Stellar blockchain and requires a regulated intermediary (an authorized ECSP, a CASP, or a MiFID II investment firm) that complies with EU regulations like MiCA or ECSPR.

## Instructions
1.  **Identify Regulatory Scope:** Determine if the project falls under the European Crowdfunding Service Providers Regulation (ECSPR) for raises up to €5M or requires a full MiFID II investment firm for larger raises.
2.  **Filter for Stellar Support:** Search for providers that explicitly support the Stellar network (Asset Issuance, SEP-24/SEP-6 anchored deposit/withdrawal, SEP-8 regulated assets, or Soroban smart contracts).
3.  **Verify EU Licensing:** Cross-reference the provider's legal entity against ESMA (European Securities and Markets Authority) registries or national competent authority (NCA) databases (e.g., BaFin, AMF, CNMV).
4.  **Assess Tokenization Capabilities:** Ensure the partner provides:
    *   On-chain cap table management.
    *   KYC/AML integration for Stellar wallets.
    *   Automated dividend/yield distribution via Stellar.
5.  **Output Recommendation:** Provide the partner name, their primary EU jurisdiction, and a link to their developer documentation or partnership portal.

## Examples
**User:** "We need an EU-regulated partner to help us issue green energy tokens on Stellar under ECSPR."
**Agent:** "For EU-compliant crowdfunding on Stellar, look for an authorized ECSP or CASP with Stellar issuance support. A historical example is Bitbond (Germany), which ran the first BaFin-approved security token offering in 2019 - but a name search in the BaFin Unternehmensdatenbank returned no current match for 'Bitbond' (checked 2026-10-28), so do not present it as a currently authorized provider. Before relying on any provider, verify its current authorization in the relevant national register (e.g., BaFin Unternehmensdatenbank, AMF REGAFI, or the ESMA ECSP register) - provider availability changes fast."

## Constraints
*   Do not provide legal advice or guarantee regulatory approval.
*   Do not recommend providers that lack a specific license for EU operations (e.g., US-only Broker-Dealers).
*   Do not suggest manual workarounds that bypass KYC/AML requirements.
*   Always specify the difference between a technology provider (software only) and a regulated partner (license holder).