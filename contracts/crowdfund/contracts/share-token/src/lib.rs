#![no_std]
//! Share token scaffold (contract v2, testnet prototype).
//!
//! SEP-41 fungible token surface with OpenZeppelin-style access primitives:
//! an owner (admin), a single designated minter, and a pause switch that
//! freezes value movement. One instance = one future offering's share token;
//! the offering configuration contract wires it to a campaign.
//!
//! Scope honesty: this is a scaffold for the approved v2 build-out. It moves
//! no real value, assigns no production roles, and grants no investor rights;
//! issuance/legal meaning stay with the offering layer and remain unapproved.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, String};

const DAY_LEDGERS: u32 = 17280;
const BUMP_THRESHOLD: u32 = 30 * DAY_LEDGERS;
const BUMP_TO: u32 = 60 * DAY_LEDGERS;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidParams = 1,
    InvalidAmount = 2,
    InsufficientBalance = 3,
    InsufficientAllowance = 4,
    Paused = 5,
    NotMinter = 6,
    Overflow = 7,
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceKey {
    pub from: Address,
    pub spender: Address,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Minter,
    Paused,
    Name,
    Symbol,
    Decimals,
    TotalSupply,
    Balance(Address),
    Allowance(AllowanceKey),
}

fn read_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

fn read_minter(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Minter)
}

fn is_paused(env: &Env) -> bool {
    env.storage().instance().get(&DataKey::Paused).unwrap_or(false)
}

fn not_paused(env: &Env) -> Result<(), Error> {
    if is_paused(env) {
        return Err(Error::Paused);
    }
    Ok(())
}

fn write_balance(env: &Env, who: &Address, amount: i128) {
    let key = DataKey::Balance(who.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
}

fn read_balance(env: &Env, who: &Address) -> i128 {
    env.storage().persistent().get(&DataKey::Balance(who.clone())).unwrap_or(0)
}

fn write_total(env: &Env, total: i128) {
    env.storage().instance().set(&DataKey::TotalSupply, &total);
}

fn read_total(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
}

fn spend_allowance(env: &Env, from: &Address, spender: &Address, amount: i128) -> Result<(), Error> {
    let key = DataKey::Allowance(AllowanceKey { from: from.clone(), spender: spender.clone() });
    let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
    if current < amount {
        return Err(Error::InsufficientAllowance);
    }
    let next = current - amount;
    env.storage().persistent().set(&key, &next);
    env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
    Ok(())
}

fn move_value(env: &Env, from: &Address, to: &Address, amount: i128) -> Result<(), Error> {
    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }
    let from_bal = read_balance(env, from);
    if from_bal < amount {
        return Err(Error::InsufficientBalance);
    }
    write_balance(env, from, from_bal - amount);
    let to_bal = read_balance(env, to);
    write_balance(env, to, to_bal.checked_add(amount).ok_or(Error::Overflow)?);
    Ok(())
}

#[contract]
pub struct ShareToken;

#[contractimpl]
impl ShareToken {
    /// Atomically configured at deploy time: the deployer names the admin
    /// (owner), who must authorise these exact arguments. The minter starts
    /// unset; the admin designates it afterwards (typically the offering
    /// contract once deployed). Starts unpaused with zero supply.
    pub fn __constructor(env: Env, admin: Address, name: String, symbol: String, decimals: u32) -> Result<(), Error> {
        admin.require_auth();
        if decimals > 18 {
            return Err(Error::InvalidParams);
        }
        let s = env.storage().instance();
        s.set(&DataKey::Admin, &admin);
        s.set(&DataKey::Paused, &false);
        s.set(&DataKey::Name, &name);
        s.set(&DataKey::Symbol, &symbol);
        s.set(&DataKey::Decimals, &decimals);
        s.set(&DataKey::TotalSupply, &0i128);
        s.extend_ttl(BUMP_THRESHOLD, BUMP_TO);
        Ok(())
    }

    /// Keep the contract and (optionally) one balance record alive. Expired
    /// entries are archived, not erased; a balance never reads as zero
    /// silently - calls fail until restored.
    pub fn bump(env: &Env, holder: Option<Address>) {
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
        if let Some(h) = holder {
            let key = DataKey::Balance(h);
            if env.storage().persistent().has(&key) {
                env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
            }
        }
    }

    // --- SEP-41 read surface ---

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Decimals).unwrap()
    }

    pub fn total_supply(env: &Env) -> i128 {
        read_total(env)
    }

    pub fn balance(env: &Env, id: Address) -> i128 {
        read_balance(env, &id)
    }

    pub fn allowance(env: &Env, from: Address, spender: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(AllowanceKey { from, spender }))
            .unwrap_or(0)
    }

    // --- SEP-41 value movement ---

    pub fn approve(env: &Env, from: Address, spender: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount < 0 {
            return Err(Error::InvalidAmount);
        }
        let key = DataKey::Allowance(AllowanceKey { from, spender });
        env.storage().persistent().set(&key, &amount);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        Ok(())
    }

    pub fn transfer(env: &Env, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        not_paused(env)?;
        move_value(env, &from, &to, amount)
    }

    pub fn transfer_from(env: &Env, spender: Address, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        spender.require_auth();
        not_paused(env)?;
        spend_allowance(env, &from, &spender, amount)?;
        move_value(env, &from, &to, amount)
    }

    pub fn burn(env: &Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        not_paused(env)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let bal = read_balance(env, &from);
        if bal < amount {
            return Err(Error::InsufficientBalance);
        }
        write_balance(env, &from, bal - amount);
        write_total(env, read_total(env) - amount);
        Ok(())
    }

    // --- Roles / ownership / pause primitives (admin-gated) ---

    /// Mint new units. Only the designated minter (expected to become the
    /// offering contract); blocked while paused.
    pub fn mint(env: &Env, to: Address, amount: i128) -> Result<(), Error> {
        let minter = read_minter(env).ok_or(Error::NotMinter)?;
        minter.require_auth();
        not_paused(env)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let to_bal = read_balance(env, &to);
        write_balance(env, &to, to_bal.checked_add(amount).ok_or(Error::Overflow)?);
        write_total(env, read_total(env).checked_add(amount).ok_or(Error::Overflow)?);
        Ok(())
    }

    /// Owner designates (or replaces) the minter. Demo-grade single-owner
    /// control; production role assignment is not approved.
    pub fn set_minter(env: &Env, minter: Address) -> Result<(), Error> {
        let admin = read_admin(env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Minter, &minter);
        Ok(())
    }

    /// Pause all value movement (transfer, transfer_from, mint, burn).
    pub fn pause(env: &Env) -> Result<(), Error> {
        let admin = read_admin(env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &true);
        Ok(())
    }

    pub fn unpause(env: &Env) -> Result<(), Error> {
        let admin = read_admin(env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &false);
        Ok(())
    }

    pub fn paused(env: &Env) -> bool {
        is_paused(env)
    }

    pub fn admin(env: &Env) -> Address {
        read_admin(env)
    }

    pub fn minter(env: &Env) -> Option<Address> {
        read_minter(env)
    }
}

#[cfg(test)]
mod test;
