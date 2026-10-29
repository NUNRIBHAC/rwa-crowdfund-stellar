---
name: eu-crypto-crowdfunding-incident-response
description: Manage crisis communications for EU-regulated Stellar tokenization platforms following security or compliance incidents.
---

When to use
Use this skill when a crowdfunding platform operating in the EU on the Stellar network experiences a critical failure, including:
- Smart contract exploits or unauthorized token movements.
- Regulatory freezes or MiCA (Markets in Crypto-Assets) compliance breaches.
- Significant downtime affecting investor secondary market trading.
- Wallet compromise or loss of private keys for asset issuance.

## Instructions
1.  **Categorize the Incident:** Determine if the crisis is technical (Stellar network/contract), regulatory (ESMA/NCAs), or security-based (theft).
2.  **Verify Compliance Status:** Consult the MiCA and ECSP (European Crowdfunding Service Providers) requirements for mandatory notification timelines (often 24-72 hours).
3.  **Draft the "Initial Acknowledgment":** Within 60 minutes, issue a statement confirming the team is investigating. Do not speculate on the "attacker" or the total amount lost.
4.  **Chain Analysis:** Use StellarExpert or Horizon API data to trace the movement of the specific Asset Code and Issuer Address involved.
5.  **Multilingual Deployment:** Draft updates in English and the primary languages of the EU member states where the offering was registered.
6.  **Direct Investor Communication:** Prepare a specific email for token holders explaining the status of their underlying assets (e.g., "The underlying real estate asset remains secure; only the liquid token pool is affected").
7.  **Final Incident Report:** Once resolved, document the "Correction and Recovery" steps taken to satisfy National Competent Authority (NCA) requirements.

## Examples
**Scenario:** A liquidity pool on a Stellar DEX for a tokenized French vineyard is drained due to a bug.
**Action:** 
1. Pause the issuance bridge. 
2. Publish: "We are investigating unusual activity on the XLM/VINE pool. Trading is temporarily halted on our frontend. Assets are SAFU." 
3. Notify the AMF (France) via their portal. 
4. Update investors with the transaction hash of the drained funds to show transparency.

## Constraints
- **NO Speculation:** Never guess the identity of a threat actor or the "intent" behind a code failure.
- **NO Guarantee of Recovery:** Do not promise that funds will be returned unless they are already in a recovery escrow.
- **Privacy First:** Never include personal data (PII) of investors in public incident reports, even if their wallet addresses are public on the Stellar ledger.
- **Adhere to MiCA:** Do not bypass legal review for any statement regarding "Asset-Referenced Tokens" (ARTs) or "Electronic Money Tokens" (EMTs).
