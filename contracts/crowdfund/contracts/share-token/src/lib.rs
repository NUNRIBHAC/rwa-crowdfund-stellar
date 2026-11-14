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

use soroban_sdk::{contract, contracterror, contractevent, contractimpl, contracttype, symbol_short, Address, Env, MuxedAddress, String};

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
    InvalidExpiration = 8,
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceKey {
    pub from: Address,
    pub spender: Address,
}

// Same METADATA key and field shape as soroban-token-sdk 29.0.1.
#[contracttype]
#[derive(Clone)]
pub struct TokenMetadata {
    pub decimal: u32,
    pub name: String,
    pub symbol: String,
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceData {
    pub amount: i128,
    pub live_until_ledger: u32,
}

#[contractevent(data_format = "vec")]
pub struct Approve {
    #[topic]
    pub from: Address,
    #[topic]
    pub spender: Address,
    pub amount: i128,
    pub live_until_ledger: u32,
}

#[contractevent]
pub struct Transfer {
    #[topic]
    pub from: Address,
    #[topic]
    pub to: Address,
    pub amount: i128,
    pub to_muxed_id: Option<u64>,
}

#[contractevent(data_format = "single-value")]
pub struct Burn {
    #[topic]
    pub from: Address,
    pub amount: i128,
}

#[contractevent(data_format = "single-value")]
pub struct Mint {
    #[topic]
    pub to: Address,
    pub amount: i128,
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
    // Old indefinite persistent allowances are never revived or inferred.
    Allowance(AllowanceKey),
    AllowanceV2(AllowanceKey),
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

fn read_allowance(env: &Env, from: &Address, spender: &Address) -> AllowanceData {
    let key = DataKey::AllowanceV2(AllowanceKey { from: from.clone(), spender: spender.clone() });
    let data: Option<AllowanceData> = env.storage().temporary().get(&key);
    match data {
        Some(data) if data.live_until_ledger >= env.ledger().sequence() => data,
        _ => AllowanceData { amount: 0, live_until_ledger: 0 },
    }
}

fn spend_allowance(env: &Env, from: &Address, spender: &Address, amount: i128) -> Result<(), Error> {
    if amount < 0 {
        return Err(Error::InvalidAmount);
    }
    let mut data = read_allowance(env, from, spender);
    if data.amount < amount {
        return Err(Error::InsufficientAllowance);
    }
    // Zero spending must not create or extend an expired allowance.
    if amount > 0 {
        data.amount -= amount;
        let key = DataKey::AllowanceV2(AllowanceKey { from: from.clone(), spender: spender.clone() });
        env.storage().temporary().set(&key, &data);
    }
    Ok(())
}

fn burn_value(env: &Env, from: &Address, amount: i128) -> Result<(), Error> {
    if amount < 0 {
        return Err(Error::InvalidAmount);
    }
    let bal = read_balance(env, from);
    if bal < amount {
        return Err(Error::InsufficientBalance);
    }
    write_balance(env, from, bal - amount);
    write_total(env, read_total(env) - amount);
    Burn { from: from.clone(), amount }.publish(env);
    Ok(())
}

fn move_value(env: &Env, from: &Address, to: &Address, amount: i128) -> Result<(), Error> {
    if amount < 0 {
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
        s.set(&symbol_short!("METADATA"), &TokenMetadata { decimal: decimals, name: name.clone(), symbol: symbol.clone() });
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
        read_allowance(env, &from, &spender).amount
    }

    // --- SEP-41 value movement ---

    pub fn approve(env: &Env, from: Address, spender: Address, amount: i128, live_until_ledger: u32) -> Result<(), Error> {
        from.require_auth();
        if amount < 0 {
            return Err(Error::InvalidAmount);
        }
        let current = env.ledger().sequence();
        let max_live = current.checked_add(env.storage().max_ttl() - 1).ok_or(Error::InvalidExpiration)?;
        if amount > 0 && (live_until_ledger < current || live_until_ledger > max_live) {
            return Err(Error::InvalidExpiration);
        }
        let key = DataKey::AllowanceV2(AllowanceKey { from: from.clone(), spender: spender.clone() });
        if amount == 0 {
            env.storage().temporary().remove(&key);
        } else {
            env.storage().temporary().set(&key, &AllowanceData { amount, live_until_ledger });
            let ttl = live_until_ledger - current;
            env.storage().temporary().extend_ttl(&key, ttl, ttl);
        }
        Approve { from, spender, amount, live_until_ledger }.publish(env);
        Ok(())
    }

    pub fn transfer(env: &Env, from: Address, to: MuxedAddress, amount: i128) -> Result<(), Error> {
        from.require_auth();
        not_paused(env)?;
        let recipient = to.address();
        move_value(env, &from, &recipient, amount)?;
        Transfer { from, to: recipient, amount, to_muxed_id: to.id() }.publish(env);
        Ok(())
    }

    pub fn transfer_from(env: &Env, spender: Address, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        spender.require_auth();
        not_paused(env)?;
        spend_allowance(env, &from, &spender, amount)?;
        move_value(env, &from, &to, amount)?;
        Transfer { from, to, amount, to_muxed_id: None }.publish(env);
        Ok(())
    }

    pub fn burn(env: &Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        not_paused(env)?;
        burn_value(env, &from, amount)
    }

    pub fn burn_from(env: &Env, spender: Address, from: Address, amount: i128) -> Result<(), Error> {
        spender.require_auth();
        not_paused(env)?;
        spend_allowance(env, &from, &spender, amount)?;
        burn_value(env, &from, amount)
    }

    // --- Roles / ownership / pause primitives (admin-gated) ---

    /// Mint new units. Only the designated minter (expected to become the
    /// offering contract); blocked while paused.
    pub fn mint(env: &Env, to: Address, amount: i128) -> Result<(), Error> {
        let minter = read_minter(env).ok_or(Error::NotMinter)?;
        minter.require_auth();
        not_paused(env)?;
        if amount < 0 {
            return Err(Error::InvalidAmount);
        }
        let to_bal = read_balance(env, &to);
        write_balance(env, &to, to_bal.checked_add(amount).ok_or(Error::Overflow)?);
        write_total(env, read_total(env).checked_add(amount).ok_or(Error::Overflow)?);
        Mint { to, amount }.publish(env);
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

    /// Pause all value movement (transfer, transfer_from, mint, burn, burn_from).
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
