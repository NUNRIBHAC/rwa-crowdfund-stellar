# Testing and CI

- Backend: Vitest, 221 tests (API, journal, community, backfill,
  reconciliation, TOTP, rate limiting).
- Frontend: Vitest, 237 tests across 28 files (contribution flow, funding
  blocks, i18n gates, campaign builder).
- Contract: Rust test suite in `contracts/crowdfund` (`cargo test`).
- E2E scripts in `backend/e2e/` exercise the live testnet deployment
  (trustline setup, build/submit).
- CI (GitHub Actions) runs all suites plus the contract build on every push
  and PR; `i18n:export` + `i18n:check` gate locale consistency.
