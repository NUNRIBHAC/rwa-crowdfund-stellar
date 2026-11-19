# Debt terms (unratified scaffold)

Deterministic, pure debt-servicing math for a future ECSPR interest-bearing debt
instrument. This crate has no storage, moves no funds, emits no events, and has
no `#[contract]` entry points, so it cannot be deployed and cannot change
`crowdfund.wasm`, `offering`, or `share-token` bytes.

## Assumptions are placeholders

Every constant and convention here is a placeholder pending an approved
debt-instrument specification and the corresponding legal/authorisation
decision. In particular, none of the following is approved:

- simple (non-compounding) interest, actual/365 fixed day count with a
  `31_536_000` second year;
- rates expressed as integer basis points per annum, `10_000` bps = 100 %;
- `i128` base units with 7 decimals;
- floor rounding, so fractional base units are never created;
- equal coupon periods with the last period absorbing the remainder seconds;
- a per-coupon carry of at most one base unit: because each coupon is a
  difference of floored cumulative amounts, one coupon can exceed the floor of
  its own period's interest by one base unit when a fraction is carried from an
  earlier period. The schedule total stays exact, so no value is created;
- a `MAX_COUPON_PERIODS` cap of 1_000 coupons per schedule, which guards an
  unbounded allocation;
- the error set in `DebtError`, including refusing an overflowing intermediate
  product rather than wrapping or saturating.

## Evidence boundary

Passing unit tests are local evidence only. They are not a staging result, not a
real-wallet result, and not regulatory readiness. Nothing here has been reviewed
by counsel, authorised by a regulator, or exercised against a deployed contract.

## Local check

```sh
cd contracts/crowdfund && cargo test --locked
```
