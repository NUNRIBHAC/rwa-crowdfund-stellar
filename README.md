# RWA Crowdfund: Soroban review branch

Active campaign flow: Soroban contract escrow, nontransferable contribution balances, all-or-nothing funding and atomic cap enforcement. Classic payment routes are disabled; historical balances and uncertain intents are preserved for separate reconciliation.

This is testnet-only integration code, not a deployed or production-ready service. The default registry is empty. No deployment, migration or real funds are included. The frontend says so explicitly.

## Run locally

```sh
npm ci
npm test
npm run build
npm run dev:backend
npm run dev:frontend
```

Copy `backend/.env.example` to `backend/.env` and configure only reviewed deployed testnet contract IDs when available. `SOROBAN_CAMPAIGNS_JSON=[]` intentionally shows no campaigns. There is no automatic deploy or campaign creation transaction. Do not run old classic setup/demo/reset scripts for the new flow.

- [Active API, configuration, migration boundary and live-test gates](docs/soroban-flow.md)
- [Earlier hardening checkpoint and its residual classic lockup limits](docs/review-hardening.md)
- [Contract rules, pinned builds and deployment/TTL caveats](contracts/crowdfund/README.md)
- [Separate mock-only identity, valuation, governance and cashout API](IMPLEMENTATION.md)
- [Historical classic README, not current behavior](docs/classic-readme-historical.md)
- [Skills reference collection](docs/skills-reference/README.md) - the skill catalog with per-skill rights status and include now / include for later / not include decisions ([INDEX](docs/skills-reference/INDEX.md), [assessment](docs/skills-reference/ASSESSMENT.md), [attribution](docs/skills-reference/NOTICE.md)). Reference documentation only; nothing there is installed or executed by this repository.

## Demo deployment

The testnet demo at https://rwa-crowdfund-demo.onrender.com deploys from `main` via Render auto-deploy (on commit) using `render.yaml`. Testnet only; no real funds.

## Checks

CI runs JS tests, backend/frontend builds, Rust tests and Wasm build. Tests use simulated ledger/RPC and the Soroban in-memory environment. Live wallet-to-contract execution and deploy-time creator authorization are not verified. The separate infrastructure modules do not approve real people, define legal rights, or move fiat.

No private legal documents are part of this repository.
