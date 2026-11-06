# Crowdfund v1 - security self-review (2026-11-01)

Scope: `contracts/crowdfund/contracts/crowdfund/src/lib.rs` (255 lines) and
`src/test.rs` (309 lines, 20 tests), at the commit this document was added.

Method: self-review against Certora's "Your Roadmap to a Soroban Security
Audit" (https://www.certora.com/blog/roadmap-to-a-soroban-security-audit,
read 2026-11-01). This is NOT an audit and NOT a substitute for one. It is the
guide's pre-audit preparation applied by the contract's author, so that a
future external audit starts from documented invariants and known gaps.

## Invariants (the "north star" list the guide asks for)

1. `Raised <= Config.goal` at all times (cap enforced in `contribute`,
   lib.rs:176-179: over-goal contributions are rejected, not trimmed).
2. Until settlement, `Raised == sum of all Balance(address) entries`.
3. `withdraw` succeeds at most once (`DataKey::Withdrawn` flag set before the
   token transfer, lib.rs:207-212) and only when `now >= deadline` and
   `Raised >= goal`.
4. `refund` pays each contributor at most once (balance removed before the
   token transfer, lib.rs:229-235) and only when `now >= deadline` and
   `Raised < goal`.
5. Only the configured creator can `withdraw`; only the contributor themselves
   can move their own contribution (`require_auth` in `__constructor`,
   `contribute`, `withdraw`, `refund`).
6. No transferable claim exists: the contribution record is a ledger entry
   inside the contract, so a refunded contribution leaves nothing usable.

## Guide checklist applied

### 1. Design for security

- Invariants: documented above (previously only implicit in code comments).
- STRIDE threat model: NOT YET WRITTEN as a standalone document. Known
  threats and current mitigations:
  - Spoofing: every state-changing entry point calls `require_auth` on the
    relevant address (creator or contributor). Constructor requires the
    creator's auth on the exact deployment arguments, so initialisation
    cannot be front-run (lib.rs:127-142).
  - Tampering: config is written once in the constructor; there is no
    admin/setter path by design (no pause, no upgrade, one immutable
    instance per campaign).
  - Denial of service / resource exhaustion: no loops, no unbounded
    storage growth; one persistent entry per contributor; instance storage
    holds only Config/Raised/Withdrawn. TTLs are bumped on every write and
    via the public `bump` (lib.rs:146-154); expired entries are archived,
    not erased, and calls fail until restored - a balance never silently
    reads as zero (lib.rs module docs, `bump`).
  - Key compromise (web2.5): if the creator key is compromised after the
    goal is met, the attacker can call `withdraw` and take the pool. There
    is no mitigation in v1 (no multisig, no timelock, no pause). Accepted
    for a testnet prototype; MUST be addressed before any mainnet handling
    of real funds.
- Architecture documentation: module docs in lib.rs describe the rules;
  this document adds the security view.

### 2. Clean, verification-friendly code

- Arithmetic: `checked_add` on both the balance and the raised total
  (lib.rs:173-175); `amount <= 0` rejected (lib.rs:166-168); amounts are
  integer smallest-units, so no rounding.
- Checks-effects-interactions: state is updated BEFORE the external token
  call in `contribute` (cap + storage first, transfer last), `withdraw`
  (flag first), and `refund` (balance removed first). If the token call
  fails, the whole invocation rolls back.
- Error handling: typed `Error` enum, no panics on user-controlled paths;
  reads of optional state use explicit defaults (`unwrap_or(0)` /
  `unwrap_or(false)`) only where absence is semantically zero.
- External dependency: the configured SAC/SEP-41 token contract. The
  contract trusts the token's `transfer` semantics; a malicious token
  address is a deployment-time choice of the creator, not user input.
- Storage keys: single `DataKey` enum, no collision surface.

### 3. Testing

- 20 unit tests (test.rs) cover: happy paths (contribute, withdraw,
  refund), constructor validation and single-init, zero/negative amounts,
  post-deadline rejection, rollback when the contributor lacks funds
  (record not left behind), withdraw blocked when goal missed, refund
  blocked when goal met, double-refund prevention, non-contributor refund
  rejection, campaign isolation between instances, and authorization
  requirements on all three mutating entry points.
- NOT DONE yet (guide asks for these before an audit):
  - Fuzz testing (Stellar fuzz guide) - not started.
  - Testnet integration tests of the compiled Wasm - the demo deploys and
    exercises this contract on testnet through the app, but there is no
    dedicated integration test suite.
  - TTL expiry/restore behaviour tests (archived-entry restore path).

### 4. Security tools

- ATTEMPTED 2026-11-06, BLOCKED: Scout static analysis. The crate itself
  compiles clean (`cargo test --locked`, 12/12 passed, rust 1.99.1). The
  scan could not be produced within free infrastructure: (a) the official
  coinfabrik/scout Docker image ships x86-64 only and cannot run on this
  arm64 (Ampere) host; (b) building cargo-scout-audit 0.3.17 from source
  exhausted the free-tier VM disk while installing its required nightly
  toolchain (os error 28); (c) scout 0.3.17 officially supports
  soroban-sdk 28 while this crate pins 29.0.1, so analysis success was
  uncertain even if built (CoinFabrik/scout-audit#341 class). The
  contracts will NOT be downgraded to fit the tool. Interim controls
  remain this manual self-review plus `overflow-checks = true` in the
  release profile. NOT RUN yet: Certora Sunbeam formal verification
  (Sunbeam is noted by the guide as not part of initial Audit Bank
  engagements). Next concrete step: re-attempt Scout when upstream ships
  SDK-29 support (watch CoinFabrik/scout-audit releases; candidate
  independent fork mihaieremia/scout-audit, SDK-29 support unverified) or
  when an aarch64 image or larger runner is available within free
  resources, then fix or document every finding and wire it into CI.

### 5. Application readiness (Audit Bank)

- Required-by-checklist items now present: invariants + this review +
  existing module docs + test suite.
- Missing: STRIDE threat model document, fuzz results, Scout report,
  deployment instructions for auditors.

## Honest status

This contract is a testnet prototype. This self-review raises its audit
readiness but claims no security guarantee. The known critical gap for any
real-money future is creator-key custody (single key controls the pool after
the goal is met); that is a design decision for a future version, not a code
bug in v1.

## Further resources (links only, nothing copied)

- Certora, "Your Roadmap to a Soroban Security Audit" -
  https://www.certora.com/blog/roadmap-to-a-soroban-security-audit
  (Soroban-specific; the checklist this review follows).
- Trail of Bits / Crytic, "building-secure-contracts" -
  https://github.com/crytic/building-secure-contracts (AGPL-3.0).
  EVM-oriented, but its sections on defining invariants and property-based
  testing transfer to Soroban work. Linked as reading only; its content is
  not incorporated into this repository.
- Trail of Bits, "eth-security-toolbox" -
  https://github.com/trailofbits/eth-security-toolbox - EVM tooling, listed
  for completeness; no Soroban equivalent is claimed.
