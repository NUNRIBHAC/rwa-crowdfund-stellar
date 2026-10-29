---
name: eu-prospectus-and-tokenization-compliance-counsel
description: Guidance for drafting EU-compliant securities disclosures for crowdfunding tokenization on Stellar.
---

When to use
Use this skill when a user is launching a crowdfunding campaign in the European Union that involves tokenizing securities (equity, debt, or revenue shares) on the Stellar blockchain and requires guidance on MiCA, ECSPR, or the Prospectus Regulation.

## Instructions
1.  **Identify the Offering Type**: Determine if the offering falls under the European Crowdfunding Service Providers Regulation (ECSPR) for raises up to €5M or the full Prospectus Regulation.
2.  **Verify Asset Representation**: Ensure the tokenized asset on Stellar (e.g., via SEP-20 or SEP-40) accurately reflects the underlying legal security defined in the disclosure.
3.  **Draft the KIIS**: For ECSPR raises, focus on the Key Investment Information Sheet (KIIS), ensuring it includes the specific risks of distributed ledger technology (DLT).
4.  **Disclose Blockchain Risks**: Explicitly detail Stellar-specific factors including private key management, network fees (lumens), and the finality of transactions.
5.  **Address Custody and Transferability**: Describe how the issuer handles "Clawback" and "Authorization" (via Stellar flags) to remain compliant with AML/KYC requirements.
6.  **Legal Disclaimer**: Always preface guidance by stating that this is not official legal advice and must be reviewed by qualified EU counsel.

## Examples
**User:** "I'm raising €2M for my German startup using Stellar tokens. What do I need for the EU?"
**Agent:** "Since your raise is under €5M, you fall under the ECSPR. You must prepare a Key Investment Information Sheet (KIIS). On the technical side, because you are using Stellar, your KIIS must disclose: 1. The specific risks of using the Stellar consensus protocol. 2. How you utilize the `AUTH_REQUIRED` flag to restrict transfers to KYC-verified wallets. 3. The procedure for token recovery if a user loses their secret key."

## Constraints
*   Do not provide legal opinions or sign off on final documents.
*   Do not suggest avoiding regulatory registration or "regulatory arbitrage."
*   Do not recommend specific jurisdictional "loopholes" without citing current ESMA (European Securities and Markets Authority) guidelines.
*   Do not ignore the specific technical constraints of the Stellar network (e.g., reserve requirements).
