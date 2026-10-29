> **Local implementation extension (29 October 2026):** Read [IMPLEMENTATION.md](IMPLEMENTATION.md) first. The new identity/valuation/governance/cash-out API is test-only and separate from the campaign API. It does not approve real investors or send fiat. The existing classic tokens and Soroban balance records do not by themselves establish economic rights, legal ownership, liquidity, regulatory permission or KYC enforcement. No live network tests, provider integrations, push or deployment are included.

# RWA Crowdfund — Stellar

Tokenized RWA (real world assets) crowdfunding platform on the Stellar network.
Built for HackMeridian 2026 — Genesis, **Stellar Unlocked** track.

## Problem

Real-world projects (energy, infrastructure, real estate) need upfront funding, but the
traditional path is slow, opaque and offers no liquidity to the small investor. RWA
tokenization solves this: every contribution becomes a transferable, verifiable digital
asset. This MVP proves the full loop on Testnet using Stellar's native protocol
capabilities — without relying on Soroban contracts on the critical path.

## What it does (MVP)

- Create funding campaigns with a USDC goal (testnet)
- Invest from your Freighter wallet (`@stellar/freighter-api`) or demo accounts
- Funds are held in escrow (platform account) until the goal is met
- Per-campaign transferable RWA tokens, issued through the protocol's native asset
  issuance (classic asset issuance + trustlines): each campaign gets its own `CRWD00X`
  asset, with the supply issued to the platform account and distributed to investors
- `finalize` pays the creator when the goal is met; `refund` returns USDC to investors
  if the campaign does not move forward

## Track: Stellar Unlocked

What this build gets out of the Stellar protocol:

- **Classic asset issuance**: each campaign creates a `CRWD00X` asset with the platform
  account as issuer and control authority. Investors create trustlines for the asset and
  receive transferable tokens.
- **Stellar account escrow**: USDC sits in a platform account (not a complex contract)
  until finalize/refund; the movement is public and verifiable on Horizon / stellar.expert.
- **Cryptographic wallet integration**: transactions are signed in the browser with
  `@stellar/freighter-api` over the backend's build/submit flow (the browser never exposes
  the secret key).

## Stack

- Backend: Node/TS, Express 5, `@stellar/stellar-sdk` v17, Horizon testnet, zod
- Frontend: React + Vite, `@stellar/freighter-api`
- Network: Stellar Testnet (Horizon `https://horizon-testnet.stellar.org`), Circle USDC
  testnet (SAC), Sozu faucet

No Soroban contract on the critical path: everything uses classic protocol operations.

## Architecture

```
frontend (React + Freighter)               backend (Express + stellar-sdk)
        │                                          │
        │ 1. POST /api/campaigns/:id/invest/build  │
        │    { investorPub, amountUsdc } ─────────►│ validates: campaign funding, amount > 0,
        │                                          │   ensures investor account exists
        │ 2. unsigned XDR ◄────────────────────────│ build: changeTrust USDC (if missing),
        │    (changeTrust USDC + changeTrust RWA   │   changeTrust RWA,
        │     + payment USDC → platform escrow)    │   payment USDC → platform (escrow)
        │ 3. signTransaction (Freighter)           │
        │ 4. POST /api/campaigns/:id/invest/submit │
        │    { investorPub, xdr } ────────────────►│ verifies tx.source == investorPub,
        │                                          │   extracts the real payment amount
        │                                          │   (does not trust the input), submits
        │ 5. investment response ◄─────────────────│ delivers RWA tokens (issuer payment),
        │                                          │   records in backend/data/campaigns.json
```

Accounts and assets:

- **Platform / escrow / RWA issuer**: `GDYY4VT5DI5QGBXBKJRCZGCEFJWEJNGTBLSFJF355Z53MI5QAHNJYUO7`
  (secret in `backend/.env` → `PLATFORM_SECRET`)
