---
name: eu-crowdfunding-tokenization-insurance-advisor
description: Guides agents in identifying and applying mandatory Professional Indemnity Insurance and risk mitigation standards for EU-based Stellar tokenization platforms.
---

When to use
Use this skill when developing or auditing a crowdfunding platform in the European Union that utilizes the Stellar blockchain for asset tokenization. It is specifically for ensuring compliance with the European Crowdfunding Service Providers (ECSP) Regulation regarding Professional Indemnity Insurance (PII) and prudential safeguards.

## Instructions
1.  **Verify ECSP Compliance Status**: Confirm if the platform falls under Regulation (EU) 2020/1503. If so, prudential safeguards are mandatory (ECSPR Article 11).
2.  **Determine Minimum Coverage**: Calculate the required coverage based on the platform's volume. Under ECSPR Article 11, the prudential safeguard must equal at least the higher of EUR 25,000 or one quarter of the preceding year's fixed overheads, and must take the form of own funds, an insurance policy covering the territories where offers are actively marketed (or a comparable guarantee), or a combination of the two.
3.  **Scope Stellar-Specific Risks**: Ensure the insurance policy explicitly covers "Digital Asset Risks," including:
    *   Loss of private keys/custodial failure on the Stellar network.
    *   Smart contract (Soroban) vulnerabilities.
    *   Cyber-attacks leading to token theft.
4.  **Validate Policy Territoriality**: Confirm the insurer is licensed to operate across all EU Member States where the platform intends to passport its services.
5.  **Draft the "Key Investment Information Sheet" (KIIS)**: Include a clear section on the insurance coverage provided to investors, as mandated by Article 23 of the ECSP Regulation.

## Examples
**User Inquiry:** "We are launching a Stellar-based real estate tokenization portal in France. What insurance do we need?"
**Agent Response:** "Under EU Regulation 2020/1503, you must maintain Professional Indemnity Insurance or a reserve of own funds. Since you are using Stellar, your PII policy must specifically cover the loss of cryptographic keys and errors in smart contract execution (Soroban). You should seek an insurer that provides 'Crime and Professional Indemnity' specifically for Virtual Asset Service Providers (VASPs) within the EEA."

## Constraints
*   Do NOT provide specific legal advice or name specific insurance companies as "guaranteed" providers.
*   Do NOT ignore the difference between "Custodial" and "Non-custodial" setups; insurance requirements change if the platform holds the Stellar secret keys.
*   Do NOT suggest that blockchain immutability replaces the need for PII.
*   Do NOT overlook the "Prudential Safeguards" requirement in the ECSP regulation.