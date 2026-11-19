# Local public campaign listing benchmark

## Scope and finding

The public `/api/campaigns` handler uses `CampaignListCache.read(sorobanCampaigns, actor)`.
It does not call the synchronous JSON file store in `campaigns.ts`.
The existing display cache has a 30-second TTL and shares concurrent reads.
This benchmark targets the anonymous listing adapter on cache misses and the existing warm cache.
It includes registry validation, ledger-key construction, fixture lookup, XDR decoding, asset validation, and response JSON serialization.
It does not start the real server or measure HTTP, database, network, or real RPC latency.
It does not exercise the complete `k6-browse-journey.js` journey.

The current comparison uses baseline `3737842f4cd7581e9847366a9f89da77a73163fb` and optimization source commit `12709c2` on local Node v22.23.4. This is below the repository's required Node 24 runtime, so these measurements are supporting local evidence, not a substitute for CI on Node 24. Sixty runs completed: five alternating AB/BA pairs for each size and fresh/warm mode. Every response matched and every run had zero errors.

| Campaigns | Mode  | Baseline median p50 ms | Candidate median p50 ms |
| --------- | ----- | ---------------------: | ----------------------: |
| 3         | fresh |               0.264752 |                0.224846 |
| 3         | warm  |               0.002802 |                0.002676 |
| 25        | fresh |               1.180344 |                0.936972 |
| 25        | warm  |               0.016380 |                0.016643 |
| 100       | fresh |               5.020283 |                3.585831 |
| 100       | warm  |               0.059390 |                0.060036 |

Fresh-read p50 reductions were 15.1%, 20.6% and 28.6% for 3, 25 and 100 campaigns. Warm-hit differences are noise, not a gain attributable to this change. The untimed derivation probe reports one derivation per fresh candidate listing, versus one per campaign before it. Local raw evidence was retained with the review; rerun the committed harness to produce fresh host-specific output. These are neither hosted service measurements nor a CPU cost, capacity or invoice saving promise.

The selected optimization derives the configured USDC contract ID once per listing instead of once per campaign.
The value stays local to that invocation. Every campaign still checks its asset against that value.
No cross-request cache, TTL, RPC concurrency, code-integrity check, actor key, or decision path changes.
The derivation stays lazy so empty registries need no issuer and instance validation still precedes asset validation.

## Repeat

Use the repository's Node 24 toolchain and install locked dependencies with `npm ci` when needed.
From the repository root, run:

```sh
node load/compare-campaign-listing.mjs \
  3737842f4cd7581e9847366a9f89da77a73163fb \
  <optimization-commit> \
  /code/.generated_artifacts/browse-benchmark/comparison
```

Both revisions must exist locally. The runner verifies each commit and archives its backend source into isolated `/var/tmp` directories.
Both revisions use the same installed dependencies, fixture generator, serializer, and cache implementation.
The cache implementation does not change in this optimization.
The runner removes the source snapshots when it finishes.
It never checks out another branch or changes an environment's settings.

The runner starts one child process at a time with a restricted environment, without managed secrets.
The worker refuses socket connections and fetch requests. RPC responses come only from deterministic in-memory XDR fixtures.
No hosted database, staging, demo, production, or public testnet request is part of this benchmark.

For each of 3, 25, and 100 campaigns, the runner performs five baseline/candidate pairs in alternating AB/BA order.
Each process runs 100 warm-up operations. Each fresh process then measures 500 operations at concurrency one.
Each warm-cache process measures 10,000 operations at concurrency one.
The worker yields to the event loop every ten operations in both revisions.
The warm-cache run must finish within the existing TTL; unexpected expiry fails the RPC-count assertion.
Responses must match the reference on every operation, and their hashes must match between revisions.
All errors fail the run. Response ordering is deliberately reversed in the fake RPC to exercise key-based matching.

`runs.jsonl` records the exact source commit, Node version, timestamp, fixture sizes, response bytes/hash,
load, warm-up, elapsed time, throughput, latency percentiles, errors, RPC calls, derivation probe count,
CPU user/system time, process peak RSS, end-of-run RSS, context switches, and event-loop delay.
`host.json` records the host and harness hashes. `summary.json` records medians across the five process runs,
not pooled request percentiles. Raw runs remain the primary evidence.

Peak RSS includes fixture creation, module loading, and warm-up. CPU deltas cover only the measured interval.
Event-loop delay depends on the artificial yield cadence. Shared-host scheduling and garbage collection add noise.
Warm-cache differences cannot be caused by this change because warm hits do not call `sorobanCampaigns`.
This is a repeatable local CPU-cost comparison, not a hosted latency, capacity, resource-saving, or cost claim.

## Regression checks

```sh
NODE_ENV=test node --import tsx --test \
  backend/test/campaign-listing-reads.test.ts \
  backend/test/campaign-list-cache.test.ts
npm --workspace backend run build
```

The new regression checks enforce one derivation per listing, revalidation after issuer changes,
an empty registry without an issuer, and the testnet-only guard.
Existing checks cover live reads, actor balances and fallbacks, wrong assets/code, archived/malformed instances,
RPC failures, batching, cache expiry, single-flight, actor separation, and bounded cache entries.
