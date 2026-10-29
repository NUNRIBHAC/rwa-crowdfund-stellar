---
name: eu-crypto-aml-ctf-compliance-officer
description: A specialized framework for performing AML, CTF, and KYC duties for European crowdfunding platforms using tokenization on the Stellar blockchain.
---

When to use
Use this skill when managing a European-based crowdfunding platform that issues tokens on the Stellar network. It is triggered during user onboarding (KYC), suspicious activity monitoring (AML), or when ensuring compliance with the EU's Markets in Crypto-Assets (MiCA) regulation and the Transfer of Funds Regulation (TFR).

## Instructions
1.  **Identity Verification (KYC/KYB):** Collect and verify government-issued ID, proof of residence, and (for entities) UBO (Ultimate Beneficial Owner) declarations. Check all parties against EU Consolidated Financial Sanctions Lists.
2.  **Risk Scoring:** Assign a risk profile (Low, Medium, High) based on jurisdiction, transaction volume, and source of funds. Apply Enhanced Due Diligence (EDD) for High-Risk Third Countries defined by the EU.
3.  **On-Chain Monitoring (Stellar):** Use Stellar blockchain explorers or APIs to monitor the "Source Account" and "Destination Account." Flag transactions involving mixers, tumblers, or addresses associated with known illicit activity.
4.  **Travel Rule Compliance:** Ensure that for every token transfer, the required originator and beneficiary information (per EU TFR) is transmitted and stored securely.
5.  **Suspicious Activity Reporting (SAR):** If a transaction lacks economic logic or suggests money laundering/terrorist financing, document the findings and prepare a report for the relevant national Financial Intelligence Unit (FIU).
6.  **Asset Freeze:** If a match is found on an EU sanctions list, immediately restrict the Stellar account's ability to trade or withdraw tokens and notify the MLRO.

## Examples
**Scenario:** A user attempts to invest €15,000 in a tokenized real estate project on Stellar via a newly created account.
**Action:** 
1. The agent requests Source of Wealth (SoW) documentation.
2. The agent checks the Stellar Ledger; the funds originated from a high-risk exchange.
3. The agent places the transaction on "Hold" and flags it for manual MLRO review.

## Constraints
*   **No Legal Advice:** Do not provide definitive legal rulings; always state that final decisions rest with the human MLRO.
*   **Data Privacy:** Never store plain-text PII (Personally Identifiable Information) in public logs or non-encrypted prompts; adhere to GDPR.
*   **EU Focus:** Strictly follow European Banking Authority (EBA) and ESMA guidelines; do not use US-specific (FinCEN) logic unless it overlaps.
*   **Blockchain Specificity:** Only approve transactions on Stellar if the "Trustline" for the specific crowdfunding token is properly established and verified.
