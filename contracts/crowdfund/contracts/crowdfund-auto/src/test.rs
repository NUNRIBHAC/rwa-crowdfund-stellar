#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::storage::{Instance as _, Persistent as _};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};
use std::panic::{catch_unwind, AssertUnwindSafe};

const GOAL: i128 = 1_000;
const DEADLINE: u64 = 10_000;

struct T<'a> {
    env: Env,
    client: CrowdfundClient<'a>,
    token: TokenClient<'a>,
    creator: Address,
    alice: Address,
    bob: Address,
    contract: Address,
}

fn setup<'a>() -> T<'a> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    sac.issuer()
        .set_flag(soroban_sdk::testutils::IssuerFlags::RevocableFlag);
    let token = TokenClient::new(&env, &sac.address());
    let admin = StellarAssetClient::new(&env, &sac.address());
    admin.mint(&alice, &5_000);
    admin.mint(&bob, &5_000);
    let contract = env.register(Crowdfund, (&creator, &sac.address(), GOAL, DEADLINE));
    let client = CrowdfundClient::new(&env, &contract);
    T {
        env,
        client,
        token,
        creator,
        alice,
        bob,
        contract,
    }
}

fn end(t: &T) {
    t.env.ledger().set_timestamp(DEADLINE);
}

#[test]
fn contribute_moves_funds_and_records() {
    let t = setup();
    t.client.contribute(&t.alice, &300);
    t.client.contribute(&t.alice, &200);
    assert_eq!(t.client.balance_of(&t.alice), 500);
    assert_eq!(t.client.total_raised(), 500);
    assert_eq!(t.token.balance(&t.contract), 500);
    assert_eq!(t.token.balance(&t.alice), 4_500);
}

#[test]
fn constructor_validates_params_and_cannot_run_twice() {
    let t = setup();
    let cfg = t.client.get_config();
    assert_eq!((cfg.goal, cfg.deadline), (GOAL, DEADLINE));
    // there is no public init function to call again
    let a = Address::generate(&t.env);
    assert!(catch_unwind(AssertUnwindSafe(|| t
        .env
        .register(Crowdfund, (&a, &a, 0i128, 100u64))))
    .is_err());
    assert!(catch_unwind(AssertUnwindSafe(|| t
        .env
        .register(Crowdfund, (&a, &a, 10i128, 0u64))))
    .is_err());
}

#[test]
fn rejects_zero_negative_amount() {
    let t = setup();
    assert_eq!(
        t.client.try_contribute(&t.alice, &0),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        t.client.try_contribute(&t.alice, &-5),
        Err(Ok(Error::InvalidAmount))
    );
}

#[test]
fn rejects_contribution_after_deadline() {
    let t = setup();
    end(&t);
    assert_eq!(
        t.client.try_contribute(&t.alice, &10),
        Err(Ok(Error::CampaignEnded))
    );
}

#[test]
fn insufficient_balance_rolls_back_record() {
    let t = setup();
    let poor = Address::generate(&t.env);
    assert!(t.client.try_contribute(&poor, &500).is_err());
    assert_eq!(t.client.balance_of(&poor), 0);
    assert_eq!(t.client.total_raised(), 0);
}

#[test]
fn withdraw_after_deadline_when_goal_met() {
    let t = setup();
    t.client.contribute(&t.alice, &600);
    t.client.contribute(&t.bob, &400);
    // goal reached but deadline not passed: no early payout
    assert_eq!(t.client.try_withdraw(), Err(Ok(Error::CampaignNotEnded)));
    end(&t);
    assert_eq!(t.client.withdraw(), 1_000);
    assert_eq!(t.token.balance(&t.creator), 1_000);
    assert_eq!(t.token.balance(&t.contract), 0);
    assert!(t.client.is_withdrawn());
    // These are contribution records, not the contract's remaining escrow.
    // The account UI must not present them as funds still held by the contract.
    assert_eq!(t.client.balance_of(&t.alice), 600);
    assert_eq!(t.client.balance_of(&t.bob), 400);
    assert_eq!(t.client.try_withdraw(), Err(Ok(Error::AlreadyWithdrawn)));
}

#[test]
fn no_refund_when_goal_met() {
    let t = setup();
    t.client.contribute(&t.alice, &1_000);
    end(&t);
    assert_eq!(t.client.try_refund(&t.alice), Err(Ok(Error::GoalReached)));
}

