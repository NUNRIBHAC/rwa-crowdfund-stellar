# Isolated synthetic default and recovery simulator

A public simulation on the Investors landing page. This is separate from the account assessment and loss-bearing-capacity flow. It is not an ECSPR assessment or a legal debt record.

## Scope and isolation

- Three fixed fictional loans, two campaigns, two investors, and two promoters in the base/adverse register.
- Base, adverse, severe scenarios change explicit late/default/recovery assumptions. Severe deliberately places all three loans with P1 to demonstrate concentration. The original register is never mutated.
- No input of real personal or financial information. No API calls, wallet calls, persistence, payments, signatures, PSPs, balances, or contract writes in the simulator.
- EUR is only an illustrative display unit. All monetary calculations use integer cents and BigInt. Display conversion of a remainder from 0 through 99 is only for localized digits.

## Calculation conventions

Each loan has an original principal, annual rate, dated principal schedule, dated principal payments already received, collateral valuation, and investor shares. Principal paid reconciles to payment history. Outstanding principal equals original principal minus received principal.

- Expected loss: opening outstanding exposure x PD x LGD, both factors in basis points, rounded down to cents once per loan.
- Realized capital loss: defaulted outstanding principal less explicitly simulated capital recovery. No realized loss is booked solely because a loan is late or in collection.
- Interest: simple ACT/365 on the scenario opening outstanding principal for the explicitly assigned delay days, rounded down to cents, not capitalized. This toy convention does not claim to calculate every real loan contract.
- Collateral values are not automatically counted as cash recovery. Interest and collection costs stay separate from principal. The assumed collection cost is EUR 500 for each explicit default.
- Platform operating losses are assumed zero and shown separately, not combined with investor losses.
- Investor shares total 10,000 basis points per loan. Position and recovery use integer division, with the last synthetic investor receiving the rounding residual. Recovery is capped by each allocated position and excess residual cents are redistributed to remaining capacity. Realized loss is derived from allocated position minus allocated recovery, so each investor and the portfolio reconcile even when fractional cent allocations differ. These three fixed records reconcile exactly at loan, campaign, promoter, investor and portfolio levels.
- Base/adverse/severe are deterministic simulations, not probability-calibrated forecasts. Events are explicit fictional decisions, not legal classifications inferred from elapsed time.

Requested worked example: L1 begins with 100,000 principal and 30,000 principal received, leaving 70,000 outstanding. Adverse recovery is 40%, or 28,000. Final capital loss is 42,000. Interest, collection cost and collateral remain separate fields.

## Validation

- Rebased release candidate: all 963 frontend tests in 111 disjoint files passed. Combined unchanged coverage gates passed: 81.99% lines, 74.66% functions, 76.26% branches. Full clean GitHub CI remains the release gate.
- All 11 languages round-tripped through Weblate: 41 added units per language, 451 total, with no changed or removed existing translation units. All 27,533 UI units match the database export. Translated state is not an independent linguistic review.
- Production build, i18n projection/whitespace guard, lint and format checks passed. Focused simulator and Investors tests passed.
- Visual checks: 11 locales x 2 themes x 4 widths x 3 scenarios = 264 checks. Scroll is contained within the loan table on mobile. Register history, schedule, assumptions and event sequence are expandable. Existing theme scope is retained, with light content cards in both chrome themes.
- Selected screenshots were inspected, including Portuguese desktop, Arabic mobile and Hindi mobile register. This is not manual inspection of every screenshot.

## Release boundaries

The release candidate is based on current main after the catalog contract-link fix. It contains only the isolated synthetic simulator and its translations, tests and documentation. Staging activation follows clean CI and exact-image checks. No production, demo, database, wallet or contract changes are included.
