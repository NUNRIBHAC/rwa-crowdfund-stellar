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
    t.client.approve(&t.alice, &t.bob, &200, &1000);
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
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.mint(&t.alice, &-1))).is_err());
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.approve(&t.alice, &t.bob, &-5, &1000))).is_err());
}

// --- Adversarial: guards the Scout lint flags sit on ---------------------
// These prove behaviour with the real host, not by reading the guards:
// an error aborts the invocation and storage rolls back atomically.

#[test]
fn transfer_from_negative_amount_rolls_back_allowance() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &500);
    t.client.approve(&t.alice, &t.bob, &200, &1000);
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
    t.client.approve(&t.alice, &t.bob, &50, &1000);
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

#[test]
fn sep41_allowance_expires_inclusively_without_sliding() {
    use soroban_sdk::testutils::Ledger;
    let t = setup();
    t.env.ledger().with_mut(|l| l.sequence_number = 100);
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &500);
    t.client.approve(&t.alice, &t.bob, &200, &110);
    t.env.ledger().with_mut(|l| l.sequence_number = 110);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 200);
    t.client.transfer_from(&t.bob, &t.alice, &t.bob, &50);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 150);
    t.env.ledger().with_mut(|l| l.sequence_number = 111);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 0);
    assert!(t.client.try_burn_from(&t.bob, &t.alice, &1).is_err());
    assert!(t.client.try_transfer_from(&t.bob, &t.alice, &t.bob, &1).is_err());
    assert_eq!(t.client.balance(&t.alice), 450);
}

#[test]
fn sep41_approval_bounds_overwrite_and_revoke() {
    use soroban_sdk::testutils::Ledger;
    let t = setup();
    t.env.ledger().with_mut(|l| l.sequence_number = 100);
    assert!(t.client.try_approve(&t.alice, &t.bob, &1, &99).is_err());
    assert!(t.client.try_approve(&t.alice, &t.bob, &1, &u32::MAX).is_err());
    t.client.approve(&t.alice, &t.bob, &100, &100);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 100);
    t.client.approve(&t.alice, &t.bob, &50, &120);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 50);
    t.client.approve(&t.alice, &t.bob, &0, &1);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 0);
    let maximum = 100 + t.env.storage().max_ttl() - 1;
    t.client.approve(&t.alice, &t.bob, &1, &maximum);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 1);
}

#[test]
fn sep41_burn_from_guards_supply_allowance_and_pause() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &100);
    t.client.approve(&t.alice, &t.bob, &200, &1000);
    assert!(t.client.try_burn_from(&t.bob, &t.alice, &101).is_err());
    assert!(t.client.try_burn_from(&t.bob, &t.alice, &-1).is_err());
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 200);
    assert_eq!(t.client.total_supply(), 100);
    t.client.pause();
    assert!(t.client.try_burn_from(&t.bob, &t.alice, &1).is_err());
    t.client.unpause();
    t.client.burn_from(&t.bob, &t.alice, &80);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 120);
    assert_eq!(t.client.balance(&t.alice), 20);
    assert_eq!(t.client.total_supply(), 20);
}

#[test]
fn sep41_events_have_exact_topics_and_data() {
    use soroban_sdk::{testutils::Events, symbol_short, IntoVal, Val, Map};
    let t = setup();
    t.client.set_minter(&t.minter);
    let id = t.client.address.clone();
    let mut expected: soroban_sdk::Vec<(Address, soroban_sdk::Vec<Val>, Val)> = soroban_sdk::Vec::new(&t.env);
    t.client.mint(&t.alice, &100);
    expected.push_back(
        (id.clone(), (symbol_short!("mint"), t.alice.clone()).into_val(&t.env), 100i128.into_val(&t.env)));
    assert_eq!(t.env.events().all(), expected);
    expected = soroban_sdk::Vec::new(&t.env);
    t.client.approve(&t.alice, &t.bob, &80, &1000);
    expected.push_back(
        (id.clone(), (symbol_short!("approve"), t.alice.clone(), t.bob.clone()).into_val(&t.env),
        (80i128, 1000u32).into_val(&t.env)));
    assert_eq!(t.env.events().all(), expected);
    expected = soroban_sdk::Vec::new(&t.env);
    let transfer_data = |amount: i128| {
        let mut data = Map::<soroban_sdk::Symbol, Val>::new(&t.env);
        data.set(symbol_short!("amount"), amount.into_val(&t.env));
        data.into_val(&t.env)
    };
    t.client.transfer(&t.alice, &t.bob, &10);
    expected.push_back(
        (id.clone(), (symbol_short!("transfer"), t.alice.clone(), t.bob.clone()).into_val(&t.env), transfer_data(10)));
    assert_eq!(t.env.events().all(), expected);
    expected = soroban_sdk::Vec::new(&t.env);
    t.client.transfer_from(&t.bob, &t.alice, &t.bob, &20);
    expected.push_back(
        (id.clone(), (symbol_short!("transfer"), t.alice.clone(), t.bob.clone()).into_val(&t.env), transfer_data(20)));
    assert_eq!(t.env.events().all(), expected);
    expected = soroban_sdk::Vec::new(&t.env);
    t.client.burn(&t.alice, &5);
    expected.push_back(
        (id.clone(), (symbol_short!("burn"), t.alice.clone()).into_val(&t.env), 5i128.into_val(&t.env)));
    assert_eq!(t.env.events().all(), expected);
    expected = soroban_sdk::Vec::new(&t.env);
    t.client.burn_from(&t.bob, &t.alice, &7);
    expected.push_back(
        (id, (symbol_short!("burn"), t.alice.clone()).into_val(&t.env), 7i128.into_val(&t.env)));
    assert_eq!(t.env.events().all(), expected);
}

