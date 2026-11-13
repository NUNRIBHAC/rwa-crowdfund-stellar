# Architecture guide

All five views describe source `9f4ac1c2f1203b42b224037ec3094a3660a04fe5`
(13 November 2026). Runtime notes below are a separate snapshot of the same date,
not an assertion that every source path is enabled or deployed. This remains a
testnet prototype, not a production-ready investment service.

Images are linked from the existing public media Worker, backed by the existing
`blockallisto-media` B2 bucket under `public/architecture/`. They are not bundled
in the repository or app image. Click any image for its full-size SVG and readable
labels. The text under each image remains available if external media is blocked.

## Whole system

Browser, server, records, testnet and external services.

[![Whole system - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/system-9f4ac1c-a0585e895442.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/system-9f4ac1c-a0585e895442.svg)

[Open full-size SVG](https://blockallisto-media.nunrib-df6.workers.dev/architecture/system-9f4ac1c-a0585e895442.svg). The browser signs through Freighter; the API validates and submits exact envelopes. Community records, identity, mail and public media remain separate services. Google Fonts HTML links are not part of the frontend entry point.

## Accounts, community and document safety

Shared process runtime, authenticated workflows and explicit storage gates.

[![Accounts, community and document safety - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/accounts-community-9f4ac1c-0ecb84387763.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/accounts-community-9f4ac1c-0ecb84387763.svg)

[Open full-size SVG](https://blockallisto-media.nunrib-df6.workers.dev/architecture/accounts-community-9f4ac1c-0ecb84387763.svg). The default community factory shares its in-flight initialization and resulting service across request and background callers in one process. Upload-mode discovery is authenticated and not cached. Only the owner's draft documents can be added, replaced or deleted; Submit freezes changes. Successful empty DELETE responses are accepted by the client. The OCI private workflow and finite cleanup worker require explicit gates; staging has both OFF and uses legacy-inline. Private-document retention remains an activation review item.

## Transactions and durable evidence

Exact envelopes, uncertainty preservation and historical contribution records.

[![Transactions and durable evidence - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/transactions-9f4ac1c-f47932caaba5.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/transactions-9f4ac1c-f47932caaba5.svg)

[Open full-size SVG](https://blockallisto-media.nunrib-df6.workers.dev/architecture/transactions-9f4ac1c-f47932caaba5.svg). The journal preserves exact signed envelopes before submission; ambiguous status is not failure or permission to create a replacement. The crowdfund v1 contract controls caps, escrow, withdrawal and refunds. Account contribution records survive a successful creator withdrawal and are not current escrow. The v2 offering/share-token source is a separate model. Queues and event archives are not a full disaster-recovery backup.

## Delivery, documentation and held code

Reviewed releases, app-only builds, translations and explicit QA limits.

[![Delivery, documentation and held code - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/supporting-9f4ac1c-d6867bdbd508.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/supporting-9f4ac1c-d6867bdbd508.svg)

[Open full-size SVG](https://blockallisto-media.nunrib-df6.workers.dev/architecture/supporting-9f4ac1c-d6867bdbd508.svg). The dedicated app-oled builder uses BuildKit 0.35.0 with its own OCI worker state on OLED. Final image loading still uses root storage. Builds do not activate apps. The approved release path builds explicitly and activates the selected environment with --no-build after gates. Staging runs source 9f4ac1c (PR #172); demo remains cd6eddc. Main does not automatically deploy either environment. Weblate supplies eleven locales. JavaScript/Rust/secret-scan checks do not replace real-wallet or complete visual acceptance; Argos upload is held at its plan quota.

## Whole-code overview

Current source groups and their boundaries.

[![Whole-code overview - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/overview-9f4ac1c-9c17c73afe53.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/overview-9f4ac1c-9c17c73afe53.svg)

[Open full-size SVG](https://blockallisto-media.nunrib-df6.workers.dev/architecture/overview-9f4ac1c-9c17c73afe53.svg). This overview groups the current source into the SPA, server boundary, identity/community, document storage, transaction evidence, contract models, delivery and explicitly non-live code. Grouping is not a data-flow sequence. Classic write routes return HTTP 410; simulation and infrastructure-prototype code does not represent a live payout service.

## Deployment snapshot

| Environment | Source                                               | Running image ID                                                          |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Staging     | `9f4ac1c2f1203b42b224037ec3094a3660a04fe5` (PR #172) | `sha256:bcb2f58abcf87bb88d34ed58c76e71b34394ca30dba41d4f7cc78167f1544486` |
| Demo        | `cd6eddca22c1ac77c3fecf8ba1eb1682d5119315`           | `sha256:a8fb3da59930f974cd83250d56a506af73df0395c57c494e9af6be0dfbe5951f` |

A merge is not an automatic deployment. Staging and demo are approved, verified
releases on the Oracle VM. Their runtime source can differ from current main.

## Reading limits and related code

- A source path shows intended behavior, not end-to-end acceptance. Fake-provider
  tests and in-memory Rust tests do not prove real-wallet behavior or live OCI
  activation. Full pages x locales x themes visual QA remains incomplete.
- Store and provider selection is configuration-dependent. A database or provider
  box does not certify its availability, permissions, backups or legal compliance.
- Private upload and cleanup are not activated by these diagrams. Their existing
  enablement, storage-identity, cost and retention review gates still apply.
- An event archive is not a full disaster-recovery backup. An unknown signed
  transaction remains an unresolved intent, not a failed or absent transaction.
- [Community and account API](community-api.md)
- [Private application runtime gates](private-application-runtime.md)
- [Soroban flow and live-test gates](soroban-flow.md)
- [Contract source and limits](../contracts/crowdfund/README.md)
- [App-only OLED builder](app-oled-builder.md)

## Media provenance

The five content-named SVGs total 50,268 bytes. Their
source labels, public MIME type and byte hashes were checked on 13 November 2026.
Public media uses the existing service and its request limits; this update does
not change bucket visibility, access policy, account settings or app releases.
