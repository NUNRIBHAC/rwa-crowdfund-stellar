# Live testnet deployment record (2026-10-29)

First live deployment of the reviewed crowdfund contract on Stellar testnet. No real funds anywhere. All accounts below are throwaway testnet accounts funded by Friendbot and the Sozu USDC faucet.

## Verified gates (previously unverified in repo docs)

- Source reproduces the pinned Wasm byte-identical: sha256 `202c9d7e59623c06d1eb2f1ade4cbd187a73ccd3f8154673593820c71db1b564` (rustc 1.99.1, stellar-cli 28.1.0, `cmp` against `backend/test/fixtures/reviewed-crowdfund.wasm`).
- 20/20 Rust tests, 74/74 JS tests pass.
- Deploy-time creator authorization verified live: deploying from an unrelated account fails with `Error(Auth, InvalidAction)` (constructor `require_auth` not tied to root invocation). This closes the explicit gate in `contracts/crowdfund/README.md`.

## Deployed contracts (testnet, Wasm hash `202c9d7e...`, USDC SAC `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`)

| Registry id | Contract ID | Goal (USDC) | Deadline | Purpose |
|---|---|---|---|---|
| demo-solar | `CCBIMGPHIOUFN6IC6MYPFXOGJQIRJHHDXA2Y7LQDCYBSJOKHULICO6NY` | 500 | 2026-11-05 ~20:50 UTC | User-facing demo |
| e2e-success | `CAF673HYNQLEJJH5XNNZUMXAJQOBNN5FCAOQFBTPTCZZX45UG6PCF5WJ` | 10 | 2026-10-29 (passed) | Withdraw path test |
| e2e-refund | `CBKUUNTKEJQ7RRXMG7ROOW7ZKTWKBEZLGHAMTICP3FFQRZLRB7LX6CII` | 10 | 2026-10-29 (passed) | Refund path test |

Wasm upload tx: `da2ecb9ad406b9245d595866b3ccbbcaa16f294e66cdae8d8a46a802d52e8ad6`.

## Test accounts (public keys only)

- creator/deployer: `GDZHAPAP23CTX7MLNGJPJUZAXNVAEYXXLAAXZODJY6PI27CL4LGQ5OPU`
- contributor 1: `GBGGACYXMNNWZCSCON2K5PBQYEJPGEH62OES6JPRPPADNQNOQCNP6GKU`
- contributor 2: `GCXAFXWLLMSIFVVSXP7DSJUCOMSK6G32ZVYGI6UYZXXHBCK776PAKPEB`
- negative-test account: `GB54OC77G2NIUQNWCVWBP4C7CFEOQGV3XWOUWGGFECFZLTCKX5TDUOU7`

Secrets are NOT in this repo. The creator secret is stored in the owner's credential vault ("Stellar testnet - RWA demo campaign creator"); contributor secrets were ephemeral sandbox entries. The demo-solar creator key can withdraw if the goal is met; custody is via vault fill only, never chat/files.

## Live test results (all executed on testnet)

Contract behavior via CLI (source-account auth, same envelope shape the API builds):

1. contribute fills e2e-success exactly (Contributed event, raised 100000000). PASS
2. over-cap contribution on full campaign rejected `Error(Contract, #12)` ExceedsGoal. PASS
3. withdraw before deadline rejected `#6` CampaignNotEnded. PASS
4. refund before deadline rejected `#6`. PASS
5. creator withdraw after deadline on funded campaign: SUCCESS, Withdrawn event 100000000, creator balance 0 -> 10 USDC. PASS
6. second withdraw rejected `#9` AlreadyWithdrawn. PASS
7. withdraw on underfunded campaign rejected `#7` GoalNotReached. PASS
8. refund on funded campaign rejected `#8` GoalReached. PASS
9. contributor refund after deadline on underfunded campaign: SUCCESS for both contributors (40000000 and 10000000 units), balances zeroed. PASS
10. second refund rejected `#10` NothingToRefund. PASS
11. refund by account with zero balance rejected `#10`. PASS
12. contribute after deadline rejected `#5` CampaignEnded. PASS
13. deploy without creator auth rejected `Error(Auth, InvalidAction)`. PASS

