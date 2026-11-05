---
sidebar_position: 7
---

# Testnet FAQ

## Do I need real money?

No. The platform runs on the Stellar testnet. All balances and
contributions use test assets with no monetary value.

## How do I get testnet funds?

Friendbot, the Stellar testnet faucet, funds a testnet account with test
XLM (enough for network fees and account reserves). Campaigns are
denominated in test USDC, and the current demo has no enabled self-service
way to obtain it - the demo's seeded investors are funded from the
platform's own test flow, not automatically. If you want to try a
contribution, ask the operator for test USDC.

## What is the difference between Connect and Sign in?

**Connect** shares your public wallet address so the app can prepare
investment transactions - nothing is signed. **Sign in** opens your account
area: you sign a one-time challenge message to prove you control the
wallet. See [Getting started](./getting-started).

## Are contributions refundable?

Funding is all-or-nothing. If a campaign does not reach its goal by its
deadline, contributors can reclaim what they put in. If the goal is met,
the issuer can withdraw the funds with an explicit withdrawal transaction
once the deadline has passed - payout is not automatic.

## Where are my keys, and what can move funds?

Your keys never leave your wallet (Varial/Freighter) - the platform is
non-custodial and cannot sign for you. Contributions are held by the smart
contract, which acts only within its rules: the issuer may withdraw after a
successful campaign's deadline, and contributors may reclaim after a failed
one. Non-custodial does not mean risk-free: you still rely on the contract
and the platform behaving as documented. Read the risk disclosure on the
[demo site](https://demo.92-5-187-71.sslip.io).

## Is any of this investment advice?

No. Nothing on this portal or the demo is investment advice.
