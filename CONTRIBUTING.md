# Contributing

This repository is the owner's original work, published for review and
demonstration. It is not open source and is **not currently accepting
external code contributions**: pull requests from forks may be closed without
review, and no rights to reuse the code are granted (see the repository
notice).

Bug reports are welcome as GitHub issues. For security findings, do not open
a public issue - follow SECURITY.md instead.

## Local development (for the owner and invited collaborators)

- Node 24 (`engines >=24 <25`; see `.nvmrc`).
- `npm ci`, then `npm run lint`, `npm test` and `npm run build` must pass
  before pushing. CI enforces all of these plus a high/critical `npm audit`
  gate, on every pull request.
- `npm run format` normalizes formatting with Prettier; `npm run format:check`
  verifies it.
- Contracts are Rust (pinned toolchain); `contracts/crowdfund` has its own
  `cargo test` and a pinned Stellar CLI build whose Wasm output is
  hash-verified in CI.
