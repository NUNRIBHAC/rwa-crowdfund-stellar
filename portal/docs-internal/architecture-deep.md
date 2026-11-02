# Architecture in depth

## Frontend

- React 19 + TypeScript, Vite 7 build, hash-based routing (no react-router).
- Hand-rolled CSS (`frontend/src/styles.css`, ~2100 lines) on brand tokens
  (`brand/brand-tokens.css`, Fraction identity v1.4).
- i18n: 10 locales, TypeScript sources in `frontend/src/i18n/locales/` plus
  exported JSON in `frontend/i18n-json/ui/`; both tracked, gated by
  `i18n:export` + `i18n:check`. Translations managed in Weblate.
- Community/account code under `frontend/src/community/` and
  `frontend/src/pages/Account.tsx`.

## Backend

- Node.js + TypeScript (Node 24 in production), Express-style API in
  `backend/src/`.
- PostgreSQL journal (Neon) for off-chain records; file-backed store for
  local/dev.
- Contributor backfill: reconciles Soroban RPC events into the journal;
  floor-clamped ledger ranges, versioned checkpoints (`BACKFILL_VERSION=2`),
  records its synthetic actor as `backend-backfill`.
- Admin reconciliation endpoint guarded by an `x-admin-key` header; the key
  lives in Render environment variables.
- Rate limiting, sitemap generation, TOTP service for account 2FA.

## Contracts

- Soroban campaign contract in Rust (`contracts/crowdfund`), deployed to
  testnet; Stellar CLI 28.1.0 for local work.
- Events: `Contributed{contributor, amount, raised}`,
  `Withdrawn{creator, amount}`, `Refunded{contributor, amount}`.
- Storage: per-contributor `Balance(address)` in persistent storage;
  config and raised totals in instance storage; entries archive (not
  delete) at TTL expiry and restore on access with the known key.

## Wallet and auth

- Two wallet flows, both via `@stellar/freighter-api` (the wallet rebranded to Varial in
  October 2026; package name unchanged):
  - **Actor**: connected wallet address, read-only, used for escrow
    transactions (contributions).
  - **Community session**: challenge-response - user signs a one-time
    challenge, server exchanges it for a 30-day bearer token. Optional TOTP
    second factor with single-use recovery codes.
- Operator access: server-side `OPERATOR_WALLETS` allow-list, re-checked on
  every operator request (frontend flag is display-only).
