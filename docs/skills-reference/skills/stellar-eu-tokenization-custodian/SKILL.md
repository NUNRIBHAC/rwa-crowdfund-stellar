---
name: stellar-eu-tokenization-custodian
description: Guidelines for managing asset custody and regulatory compliance for EU-based crowdfunding on the Stellar network.
---

When to use
Use this skill when designing or operating the custody layer for a crowdfunding platform that issues tokenized securities (STOs) in the European Union using the Stellar blockchain. This is applicable when dealing with MiCA (Markets in Crypto-Assets) compliance and CASP (Crypto-Asset Service Provider) requirements.

## Instructions
1.  **Select Custody Model**: Determine if the platform uses *Self-Custody* (user-managed keys via SEP-30), *Custodial* (platform holds keys), or *Hybrid* models. For EU crowdfunding, a licensed third-party custodian is often required to safeguard investor assets.
2.  **Verify MiCA Compliance**: Ensure the custody solution complies with MiCA Article 75, which mandates the segregation of client assets from the platform’s own assets and technical safeguards against cyber threats.
3.  **Implement Stellar SEP-24/31**: Use Stellar Ecosystem Proposals for deposit/withdrawal anchors to ensure a regulated flow of funds (Euro-stablecoins like EURC to fiat).
4.  **Enforce Clawback (SEP-35)**: Enable the `auth_clawback_enabled` flag on the Stellar asset. This is a mandatory regulatory requirement in the EU to reverse transactions in cases of fraud, lost keys, or legal court orders.
5.  **Address Multi-Sig Governance**: Require a minimum of 2-of-3 or 3-of-5 multisig for the platform’s "Issuer Account" to prevent single-point-of-failure thefts.

## Examples
**Scenario: Issuing a Tokenized Bond in Germany**
- **Action**: The agent sets up a Stellar account with `auth_required` and `auth_clawback_enabled` flags.
- **Custody**: Links the platform to a BaFin-licensed crypto custodian.
- **Distribution**: Uses SEP-10 for secure web3 authentication and SEP-12 for KYC data collection before allowing the custodian to sign the transaction.

## Constraints
- **Do NOT** issue assets without the `clawback` flag enabled for EU regulated securities.
- **Do NOT** store private keys in plaintext or unencrypted databases.
- **Do NOT** ignore the Crowdfunding Regulation (ECSPR) limit of €5 million per year for projects without a full prospectus.
- **Do NOT** mix operational platform funds with investor investment tokens.