Backend API live against testnet (`SOROBAN_CAMPAIGNS_JSON` pointing at the three contracts):

- GET /api/campaigns returns live config/raised/balance; per-read Wasm hash and USDC SAC verification pass. PASS
- POST build (contribute 1.5 USDC, demo-solar) -> local signing with a test key -> POST submit -> PENDING -> GET status -> SUCCESS; raised 250000000 -> 265000000, contributor balance 15000000. Tx `2f717f96a620e27d616fae91573f52a6dc7fd7adb67dea717fb4a58f172671a5`. PASS
- Note: build requires the prior signed intent resolved; intents journal is local file `SOROBAN_INTENTS_PATH` (see hosting notes).

Known contract-ordering detail: on an underfunded campaign a non-creator withdraw attempt surfaces `#7` GoalNotReached before the creator-auth check; only-creator enforcement on funded campaigns is covered by the Rust in-memory tests (`only_creator_can_withdraw`) and by the auth model (withdraw requires `creator.require_auth()`).

## Frontend fixes in this branch

- Deadline labels no longer show "1 day left" for minutes-level deadlines: under a minute / minutes / hours / days, and "Ended" once past.
- Hero disclaimer corrected: campaigns shown are live testnet contracts (the old copy claimed none were deployed or configured).

## Registry configuration used (testnet only)

```
SOROBAN_CAMPAIGNS_JSON=[{"id":"demo-solar","name":"Demo Solar Farm (testnet)","contractId":"CCBIMGPHIOUFN6IC6MYPFXOGJQIRJHHDXA2Y7LQDCYBSJOKHULICO6NY"},{"id":"e2e-success","name":"E2E Success Path","contractId":"CAF673HYNQLEJJH5XNNZUMXAJQOBNN5FCAOQFBTPTCZZX45UG6PCF5WJ"},{"id":"e2e-refund","name":"E2E Refund Path","contractId":"CBKUUNTKEJQ7RRXMG7ROOW7ZKTWKBEZLGHAMTICP3FFQRZLRB7LX6CII"}]
```

For the user-facing demo, register demo-solar only; the E2E contracts are ended test fixtures.

## Hosting requirements (for provider selection)

