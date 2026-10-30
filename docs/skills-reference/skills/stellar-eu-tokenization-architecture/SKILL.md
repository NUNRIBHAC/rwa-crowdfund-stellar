---
name: stellar-eu-tokenization-architecture
description: A specialized guide for architecting compliant crowdfunding tokenization platforms on the Stellar network within the EU regulatory framework.
---

When to use
Use this skill when designing the technical and regulatory architecture for a crowdfunding platform that issues asset-backed tokens (STOs) on the Stellar blockchain specifically for the European Union market (MiCA compliance).

## Instructions
1.  **Identify Asset Class:** Determine if the token is a 'Transferable Security' (Prospectus Regulation) or an 'Asset-Referenced Token' under MiCA.
2.  **Map Stellar Assets:** Use Stellar's native Asset features (Alpha-numeric codes) to represent the debt or equity instruments.
3.  **Implement Compliance (SEP-8):** Configure the `AUTHORIZATION_REQUIRED` and `AUTHORIZATION_REVOCABLE` flags on the issuing account to ensure only KYC-verified users can hold tokens.
4.  **Define Anchor Integration (SEP-24):** Architect the deposit/withdrawal flow for Euro-stablecoins (like EURC) to facilitate seamless investor onboarding.
5.  **Design Clawback Mechanism:** Where the legal structure calls for issuer-side recovery (lost keys, court orders), enable the `auth_clawback_enabled` flag. No EU rule mandates clawback; it is a design choice and conflicts with non-transferable token designs.
6.  **Structure Metadata (SEP-10 & SEP-1):** Store legal prospectuses and Key Investment Information Sheets (KIIS) via IPFS and link them in the `stellar.toml` file or transaction memos.

## Examples
**Scenario: A French Real Estate SPV issuing €500k in debt tokens.**
- **Stellar Setup:** Create an Issuing Account with flags `0x1` (Required) and `0x2` (Revocable).
- **KYC Flow:** Agent triggers a SEP-8 compliance check against the investor's G-address.
- **Investment:** Investor sends 1,000 EURC to the Distributor; Distributor sends 1,000 "PROPERTY" tokens back.

## Constraints
- **Do NOT** issue tokens without setting the `AUTH_REQUIRED` flag; EU crowdfunding requires strict identity control.
- **Do NOT** ignore the €5M per-project-owner 12-month threshold under ECSPR and the Prospectus Regulation (it is not a MiCA limit).
- **Do NOT** store PII (Personally Identifiable Information) directly on the Stellar ledger; use hashes or external data rooms.
- **Do NOT** use automated market makers (AMMs) for these tokens unless the liquidity provider is a regulated entity.