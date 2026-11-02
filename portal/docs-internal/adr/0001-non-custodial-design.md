# ADR 0001: Non-custodial all-or-nothing campaign contract

- Status: Accepted (v1, testnet prototype)
- Date: 2026-11-02 (decision predates this record; recorded from current source)

## Context

Blockallisto campaigns pool contributor funds. The first contract version had
to decide who holds pooled funds and how settlement works, before any legal
structure, KYC or real-money providers exist.

## Decision

One Soroban contract instance per campaign, configured once in the constructor
at deploy time (creator, token, goal, deadline), so a payment can never be
credited to another campaign and initialisation cannot be front-run. Funds are
held by the contract itself in a Stellar asset (SAC / SEP-41 token) - not by a
platform wallet. Settlement is all-or-nothing:

- `contribute` only before the deadline; a contribution that would exceed the
  goal is rejected (not trimmed), so total raised can never pass the goal.
- After the deadline, if raised == goal the creator can `withdraw` once.
- After the deadline, if raised < goal each contributor can `refund` their own
  balance once (record zeroed before payout, so no double refund).

Amounts are integers in the asset's smallest unit (no cent rounding).

## Consequences

- The platform never takes custody of funds; there is no pooled platform
  account to drain or reconcile.
- Contributors carry deadline risk themselves: funds are locked until the
  deadline either way.
- No partial payouts, no early cancellation, no campaign edits after deploy.
- The contract does NOT define legal rights for contributors (equity, revenue
  share, rewards); that remains a separate legal decision.
- Refund and withdraw correctness depends on the token contract's `transfer`
  semantics; state is written before the external call and any failure rolls
  the whole invocation back.

## Verification anchors (source, current main)

- contracts/crowdfund/contracts/crowdfund/src/lib.rs: `__constructor`,
  `contribute`, `withdraw`, `refund`, `ExceedsGoal`, `AlreadyWithdrawn`,
  `NothingToRefund`.
