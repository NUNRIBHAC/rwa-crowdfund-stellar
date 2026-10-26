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
| POST | `/api/campaigns/:id/finalize` | finalize and pay the creator |
| POST | `/api/campaigns/:id/refund` | refund investors |
| GET | `/api/demo/investors` | list demo investors |
| POST | `/api/demo/seed-investors` | seed demo investors |
| GET | `/api/demo/wallet/:pub` | account balances |
| POST | `/api/wallet/trustline/build` | USDC trustline XDR (Freighter) |
| POST | `/api/wallet/trustline/submit` | submit signed trustline |

## Known limitations (demo) and next steps

This MVP is deliberately simple; the decisions below are demo simplifications, with
their respective next steps:

1. **finalize/refund authorization**: today anyone can call `/finalize` and `/refund`
   (and the UI exposes the buttons). In practice there should be a time gate (campaign
   deadline, all-or-nothing) and authorization (creator/admin/multisig). Next step:
   Soroban contract with `deadline`, `onlyOwner` and atomic payout logic.
2. **Idempotency and races**: `invest()` reads state and writes afterwards; two
   concurrent submissions can overshoot the goal. Re-submitting the same XDR fails on
   Horizon (`tx_bad_seq`), so it does not duplicate, but the race between different
   investors exists. Acceptable at demo level. Next step: atomic state and cap in the
   contract.
3. **Post-USDC consistency**: if token delivery fails after the USDC payment was
   already submitted, the record stays pending (should not happen in the demo). Next
   step: manual retry/compensation, or atomic operations in the Soroban contract.
4. **Plaintext keys**: `.creator.json`, `.demo-investors.json` and `PLATFORM_SECRET`
   contain secret keys and are **testnet only — never use on mainnet**. They are
   protected by `.gitignore`; in production use a secrets manager and multisig.

Roadmap beyond the next steps above: KYC/ECSPR and legal structuring (MiCA/ECSPR),
RWA valuation oracles, secondary market for the tokens, platform governance and anchor
integration for fiat cash out — the goal is a single Soroban contract that replaces the
backend as the source of truth for escrow, deadlines and authorization.

## Security

- Network: Testnet only; demo keys in files protected by `.gitignore`
- The backend validates the amount from the signed XDR operations (does not trust the
  input)
- Demo accounts only hold faucet USDC, no real value

## Links

- Repository: https://github.com/NUNRIBHAC/rwa-crowdfund-stellar
- Explorer (testnet): https://stellar.expert/explorer/testnet
- Freighter: https://www.freighter.app/