#[test]
fn withdraw_blocked_when_goal_missed() {
    let t = setup();
    t.client.contribute(&t.alice, &999);
    end(&t);
    assert_eq!(t.client.try_withdraw(), Err(Ok(Error::GoalNotReached)));
}

#[test]
fn refund_after_failed_deadline_once_only() {
    let t = setup();
    t.client.contribute(&t.alice, &400);
    t.client.contribute(&t.bob, &100);
    assert_eq!(
        t.client.try_refund(&t.alice),
        Err(Ok(Error::CampaignNotEnded))
    );
    end(&t);
    assert_eq!(t.client.refund(&t.alice), 400);
    assert_eq!(t.token.balance(&t.alice), 5_000);
    assert_eq!(t.client.balance_of(&t.alice), 0);
    assert_eq!(
        t.client.try_refund(&t.alice),
        Err(Ok(Error::NothingToRefund))
    );
    // bob unaffected and contract still holds his money
    assert_eq!(t.token.balance(&t.contract), 100);
    assert_eq!(t.client.refund(&t.bob), 100);
    assert_eq!(t.token.balance(&t.contract), 0);
}

#[test]
fn refund_nothing_for_non_contributor() {
    let t = setup();
    end(&t);
    assert_eq!(
        t.client.try_refund(&t.alice),
        Err(Ok(Error::NothingToRefund))
    );
}

#[test]
fn campaigns_are_isolated() {
    let t = setup();
    let id2 = t
        .env
        .register(Crowdfund, (&t.creator, &t.token.address, GOAL, DEADLINE));
    let c2 = CrowdfundClient::new(&t.env, &id2);
    t.client.contribute(&t.alice, &700);
    assert_eq!(c2.total_raised(), 0);
    assert_eq!(c2.balance_of(&t.alice), 0);
}

#[test]
fn only_creator_can_withdraw() {
    use soroban_sdk::{testutils::MockAuth, testutils::MockAuthInvoke, IntoVal};
    let t = setup();
    t.client.contribute(&t.alice, &1_000);
    end(&t);
    // authorise as bob only: withdraw must fail since creator auth is needed
    let r = t
        .client
        .mock_auths(&[MockAuth {
            address: &t.bob,
            invoke: &MockAuthInvoke {
                contract: &t.contract,
                fn_name: "withdraw",
                args: ().into_val(&t.env),
                sub_invokes: &[],
            },
        }])
        .try_withdraw();
    assert!(r.is_err());
    assert_eq!(t.token.balance(&t.creator), 0);
}

#[test]
fn contribute_requires_contributor_auth() {
    use soroban_sdk::{testutils::MockAuth, testutils::MockAuthInvoke, IntoVal};
    let t = setup();
    // bob signs, but tries to spend alice's funds
    let args = (&t.alice, 100i128).into_val(&t.env);
    let r = t
        .client
        .mock_auths(&[MockAuth {
            address: &t.bob,
            invoke: &MockAuthInvoke {
                contract: &t.contract,
                fn_name: "contribute",
                args,
                sub_invokes: &[],
            },
        }])
        .try_contribute(&t.alice, &100);
    assert!(r.is_err());
    assert_eq!(t.token.balance(&t.alice), 5_000);
    assert_eq!(t.client.total_raised(), 0);
}

#[test]
fn refund_requires_contributor_auth() {
    use soroban_sdk::{testutils::MockAuth, testutils::MockAuthInvoke, IntoVal};
    let t = setup();
    t.client.contribute(&t.alice, &100);
    end(&t);
    let args = (&t.alice,).into_val(&t.env);
    let r = t
        .client
        .mock_auths(&[MockAuth {
            address: &t.bob,
            invoke: &MockAuthInvoke {
                contract: &t.contract,
                fn_name: "refund",
                args,
                sub_invokes: &[],
            },
        }])
        .try_refund(&t.alice);
    assert!(r.is_err());
    assert_eq!(t.client.balance_of(&t.alice), 100);
    assert_eq!(t.token.balance(&t.bob), 5_000);
}

#[test]
fn withdraw_transfer_failure_rolls_back_flag() {
    let t = setup();
    // Corrupt state on purpose: record raised funds the contract does not hold.
    t.env.as_contract(&t.contract, || {
        t.env.storage().instance().set(&DataKey::Raised, &GOAL);
    });
    end(&t);
    assert!(t.client.try_withdraw().is_err());
    assert!(!t.client.is_withdrawn()); // flag rolled back with the failed transfer
    assert_eq!(t.token.balance(&t.creator), 0);
}

