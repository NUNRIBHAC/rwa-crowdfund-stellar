# ADR 0002: Off-chain records with on-chain settlement

- Status: Accepted (v1, testnet prototype)
- Date: 2026-11-02 (decision predates this record; recorded from current source)

## Context

A campaign platform needs user accounts, comments, news, support tickets,
issuer applications, notifications and audit trails. Putting all of that
on-chain would be expensive, public and hard to moderate or delete.

## Decision

Only value-moving facts live on-chain: contribution balances, raised totals,
withdraw/refund settlement, and the campaign configuration. Everything else is
off-chain in the backend's Postgres journal (Neon): community content,
accounts and sessions, appropriateness results, notifications, operator audit
log, and campaign metadata.

The backend independently archives Stellar events (event archive with periodic
snapshots and restore tests) so off-chain records can be reconciled against
chain history without trusting the backend's own writes.

## Consequences

- Off-chain content can be moderated (comment hide/unhide, ticket close),
  corrected and backed up; on-chain settlement cannot be edited by anyone,
  including the operator.
- Two failure modes to monitor instead of one: chain RPC availability AND
  Postgres/backup health (see monitoring docs and the dead-man's switch work).
- Users' public on-chain data is limited to their wallet address and
  contributions; personal data stays off-chain where it can be deleted.
- Any future mainnet version must keep the boundary documented per feature.

## Verification anchors (source, current main)

- contracts/crowdfund/contracts/crowdfund/src/lib.rs (on-chain state:
  `Config`, `Raised`, `Withdrawn`, `Balance`).
- backend/src/community-store.ts, backend/src/journal.ts,
  backend/src/reconciliation.ts, backend/test/* (off-chain journal and
  reconciliation tests).
