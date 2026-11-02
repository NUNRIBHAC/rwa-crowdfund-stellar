#![no_std]
//! Offering configuration contract (contract v2, testnet prototype).
//!
//! Separates an offering's configuration from its share token: one instance
//! holds the token address, the issuer, the per-investor min/max bounds, the
//! funding goal and the deadline, plus role and pause primitives. The
//! campaign builder (later increment) deploys one of these per offering and
//! wires it to a share-token instance; settlement/investment flows come
//! after that and are NOT part of this scaffold.
//!
//! Scope honesty: configuration and access primitives only. No funds move
//! here, no production roles are assigned, and no investor rights change.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

const DAY_LEDGERS: u32 = 17280;
const BUMP_THRESHOLD: u32 = 30 * DAY_LEDGERS;
const BUMP_TO: u32 = 60 * DAY_LEDGERS;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidParams = 1,
    Paused = 2,
    OfferingEnded = 3,
    BelowMin = 4,
    AboveMax = 5,
    Unauthorized = 6,
}

#[contracttype]
#[derive(Clone)]
pub struct OfferingConfig {
    pub token: Address,
    pub issuer: Address,
    pub min_per_investor: i128,
    pub max_per_investor: i128,
    pub goal: i128,
    /// Ledger timestamp (seconds).
    pub deadline: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Operator,
    Paused,
    Config,
}

fn read_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

fn read_config(env: &Env) -> OfferingConfig {
    env.storage().instance().get(&DataKey::Config).unwrap()
}

fn write_config(env: &Env, cfg: &OfferingConfig) {
    env.storage().instance().set(&DataKey::Config, cfg);
}

/// Admin or the designated operator may call. The caller is an explicit
/// parameter (Soroban has no msg.sender): it must authorise the call AND
/// match a stored role, so the role check stays real even in mocked-auth
/// tests.
fn require_admin_or_operator(env: &Env, caller: &Address) -> Result<(), Error> {
    caller.require_auth();
    let admin = read_admin(env);
    let operator: Option<Address> = env.storage().instance().get(&DataKey::Operator);
    if *caller == admin || operator.as_ref() == Some(caller) {
        return Ok(());
    }
    Err(Error::Unauthorized)
}

#[contract]
pub struct Offering;

#[contractimpl]
impl Offering {
    /// Atomically configured at deploy time; the admin authorises these exact
    /// arguments. Bounds: 0 < min <= max, goal > 0, deadline in the future.
    pub fn __constructor(
        env: Env,
        admin: Address,
        token: Address,
        issuer: Address,
        min_per_investor: i128,
        max_per_investor: i128,
        goal: i128,
        deadline: u64,
    ) -> Result<(), Error> {
        admin.require_auth();
        if min_per_investor <= 0
            || max_per_investor < min_per_investor
            || goal <= 0
            || deadline <= env.ledger().timestamp()
        {
            return Err(Error::InvalidParams);
        }
        let s = env.storage().instance();
        s.set(&DataKey::Admin, &admin);
        s.set(&DataKey::Paused, &false);
        s.set(
            &DataKey::Config,
            &OfferingConfig { token, issuer, min_per_investor, max_per_investor, goal, deadline },
        );
        s.extend_ttl(BUMP_THRESHOLD, BUMP_TO);
        Ok(())
    }

    pub fn bump(env: &Env) {
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
    }

    // --- Read surface ---

    pub fn get_config(env: &Env) -> OfferingConfig {
        read_config(env)
    }

    pub fn admin(env: &Env) -> Address {
        read_admin(env)
    }

    pub fn operator(env: &Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Operator)
    }

    pub fn paused(env: &Env) -> bool {
        env.storage().instance().get(&DataKey::Paused).unwrap_or(false)
    }

    /// Pure bound check used by future investment entry points: an amount an
    /// investor may commit under this offering's per-investor limits. Fails
    /// while paused or after the deadline.
    pub fn check_investment_amount(env: &Env, amount: i128) -> Result<(), Error> {
        if env.storage().instance().get(&DataKey::Paused).unwrap_or(false) {
            return Err(Error::Paused);
        }
        let cfg = read_config(env);
        if env.ledger().timestamp() >= cfg.deadline {
            return Err(Error::OfferingEnded);
        }
        if amount < cfg.min_per_investor {
            return Err(Error::BelowMin);
        }
        if amount > cfg.max_per_investor {
            return Err(Error::AboveMax);
        }
        Ok(())
    }

    // --- Admin / operator primitives ---

    /// Update per-investor bounds before the deadline. Admin or operator.
    pub fn set_investor_limits(env: &Env, caller: Address, min_per_investor: i128, max_per_investor: i128) -> Result<(), Error> {
        require_admin_or_operator(env, &caller)?;
        if min_per_investor <= 0 || max_per_investor < min_per_investor {
            return Err(Error::InvalidParams);
        }
        let mut cfg = read_config(&env);
        if env.ledger().timestamp() >= cfg.deadline {
            return Err(Error::OfferingEnded);
        }
        cfg.min_per_investor = min_per_investor;
        cfg.max_per_investor = max_per_investor;
        write_config(&env, &cfg);
        Ok(())
    }

    /// Owner designates (or replaces) the operator. Demo-grade; production
    /// role assignment is not approved.
    pub fn set_operator(env: &Env, operator: Address) -> Result<(), Error> {
        let admin = read_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Operator, &operator);
        Ok(())
    }

    /// Pause: blocks future investment entry points (check_investment_amount
    /// already fails) without touching stored configuration.
    pub fn pause(env: &Env) -> Result<(), Error> {
        let admin = read_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &true);
        Ok(())
    }

    pub fn unpause(env: &Env) -> Result<(), Error> {
        let admin = read_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &false);
        Ok(())
    }
}

#[cfg(test)]
mod test;