- **USDC testnet (Circle SAC)**: issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- **Demo investors** (seed used on 2026-10-26):
  `GAFMHEPPLG34JEMHZVVXL3PPMYWLUEBUGVC2CL6LNYXEKSHZU6DV7TW6`,
  `GA2HE7NF6W5CK67X5BOSP2SSDFPDJ772ENOOYEDNYFBYLDBRZFQ7QUWY`,
  `GDEN5H2LZVPFWWQTFZTOLCI2BCVXQG2QUMG5QQV2LVFOY6FSVUPBDWUM`
- **No Soroban contract IDs, no anchors, no oracles** in the MVP: they are next steps
  (see roadmap)

## Testnet evidence (2026-10-26, campaign CRWD001 — "Solar Lisbon #2")

Full build/submit flow — the same one Freighter executes — with 3 investors
(20 USDC from a real Freighter wallet, 12 and 8 USDC from demo accounts),
40 USDC goal, 1000 token supply, already finalized:

| Step | Tx hash | Explorer (testnet) |
|---|---|---|
| Mint CRWD001 supply (escrow on platform) | `879dc3a8c76a83e9865168cb31988851ce274f3b70663bd61a0f15ff73965288` | https://stellar.expert/explorer/testnet/tx/879dc3a8c76a83e9865168cb31988851ce274f3b70663bd61a0f15ff73965288 |
| Investment 1: 20 USDC → 500 tokens (Freighter) | USDC `7c92d6c9305373d893e6516238fd46aaf57486755a65367c1e8b480a836e521c` / tokens `623b229d9eef3730034bd19de3a02168113c3270e367f221cf5bc1c1b9e4d66e` | https://stellar.expert/explorer/testnet/tx/7c92d6c9305373d893e6516238fd46aaf57486755a65367c1e8b480a836e521c |
| Investment 2: 12 USDC → 300 tokens | USDC `26e6a938b0fe00241ff7ed1c4d2ae0f16f57c173d0ba79641e1f95857b2ef0a9` / tokens `16474e8ddb9a2342e84546f4c62b5362cacd4c969f9be640be88c1e5ccc15400` | https://stellar.expert/explorer/testnet/tx/26e6a938b0fe00241ff7ed1c4d2ae0f16f57c173d0ba79641e1f95857b2ef0a9 |
| Investment 3: 8 USDC → 200 tokens | USDC `c265aaf2749d26616848c9217c300324aab81833c95067ec39b5b2bd6ee9e28d` / tokens `9ccd47948512254b8162602fabd430f9f33d56193d3288e2a0fb71bd69dfdb8e` | https://stellar.expert/explorer/testnet/tx/c265aaf2749d26616848c9217c300324aab81833c95067ec39b5b2bd6ee9e28d |
| Finalize: 40 USDC payout to creator | `52b0556ea49eca1241a787321eea9ae6f30dc4fb740372ebe21ddc6aa0983bc7` | https://stellar.expert/explorer/testnet/tx/52b0556ea49eca1241a787321eea9ae6f30dc4fb740372ebe21ddc6aa0983bc7 |

Verified final state: investors hold CRWD001 500/300/200 tokens (recorded in
`backend/data/campaigns.json` and visible in the transactions above); the payout moved
40 USDC from the platform escrow to the campaign creator
(`GCYIL3FJ42V3VYGDJSPON3VWIAHEZXJZVU7HFL6DQ3FOVB4E35O6VUTI`); the platform keeps the
issuer role and supply control.

## Setup

Requirements: Node 20+, a Stellar testnet account and the Freighter extension for the
real wallet flow.

```bash
npm install
cp backend/.env.example backend/.env   # fill in (see table below)
npm run setup                          # accounts + testnet USDC + RWA asset
npm run dev:backend                    # API at http://localhost:4000
npm run dev:frontend                   # app at http://localhost:5173
```

### Environment variables (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `STELLAR_NETWORK` | yes | `testnet` (only network supported in this MVP) |
| `HORIZON_URL` | no | defaults to `https://horizon-testnet.stellar.org` |
| `RPC_URL` | no | defaults to `https://soroban-testnet.stellar.org` |
| `USDC_ISSUER` | yes | Circle USDC testnet SAC issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| `SOZU_FAUCET_URL` | no | defaults to `https://faucet.sozu.capital` |
| `PLATFORM_SECRET` | yes | secret key of the platform/escrow account (testnet only) |
| `ADMIN_SECRET` | yes | shared admin key for the money-moving endpoints (`/finalize`, `/refund`, `/retry-pending`, `/demo/seed-investors`); sent as the `x-admin-key` header. `npm run setup` generates one if empty |
| `PORT` | no | API port, defaults to `4000` |

