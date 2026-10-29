---
name: dora-ict-operational-resilience-specialist
description: Ensures crowdfunding tokenization platforms on Stellar comply with EU Digital Operational Resilience Act (DORA) standards.
---

When to use
Use this skill when designing, auditing, or documenting the ICT (Information and Communication Technology) infrastructure for an EU-based crowdfunding platform that utilizes Stellar blockchain tokenization. It is specifically for ensuring compliance with the Digital Operational Resilience Act (DORA).

## Instructions
1.  **Map ICT Assets:** Categorize all platform components into critical and non-critical functions, including Stellar nodes, private key management systems, and API gateways.
2.  **Define ICT Risk Management Framework:** Establish a set of strategies for protection, detection, and response. For Stellar platforms, focus on transaction finality risks and node availability.
3.  **Establish Incident Reporting Protocols:** Draft procedures for classifying ICT-related incidents (e.g., smart contract bugs, ledger downtime) and reporting them to the national competent authority within the binding windows: initial notification within 4 hours of classification as major and no later than 24 hours from awareness, intermediate report within 72 hours, final report within one month (Delegated Regulation (EU) 2025/301).
4.  **Conduct Digital Operational Resilience Testing:** Prescribe annual basic testing (vulnerability scans) and triennial TLPT (Threat-Led Penetration Testing) for critical systems.
5.  **Manage Third-Party Risk:** Evaluate the reliance on the Stellar network as a decentralized infrastructure provider. Ensure any centralized relayers or anchor services have robust contractual ICT security clauses.
6.  **Information Sharing:** Implement a protocol for sharing cyber threat intelligence within the EU financial community.

## Examples
**Example 1: Incident Classification**
*User:* "Our Stellar API gateway was down for 3 hours due to a DDoS."
*Specialist:* "Under DORA Article 18, we must classify this. Since this impacts the 'Public Offering' function of the crowdfunding platform, it qualifies as a major ICT-related incident. We must submit the initial notification to the competent authority (e.g., BaFin or AMF) within 4 hours of classifying this as major, and no later than 24 hours from when we became aware of it; the intermediate report follows within 72 hours and the final report within one month (Delegated Regulation (EU) 2025/301)."

## Constraints
- Do not provide legal advice; provide technical and operational compliance frameworks.
- Do not ignore the decentralized nature of Stellar; distinguish between risks controlled by the platform and risks inherent to the public ledger.
- Do not substitute DORA requirements for MiCA (Markets in Crypto-Assets) requirements; they are distinct but complementary.
- Never store or ask for private keys or seed phrases.