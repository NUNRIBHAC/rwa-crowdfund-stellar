# SDK30 compatibility preparation

No network deployment, registry edit or contract upgrade is part of this change. Existing historical WASM files and the v1 test fixture remain byte-identical. New SDK30 builds are separate files.

## Selection and integrity

`contract-artifacts.ts` records seven exact artifact hashes and their contract families. Reads accept only known hashes for that family. New campaign preparations select SDK30. Packaging verifies every artifact. CI pins Rust 1.99.1 and CLI 30.0.1 with the official release asset checksum and reproduces the three new files.

A stored pre-upgrade signed deployment is reconciled against the exact artifact hash recovered from its own envelope, not the current deployment pin. A partially completed v2 deployment retains the artifact generation established by its successful journaled envelopes. Mixed or unknown generations fail closed. No historical transaction is replaced.

## ABI qualification

All function names, inputs, and error enum entries are unchanged. The 21 spec differences are Result error type declarations changing from generic error to the Error UDT: five crowdfund, six offering, ten share-token. SDK JS parses both generations. This is adapter/spec evidence, not an independent audit or live protocol execution proof.

The generated metadata targets protocol30. Current mainnet/testnet Horizon both reported protocol30 on November24,2026. No deployment to either network was performed.

## Advisories

SDK30 resolves nine heapless unsound warnings using stellar-strkey1.0.0 and heapless0.9.4. The documented crypto-bigint DEV exception remains because that exact dependency is still in the host/test graph. Chrono and paste unmaintained warnings remain. No advisory exception is widened or removed by this change.

## Sources

- https://github.com/stellar/stellar-cli/releases/tag/v30.0.1
- https://horizon-testnet.stellar.org
- https://horizon.stellar.org

Merge and deployment require separate approval. Native wallet, faucet and on-chain acceptance are not proved by these tests.