Generate `PLATFORM_SECRET` with:
`node -e "console.log(require('@stellar/stellar-sdk').Keypair.random().secret())"`

## Clean demo (reset + faucet)

To start from scratch before a demo (for example, after a full E2E in which the demo
investors spent their USDC):

1. `cd backend && npm run reset` — deletes `backend/data/campaigns.json` and
   `.demo-investors.json`.
2. `npm run setup` — ensures the platform account, adds the USDC trustline and requests
   USDC from the Sozu Faucet (platform + 1 demo investor). If the automatic claim fails
   because the platform already claimed before, request USDC manually on the Sozu Faucet
   using the platform's publicKey.
3. `npm run demo` — runs the deterministic E2E: seeds 60+30+10 USDC (3 investors),
   creates a campaign, invests, finalizes and pays the creator.

Notes:

- The platform account is persistent (`backend/.env` → `PLATFORM_SECRET`); reset only
  deletes campaigns and demo accounts.
- After a full E2E the platform is left with ~40 USDC, so step 2 is required before
  another demo.
- All demo transactions are verifiable on stellar.expert (testnet).

## API

| Method | Route | Description |
|---|---|---|
| GET | `/health` | API and network status |
| GET | `/api/campaigns` | list campaigns |
| POST | `/api/campaigns` | create campaign |
| POST | `/api/campaigns/:id/invest` | demo investment (backend signs) |
| POST | `/api/campaigns/:id/invest/build` | build XDR for Freighter signing |
| POST | `/api/campaigns/:id/invest/submit` | submit signed XDR and deliver tokens |
| POST | `/api/campaigns/:id/finalize` | finalize and pay the creator (admin key, after deadline, goal met) |
| POST | `/api/campaigns/:id/refund` | refund investors (admin key, after deadline, goal missed) |
| POST | `/api/campaigns/:id/retry-pending` | retry token delivery for pending investments (admin key) |
| GET | `/api/demo/investors` | list demo investors |
| POST | `/api/demo/seed-investors` | seed demo investors |
| GET | `/api/demo/wallet/:pub` | account balances |
| POST | `/api/wallet/trustline/build` | USDC trustline XDR (Freighter) |
| POST | `/api/wallet/trustline/submit` | submit signed trustline |

## Known limitations (demo) and next steps

### Addressed in the backend (previously mis-described or open)

1. **finalize/refund authorization and time gate**: previously anyone could call
   `/finalize` and `/refund` at any time. Now both are all-or-nothing and gated:
   `finalize` only after the deadline and only if the goal was met; `refund` only
   after the deadline and only if the goal was missed. Every money-moving route
   (`/campaigns` create, `/invest` demo path, `/finalize`, `/refund`,
   `/retry-pending`, `/demo/seed-investors`) requires the admin key
   (`x-admin-key` header; demo-grade shared secret, not yet creator/multisig
   authorization). Next step: Soroban contract with `deadline`, `onlyOwner` and
   atomic payout logic.
2. **Idempotency, intent-first**: an earlier version of this section claimed
   that re-submitting the same XDR always fails on Horizon (`tx_bad_seq`);
   Horizon can instead replay the original successful result, which double-paid
   tokens. Now every payment (USDC contribution, token delivery, payout,
   clawback, refund, mint) is executed intent-first: the exact signed XDR and
   its hash are persisted (fsynced JSON store) before the first broadcast, and
   uncertain outcomes (crash after broadcast, lost response, `tx_bad_seq`,
   `tx_too_late`) resubmit the identical transaction, which Horizon replays
   instead of applying twice. A previously broadcast intent is never discarded
   or rebuilt automatically: its hash is reconciled against Horizon, and
   anything short of an authoritative applied result (successful === true)
   holds the intent for manual reconciliation — that includes a bare 404
   (absence in queried history, not proof the tx can never execute) and a
   transaction found but recorded as failed. Remaining honesty note: this
   protects one backend process with its JSON store; it is not multi-process
   safe and not a substitute for on-chain enforcement.
