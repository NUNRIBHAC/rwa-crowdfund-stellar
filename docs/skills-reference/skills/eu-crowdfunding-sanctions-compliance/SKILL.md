---
name: eu-crowdfunding-sanctions-compliance
description: Validates EU crowdfunding transactions and tokenized assets on Stellar against EU/UN sanctions lists and AMLD6 requirements.
---

When to use
Use this skill when a platform user attempts to:
1. Register an account for an EU-based crowdfunding project.
2. Purchase or trade tokenized assets on the Stellar network within the EU jurisdiction.
3. Withdraw funds from a crowdfunding campaign to an external wallet or bank account.
4. Conduct Due Diligence (CDD/EDD) as required by the EU anti-money-laundering framework (AMLD5/6, transitioning to the AML Regulation (EU) 2024/1624 package).

## Instructions
1. **Identify the Subject:** Extract the full legal name, date of birth (for individuals), or registration number (for entities), and country of residence/incorporation.
2. **Screen Against Mandated Lists:** Check the subject against the Consolidated list of persons, groups, and entities subject to EU financial sanctions (EU Sanctions Map).
3. **Analyze Stellar Wallet History:** Review the transaction history of the providing Stellar public key for interactions with "High-Risk Third Countries" as defined by the European Commission.
4. **Token Limitation Check:** Ensure the crowdfunding offer does not exceed the €5 million annual threshold (per EC Regulation 2020/1503) unless a full prospectus is provided.
5. **Categorize Risk:**
    - **Green:** No matches, low-risk jurisdiction. Proceed.
    - **Yellow:** Partial match or high-volume transaction. Flag for manual compliance officer review.
    - **Red:** Direct match on EU Sanctions list. Freeze the transaction and flag for blocking.
6. **Documentation:** Generate a compliance log entry containing the timestamp, the lists checked, and the specific EU regulation applied (e.g., "Compliance check per Regulation (EU) 2020/1503").

## Examples
**Scenario:** A user from Estonia wants to invest 2,000 EUR in a tokenized real estate project.
**Agent Action:**
1. Verified ID via eIDAS-compliant provider.
2. Screened name against EU Financial Sanctions Database (No hits).
3. Checked Stellar wallet: No history with sanctioned mixers or exchanges.
4. Verified project total raise is under €5M.
5. **Outcome:** Transaction Authorized.

## Constraints
- **Do NOT** treat the EU list of high-risk third countries as an automatic ban: it requires enhanced due diligence (EDD). Direct matches on EU sanctions lists remain prohibited.
- **Do NOT** process transactions for anonymous wallets; all Stellar keys must be mapped to a verified KYC profile.
- **Do NOT** bypass the €5 million limit without verifying the existence of a prospectus approved by the issuer's home Member State competent authority (prospectuses are not approved by ESMA).
- **Do NOT** share specific internal screening logic or "tipping off" information with the user if they are flagged.