#[test]
fn refund_transfer_failure_rolls_back_balance() {
    let t = setup();
    t.env.as_contract(&t.contract, || {
        t.env
            .storage()
            .persistent()
            .set(&DataKey::Balance(t.alice.clone()), &100i128);
    });
    end(&t);
    assert!(t.client.try_refund(&t.alice).is_err());
    assert_eq!(t.client.balance_of(&t.alice), 100); // record restored
}

#[test]
fn ttl_is_set_on_contribution_and_bump_extends_it() {
    let t = setup();
    t.client.contribute(&t.alice, &100);
    let key = DataKey::Balance(t.alice.clone());
    let ttl = |t: &T| {
        t.env
            .as_contract(&t.contract, || t.env.storage().persistent().get_ttl(&key))
    };
    let inst = |t: &T| {
        t.env
            .as_contract(&t.contract, || t.env.storage().instance().get_ttl())
    };
    assert!(ttl(&t) >= 59 * 17_280);
    assert!(inst(&t) >= 59 * 17_280);
    // 40 days later TTL has dropped below the threshold; bump restores it
    t.env
        .ledger()
        .with_mut(|l| l.sequence_number += 40 * 17_280);
    assert!(ttl(&t) < 30 * 17_280);
    t.client.bump(&Some(t.alice.clone()));
    assert!(ttl(&t) >= 59 * 17_280);
    assert!(inst(&t) >= 59 * 17_280);
    assert_eq!(t.client.balance_of(&t.alice), 100);
}

#[test]
fn contribution_over_remaining_target_is_rejected_not_trimmed() {
    let t = setup();
    t.client.contribute(&t.alice, &900);
    assert_eq!(
        t.client.try_contribute(&t.bob, &101),
        Err(Ok(Error::ExceedsGoal))
    );
    assert_eq!(t.client.total_raised(), 900);
    assert_eq!(t.token.balance(&t.bob), 5_000);
    // single oversize contribution on an empty campaign
    let t2 = setup();
    assert_eq!(
        t2.client.try_contribute(&t2.alice, &1_001),
        Err(Ok(Error::ExceedsGoal))
    );
    assert_eq!(t2.client.total_raised(), 0);
}

#[test]
fn exact_fill_allowed_then_campaign_is_full() {
    let t = setup();
    t.client.contribute(&t.alice, &900);
    t.client.contribute(&t.bob, &100); // exactly the remaining amount
    assert_eq!(t.client.total_raised(), GOAL);
    assert_eq!(
        t.client.try_contribute(&t.bob, &1),
        Err(Ok(Error::ExceedsGoal))
    );
    end(&t);
    assert_eq!(t.client.withdraw(), GOAL);
}

#[test]
fn failed_full_goal_contribution_does_not_reserve_capacity_for_others() {
    let t = setup();
    // Alice was funded at setup. Drain her just before the contribution,
    // modelling the balance race that jams the classic pending-intent flow.
    t.token.transfer(&t.alice, &t.bob, &5_000);
    let failed = catch_unwind(AssertUnwindSafe(|| t.client.contribute(&t.alice, &GOAL)));
    assert!(failed.is_err());
    assert_eq!(t.client.total_raised(), 0);
    assert_eq!(t.client.balance_of(&t.alice), 0);
    assert_eq!(t.token.balance(&t.contract), 0);
    // Another contributor can still fill the entire goal and settle it.
    t.client.contribute(&t.bob, &GOAL);
    assert_eq!(t.client.total_raised(), GOAL);
    end(&t);
    assert_eq!(t.client.withdraw(), GOAL);
    assert_eq!(t.token.balance(&t.creator), GOAL);
}

#[test]
fn automatic_refund_needs_no_contributor_signature_and_cannot_redirect() {
    let t = setup();
    t.client.contribute(&t.alice, &400);
    t.client.contribute(&t.bob, &100);
    end(&t);
    // An empty auth set proves no wallet signature is required for settlement.
    assert_eq!(t.client.mock_auths(&[]).refund_for(&t.alice), 400);
    assert_eq!(t.token.balance(&t.alice), 5_000);
    assert_eq!(t.token.balance(&t.bob), 4_900);
    assert_eq!(t.token.balance(&t.contract), 100);
    assert_eq!(t.client.balance_of(&t.alice), 0);
    assert_eq!(
        t.client.try_refund_for(&t.alice),
        Err(Ok(Error::NothingToRefund))
    );
    assert_eq!(
        t.client.try_refund(&t.alice),
        Err(Ok(Error::NothingToRefund))
    );
}

