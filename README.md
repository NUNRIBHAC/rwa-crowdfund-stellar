# Blockallisto - Stellar testnet crowdfunding prototype

Blockallisto is a deployed testnet prototype with a React/TypeScript frontend,
a Node.js 24/Express API and Soroban contracts. Its active crowdfund v1 flow
uses contract escrow, all-or-nothing funding and atomic cap enforcement.
Contribution balances are nontransferable historical records, not current
escrow balances. Classic payment writes are disabled.

No real funds, verified investment rights, real identity verification or
production-readiness claim is represented by this prototype.

## Architecture

The five original images below are retained as dated source snapshots. The
first four map `045e042` (12 November 2026); the fifth maps `177c8c1`.
They are not diagrams of current source `9f4ac1c`, and are not evidence that
all capabilities are enabled, deployed or fully tested. Click an image for
its full-size SVG and readable labels. The
[architecture guide](docs/architecture.md) describes these same snapshots.

Visible age limits: the accounts view does not show the current shared
community runtime, authenticated upload-mode discovery or draft/private-upload
workflow. The transaction view does not explain that account contribution
records survive creator withdrawal and are not current escrow. The delivery
view does not show the dedicated app-oled builder, separate approved releases
or the current Argos upload limit. The dense whole-code overview is the older
`177c8c1` map, not a current-source inventory. Current behavior and runtime
boundaries are described in the text below, without relabeling these images.

### Whole system - source045e042

