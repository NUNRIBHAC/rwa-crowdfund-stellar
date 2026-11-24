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
