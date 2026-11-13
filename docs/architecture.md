# Architecture guide

These diagrams map the source at commit `045e042ceccf406818a898bfc774c2fb12c11eed`
(12 November 2026). They are a code-reading aid, not evidence that every path
has passed live integration tests or that a service is production-ready.
The project remains testnet-only; no real funds or verified investment rights
are represented here.

The images are stored in the existing `blockallisto-media` B2 bucket under
`public/architecture/` and served through the existing public media Worker.
No credentials or signed download links are required. Open each full-size SVG
to zoom in on labels. Text below remains available if external media is blocked.

## Whole system

Browser, API, records, testnet contracts, identity, mail, media and delivery.

[![Browser, API, records, testnet contracts, identity, mail, media and delivery.](https://blockallisto-public-media.pages.dev/architecture/system-light-adcddcb9ea17417dab6b835f620e97d1.svg)](https://blockallisto-public-media.pages.dev/architecture/system-light-adcddcb9ea17417dab6b835f620e97d1.svg)

[Open full-size SVG](https://blockallisto-public-media.pages.dev/architecture/system-light-adcddcb9ea17417dab6b835f620e97d1.svg). The browser signs through Freighter. The API validates and submits signed transactions; it does not hold wallet private keys.

## Accounts, community and safety

Sign-in, account sessions, TOTP, community requests and external proof services.

[![Sign-in, account sessions, TOTP, community requests and external proof services.](https://blockallisto-public-media.pages.dev/architecture/accounts-community-light-48093798a83749750ec9c7fae14f781e.svg)](https://blockallisto-public-media.pages.dev/architecture/accounts-community-light-48093798a83749750ec9c7fae14f781e.svg)

[Open full-size SVG](https://blockallisto-public-media.pages.dev/architecture/accounts-community-light-48093798a83749750ec9c7fae14f781e.svg). Email remains the primary route. Telegram phone is an explicit, gated alternative, not a bot-message OTP flow.

## Transactions and durable evidence

Wallet signing, transaction validation, reconciliation, queues, journals and event archives.

[![Wallet signing, transaction validation, reconciliation, queues, journals and event archives.](https://blockallisto-public-media.pages.dev/architecture/transactions-light-5f4b99ab618b840f5ff9bca88a9dcc16.svg)](https://blockallisto-public-media.pages.dev/architecture/transactions-light-5f4b99ab618b840f5ff9bca88a9dcc16.svg)

[Open full-size SVG](https://blockallisto-public-media.pages.dev/architecture/transactions-light-5f4b99ab618b840f5ff9bca88a9dcc16.svg). The v1 contract moves testnet tokens. The v2 code provides offering and share-ledger primitives. An event archive is not a complete disaster-recovery backup.

## Delivery, documentation and held code

Builds, CI, translations, documentation, hosting and isolated QA.

[![Builds, CI, translations, documentation, hosting and isolated QA.](https://blockallisto-public-media.pages.dev/architecture/supporting-light-16e7b084d8e674625bc0a0055360d776.svg)](https://blockallisto-public-media.pages.dev/architecture/supporting-light-16e7b084d8e674625bc0a0055360d776.svg)

[Open full-size SVG](https://blockallisto-public-media.pages.dev/architecture/supporting-light-16e7b084d8e674625bc0a0055360d776.svg). Classic write routes are disabled. Simulations and the infrastructure prototype are not live money-moving services.

## Earlier whole-code overview

This fifth diagram labels itself `main @ 177c8c1` (12 November 2026). It is
retained for comparison, not presented as the newer `045e042` source map.
Its smaller labels are best read in the full-size SVG.

[![Earlier whole-code overview - source177c8c1](https://blockallisto-public-media.pages.dev/architecture/blockallisto-architecture-5997b399.svg)](https://blockallisto-public-media.pages.dev/architecture/blockallisto-architecture-5997b399.svg)

[Open full-size SVG](https://blockallisto-public-media.pages.dev/architecture/blockallisto-architecture-5997b399.svg).

## Reading limits and related code

- Record stores are selected by configuration. A database node does not prove
  the state, backups, permissions or availability of a hosted database.
- A source connection shows intended data flow, not an end-to-end acceptance
  result. Deployment and QA nodes do not certify that a release passed its gates.
- This is a versioned snapshot. Recheck the implementation before using a
  diagram to make an operational or security decision.
- [Community and account API](community-api.md)
- [Soroban flow and live-test gates](soroban-flow.md)
- [Testnet deployment](testnet-deployment.md)
- [Contract source and limits](../contracts/crowdfund/README.md)

## Media provenance

All five SVGs above were read from B2 and checked byte-for-byte
against their public responses on 12 November 2026. They are linked rather
than copied into the repository or app images. Together they are 656,537 bytes;
viewing this guide uses the existing media service and its request limits.

The older overview is 568,021 bytes of that total. Its key and image bytes
are unchanged. No image is copied into the repository or app build.