[![Whole system - source045e042](https://blockallisto-public-media.pages.dev/architecture/system-light-adcddcb9ea17417dab6b835f620e97d1.svg)](https://blockallisto-public-media.pages.dev/architecture/system-light-adcddcb9ea17417dab6b835f620e97d1.svg)

### Accounts, community and safety - source045e042

[![Accounts, community and safety - source045e042](https://blockallisto-public-media.pages.dev/architecture/accounts-community-light-48093798a83749750ec9c7fae14f781e.svg)](https://blockallisto-public-media.pages.dev/architecture/accounts-community-light-48093798a83749750ec9c7fae14f781e.svg)

### Transactions and durable evidence - source045e042

[![Transactions and durable evidence - source045e042](https://blockallisto-public-media.pages.dev/architecture/transactions-light-5f4b99ab618b840f5ff9bca88a9dcc16.svg)](https://blockallisto-public-media.pages.dev/architecture/transactions-light-5f4b99ab618b840f5ff9bca88a9dcc16.svg)

### Delivery, documentation and held code - source045e042

[![Delivery, documentation and held code - source045e042](https://blockallisto-public-media.pages.dev/architecture/supporting-light-16e7b084d8e674625bc0a0055360d776.svg)](https://blockallisto-public-media.pages.dev/architecture/supporting-light-16e7b084d8e674625bc0a0055360d776.svg)

### Earlier whole-code overview - source177c8c1

[![Earlier whole-code overview - source177c8c1](https://blockallisto-public-media.pages.dev/architecture/blockallisto-architecture-5997b399.svg)](https://blockallisto-public-media.pages.dev/architecture/blockallisto-architecture-5997b399.svg)

## Implemented behavior and boundaries

### Campaigns and transaction evidence

- Crowdfund v1 supports testnet contribution, all-or-nothing settlement,
  creator withdrawal after successful funding and contributor refunds after
  unsuccessful funding. The contract is the cap and escrow authority.
- The frontend asks Freighter to sign the prepared envelope. The backend
  validates the exact signed transaction and preserves its intent before
  submission. An unresolved signed intent is not treated as failure or
  silently replaced. Account contribution records are not a valuation,
  transferable security or current escrow total.
- Contributor records, operator reconciliation, share-register exports
  (JSON/CSV/PDF), durable recovery queues and event archives support review.
  A journal covers this deployment's recorded intents, not all chain history.
- Offering and share-token v2 contracts are a separate source model, not
  transferable receipts for crowdfund v1. An operator-only campaign builder
  can prepare deployment transactions for wallet signing. A created contract
  is not automatically listed: its returned registry entry requires a
  separate configuration step. Source and tests do not prove live deployment
  authorization or real-wallet end-to-end acceptance.
- Classic campaign write routes return HTTP 410. Preserved classic records
  and uncertain intents are for separate reconciliation, not an active
  alternative payment flow or an automatic migration.

### Accounts, community and issuer applications

- Wallet sign-in uses a one-time challenge and server-verified sessions.
  Email/password registration, localized verification and reset mail,
  TOTP, session management and linked social-provider integrations are
  implemented. Telegram phone registration is an explicit gated alternative.
  Provider configuration and real-browser acceptance vary by environment.
- Comments, news, support tickets and issuer applications use authenticated
  routes, ownership checks, schemas and per-account/per-IP limits.
  Operator routes use configured operator identities; separate admin routes
  retain a demo-grade shared-secret gate. Neither is evidence of verified
  issuer identity, KYC approval or production access governance.
- The For Businesses form (`/for-businesses`, also `/financing`) and Account
  area expose the signed-in user's applications, tickets and content.
  Draft document controls allow add, replace and delete only before Submit.
  The client reads the authenticated, non-cached upload mode before choosing
  its protocol and accepts successful empty document-deletion responses.
- The configured default is `legacy-inline`. Staging has OCI private upload
  and private cleanup OFF. The gated private workflow is synthetic `.txt`
  only, 16 KB maximum and five documents; it uses ownership/hash checks,
  durable intents and finite cleanup of requested deletion jobs. It does not
  silently migrate inline data or delete submitted live references.
- Standard ticket/application retention defaults to 90 days. Private
  references and unresolved cleanup jobs are retained for separate review.
  Private-provider activation still requires storage identity, access,
  credentials, cost and retention review. See the
  [private runtime gates](docs/private-application-runtime.md).
- The default community factory shares its in-flight initialization,
  service, store and pruning timer within one process. Its PostgreSQL pool
  can close after failed startup. This is not a global connection-budget
  guarantee or a distributed rate limiter.

### Interface, media and legal content

- Eleven UI locales: English, Portuguese (PT-PT), Spanish, French, German,
  Simplified Chinese, Traditional Chinese, Japanese, Korean, Arabic and
  Hindi. Arabic uses right-to-left text with the shared layout. Weblate
  maintains translations and the repository checks its JSON projection.
- Light/dark themes, responsive pages, campaign tabs, an account summary,
  historical contribution records, recent activity, wallet information and
  an onboarding checklist are implemented. Full pages x locales x themes
  visual acceptance is not complete.
- Fonts, logos, social icons, animations and architecture images are served
  through the existing public Cloudflare Worker backed by B2, not bundled
  in the app image. The frontend HTML has no Google Fonts links. External
  media remains subject to its service availability and request limits.
- The footer links the Blockallisto social profiles. The block-fill
  illustration explains funding; it is not live funding activity.
- Terms, privacy, risk, legal notice, conflicts, complaints and business
  continuity pages use translated demo templates under `legal/`.
  Machine-assisted translations are not confirmed human/legal review.
  `[DEMO]` particulars are not verified operator/data-controller details,
  investment advice, registration or regulatory authorization.

## Deployment snapshot and known limits

Snapshot: 13 November 2026.

- [Staging](https://staging.92-5-187-71.sslip.io) runs source `9f4ac1c`
  (PR #172).
- [Public demo](https://demo.92-5-187-71.sslip.io) runs source `cd6eddc`,
  image ID `a8fb3da59930`. Its public registry exposes `demo-solar` on testnet.
  It does not include every current-main change.
- Both environments are hosted on the Oracle VM. Merging to main does not
  automatically deploy either environment. The dated release identifiers above describe deployment, not the
  older architecture-image snapshots.
  `render.yaml` is reference-only.
- The dedicated `app-oled` Buildx builder uses BuildKit 0.35.0 and an OCI
  worker with state on OLED. Builds check disk reserves and load an explicit
  image into Docker, which still consumes root storage. Builds do not activate
  apps or change the global default builder. Reviewed activation uses the
  selected built image with `--no-build`; see the
  [builder and release gates](docs/app-oled-builder.md).
- Real Freighter browser acceptance, including Ledger-backed wallets,
  complete visual/language acceptance and live deployment authorization
  remain separate verification work. Fake-provider and in-memory tests do
  not establish these outcomes.
- Community PostgreSQL storage is one JSONB document, not a per-entity
  relational schema. Limits and runtime sharing are per process. Production
  access governance, legal review and operational assurance are not complete.
- The Argos main-branch upload is held at its plan quota. Synthetic captures
  are not evidence that live authenticated flows or every visual state passed.
  No automatic paid upgrade is part of the workflow.
- Distribution/meeting simulations and the separate infrastructure prototype
  are test-only. They do not approve real people, define legal rights or move
  fiat. Event archives do not establish a complete recovery backup.

## Brand

The Blockallisto visual identity (Fraction logo, palette, typography, UI kit
and motion specifications) is in [brand/](brand/README.md), with editable SVG
sources, PNG exports, icons, social graphics and design tokens. It is a
prototype identity, not evidence of trademark clearance or registration.
The same all-rights-reserved terms apply.

## Rights

Copyright (c) 2026 Nuno Ribeiro. All rights reserved. No permission is
granted to reuse, modify or redistribute the original code or
documentation, except as required by applicable law or GitHub's terms.
Material under `docs/skills-reference/` retains its separately stated
rights and licenses.

No open-source license or patent grant is given. The same notice is kept
in [NOTICE](NOTICE).

## Run locally

Requires Node.js 24. Run tests in an isolated checkout, not inside a live
app container or with hosted-service credentials inherited.

```sh
npm ci
npm test
npm run build
npm run dev:backend
npm run dev:frontend
```

Copy `backend/.env.example` to `backend/.env` for local configuration.
`SOROBAN_CAMPAIGNS_JSON=[]` intentionally shows no campaigns. Add only reviewed,
verified testnet contract entries; configuring a registry does not deploy a
contract or migrate classic state. Do not unlock classic setup/demo/reset
scripts for the active Soroban flow.

Set `COMMUNITY_DATABASE_URL` explicitly for community PostgreSQL storage.
When that variable is unset, the factory can use `SOROBAN_JOURNAL_DATABASE_URL`;
an empty string is not the same as unset. Where file storage is allowed,
`COMMUNITY_STORE_PATH` selects the local JSON file. Hosted configurations that
require PostgreSQL refuse a silent file fallback. Tests reject non-local
PostgreSQL and reject implicit default paths for file-backed stores. Supply an
explicit isolated per-test file path; explicitness alone is not path isolation.

Keep private-provider gates OFF unless their separate activation review has
passed. Retention, pool-size and provider settings are described in
`backend/.env.example` and the linked runtime documentation.

## Documentation

- [Architecture and exact deployment snapshot](docs/architecture.md)
- [Community, accounts and support API](docs/community-api.md)
- [Community frontend integration](docs/frontend-integration-community.md)
- [Private application runtime and activation gates](docs/private-application-runtime.md)
- [Soroban API, registry and live-test gates](docs/soroban-flow.md)
- [Testnet deployment](docs/testnet-deployment.md)
- [Crowdfund and v2 contract source, pinned builds and TTL limits](contracts/crowdfund/README.md)
- [App-only OLED builder and release gates](docs/app-oled-builder.md)
- [Load-test scenarios and execution gates](load/README.md)
- [Legal demo templates](legal/) - illustrative and non-operative
- [Separate mock-only infrastructure API](IMPLEMENTATION.md)
- [Skills reference collection](docs/skills-reference/README.md) - reference
  documents, not installed or executed by this repository
  ([index](docs/skills-reference/INDEX.md),
  [assessment](docs/skills-reference/ASSESSMENT.md),
  [attribution](docs/skills-reference/NOTICE.md))

## Checks

CI runs lint, formatting, JavaScript tests, frontend/backend builds,
translation-projection checks, app-builder safety tests, built production-host
integration, dependency audits and a full-history secret scan. The Rust job
runs locked contract tests, audits dependencies, builds contracts and checks
the reviewed Wasm fixture. The visual workflow captures synthetic public-route
fixtures; PR runs do not receive an upload secret.

These checks use fakes, fixtures and the Soroban in-memory environment where
applicable. They do not prove real-wallet behavior, private-provider activation,
complete live visual acceptance, disaster recovery or production readiness.
