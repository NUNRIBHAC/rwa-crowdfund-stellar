# Order 13: guided testnet setup and repeat test

Status: local foundation only. Not connected to the running server or UI. No deployment or network transaction has been performed.

## Scope and limits

The intended flow is a guided repeat contribution test with fresh test assets. A new account is created or selected inside the user's wallet. The application must never request, create, import, store or export its private key. The installed Freighter API 6.0.1 exposes connection, network, address and signing methods, but no account-creation method. A one-click newly created wallet account is therefore not implemented by this foundation.

The application may automate testnet XLM funding and preparation/submission of an explicitly signed USDC trustline. Test USDC funding stays with the official faucet unless a separately verified and supported faucet interface is available. Do not advertise a fixed amount, guaranteed availability or a cooldown that has not been checked. A new account does not erase campaign history, reopen a closed campaign or remove contributions.

Sources checked on 2026-11-22:

- https://github.com/stellar/freighter-developer-docs/blob/main/extension/connecting.md
- https://developers.stellar.org/docs/tools/lab/account
- https://docs.varialwallet.com/extension-varial-sdk/extension

The latter documents the wallet SDK's new name. This change does not authorize a dependency migration and none is included.

## Implemented locally

- Pure service with injected network ports, no database or platform-secret dependency.
- Exact testnet network, Horizon origin and configured test USDC issuer gates.
- Public Ed25519 address validation; no secret or contract address input.
- Account read distinguishes HTTP404 from transport failure.
- XLM funding only for a confirmed missing account, followed by a fresh verification read.
- Unsigned trustline build for USDC, limit1000, fee100stroops, expiry180seconds.
- Signed submission restricted to one exact USDC trustline operation, the requested source, valid source signature, current sequence, bounded fee/expiry and no memo. Payments, extra operations and fee-bump envelopes are not accepted.
- API router has no-store responses, request allowlists, a per-IP/global bounded request budget and stable error codes without upstream diagnostics.
- Ports use fixed official testnet origins, no redirects and15-second read/funding deadlines.

The router is deliberately not mounted. There is no feature flag wired into the server yet. Synthetic signing tests use public deterministic seeds and never contact a network or create a user account.

## Required before completion

1. Add localized UI strings through the established translation workflow for all11languages, including every error and pending/uncertain state. No raw upstream text or English fallback.
2. Add account-page entry point or a clearly identified setup route. Keep this separate from a loss simulator and from synthetic sample campaigns.
3. Guide new account creation/selection in the wallet. Never label a guide as automatic wallet creation.
4. Before each effect or signature, re-read the wallet network and selected address. Require exact testnet passphrase and same address as the displayed setup state. Account/network changes invalidate pending setup state.
5. Block setup writes while an unresolved saved contribution intent exists. Adding a trustline changes the account sequence and could invalidate an already signed contribution. Do not clear or replace any saved intent to work around this.
6. Connect wallet, check status manually, fund missing XLM, build/sign/submit trustline, open the official USDC faucet, verify balance manually, then link to real available testnet campaigns. Do not make an automatic contribution.
7. Check signature cancellation, unavailable extension, network mismatch, changed account during approval, existing trustline, exhausted faucet, failed read, stale sequence and uncertain submission. No automatic retries after an uncertain submit.
8. Add router integration and adapter tests, then mount behind an explicit disabled-by-default testnet setup flag. Add rate-limit tests for global/cardinality expiry and router behavior.
9. Run full backend/frontend/UI-kit suites, builds, formatting, lint and i18n checks. Inspect all11languages, both themes and required widths, including Arabic. Synthetic tests do not prove a live wallet accepts the flow.
10. Keep local until review and separately approved release steps. No production/staging effects are included in this work.
