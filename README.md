# Blockallisto - Stellar testnet crowdfunding prototype

Blockallisto is a crowdfunding prototype on the Stellar testnet. Campaign
contributions are escrowed in a Soroban contract with nontransferable
contribution balances, all-or-nothing funding and atomic cap enforcement.
Classic payment routes are disabled; historical balances and uncertain
intents are preserved for separate reconciliation.

This is a deployed testnet prototype, not a production-ready service.
No real funds, no real identity verification, no investment advice.
The frontend says so explicitly on every page.

## Architecture

Five current-source views are available below and in the
[architecture guide](docs/architecture.md). All describe `9f4ac1c`
(13 November 2026). Runtime notes are labeled separately. These are source maps,
not proof of production readiness or complete live acceptance. Click an image
for its full-size SVG and readable labels.

### Whole system

[![Whole system - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/system-9f4ac1c-a0585e895442.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/system-9f4ac1c-a0585e895442.svg)

### Accounts, community and document safety

[![Accounts, community and document safety - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/accounts-community-9f4ac1c-0ecb84387763.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/accounts-community-9f4ac1c-0ecb84387763.svg)

### Transactions and durable evidence

[![Transactions and durable evidence - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/transactions-9f4ac1c-f47932caaba5.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/transactions-9f4ac1c-f47932caaba5.svg)

### Delivery, documentation and held code

[![Delivery, documentation and held code - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/supporting-9f4ac1c-d6867bdbd508.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/supporting-9f4ac1c-d6867bdbd508.svg)

### Whole-code overview

[![Whole-code overview - source 9f4ac1c](https://blockallisto-media.nunrib-df6.workers.dev/architecture/overview-9f4ac1c-9c17c73afe53.svg)](https://blockallisto-media.nunrib-df6.workers.dev/architecture/overview-9f4ac1c-9c17c73afe53.svg)

## What is implemented

Campaign flow (Soroban):

- Contract escrow, all-or-nothing settlement, refund paths; the public demo
  registers one demo campaign (`demo-solar`, testnet contract).
- Contribution/refund/creator-withdraw UI against the registered testnet
  contract. Live wallet-to-contract execution in a real browser wallet is
  not yet verified (see Known limits).

Community and accounts (docs/community-api.md):

- Wallet-based registration/sign-in: one-time challenge signed with
  Freighter, server-verified session tokens (sha256-hashed at rest).
  Email/password registration with localized verification emails, TOTP
  2FA and session management; social sign-in (Google, GitHub, LinkedIn,
  Telegram, Farcaster) with provider linking on the same account.
  Several social flows are configured but not yet verified end to end
  in a real browser.
- Campaign comments: authenticated public writes, server-resolved masked
  author labels, per-account and per-IP rate limits, admin hide/unhide.
- Campaign news: admin-posted updates, labeled `platform-demo` while no
  verified issuer identity exists.
- Support tickets and issuer applications: authenticated submission,
  owner-only reads and admin list/close/status. Standard retention is
  90 days with hard delete; private references and unresolved cleanup jobs
  are retained for separate review, not silently pruned. The For Businesses
  page (`/for-businesses`, also served at
  `/financing`) carries the issuer application form behind community
  sign-in; the Account area lists the signed-in user's own
  applications, support tickets and comments.
- Campaign metadata: industry tags, document entries and campaign tabs
  (Overview/Details/Documents/News) per campaign.
- Admin operations exist at the API level behind `x-admin-key` and fail
  closed when the secret is unset. A limited operator panel (ticket,
  application, news and comment moderation flows) renders for the
  configured platform operator account after community sign-in; it is not
  a full admin dashboard, and no operator account is configured on the
  public demo.

Frontend:

- Eleven UI locales: English, Portuguese (PT-PT), Spanish, French,
  German, Simplified Chinese, Traditional Chinese, Japanese, Korean,
  Arabic and Hindi. Arabic keeps the
  shared page geometry with right-to-left text. Legal document bodies now
  have translated drafts in all eleven locales (machine-assisted, private
  Weblate pipeline); a human or legal review of those drafts is not
  confirmed.
- Light and dark themes, responsive layout, animated footer illustration.
- Account area: summary, my investments, recent activity, wallet and
  onboarding checklist against the signed-in session.
- Legal section: Terms of Service, Privacy Policy, Risk Disclosure, Legal
  Notice, Conflicts of Interest, Complaints Management and Business
  Continuity pages rendered from `legal/`. These are illustrative demo
  templates with fictional `[DEMO]` company particulars; they are not
  lawyer-reviewed, the registered operator and data controller are not
  verified, and they are not evidence of registration or authorisation.

## Current status and known limits

- Release snapshot, 13 November 2026: staging at
  https://staging.92-5-187-71.sslip.io runs source `9f4ac1c` (PR #172).
  The public demo at https://demo.92-5-187-71.sslip.io runs source `cd6eddc`
  with image ID `a8fb3da59930`. Both are hosted on the Oracle VM; merges do
  not automatically deploy either environment. See the
  [architecture guide](docs/architecture.md#deployment-snapshot) for exact
  source and image IDs. `render.yaml` is reference-only.
- In current source, the community runtime shares one store/service and
  pruning timer per process, including concurrent initialization. Issuer document clients read
  the authenticated upload mode before choosing a protocol. Staging uses
  `legacy-inline`; OCI private upload and cleanup remain OFF behind explicit
  activation gates. Draft-only document changes freeze after Submit.
- Account contribution balances are historical records, not current escrow;
  the crowdfund v1 contract preserves them after creator withdrawal.
- Community sign-in, comment posting/rendering, tickets and applications
  have been exercised on staging with a simulated wallet. Real Freighter
  extension sign-in (including Ledger-backed wallets) is not yet verified
  in browser integration testing; per docs/community-api.md it must be
  verified before the UI ships as final.
- Full visual/language QA (all pages x all locales x both themes) is in
  progress, not complete.
- The community store is a single JSON document (Postgres jsonb or a local
  file); a per-entity relational schema is production follow-up. Rate
  limits are per-process.
- The admin gate is a demo-grade shared secret; production needs real
  admin identities with individual accountability.
- Footer social icons link the official Blockallisto profiles (X,
  Instagram, Facebook, Threads, YouTube, Telegram, Discord, Farcaster,
  LinkedIn).
- Legal templates are demo content (above), not operative legal documents.

## Brand

The Blockallisto visual identity (Fraction logo, palette, typography, UI
kit and motion specifications) lives in [brand/](brand/README.md):
editable SVG logos, ready-to-use PNG exports, icons, social graphics, the
hero concept and machine-readable design tokens. The frontend applies this
identity, including the "How funding works" block-fill illustration, which
is an explanatory animation - not live funding activity. The identity is a
draft for this prototype; no trademark search or registration has been
done. The same all-rights-reserved terms apply.

## Rights

Copyright (c) 2026 Nuno Ribeiro. All rights reserved. No permission is
granted to reuse, modify or redistribute the original code or
documentation, except as required by applicable law or GitHub's terms.
Material under `docs/skills-reference/` retains its separately stated
rights and licenses.

No open-source license or patent grant is given. The same notice is kept
in [NOTICE](NOTICE).

## Run locally

Requires Node.js 24.

```sh
npm ci
npm test
npm run build
npm run dev:backend
npm run dev:frontend
```

Copy `backend/.env.example` to `backend/.env` and configure only reviewed
deployed testnet contract IDs when available. `SOROBAN_CAMPAIGNS_JSON=[]`
intentionally shows no campaigns. There is no automatic deploy or campaign
creation transaction. Do not run old classic setup/demo/reset scripts for
the new flow.

Community features store data in Postgres when `COMMUNITY_DATABASE_URL`
(or `SOROBAN_JOURNAL_DATABASE_URL`) is set, falling back to a local JSON
file (`COMMUNITY_STORE_PATH`) for dev and tests. Retention and metadata
overrides are documented in `backend/.env.example`.

## Documentation

- [Community, accounts and support API](docs/community-api.md)
- [Community frontend integration notes](docs/frontend-integration-community.md)
- [Active campaign API, configuration, migration boundary and live-test gates](docs/soroban-flow.md)
- [Testnet deployment](docs/testnet-deployment.md)
- [Contract rules, pinned builds and deployment/TTL caveats](contracts/crowdfund/README.md) -
  Rust sources and Wasm build instructions for the crowdfund contract live
  under `contracts/crowdfund/` (cargo + the pinned toolchain in
  `rust-toolchain.toml`); CI runs the Rust tests and Wasm build.
- [Earlier hardening checkpoint and its residual classic lockup limits](docs/review-hardening.md)
- [Load testing (k6) scenarios and execution rules](load/README.md)
- [Crowdfund v1 security self-review (2026-11-01)](docs/security/crowdfund-v1-self-review-2026-11-01.md)
- [Legal demo templates](legal/) - illustrative, non-operative; see the status section
- [Separate mock-only identity, valuation, governance and cashout API](IMPLEMENTATION.md)
- [Historical classic README, not current behavior](docs/classic-readme-historical.md)
- [Skills reference collection](docs/skills-reference/README.md) - reference
  documentation only; nothing there is installed or executed by this
  repository ([INDEX](docs/skills-reference/INDEX.md), [assessment](docs/skills-reference/ASSESSMENT.md), [attribution](docs/skills-reference/NOTICE.md))

## Checks

CI runs the JS test suites and the backend/frontend builds. Tests use
simulated ledger/RPC and the Soroban in-memory environment. Live
wallet-to-contract execution and deploy-time creator authorization are not
verified. The separate infrastructure modules do not approve real people,
define legal rights, or move fiat.