3. **Races and cap**: an in-process lock serializes all state changes and the
   goal is a strict cap: a contribution above the remaining target is rejected,
   never trimmed, and concurrent investments cannot overshoot the goal within
   one backend process.
4. **Post-USDC consistency**: an earlier version claimed a failed token delivery
   "leaves the record pending"; the old code saved nothing. Now the investment
   is recorded (`pending_usdc` before broadcast, then `pending_token_delivery`)
   and `POST /api/campaigns/:id/retry-pending` (admin) settles it by
   resubmitting the persisted intents.
5. **Refund correctness**: refunds are intent-first and recorded per
   investment, so a retry after a partial failure does not pay an investor
   twice. A pending token delivery is reconciled against Horizon before any
   refund without token recovery; unless the delivery is found applied
   (successful === true) the refund is held for manual reconciliation — a 404
   is absence in queried history, not proof the tx did not execute, a
   found-but-failed record is not proof the funds are safe either, and even
   an expired timebound only proves it cannot execute in the future, not that
   it did not already execute. Delivered tokens must come back before the
   USDC refund: for demo accounts the platform signs the clawback; for
   non-demo (Freighter) accounts the backend verifies the return on-chain via
   the Horizon payment history. The verification is conservative: the return
   must be a single successful payment of the exact token amount owed,
   ordered after the token delivery in ledger total order (SEP-0035 paging
   tokens compared numerically, not local wall clock), and each return
   operation id can fund only one refund for the campaign. Partial, oversized
   or failed-transaction returns are not credited (manual reconciliation
   needed), and if the delivery's ledger position cannot be established the
   refund is held (`awaiting_token_return` until verified).
6. **Amounts and deadline**: money is integer cents (no float accumulation); a
   signed XDR whose payment has more than 2 decimals is rejected, never rounded
   into extra credit; the campaign deadline is enforced on the signed submit
   path as well (it was only checked at XDR build time).

### Still demo-only

1. **Single process**: the state lock and the JSON file store protect one
   backend process only. Multiple instances need a shared store with real
   transactions (e.g. a database) or, longer term, the on-chain Soroban
   contract.
2. **Authorization is a shared demo secret**, not creator/multisig control.
   Production needs real authorization (multisig, then the contract).
3. **No automatic on-chain reconciliation worker**: uncertain submissions are
   resolved by calling `/retry-pending` (admin); there is no background job
   polling Horizon yet. A bare Horizon 404 is treated as inconclusive, never
   as proof a transaction did not execute, so previously broadcast intents are
   never discarded or rebuilt automatically — clearing one requires explicit
   manual reconciliation by an operator against an authoritative source.
4. **Plaintext keys**: `.creator.json`, `.demo-investors.json`, `PLATFORM_SECRET`
   and `ADMIN_SECRET` contain secret keys and are **testnet only — never use on
   mainnet**. They are protected by `.gitignore`; in production use a secrets
   manager and multisig.

## Security

- Network: Testnet only; demo keys in files protected by `.gitignore`
- The backend validates the amount from the signed XDR operations (does not trust
  the input), persists every signed payment intent (fsynced) before broadcast
  and retries the identical transaction; a broadcast intent is never rebuilt
  automatically, so replays and crash/timeout retries do not duplicate payments
- The goal is a strict cap under an in-process lock; the deadline gates
  investing, finalizing and refunding
- Refunds fail closed: an unverifiable or oversized token return, a pending
  token intent that could still execute, or an inconclusive Horizon lookup
  holds the refund instead of guessing
- Money-moving endpoints (create, demo invest, finalize, refund, retry-pending,
  seed) require `x-admin-key` and fail closed when `ADMIN_SECRET` is not
  configured
- Demo accounts only hold faucet USDC, no real value

## Links

- Repository: https://github.com/NUNRIBHAC/rwa-crowdfund-stellar
- Explorer (testnet): https://stellar.expert/explorer/testnet
- Freighter: https://www.freighter.app/