#[test]
fn sep41_standard_client_and_zero_amounts() {
    let t = setup();
    let token = soroban_sdk::token::Client::new(&t.env, &t.client.address);
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &100);
    assert_eq!(token.name(), t.client.name());
    assert_eq!(token.symbol(), t.client.symbol());
    assert_eq!(token.decimals(), 7);
    token.approve(&t.alice, &t.bob, &80, &1000);
    token.transfer(&t.alice, &t.bob, &10);
    token.transfer_from(&t.bob, &t.alice, &t.bob, &20);
    token.burn(&t.alice, &5);
    token.burn_from(&t.bob, &t.alice, &7);
    assert_eq!(token.balance(&t.alice), 58);
    assert_eq!(token.allowance(&t.alice, &t.bob), 53);
    token.transfer(&t.alice, &t.bob, &0);
    token.transfer_from(&t.bob, &t.alice, &t.bob, &0);
    token.burn(&t.alice, &0);
    token.burn_from(&t.bob, &t.alice, &0);
    assert_eq!(token.balance(&t.alice), 58);
    assert_eq!(token.allowance(&t.alice, &t.bob), 53);
}

#[test]
fn sep41_legacy_allowance_is_not_promoted() {
    let t = setup();
    t.env.as_contract(&t.client.address, || {
        t.env.storage().persistent().set(&DataKey::Allowance(AllowanceKey {
            from: t.alice.clone(), spender: t.bob.clone(),
        }), &999i128);
    });
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 0);
}

#[test]
fn sep41_muxed_transfer_credits_base_address_and_emits_id() {
    use soroban_sdk::{testutils::{Events, MuxedAddress as _}, symbol_short, IntoVal, Map, Symbol, Val};
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &100);
    let to = MuxedAddress::generate(&t.env);
    t.client.transfer(&t.alice, &to, &25);

    let mut data = Map::<Symbol, Val>::new(&t.env);
    data.set(symbol_short!("amount"), 25i128.into_val(&t.env));
    data.set(Symbol::new(&t.env, "to_muxed_id"), to.id().unwrap().into_val(&t.env));
    let expected: soroban_sdk::Vec<(Address, soroban_sdk::Vec<Val>, Val)> = soroban_sdk::vec![&t.env,
        (t.client.address.clone(), (symbol_short!("transfer"), t.alice.clone(), to.address()).into_val(&t.env), data.into_val(&t.env))];
    assert_eq!(t.env.events().all(), expected);
    assert_eq!(t.client.balance(&to.address()), 25);
}

#[test]
fn sep41_unauthorized_calls_fail_without_changing_state() {
    let t = setup();
    t.client.set_minter(&t.minter);
    t.client.mint(&t.alice, &100);
    t.client.approve(&t.alice, &t.bob, &50, &1000);
    t.env.set_auths(&[]);
    assert!(t.client.try_approve(&t.alice, &t.bob, &80, &1000).is_err());
    assert!(t.client.try_transfer(&t.alice, &t.bob, &1).is_err());
    assert!(t.client.try_transfer_from(&t.bob, &t.alice, &t.bob, &1).is_err());
    assert!(t.client.try_burn(&t.alice, &1).is_err());
    assert!(t.client.try_burn_from(&t.bob, &t.alice, &1).is_err());
    assert!(t.client.try_mint(&t.alice, &1).is_err());
    assert_eq!(t.client.balance(&t.alice), 100);
    assert_eq!(t.client.total_supply(), 100);
    assert_eq!(t.client.allowance(&t.alice, &t.bob), 50);
}

#[test]
fn sep41_metadata_is_readable_without_invoking_getters() {
    let t = setup();
    let m: TokenMetadata = t.env.as_contract(&t.client.address, || {
        t.env.storage().instance().get(&soroban_sdk::symbol_short!("METADATA")).unwrap()
    });
    assert_eq!(m.decimal, 7);
    assert_eq!(m.name, t.client.name());
    assert_eq!(m.symbol, t.client.symbol());
}
