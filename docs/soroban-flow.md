# Soroban campaign flow: review branch

This replaces the active classic campaign API and frontend, not an optional mode. It is testnet-only integration code. It has not been deployed or tested with a real wallet against a deployed campaign. No real funds, rights token or KYC enforcement is included.

## Active interface

- `GET /api/campaigns?actor=G...`: registered contracts, configuration, total raised, withdrawn flag and optional wallet contribution balance. Amounts are integer strings in 7-decimal USDC units. Each contract's Wasm must match the reviewed fixture hash; configured asset must match testnet USDC. Empty registry returns an empty list, not fake campaigns.
- `POST /api/campaigns/:id/soroban/build`: `{actor, action, amount?}`. Actions: `contribute`, `refund`, `withdraw`. Amount is a positive decimal string with up to seven places. Loads account, simulates, includes resource fees and source-account auth in the unsigned transaction. Expiry is 15 minutes. Response includes exact hash, unsigned XDR, fee in stroops, contract ID and testnet passphrase. No submission occurs.
- Wallet signs the exact envelope. No backend wallet secret.
- `POST /api/campaigns/:id/soroban/submit`: `{actor,xdr}`. Requires a signature and the hash of a locally prepared intent. Persists exact signed XDR before RPC submission. Submission is not confirmation. Repeated sends use the original envelope.
- `GET /api/soroban/transactions/:hash`: checks the exact signed intent. SUCCESS/FAILED are terminal; NOT_FOUND is a hold, not failure. No replacement automatically follows expiry. Bounded RPC history is not complete-history proof.

The frontend saves its signed intent across reloads. No admin key is in its active flow. An unresolved signed intent blocks another action by that wallet in this server, but does not reserve any contract funding capacity or block other wallets. This avoids the classic campaign-wide pending-cap DoS without claiming all wallet or network liveness failures disappear. The contract is the sole contribution/cap/balance authority. Cap checks and token transfer execute atomically and revert together.

The contract supports all-or-nothing: contributions before ledger deadline, reject over-cap, creator withdrawal once after deadline if fully funded, contributor-signed refunds once if underfunded. No transferable receipt token. No token-return step for Soroban refunds.

## Operator configuration, not executed by this change

1. Reproduce pinned Rust tests and Wasm build. The API pins SHA-256 `202c9d7e59623c06d1eb2f1ade4cbd187a73ccd3f8154673593820c71db1b564` to prevent registering unrelated contract code.
2. Separately review and authorize a testnet deployment, creator identity, asset contract, goal, deadline and fees. Deployment is intentionally absent from API/UI. Verify creator authorization is enforced at deployment, including a negative test without it. That gate remains unverified by in-memory tests.
3. Register a verified deployed contract in `SOROBAN_CAMPAIGNS_JSON`, e.g. an array of `{id,name,contractId}`. The API also checks the token in on-chain configuration against configured testnet USDC. No contract IDs are invented or deployed here.
4. Use funded testnet wallets with the USDC trustline and asset balance. Run end-to-end contribution, cap rejection, insufficient-balance rollback, creator authorization, refunds and ambiguous RPC response tests. A failure to connect or read is a visible error, not a zero-balance fallback.
5. Operate one API process per durable intent journal. Multi-process use needs a transactional shared database. Add rate limits/authentication before any exposed hosting. Configure HTTPS, exact CORS origins and trusted RPC. The journal contains signed transaction envelopes, which should be protected as bearer authorization while valid.
6. Maintain contract TTL and restore archived state. Build/read fails closed when restoration is required. No automated keep-alive or restore service is supplied. RPC/code availability and wallet behavior remain live-test gates.

## Legacy boundary

Every classic campaign POST route returns 410, including mint/create, demo invest, Freighter classic submit, retry, finalize and refund. Old standalone setup/demo/reset scripts fail unless explicitly unlocked for a separately reviewed maintenance plan. Existing classic JSON state and signed intents are not deleted, converted, resubmitted or treated as Soroban balances.

`GET /api/legacy/campaigns` requires the admin header and returns read-only summaries/hashes, never signed XDRs. The classic implementation remains in source for forensic/reconciliation tests and maintenance review, not as an active optional mode. The earlier invalid-envelope and partial-return fixes remain regression tested there. The partial-token-return requirement is obsolete for new Soroban campaigns because there are no transferable receipt tokens.

There is no automatic migration. Before moving anything, inventory old escrow funds, token holders, payout/refund hashes and every ambiguous intent using authoritative history. Obtain a separate reviewed migration decision. Expiry or a 404 cannot erase a prior payment. No migration was attempted in this change.

## Evidence boundaries

RPC adapter tests use fakes but real SDK XDR assembly and a source-controlled Wasm fixture. Rust tests use the Soroban in-memory environment. These do not prove live deployment authentication, network ingestion, archive restoration, or wallet integration. The UI screenshot with a populated campaign is explicitly a fixture, not a deployed campaign.
