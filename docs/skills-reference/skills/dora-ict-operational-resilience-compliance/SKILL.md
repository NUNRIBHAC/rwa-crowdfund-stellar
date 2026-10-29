---
name: dora-ict-operational-resilience-compliance
description: Guidance for aligning EU crowdfunding tokenization platforms on Stellar with DORA ICT risk management and resilience standards.
---

When to use
Use this skill when designing, auditing, or documenting the technical infrastructure of a European Union-based crowdfunding platform that uses the Stellar network. It specifically applies to meeting the requirements of the Digital Operational Resilience Act (DORA) regarding ICT risk management, incident reporting, and digital operational resilience testing.

## Instructions
1. **Identify ICT Assets:** List all critical software (Stellar Horizon nodes, Soroban smart contracts, custodial wallets) and hardware supporting the crowdfunding flow.
2. **Classify Risk Profiles:** Categorize the platform as a "Financial Entity" under DORA. Determine if the platform qualifies as a "microenterprise" to apply the simplified ICT risk management framework.
3. **Map the Stellar Dependency:** Document how the platform handles Stellar network outages. Define the "Exit Strategy" for blockchain-related service providers (e.g., node providers or anchor services).
4. **Design for Resilience:** 
    - Implement multi-signature setups for asset issuance to prevent single points of failure.
    - Establish "Continuous Monitoring" for smart contract execution errors.
5. **Draft Incident Response:** Create a step-by-step workflow for reporting major ICT-related incidents to the national competent authority within DORA's binding timelines: initial notification within 4 hours of classifying the incident as major and no later than 24 hours from awareness, intermediate report within 72 hours, final report within one month (Delegated Regulation (EU) 2025/301).
6. **Plan Testing:** Schedule annual basic resilience testing (vulnerability scans) focused on the API gateway and the bridge between off-chain ledgers and the Stellar ledger. Full TLPT (Threat-Led Penetration Testing) is required at least every three years, and only for entities designated by the competent authority (DORA Articles 26-27).

## Examples
**Scenario:** A platform issuing "Real Estate Tokens" on Stellar needs to comply with DORA Article 6 (ICT Risk Management).
**Action:** The agent defines a backup strategy where the platform maintains synchronized nodes in two different EU cloud regions (e.g., Frankfurt and Paris) to ensure availability if one region fails, and documents the use of hardware security modules (HSMs) for signing Stellar transactions.

## Constraints
- Do not provide legal advice; always state that documentation must be reviewed by qualified legal counsel.
- Do not ignore the "ICT Third-Party Risk" section; specific attention must be paid to cloud providers and blockchain infrastructure providers.
- Do not assume Stellar's decentralization exempts the platform from local EU resilience requirements.
- Never store private keys or sensitive credentials in the documentation generated.
