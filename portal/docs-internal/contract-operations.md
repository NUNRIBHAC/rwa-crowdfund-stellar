# Contract operations

- Deployments are on Stellar **testnet**; each environment has its own
  contract instance. Deployment notes live in `docs/testnet-deployment.md`
  in the repo.
- Local contract work uses Stellar CLI 28.1.0 (`rust-toolchain.toml` pins
  the Rust toolchain).
- Contract rules (v1 design): all-or-nothing funding, contributions capped
  at the goal, payout only after the deadline, per-contributor balances, no
  transferable token.
- Events carry contributor + amount, which is what the backfill and the
  planned durable archive index.
- State archival: persistent/instance entries archive at TTL expiry rather
  than delete; they restore when accessed with the known key (Protocol 23+
  automatic restore via RPC simulation). A known contributor's balance is
  therefore recoverable indefinitely, but historical contribution amounts
  are not derivable from current state.

## Planned contract evolution (approved direction, not implemented)

Per-offering min/max investment, role-based access control (replacing the
demo shared admin key), pausable, upgradeable, SEP-41-compatible token as
the base for future transferable instruments. Powers that change holder
rights (whitelist, freeze, clawback, forced transfer) require legal and
investor-disclosure review before activation.
