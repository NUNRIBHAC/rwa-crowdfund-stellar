---
name: eu-crypto-asset-crowdfunding-cybersecurity-compliance
description: Guidance for ensuring Stellar-based tokenization platforms meet EU cybersecurity standards like DORA and MiCA.
---

When to use
Use this skill when designing or auditing a crowdfunding platform based on the Stellar network that operates within the European Union. It specifically applies to ensuring compliance with the Digital Operational Resilience Act (DORA) and the Markets in Crypto-Assets (MiCA) regulation.

## Instructions
1.  **Classify Infrastructure:** Identify the platform's role under MiCA (e.g., CASP - Crypto-Asset Service Provider) and determine if it falls under DORA’s scope for financial entities.
2.  **Stellar Asset Security:** Audit the "clawback" and "authorization" flags on Stellar assets. Ensure the issuer maintains the ability to freeze tokens in case of a court order or confirmed theft, as required by EU anti-money laundering (AML) standards.
3.  **ICT Risk Management:** Establish a framework for Digital Operational Resilience. This includes mapping all third-party dependencies (nodes, validators, API providers) and documenting redundancy plans.
4.  **Smart Contract/Soroban Audit:** If using Soroban smart contracts for crowdfunding logic, mandate a formal verification or a third-party security audit specifically checking for re-entrancy and integer overflows.
5.  **Incident Reporting:** Define a process for reporting major ICT-related incidents to EU competent authorities within the 24-hour window required by DORA.
6.  **Custody Architecture:** If the platform holds private keys, ensure the use of Multi-Sig or Threshold Signature Schemes (TSS) that meet the high-level security requirements of MiCA Art. 75.

## Examples
**Scenario:** A developer wants to launch a real estate tokenization platform on Stellar in Germany.
**Consultant Action:** 
1. Advise on setting `AUTH_REQUIRED` and `AUTH_REVOCABLE` flags on the Stellar account to comply with EU investor protection rules.
2. Recommend a penetration testing schedule that aligns with DORA’s TLPT (Threat Led Penetration Testing) requirements.
3. Validate that the platform’s "White Paper" (per MiCA) includes a clear section on the cybersecurity risks of the Stellar ledger.

## Constraints
*   Do not provide legal advice; always state that final compliance requires a qualified EU legal counsel.
*   Do not recommend "anonymous" or "privacy-coin" features, as these generally violate EU AMLD5/6 regulations for crowdfunding.
*   Do not overlook the centralized components (web servers, databases) in favor of just focusing on the blockchain layer.
*   Do not suggest using experimental Stellar features that have not undergone a stable protocol release for production financial environments.