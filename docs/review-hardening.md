# Review-branch hardening

Test-only prototype, not production-ready. No deployment, real funds, or legal-rights integration is included.

## Campaign lockup: mitigated, not fully eliminated

Before recording a new signed investment, the API now checks the investor signature, ordinary master-key authorization, source existence, current sequence, spendable USDC, native fee/reserve balance and active time bounds. It accepts exactly one payment to the platform, optional matching trustline operations only, and a campaign-bound memo. An unfunded or unsigned full-goal envelope therefore cannot reserve the cap. Cross-campaign replay is rejected.

Reservations still count atomically under the existing single-process lock. Counting confirmed funds only would permit concurrent oversubscription. A conclusive hash-matching ledger transaction record with `successful=false` and a positive ledger number releases a USDC reservation as `failed_usdc`. The failed record and original intent remain for audit; it is not retried or credited. Transaction operations are atomic, so this positive failed result proves no USDC transfer occurred.

**Residual denial of service:** preflight is not atomic with ledger execution. A source can spend its balance or change sequence after validation. If the broadcast outcome cannot be established, the reservation stays held and may block settlement. Tests reproduce this race. This patch prevents the reproduced unfunded-source attack but does not solve the whole campaign-lockup class.

Expiry only rules out future inclusion. A 404, missing fields or an unsynced/pruned history response is not proof of no prior inclusion. No expiry-based void endpoint or automatic replacement of uncertain payments exists. Manual reconciliation must use authoritative complete history covering the whole validity window before releasing an absent intent. The verified complete-history recovery service is not implemented here. To remove this DoS class, the next design step is atomic on-chain contribution and cap accounting, or a verified authoritative reconciliation service. The separate Soroban prototype is not wired into this API.

The preflight intentionally rejects multisig/custom-precondition envelopes. Existing pending intents remain retryable with their exact original XDR; the new memo rule applies only to new submissions. Restrict the Horizon endpoint to a trusted operator: positive ledger records are an external trust boundary.

## Five improvements

1. GitHub Actions runs `npm ci`, `npm test`, both app builds, pinned Rust tests and the pinned Stellar CLI Wasm build on every PR and pushes to main/review branch. Jobs have read-only repository permission and do not use secrets. Adding a workflow does not configure branch protection; require passing checks in repository settings before merging. First remote execution must be checked, not assumed.
2. Wallet investment/trustline signing window is 15 minutes instead of 60 seconds. Signed investments require an active finite window no more than 15 minutes ahead. This reduces expirations, not recovery uncertainty. The backend deadline check still applies.
3. Admin header comparisons use fixed-size SHA-256 digests and timing-safe comparison. Browser keys stay in memory only; the old localStorage key is deleted on load. API defaults to loopback. Exact `CORS_ALLOWED_ORIGINS` allowlist rejects disallowed Origin requests before route handling, including preflights. JSON bodies are limited to 64 KiB; API responses use no-store. CORS is not authentication. Hosting still requires TLS, a strong rotated key, restricted network access/rate limiting and a real admin identity system. Do not expose this demo as a production funds service.
4. Multi-payment investment transactions are rejected before broadcast instead of crediting only their first payment. Unrelated operations and alternate sources are rejected. New signatures bind the campaign ID in the memo.
5. Multiple verified partial token-return operations can total one investment's required amount before its full USDC refund. Seven-decimal fixed-point arithmetic avoids float errors. Operation IDs are deduplicated, ledger order must follow delivery, failed transaction operations do not count, and consumed IDs cannot fund another refund. Verified partial totals appear in the blocked-refund error. No partial USDC refunds occur. Oversized operations are not split across investments and need manual reconciliation. History scanning remains bounded (10 pages of 200); a missing older return remains a hold, never a presumption of return.

## Evidence sources

- Stellar atomic operations and transaction validation: https://developers.stellar.org/docs/learn/fundamentals/transactions/operations-and-transactions
- Horizon hash, ledger and successful fields: https://developers.stellar.org/docs/data/apis/horizon/api-reference/resources/transactions/object

Offline tests replace ledger calls with a simulated ledger. They prove local logic, not live-network ingestion, retention, authentication or deployment behavior. No external provider, account, contract or funds were changed by those tests.
