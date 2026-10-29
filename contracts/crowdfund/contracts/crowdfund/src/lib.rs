#![no_std]
//! All-or-nothing crowdfunding campaign (PROVISIONAL v1 prototype).
//!
//! One contract instance = one campaign, configured once by the constructor at
//! deploy time (deploy and initialise are one atomic step), so a payment can never be credited
//! to another campaign. Funds are held by the contract in a Stellar asset
//! (SAC / SEP-41 token). Amounts are integers in the asset's smallest unit,
//! so there is no cent rounding.
//!
//! Rules:
//! * `contribute` only before the deadline, and never past the goal: a
//!   contribution larger than the remaining amount is rejected (not trimmed).
//! * After the deadline, if raised == goal the creator can `withdraw` once.
//! * After the deadline, if raised < goal each contributor can `refund` their own balance once.
//! * The contribution record is a non-transferable ledger entry inside this
//!   contract. No transferable receipt token is minted in v1, so a refunded
//!   contribution cannot leave a usable claim behind.
//!
//! This contract does NOT define legal rights for contributors (equity,
//! revenue share, rewards...). That choice is open; see the legal draft.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 2,
    InvalidParams = 3,
    InvalidAmount = 4,
    CampaignEnded = 5,
    CampaignNotEnded = 6,
    GoalNotReached = 7,
    GoalReached = 8,
    AlreadyWithdrawn = 9,
    NothingToRefund = 10,
    Overflow = 11,
    ExceedsGoal = 12,
}

#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub creator: Address,
    pub token: Address,
    pub goal: i128,
    /// Ledger timestamp (seconds). Contributions are accepted while
    /// `now < deadline`; settlement actions need `now >= deadline`.
    pub deadline: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    Raised,
    Withdrawn,
    Balance(Address),
}

#[contractevent]
pub struct Contributed {
    #[topic]
    pub contributor: Address,
    pub amount: i128,
    pub raised: i128,
}

#[contractevent]
pub struct Withdrawn {
    #[topic]
    pub creator: Address,
    pub amount: i128,
}

#[contractevent]
pub struct Refunded {
    #[topic]
    pub contributor: Address,
    pub amount: i128,
}

const DAY_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 30 * DAY_LEDGERS;
const BUMP_TO: u32 = 60 * DAY_LEDGERS;

fn config(env: &Env) -> Result<Config, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Config)
        .ok_or(Error::NotInitialized)
}

fn raised(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::Raised).unwrap_or(0)
}

fn flag(env: &Env, key: DataKey) -> bool {
    env.storage().instance().get(&key).unwrap_or(false)
}

#[contract]
pub struct Crowdfund;

#[contractimpl]
impl Crowdfund {
    /// Runs atomically when the contract is deployed (Soroban constructor), so
    /// nobody can front-run initialisation of a deployed instance. The creator
    /// must authorise the deployment with these exact arguments.
    pub fn __constructor(
        env: Env,
        creator: Address,
        token: Address,
        goal: i128,
        deadline: u64,
    ) -> Result<(), Error> {
        creator.require_auth();
        if goal <= 0 || deadline <= env.ledger().timestamp() {
            return Err(Error::InvalidParams);
        }
        env.storage().instance().set(
            &DataKey::Config,
            &Config { creator, token, goal, deadline },
        );
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
        Ok(())
    }

    /// Anyone may call this to keep the campaign and (optionally) one
    /// contributor's balance record alive. Entries that expire are archived,
    /// not erased: they must be restored before the contract can be used, and
    /// calls fail until then (a balance never silently reads as zero).
    pub fn bump(env: Env, contributor: Option<Address>) {
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
        if let Some(c) = contributor {
            let key = DataKey::Balance(c);
            if env.storage().persistent().has(&key) {
                env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
            }
        }
    }

    /// Contribute `amount` before the deadline. Tokens move from the
    /// contributor to this contract and are recorded against them.
    pub fn contribute(env: Env, contributor: Address, amount: i128) -> Result<(), Error> {
        let cfg = config(&env)?;
        contributor.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if env.ledger().timestamp() >= cfg.deadline {
            return Err(Error::CampaignEnded);
        }

        // Effects before the external token call.
        let key = DataKey::Balance(contributor.clone());
        let prev: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        let new_bal = prev.checked_add(amount).ok_or(Error::Overflow)?;
        let new_raised = raised(&env).checked_add(amount).ok_or(Error::Overflow)?;
        // Cap: total raised can never exceed the goal (approved by the owner).
        if new_raised > cfg.goal {
            return Err(Error::ExceedsGoal);
        }
        env.storage().persistent().set(&key, &new_bal);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        env.storage().instance().set(&DataKey::Raised, &new_raised);
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);

        // Fails (and rolls everything back) if the contributor lacks funds.
        token::Client::new(&env, &cfg.token).transfer(
            &contributor,
            &env.current_contract_address(),
            &amount,
        );

        Contributed { contributor, amount, raised: new_raised }.publish(&env);
        Ok(())
    }

    /// Creator takes the raised funds once, after the deadline, if the goal
    /// was reached. Nothing else can move the pooled funds.
    pub fn withdraw(env: Env) -> Result<i128, Error> {
        let cfg = config(&env)?;
        cfg.creator.require_auth();
        if env.ledger().timestamp() < cfg.deadline {
            return Err(Error::CampaignNotEnded);
        }
        let total = raised(&env);
        if total < cfg.goal {
            return Err(Error::GoalNotReached);
        }
        if flag(&env, DataKey::Withdrawn) {
            return Err(Error::AlreadyWithdrawn);
        }
        env.storage().instance().set(&DataKey::Withdrawn, &true);
        token::Client::new(&env, &cfg.token).transfer(
            &env.current_contract_address(),
            &cfg.creator,
            &total,
        );
        Withdrawn { creator: cfg.creator, amount: total }.publish(&env);
        Ok(total)
    }

    /// Contributor takes back their own balance, once. Allowed only after the
    /// deadline passed without reaching the goal.
    pub fn refund(env: Env, contributor: Address) -> Result<i128, Error> {
        let cfg = config(&env)?;
        contributor.require_auth();
        if env.ledger().timestamp() < cfg.deadline {
            return Err(Error::CampaignNotEnded);
        }
        if raised(&env) >= cfg.goal {
            return Err(Error::GoalReached);
        }
        let key = DataKey::Balance(contributor.clone());
        let bal: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if bal <= 0 {
            return Err(Error::NothingToRefund);
        }
        // Zero the record before paying out: no double refund.
        env.storage().persistent().remove(&key);
        token::Client::new(&env, &cfg.token).transfer(
            &env.current_contract_address(),
            &contributor,
            &bal,
        );
        Refunded { contributor, amount: bal }.publish(&env);
        Ok(bal)
    }

    pub fn balance_of(env: Env, contributor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(contributor))
            .unwrap_or(0)
    }

    pub fn total_raised(env: Env) -> i128 {
        raised(&env)
    }

    pub fn get_config(env: Env) -> Result<Config, Error> {
        config(&env)
    }

    pub fn is_withdrawn(env: Env) -> bool {
        flag(&env, DataKey::Withdrawn)
    }
}

#[cfg(test)]
mod test;
