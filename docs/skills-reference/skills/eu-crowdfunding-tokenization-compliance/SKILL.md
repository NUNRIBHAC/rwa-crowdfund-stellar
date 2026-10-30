---
name: eu-crowdfunding-tokenization-compliance
description: Guidance on adapting Stellar-based tokenization platforms to European Union crowdfunding and financial regulations.
---

When to use
Use this skill when developing, auditing, or launching a crowdfunding platform in the EU that utilizes the Stellar blockchain for asset tokenization. This applies specifically to ensuring compliance with the European Crowdfunding Service Providers (ECSP) Regulation and MiCA (Markets in Crypto-Assets).

## Instructions
1.  **Classify the Instrument:** Determine if the tokenized asset on Stellar is a "Transferable Security" (MiFID II) or a "Crowdfunding Instrument" under the ECSP regulation.
2.  **Verify ECSP Authorization:** Ensure the platform entity is authorized as an ECSP by the National Competent Authority (NCA) of its home Member State.
3.  **Implement KIIS:** Draft or review the Key Investment Information Sheet (KIIS). Ensure it includes the specific risks of using the Stellar ledger (e.g., private key management, network fees).
4.  **Enforce Thresholds:** Apply the €5,000,000 12-month limit for crowdfunding offers as per EU 2020/1503.
5.  **Smart Contract Compliance:** Decide explicitly whether the asset enables Stellar's "Clawback" and "Auth Revocable" flags. They support court-ordered freezes and recovery, but no EU rule mandates them; treat them as a documented design choice, noting they conflict with non-transferable token designs.
6.  **Investor Categorization:** Implement a mandatory entry knowledge test and a simulation of the ability to bear loss for "non-sophisticated" investors.

## Examples
**Scenario:** A German startup wants to raise €2M for real estate using Stellar tokens.
**Action:** 
1. Advise the user to apply for ECSP authorization via BaFin.
2. Ensure the Stellar Asset Code is registered and the "Claimable Balances" feature is used for dividend distributions to satisfy local tax reporting.
3. Confirm the KIIS includes a disclaimer that the blockchain record is the definitive proof of ownership.

## Constraints
*   **No Legal Binding:** Always state that this guidance does not constitute formal legal advice.
*   **Regional Scope:** Do not apply US SEC rules (like Reg D or Reg A+) to these EU-specific workflows.
*   **Privacy:** Ensure all Stellar memo fields do not contain Personally Identifiable Information (PII) to comply with GDPR.
*   **Thresholds:** Do not suggest crowdfunding structures for raises exceeding €5M without a full Prospectus Regulation audit.
