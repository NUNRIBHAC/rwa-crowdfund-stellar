---
name: eu-crowdfunding-tokenization-compliance-writer
description: A specialized guide for drafting technical documentation for Stellar-based tokenization platforms aligned with EU crowdfunding regulations.
---

When to use
Use this skill when you need to draft technical documentation, whitepapers, or platform guides for a crowdfunding project that uses the Stellar blockchain and must comply with European Union regulations, specifically the European Crowdfunding Service Providers (ECSP) regulation and MiCA (Markets in Crypto-Assets).

## Instructions
1.  **Define the Asset Class**: Identify if the token represents a transferable security (equity/debt) or a utility, as this dictates the regulatory path under EU law.
2.  **Stellar Mapping**: Detail how Stellar features fulfill legal requirements:
    *   Map `SEP-10` (Web Authentication) or `SEP-24` (Deposit/Withdrawal) to user onboarding flows.
    *   Explain how `Clawback` and `Authorization Required` flags ensure compliance with AML/CFT and court-ordered asset freezing.
3.  **Draft the KIIS**: Assist in drafting the Key Investment Information Sheet (KIIS) required by ECSP, ensuring the technical description of the smart contract logic is translated into clear, legally sound language.
4.  **Describe the Governance**: Detail the "Account Signer" architecture to explain how multisig setups protect investor funds and platform integrity.
5.  **Address Investor Limits**: Document the automated technical safeguards for non-sophisticated investors required by ECSPR Article 21: the entry knowledge test, the simulation of ability to bear loss (10% of net worth), and the per-offer safeguard that investments above the higher of €1,000 or 5% of net worth require a risk warning, explicit consent, and proof of understanding.

## Examples
**User:** "Explain how we handle investor withdrawals for our French property tokenization project."
**Agent:** "Under ECSP guidelines and Stellar's protocol, we utilize SEP-24 for seamless EUR-to-Asset conversion. Technically, the platform maintains a regulated anchor. When a user requests a withdrawal, the Stellar asset is burned, and the anchor initiates a SEPA transfer. The documentation will reflect that the 'Finality of Settlement' occurs on the Stellar ledger; note that settlement-finality recognition under the EU DLT Pilot Regime applies only to authorized DLT market infrastructures, so this wording must be confirmed with counsel."

## Constraints
*   DO NOT provide legal advice; always include a disclaimer that the content is for technical documentation purposes only.
*   Treat 'Clawback' as a deliberate design choice: no EU rule mandates it. Where the legal structure calls for issuer-side recovery (lost keys, court orders), document the clawback flag and its governance; note that clawback conflicts with non-transferable token designs.
*   DO NOT use crypto-jargon without defining it in the context of the ECSP Annex I requirements.
*   NEVER suggest bypassing KYC/AML checks; all Stellar accounts must be documented as 'Auth_Required'.