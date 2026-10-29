# Soroban all-or-nothing crowdfund - v1 prototype

Prototype for review. Not audited, not deployed, no funds moved. Tests run only in the in-memory Soroban test environment. Separate from the starter repo.

## Rebuild from this single text file
This file holds every project file (README, toolchain pin, Cargo.lock, sources). Each starts with a line "=== FILE: path ===". Save it as bundle.txt and run:

    awk '/^=== FILE: /{f=$3; system("mkdir -p $(dirname " f ")"); next} {print > f}' bundle.txt
    cargo test --locked                # Rust 1.99.1 is pinned by rust-toolchain.toml
    stellar contract build             # stellar-cli 28.1.0; plain cargo build is rejected by the SDK

Versions: rustc 1.99.1, soroban-sdk 29.0.1, stellar-cli 28.1.0. Setup reference: https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup

## Rules (choices made by the owner)
- All-or-nothing. One contract per campaign, funded in one Stellar asset (SEP-41 / Stellar asset contract).
- Contributions only before the deadline. Total raised is capped at the goal: a contribution larger than the remaining amount is rejected, not trimmed.
- Creator withdraws once, only after the deadline, only if the goal was reached.
- If the goal was missed, each contributor refunds their own balance once, after the deadline.
- Contributions are recorded inside the contract. No transferable token is issued. No creator cancel right.
- Amounts are integers in the asset's smallest unit (no rounding).
- The contract defines no legal rights for contributors (reward, loan, equity, revenue share). That choice is still open.

## Limits and what is not verified
Initialisation. The campaign is configured by a Soroban constructor (__constructor), which runs as part of deployment, so there is no separate init call for anyone to front-run. The constructor calls creator.require_auth(), so deployment is expected to need the creator's authorisation. That is NOT verified: the test environment does not enforce deploy-time authorisation, so no test covers it. Gate: deploy on a test network and confirm a deployment without the creator's signature fails, before relying on it.

Storage lifetime (source: https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/state-archival).
- Campaign balance entries: each contributor's balance is its own persistent entry with its own TTL. The campaign totals and flags are instance storage with one shared TTL. contribute extends both to about 60 days. If a TTL reaches 0 the entry is archived, not erased, and cannot be used until restored. A call then fails (a balance never reads as zero).
- bump(contributor) only extends the TTL of entries that are still live (the campaign instance, and one contributor's balance if given). It does NOT restore archived entries. Restoring is a separate step: usually automatic when the transaction was simulated (the simulation adds archived entries to the restore list), otherwise a manual RestoreFootprintOp. Entries that are already archived must be restored before bump or any other call works.
- Contract code and instance lifetime is separate maintenance. Calling instance().extend_ttl() (which bump does) extends the instance and code entries if they are below their threshold, but the checks are independent, so one can be extended and not the other. Code and instance can also be extended directly with the network's footprint-extension operation or the deployer extend functions. Someone must keep them live for the whole campaign and any refund window.
- There is no maximum deadline. A campaign longer than about 30 days needs someone to call bump before the TTL runs out. Nothing calls it automatically.
- Tested: TTL is set on contribution, decays as ledgers pass, and bump re-extends a live entry. Not tested: real archival and restoration (needs a network).

Tests also cover: contribute and refund fail when signed by a different account; only the creator can withdraw; if the token transfer fails during withdraw or refund the state change is rolled back (simulated by corrupting state in the test); the cap.

Not covered: audit, fees, tokens with transfer restrictions or fee-on-transfer behaviour (use a standard Stellar asset), frontend/API, network deployment, a contributor-rights token. Deadline uses ledger close time in seconds.

## Evidence
    test test::campaigns_are_isolated ... ok
    test test::constructor_validates_params_and_cannot_run_twice ... ok
    test test::contribute_moves_funds_and_records ... ok
    test test::contribute_requires_contributor_auth ... ok
    test test::contribution_over_remaining_target_is_rejected_not_trimmed ... ok
    test test::exact_fill_allowed_then_campaign_is_full ... ok
    test test::insufficient_balance_rolls_back_record ... ok
    test test::no_refund_when_goal_met ... ok
    test test::only_creator_can_withdraw ... ok
    test test::refund_after_failed_deadline_once_only ... ok
    test test::refund_nothing_for_non_contributor ... ok
    test test::refund_requires_contributor_auth ... ok
    test test::refund_transfer_failure_rolls_back_balance ... ok
    test test::rejects_contribution_after_deadline ... ok
    test test::rejects_zero_negative_amount ... ok
    test test::ttl_is_set_on_contribution_and_bump_extends_it ... ok
    test test::withdraw_after_deadline_when_goal_met ... ok
    test test::withdraw_blocked_when_goal_missed ... ok
    test test::withdraw_transfer_failure_rolls_back_flag ... ok
    test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s
Wasm build with stellar contract build: OK, crowdfund.wasm 6904 bytes.

