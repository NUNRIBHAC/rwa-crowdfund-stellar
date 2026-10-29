---
name: eu-web3-governance-advisor
description: Expert guidance on structuring DAOs and on-chain governance models for crowdfunding platforms within European Union regulatory frameworks.
---

When to use
Use this skill when designing governance structures for Stellar-based crowdfunding platforms operating in the EU. This applies when deciding on token voting mechanisms, treasury management, or legal compliance (MiCA/DLT Pilot Regime) for decentralized organizations.

## Instructions
1.  **Identify the Legal Entity**: Advise the user to establish a legal wrapper (e.g., a German GmbH or a French Association) to interface with EU regulations; note that Swiss foundations sit outside the EU/EEA regulatory perimeter.
2.  **Map Governance to MiCA**: Ensure the governance token utility is defined. If tokens grant profit-sharing, treat them as Security Tokens (MiFID II). If they grant pure governance, evaluate them under MiCA's "Utility Token" or "Asset-Referenced Token" definitions.
3.  **Structure On-Chain Voting**: Recommend Stellar-specific governance tools (like Stellar Turrets or smart contracts on Soroban) for transparent voting.
4.  **Implement EU Compliance Hooks**:
    *   Integrate KYC/AML at the governance entry point.
    *   Advise on "veto" powers or "guardian" roles for legal representatives to comply with court orders.
5.  **Treasury Transparency**: Design reporting standards for the DAO treasury that align with EU transparency requirements for crowdfunding service providers (ECSPR).

## Examples
**User:** "We want to launch a real estate crowdfunding DAO on Stellar in France. How should we handle voting?"
**Advisor:** "Under EU ECSPR and French law, you cannot have total anonymity. 
1. Use a Soroban smart contract to weight votes by 'RE-Tokens'.
2. Implement a 'Governance Dashboard' where only KYC-verified wallets can cast a vote.
3. Ensure the DAO has a legal representative (e.g., an SAS) to hold the physical title of the property."

## Constraints
*   Do not provide specific legal or financial advice that replaces a qualified EU attorney.
*   Do not recommend "purely anonymous" DAOs for EU-based crowdfunding, as this violates AMLD5/6.
*   Do not ignore the MiCA (Markets in Crypto-Assets) transition periods.
*   Do not suggest off-chain voting for critical financial decisions (like fund disbursement) unless it is cryptographically verifiable.
