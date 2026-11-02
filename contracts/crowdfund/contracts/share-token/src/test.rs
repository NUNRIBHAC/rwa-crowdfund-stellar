#![cfg(test)]
extern crate std;

use super::*;
use std::panic::{catch_unwind, AssertUnwindSafe};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

struct T<'a> {
    env: Env,
    client: ShareTokenClient<'a>,
    admin: Address,
    minter: Address,
    alice: Address,
    bob: Address,
}

fn setup<'a>() -> T<'a> {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let minter = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let id = env.register(
        ShareToken,
        (
            &admin,
            String::from_str(&env, "Demo Solar Share"),
            String::from_str(&env, "DSS"),
            7u32,
        ),
    );
    let client = ShareTokenClient::new(&env, &id);
    T { env, client, admin, minter, alice, bob }
}

#[test]
fn metadata_and_zero_supply() {
    let t = setup();
    assert_eq!(t.client.name(), String::from_str(&t.env, "Demo Solar Share"));
    assert_eq!(t.client.symbol(), String::from_str(&t.env, "DSS"));
    assert_eq!(t.client.decimals(), 7);
    assert_eq!(t.client.total_supply(), 0);
    assert_eq!(t.client.admin(), t.admin);
    assert_eq!(t.client.minter(), None);
    assert!(!t.client.paused());
}

#[test]
fn mint_only_by_designated_minter() {
    let t = setup();
    // No minter designated yet: mint refuses.
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.mint(&t.alice, &100))).is_err());
    t.client.set_minter(&t.minter);
    assert_eq!(t.client.minter(), Some(t.minter.clone()));
    t.client.mint(&t.alice, &1_000);
    assert_eq!(t.client.balance(&t.alice), 1_000);
    assert_eq!(t.client.total_supply(), 1_000);
}

#[test]
fn transfer_and_burn_move_supply() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &1_000);
    t.client.transfer(&t.alice, &t.bob, &400);
    assert_eq!(t.client.balance(&t.alice), 600);
    assert_eq!(t.client.balance(&t.bob), 400);
    t.client.burn(&t.bob, &100);
    assert_eq!(t.client.balance(&t.bob), 300);
    assert_eq!(t.client.total_supply(), 900);
    // Overspend refuses, leaving balances untouched.
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.transfer(&t.alice, &t.bob, &601))).is_err());
    assert_eq!(t.client.balance(&t.alice), 600);
}

#[test]
fn allowance_flow() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &500);
    t.client.approve(&t.alice, &t.bob, &200);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 200);
    t.client.transfer_from(&t.bob, &t.alice, &t.bob, &120);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 80);
    assert_eq!(t.client.balance(&t.bob), 120);
    // Allowance overspend refuses.
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.transfer_from(&t.bob, &t.alice, &t.bob, &81))).is_err());
}

#[test]
fn pause_freezes_movement_and_unpause_restores() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &100);
    t.client.pause();
    assert!(t.client.paused());
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.transfer(&t.alice, &t.bob, &10))).is_err());
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.mint(&t.bob, &10))).is_err());
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.burn(&t.alice, &10))).is_err());
    t.client.unpause();
    t.client.transfer(&t.alice, &t.bob, &10);
    assert_eq!(t.client.balance(&t.bob), 10);
}

#[test]
fn invalid_amounts_refused() {
    let t = setup();
    t.client.set_minter(&t.minter);
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.mint(&t.alice, &0))).is_err());
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.approve(&t.alice, &t.bob, &-5))).is_err());
}

// --- Adversarial: guards the Scout lint flags sit on ---------------------
// These prove behaviour with the real host, not by reading the guards:
// an error aborts the invocation and storage rolls back atomically.

#[test]
fn transfer_from_negative_amount_rolls_back_allowance() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &500);
    t.client.approve(&t.alice, &t.bob, &200);
    // spend_allowance runs before move_value's amount check; a negative
    // amount must not leave the allowance raised after the error.
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.transfer_from(&t.bob, &t.alice, &t.bob, &-1))).is_err());
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 200);
    assert_eq!(t.client.balance(&t.alice), 500);
    assert_eq!(t.client.balance(&t.bob), 0);
    assert_eq!(t.client.total_supply(), 500);
}

#[test]
fn burn_keeps_total_at_least_any_balance() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &500);
    t.client.mint(&t.bob, &300);
    t.client.burn(&t.alice, &200);
    assert_eq!(t.client.total_supply(), 600);
    // Burning more than the holder owns refuses; total must not move,
    // so read_total - amount can never underflow behind the guard.
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.burn(&t.alice, &301))).is_err());
    assert_eq!(t.client.balance(&t.alice), 300);
    assert_eq!(t.client.total_supply(), 600);
}

#[test]
fn mint_overflow_at_i128_max_refused() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &i128::MAX);
    assert_eq!(t.client.total_supply(), i128::MAX);
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.mint(&t.bob, &1))).is_err());
    assert_eq!(t.client.balance(&t.bob), 0);
    assert_eq!(t.client.total_supply(), i128::MAX);
}

#[test]
fn transfer_over_balance_refused_unchanged() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &100);
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.transfer(&t.alice, &t.bob, &101))).is_err());
    assert_eq!(t.client.balance(&t.alice), 100);
    assert_eq!(t.client.balance(&t.bob), 0);
}

#[test]
fn self_transfer_does_not_inflate() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &100);
    t.client.transfer(&t.alice, &t.alice, &60);
    assert_eq!(t.client.balance(&t.alice), 100);
    assert_eq!(t.client.total_supply(), 100);
    t.client.approve(&t.alice, &t.bob, &50);
    t.client.transfer_from(&t.bob, &t.alice, &t.alice, &50);
    assert_eq!(t.client.balance(&t.alice), 100);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 0);
}

#[test]
fn deployment_fails_closed_on_missing_or_bad_init() {
    // The host only instantiates through __constructor: registering the
    // code without the constructor arguments refuses outright, so no
    // call can ever reach default-empty storage.
    let env = Env::default();
    env.mock_all_auths();
    assert!(catch_unwind(AssertUnwindSafe(|| {
        #[allow(deprecated)]
        env.register_contract(None, ShareToken)
    }))
    .is_err());
    // Malformed init params refuse as well (decimals above the SEP-41
    // ceiling); nothing is deployed.
    assert!(catch_unwind(AssertUnwindSafe(|| {
        env.register(
            ShareToken,
            (
                &Address::generate(&env),
                String::from_str(&env, "X"),
                String::from_str(&env, "X"),
                19u32,
            ),
        )
    }))
    .is_err());
}
