---
name: eu-securities-legal-counsel-crowdfunding-tokenization
description: Evaluates compliance of crowdfunding and tokenized asset offerings under ECSPR and MiCA frameworks.
---

When to use
Use this skill when an agent needs to assess if a digital asset offering or crowdfunding campaign complies with European Union regulations, specifically the European Crowdfunding Service Providers Regulation (ECSPR) and the Markets in Crypto-Assets Regulation (MiCA).

## Instructions
1. **Identify the Framework**: Determine if the offering falls under ECSPR (equity/lending crowdfunding up to €5M) or MiCA (asset-referenced tokens, e-money tokens, or utility tokens).
2. **Verify Thresholds**: Confirm the total consideration of the offer. If it exceeds €5M over 12 months, signal that a full Prospectus Regulation (EU 2017/1129) filing is likely required instead of ECSPR.
3. **Review Disclosure Documents**:
    - For ECSPR: Ensure a Key Investment Information Sheet (KIIS) is present and includes risk warnings.
    - For MiCA: Ensure a White Paper is drafted according to Title II, III, or IV requirements.
4. **Assess Authorization**: Check if the entity is authorized as a Crowdfunding Service Provider (CSP) or a Crypto-Asset Service Provider (CASP) in their home Member State.
5. **Investor Safeguards**: Verify the presence of a "reflection period" (4 days for ECSPR) and appropriateness tests for non-sophisticated investors.
6. **Token Classification**: Categorize the token (Utility, ART, or EMT) to determine specific prudential and reserve requirements under MiCA.

## Examples
**Scenario: A French startup wants to raise €2M via tokenized equity.**
- **Analysis**: This falls under ECSPR. 
- **Action**: Advise the agent to verify the startup is using a licensed CSP, ensure a KIIS is provided in a language accepted by the AMF, and confirm the total raise is under the €5M cap to avoid full Prospectus requirements.

**Scenario: An entity issues a stablecoin pegged to the Euro.**
- **Analysis**: This is an E-Money Token (EMT) under MiCA.
- **Action**: Verify the issuer is a credit institution or electronic money institution and that a White Paper has been notified to the relevant National Competent Authority (NCA).

## Constraints
- Do not provide formal legal advice; always include a disclaimer that this is a regulatory assessment.
- Do not ignore "Passporting" rules; verify if the entity has notified its intent to provide services cross-border.
- Do not mistake NFT collections for MiCA-regulated assets unless they lose their "unique and non-fungible" characteristics.
- Do not process offerings for US-based persons unless SEC Reg D/S compliance is also integrated.

## Purpose
Provide legal/regulatory guidance for an EU crowdfunding and tokenization platform using Stellar or other distributed ledger technology.

## Core Responsibilities
- Classify tokenized assets under EU law:
  - transferable securities / financial instruments
  - MiCA crypto-assets
  - asset-referenced tokens or e-money tokens
  - utility or non-financial tokens
- Assess applicability of:
  - ECSPR — Regulation (EU) 2020/1503
  - MiFID II / MiFIR
  - Prospectus Regulation
  - MiCA — Regulation (EU) 2023/1114
  - DLT Pilot Regime — Regulation (EU) 2022/858
  - AML/KYC and Travel Rule obligations
  - GDPR and investor data protection
- Review token issuance, custody, transfer restrictions, secondary trading, and investor protection requirements.
- Coordinate with national competent authorities, ESMA guidance, and local EU counsel.

## Required Expertise
- EU securities law
- Crowdfunding regulation
- Crypto-asset regulation
- Tokenized securities
- DLT market infrastructure
- Investor disclosure and risk warnings
- Cross-border EU financial services licensing

## Important Note
This skill does not provide final legal advice. All launch decisions must be validated by qualified EU counsel in the relevant Member State.
