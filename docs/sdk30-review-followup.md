# SDK30 local review follow-up

Not approved for publication. crypto-bigint is still present in the host/test dependency graph. This preparation does not satisfy the original fixed-dependency trigger.

## Journal safety

The initial v2 row snapshot and generation selection now run under the journal guard. Before saving the prepared envelope, a fresh guarded read recomputes generation and checks the exact row fingerprint. Changed history aborts preparation without saving a replacement.

Every nonterminal campaign deployment row blocks unless it is an unsigned BUILT envelope whose finite maxTime is strictly earlier than now. Signed rows block even when expired, because network submission may already have occurred. Unknown/malformed envelopes fail closed. Expired unsigned rows remain in the journal; no old intent is rewritten.

## Continuity scope

V1 does not use successful uploads to choose the next generation. After an old successful upload, it may perform a redundant SDK30 upload before creating the SDK30 instance. The fee is incurred only if that new transaction is signed and submitted. Existing signed v1 envelopes continue through exact-envelope verification.

V2 successful SEP41/historical pairs retain that generation. The older pre-SEP41 token remains readable, but is not silently promoted into a deployable pair. Its successful deployment row fails closed rather than choosing new-generation artifacts.

## Tests and CI

New deploy tests cover old v1 upload/new upload/new create, signed PENDING/SIGNED/UNKNOWN rows, unsigned ambiguous rows, live/expired unsigned BUILT, generation changes during simulation, and a successful legacy pre-SEP41 token row. Existing direct wrong-code recovery and all six historical/current reader pairs remain covered.

CI's Rust job runs cargo test --locked at the workspace root. The wasm_compatibility.rs file is an integration test in the crowdfund member and runs with that command. Historical artifacts are preserved by digest checks, not rebuilt using the new toolchain. The integration test was rerun from the successor directory, with the existing shared target cache explicitly named in its log.

## Exact-envelope retry successor

A new additive deployment_context column stores a fixed serialization of actor, campaign, name, goal, deadline, symbol, decimals, min/max and generation pins for newly built v2 rows. File rows carry the same optional field. Historical rows without it are never guessed reusable.

For an exact matching unsigned BUILT row, the API can return the same hash and XDR without saving a row. It requires more than 120 seconds remaining, the same source and verified hash, the next step still derived from SUCCESS rows, matching artifact generation, no other unresolved signed intent and a second guarded fingerprint check after ledger reads. Changed inputs, unknown/signed rows, changed history or incompatible artifacts fail closed. Different campaign builds cannot overwrite an already journaled transaction hash.

Cancelling Freighter and clicking again now obtains the original envelope rather than creating a replacement or imposing the full 15-minute wait. Inside the last two minutes it still fails closed until expiry. Historical live rows without context and changed-input attempts also remain blocked. HTTP uses the existing localized generic error fallback, not raw backend diagnostic text. No new copy or locale keys were added.

Tests cover exact repeated build with one row, each input dimension, actor/campaign isolation, wrong step/generation, history changing during lookup, equal/near/infinite expiry, malformed envelopes and frontend cancellation/retry orchestration. A real disposable local Postgres18.4 check verified the additive column migration and exact context/XDR roundtrip across journal instances; signed_xdr remained null. Separate six-process exclusion evidence uses the unchanged actual PostgresJournal.runExclusive on the direct local endpoint. Neither test proves a production pooler's semantics.

## Reuse freshness guard

The final successor also binds context to the network passphrase, RPC URL and configured payment token. Reuse fetches the account again and requires its current sequence + 1 to equal the original envelope sequence. It resimulates the original envelope and requires assembly to reproduce the same XDR byte-for-byte. Simulation errors, restoration needs or changed resources reject reuse without modifying or replacing the old row. This cannot guarantee future ledger state after the response; submit remains subject to network validation. A stale but still-live unsigned envelope is not assumed impossible to sign or submit, so rejection never creates a replacement.

Additional tests cover changed account sequence, simulation failure, RPC change, duplicate matching rows, a signature appearing during lookup, and preservation of the first actor's envelope when another actor builds.
