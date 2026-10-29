---
name: fintech-ux-design-for-eu-crowdfunding
description: Guidelines for designing compliant and user-friendly tokenized crowdfunding platforms on the Stellar network within the EU.
---

When to use
Use this skill when designing user interfaces, onboarding flows, or investment dashboards for European crowdfunding platforms that utilize Stellar blockchain tokenization. This applies when the platform must adhere to European Crowdfunding Service Providers (ECSP) regulations and MiCA guidelines.

## Instructions
1.  **Prioritize Compliance-First Onboarding**: Design a multi-step KYC/KYB flow that includes the mandatory "Knowledge Test" and "Simulation of Ability to Bear Loss" required by EU ECSP regulations.
2.  **Translate Blockchain Complexity**: Replace technical Stellar jargon (e.g., "Trustlines," "Asset Issuance") with financial terms familiar to EU investors (e.g., "Investment Activation," "Tokenized Shares").
3.  **Implement Mandatory Disclosure Layouts**: Create dedicated UI components for the Key Investment Information Sheet (KIIS). Ensure this document is always accessible, non-editable, and displayed before any "Confirm Investment" button.
4.  **Design for Dual-Currency Views**: Show all asset values in both the native token/Stellar asset and the Euro (€) equivalent using real-time or weighted average exchange rates to satisfy EU accounting expectations.
5.  **Visualize the 4-Day Reflection Period**: For non-sophisticated investors, design a prominent UI countdown or "Revoke Investment" button that remains active for the legally mandated 4-day pre-contractual reflection period.
6.  **Optimize Stellar Wallet Integration**: Design "Wallet-less" experiences where the underlying Stellar keys are managed via secure custody, providing a traditional login (Email/2FA) while maintaining a transparent ledger view for the user.

## Examples
**Scenario: User is about to invest 500€ in a tokenized wind farm.**
- **UI Action**: Instead of showing a "Submit Transaction" button, the UI displays: "Review Key Investment Information (KIIS)".
- **UI Action**: After review, the user clicks "Invest". The UI shows: "Reflection Period Active: You have 3 days and 23 hours to cancel this investment without penalty."
- **Dashboard**: The balance is displayed as `1,000 WIND-TOKENS (€500.00)`.

## Constraints
- **Do not** use the term "Crypto-currency" if "Investment Token" or "Security Token" is more legally accurate under the specific EU license.
- **Do not** hide risk warnings or make them small; EU law requires them to be "prominent."
- **Do not** allow a user to invest until the "Simulation of Ability to Bear Loss" is completed.
- **Do not** omit the transaction hash, but ensure it is tucked under an "Advanced Details" or "Blockchain Proof" dropdown to avoid cluttering the UX.