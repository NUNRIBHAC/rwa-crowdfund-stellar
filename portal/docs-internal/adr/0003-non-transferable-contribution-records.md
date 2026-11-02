# ADR 0003: Non-transferable contribution records (no receipt token in v1)

- Status: Accepted (v1, testnet prototype)
- Date: 2026-11-02 (decision predates this record; recorded from current source)

## Context

A contribution could be represented as a transferable token (a receipt or
share). That would enable secondary transfer - and with it transferability,
listing and investor-protection questions the project is not ready to answer,
legally or technically.

## Decision

The contribution record in v1 is a non-transferable ledger entry inside the
campaign contract (`Balance(contributor)` in persistent storage). No receipt
or claim token is minted. A refunded contribution removes the record before
payout, so a refund cannot leave a usable claim behind.

## Consequences

- Contributions cannot be sold, gifted or used as collateral; there is no
  secondary market surface in v1.
- Balance queries are read-only contract calls (`balance_of`), free of
  transfer logic and its attack surface.
- Storage entries expire with TTL; anyone may call `bump` to keep a campaign
  and balance records alive. Expired entries are archived, not erased, and
  must be restored before use - a balance never silently reads as zero.
- A future v2 with transferable positions is a new decision with its own
  legal review; v1 records do not pre-commit to it.

## Verification anchors (source, current main)

- contracts/crowdfund/contracts/crowdfund/src/lib.rs: `DataKey::Balance`,
  `refund` (record removed before payout), `bump`, `balance_of`.
