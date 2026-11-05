# Getting started

This page describes the current testnet prototype. Everything here uses test
assets with no monetary value.

## 1. Install Freighter

[Varial](https://varialwallet.com/) (formerly Freighter) is a
browser-extension wallet for Stellar. Install it, create or import an account, and switch the wallet
network to **Testnet**. The Blockallisto app may still call the wallet
"Freighter" - it is the same wallet under its new name
([announcement](https://stellar.org/blog/foundation-news/freighter-is-now-varial),
[changelog](https://varialwallet.com/changelog)).

## 2. Connect your wallet

Open [demo.92-5-187-71.sslip.io](https://demo.92-5-187-71.sslip.io)
and click **Connect**. Connecting shares your public wallet address with the
app so it can show balances and prepare investment transactions. Connecting
is not an account login and does not sign anything.

## 3. Browse campaigns

The investments page lists sample campaigns as funding blocks. Each
campaign page shows its terms: funding goal, deadline, and reward structure.

## 4. Make a test contribution

On an open campaign, choose an amount and confirm in Freighter. You sign the
investment transaction with your wallet; the smart contract records the
contribution in testnet USDC. Because funding is all-or-nothing, a
contribution to a campaign that misses its goal is refundable.

## 5. Sign in to your account

The account area uses a separate sign-in: you sign a one-time challenge
message in Freighter to prove you control the wallet - there is no password.
The session stays valid for 30 days.

For extra protection you can add an authenticator-app second factor (TOTP)
in the account's security section; single-use recovery codes are provided
when you enable it.

## 6. Explore your account

The account area shows your activity, including contribution history and
post-funding reports for backed campaigns.