#[test]
fn automatic_refund_rejects_before_deadline_success_and_non_contributor() {
    let t = setup();
    t.client.contribute(&t.alice, &100);
    assert_eq!(
        t.client.try_refund_for(&t.alice),
        Err(Ok(Error::CampaignNotEnded))
    );
    end(&t);
    assert_eq!(
        t.client.try_refund_for(&t.creator),
        Err(Ok(Error::NothingToRefund))
    );
    assert_eq!(t.client.balance_of(&t.alice), 100);
    let funded = setup();
    funded.client.contribute(&funded.alice, &GOAL);
    end(&funded);
    assert_eq!(
        funded.client.try_refund_for(&funded.alice),
        Err(Ok(Error::GoalReached))
    );
}

#[test]
fn automatic_refund_transfer_failure_retains_pending_balance() {
    let t = setup();
    t.env.as_contract(&t.contract, || {
        t.env
            .storage()
            .persistent()
            .set(&DataKey::Balance(t.alice.clone()), &100i128);
    });
    end(&t);
    assert!(t.client.try_refund_for(&t.alice).is_err());
    assert_eq!(t.client.balance_of(&t.alice), 100);
    assert_eq!(t.token.balance(&t.alice), 5_000);
}

#[test]
fn blocked_recipient_does_not_block_another_recipient() {
    let t = setup();
    t.client.contribute(&t.alice, &100);
    t.client.contribute(&t.bob, &200);
    let cfg = t.client.get_config();
    StellarAssetClient::new(&t.env, &cfg.token).set_authorized(&t.alice, &false);
    end(&t);
    assert!(t.client.try_refund_for(&t.alice).is_err());
    assert_eq!(t.client.balance_of(&t.alice), 100);
    assert_eq!(t.client.mock_auths(&[]).refund_for(&t.bob), 200);
    assert_eq!(t.client.balance_of(&t.bob), 0);
    assert_eq!(t.token.balance(&t.contract), 100);
    StellarAssetClient::new(&t.env, &cfg.token).set_authorized(&t.alice, &true);
    assert_eq!(t.client.mock_auths(&[]).refund_for(&t.alice), 100);
}

#[test]
fn manual_first_prevents_automatic_duplicate_and_campaigns_stay_isolated() {
    let t = setup();
    let other_id = t
        .env
        .register(Crowdfund, (&t.creator, &t.token.address, GOAL, DEADLINE));
    let other = CrowdfundClient::new(&t.env, &other_id);
    t.client.contribute(&t.alice, &100);
    end(&t);
    assert_eq!(
        other.try_refund_for(&t.alice),
        Err(Ok(Error::NothingToRefund))
    );
    assert_eq!(t.client.refund(&t.alice), 100);
    assert_eq!(
        t.client.try_refund_for(&t.alice),
        Err(Ok(Error::NothingToRefund))
    );
}

#[test]
fn refund_event_wire_shape_is_stable() {
    use soroban_sdk::events::Event;
    let t = setup();
    let event = Refunded {
        contributor: t.alice.clone(),
        amount: 400,
    }
    .to_xdr(&t.env, &t.contract);
    let soroban_sdk::xdr::ContractEventBody::V0(body) = event.body;
    {
        assert_eq!(body.topics.len(), 2);
        assert_eq!(
            body.topics[0],
            soroban_sdk::xdr::ScVal::Symbol(
                soroban_sdk::xdr::ScSymbol::try_from("refunded").unwrap()
            )
        );
        if let soroban_sdk::xdr::ScVal::Map(Some(fields)) = body.data {
            assert_eq!(fields.len(), 1);
            assert_eq!(
                fields[0].key,
                soroban_sdk::xdr::ScVal::Symbol(
                    soroban_sdk::xdr::ScSymbol::try_from("amount").unwrap()
                )
            );
            assert_eq!(
                fields[0].val,
                soroban_sdk::xdr::ScVal::I128(soroban_sdk::xdr::Int128Parts { hi: 0, lo: 400 })
            );
        } else {
            panic!("map required");
        }
    }
}