- One Node >= 20.19 process: build `npm ci && npm run build`, serve API + built frontend from one origin (host script pattern: express static + SPA fallback in front of `dist/server.js`).
- Env: STELLAR_NETWORK=testnet, RPC_URL, HORIZON_URL, USDC_ISSUER, SOROBAN_CAMPAIGNS_JSON, SOROBAN_INTENTS_PATH, CORS_ALLOWED_ORIGINS = exact public origin (same-origin module loads send Origin; the allowlist must include the service's own URL), PORT/HOST.
- The signed-intent journal is safety state: it holds signed envelopes and broadcast ambiguity. A host that silently discards it on restart/sleep is NOT acceptable; use durable storage (Postgres adapter to be added, or a persistent disk). Before any store expiry: export the journal and shut down accepting new intents.
- Outbound HTTPS only (Soroban RPC + Horizon testnet). ~256-512 MB RAM is ample. TLS at the platform. Single instance (journal is single-process by design).
- Rate limits/auth still required before public exposure beyond a private demo (see docs/soroban-flow.md gate 5).

## Not yet done / next steps

- Freighter browser UX test (extension signing) - attempted only with a test-only key, or the owner tries it from their own browser.
- Postgres journal adapter for durable hosted state (plus export/shutdown procedure for the 30-day free Postgres expiry).
- Journal restore caveat (residual risk, not fully closed): a stale backup can omit newer signed/broadcast intents, and exact-hash reconciliation cannot recover hashes it never knew. Partial mitigations in this branch:
  - `POST /api/soroban/recover` re-registers one exact signed envelope that someone still holds (e.g. the frontend's localStorage-retained intent). Read-only against the network; a re-registered unconfirmed intent blocks new builds for that wallet until its hash resolves. Prerequisite: the exact envelope must be retained by the wallet - localStorage may be cleared or on another device.
  - `SOROBAN_RECOVERY_MODE=true` (operator flag) disables ALL new builds. Required procedure after ANY restore from backup: start in recovery mode, re-register every retained outstanding envelope via the recover endpoint, review registered contracts' recent RPC transaction history for submissions unknown to the journal (RPC history is bounded - not complete-history proof), then lift the flag.
  - Residual: an envelope nobody retains and the operator does not know about can still be duplicated after a stale restore. The contract remains the balance authority, but a duplicate contribution is real fund movement the UI/API cannot retroactively prevent. Snapshot freshness (frequent backups, export before any store expiry/migration) is therefore still required; do not treat the recover endpoint as making restores safe by itself.
- TTL maintenance: campaigns longer than ~30 days need `bump` calls; demo-solar (7 days) is within the initial TTL set on contribution.
- Hosting account creation and any payment await owner approval; no external accounts were created.

## Hosted demo setup (Render + Neon, free tier)

- Production host: `backend/scripts/host.mjs` serves API + built frontend from one origin with test mode OFF (sets `EMBEDDED_HOST=1` so importing `dist/server.js` does not double-bind). Locally verified: static `/`, SPA fallback, and live `/api/campaigns` all 200 against testnet.
- Durable journal: `backend/src/journal.ts` adds a backend abstraction over the signed-intent journal. `SOROBAN_JOURNAL_BACKEND=file` (default) keeps the atomic local file; `=postgres` uses `SOROBAN_JOURNAL_DATABASE_URL` (Neon pooled connection string) with a `soroban_intents` table, transactional upserts, fail-closed behavior when the URL is missing or unreachable (never silently falls back to a volatile file). Covered by `backend/test/journal.test.ts` (8 tests; full suite 85/85).
- Cross-process safety (rolling deploys): a free Render deploy briefly runs old and new processes together. The journal's read-check-save critical sections (`buildSoroban`, `submitSoroban`, `recoverSoroban`, status polling) now run inside a Postgres session advisory lock (`runExclusive`, key `soroban-journal-ops`), so a second process waits instead of racing the unresolved-intent check. Schema init is advisory-lock serialized too (concurrent first-boot `CREATE TABLE IF NOT EXISTS` otherwise hits a catalog duplicate-key race - reproduced and fixed). Upserts never regress safety state: a stored signed envelope is never erased by an unsigned save, and a terminal `SUCCESS`/`FAILED` status is never overwritten by a stale writer. Validated against a real local PostgreSQL 18.4: concurrent first-boot, cross-instance lock serialization ordering, regression-guard, forward transitions (suite: 84/84 unit + 12 real-DB checks). Additionally, a DIFFERENT signed envelope for the same intent hash is rejected outright (COALESCE only fills an unsigned slot, never swaps). The session advisory lock carries a backend-stability self-check (pg_backend_pid before/after the critical section; any drift fails closed), which is why `SOROBAN_JOURNAL_DATABASE_URL` must be the Neon DIRECT endpoint - the pooled endpoint's PgBouncer transaction mode rebinds backends and breaks session-lock semantics; local PG tests prove the mechanism, and the self-check enforces it at runtime on Neon. Terminal FAILED is only ever set from a conclusive on-chain RPC result (getTransaction FAILED with a positive ledger), never from a timeout or ambiguous submission (those hold at UNKNOWN). The file backend has no cross-process guard by design: single instance only. Not claimed: sustained multi-instance scale-out semantics (throughput-oriented sharding, per-actor lock granularity) - the global ops key serializes all journal operations, correct for this demo's scale.
- Blueprint: `render.yaml` at the repo root (free plan, `npm ci && npm run build`, start `node backend/scripts/host.mjs`, registry = demo-solar only, CORS allowlist = own origin). Secrets set manually in the Render dashboard: `SOROBAN_JOURNAL_DATABASE_URL` (Neon), optional `ADMIN_SECRET` (unset keeps admin endpoints fail-closed).
- Free-tier caveats stay in force: Render free sleeps after 15 min idle (cold start ~1 min); the Postgres journal removes the journal-loss risk across restarts, but a request arriving before the first post-restore reconciliation still requires snapshot freshness of nothing - the journal is now the durable record. Recovery-mode gate (`SOROBAN_RECOVERY_MODE`) remains the operator control after any journal restore from backup.
