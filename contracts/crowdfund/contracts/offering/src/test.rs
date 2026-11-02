#![cfg(test)]
extern crate std;

use super::*;
use std::panic::{catch_unwind, AssertUnwindSafe};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env,
};

const MIN: i128 = 100;
const MAX: i128 = 5_000;
const GOAL: i128 = 50_000;
const DEADLINE: u64 = 10_000;

struct T<'a> {
    env: Env,
    client: OfferingClient<'a>,
    admin: Address,
    operator: Address,
    outsider: Address,
}

fn setup<'a>() -> T<'a> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let outsider = Address::generate(&env);
    let token = Address::generate(&env);
    let issuer = Address::generate(&env);
    let id = env.register(Offering, (&admin, &token, &issuer, MIN, MAX, GOAL, DEADLINE));
    let client = OfferingClient::new(&env, &id);
    T { env, client, admin, operator, outsider }
}

#[test]
fn config_and_roles_stored() {
    let t = setup();
    let cfg = t.client.get_config();
    assert_eq!(cfg.min_per_investor, MIN);
    assert_eq!(cfg.max_per_investor, MAX);
    assert_eq!(cfg.goal, GOAL);
    assert_eq!(t.client.admin(), t.admin);
    assert_eq!(t.client.operator(), None);
    assert!(!t.client.paused());
}

#[test]
fn investment_amount_bounds() {
    let t = setup();
    t.client.check_investment_amount(&MIN);
    t.client.check_investment_amount(&MAX);
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.check_investment_amount(&(MIN - 1)))).is_err());
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.check_investment_amount(&(MAX + 1)))).is_err());
}

#[test]
fn limits_update_roles_enforced() {
    let t = setup();
    // Outsider is neither admin nor operator: refused even with mocked auth,
    // because the role check is an explicit equality, not just require_auth.
    assert!(
        catch_unwind(AssertUnwindSafe(|| t.client.set_investor_limits(&t.outsider, &50, &1_000))).is_err()
    );
    // Admin can.
    t.client.set_investor_limits(&t.admin, &50, &1_000);
    assert_eq!(t.client.get_config().min_per_investor, 50);
    // Designated operator can; outsider still cannot.
    t.client.set_operator(&t.operator);
    assert_eq!(t.client.operator(), Some(t.operator.clone()));
    t.client.set_investor_limits(&t.operator, &60, &900);
    assert_eq!(t.client.get_config().max_per_investor, 900);
    assert!(
        catch_unwind(AssertUnwindSafe(|| t.client.set_investor_limits(&t.outsider, &1, &2))).is_err()
    );
}

#[test]
fn invalid_limits_refused() {
    let t = setup();
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.set_investor_limits(&t.admin, &0, &100))).is_err());
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.set_investor_limits(&t.admin, &200, &100))).is_err());
}

#[test]
fn pause_and_deadline_block_new_investments() {
    let t = setup();
    t.client.pause();
    assert!(t.client.paused());
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.check_investment_amount(&MIN))).is_err());
    t.client.unpause();
    t.client.check_investment_amount(&MIN);
    t.env.ledger().set_timestamp(DEADLINE + 1);
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.check_investment_amount(&MIN))).is_err());
    assert!(catch_unwind(AssertUnwindSafe(|| t.client.set_investor_limits(&t.admin, &1, &2))).is_err());
}
