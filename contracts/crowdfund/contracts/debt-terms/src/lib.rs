#![no_std]
//! Deterministic debt-servicing math for a future ECSPR interest-bearing debt
//! instrument (unratified scaffold).
//!
//! This crate is a pure library: it has no storage, moves no funds, emits no
//! events, and exposes no `#[contract]` entry points. It cannot be deployed and
//! cannot change `crowdfund.wasm`, `offering`, or `share-token` bytes, because
//! nothing links it into those crates.
//!
//! # Scope honesty
//!
//! Every number this crate produces is a placeholder until an approved
//! debt-instrument specification and the corresponding legal/authorisation
//! decision exist. Passing unit tests prove arithmetic only: they are not a
//! staging result, not a real-wallet result, and not regulatory readiness.
//!
//! # Conventions
//!
//! - Amounts are `i128` base units with 7 decimals, matching the repo's USDC
//!   usage: `1` unit = `10_000_000` base units.
//! - Rates are integer basis points per annum. `10_000` bps = 100 % per annum.
//! - Time is integer seconds.
//! - The day count is actual/365 fixed: one year is exactly
//!   `365 * 86_400 = 31_536_000` seconds. Leap years do not change the year
//!   length.
//! - Rounding is floor (toward zero for the non-negative values this crate
//!   accepts). Interest that is not a whole base unit is not created: the
//!   borrower is never over-credited and the lender is never owed a fractional
//!   base unit.
//! - No floating point is used anywhere, so results are identical on every
//!   target and in every build mode.
//!
//! # Arithmetic safety
//!
//! All intermediate products use `checked_mul`/`checked_add`. When an
//! intermediate product does not fit `i128`, the function returns
//! [`DebtError::Overflow`] instead of panicking, even if the final floored
//! quotient would have fit. This is deliberate and deterministic: the contract
//! workspaces build with `overflow-checks = true`, and a caller must handle a
//! refused computation rather than rely on wraparound. Splitting a large
//! computation into smaller spans and summing the results stays exact only at
//! whole base units per leg, so callers should prefer a single span.

extern crate alloc;

use alloc::vec::Vec;

/// Base units per whole unit (7 decimals, matching the repo's USDC usage).
pub const BASE_UNITS_PER_UNIT: i128 = 10_000_000;

/// Basis points per whole rate: `10_000` bps = 100 % per annum.
pub const BPS_DENOMINATOR: i128 = 10_000;

/// Seconds in one actual/365 fixed year: `365 * 86_400`.
pub const SECONDS_PER_YEAR: i128 = 365 * 86_400;

/// Denominator that converts `principal * rate_bps * seconds` into base units.
const YEAR_SCALE: i128 = BPS_DENOMINATOR * SECONDS_PER_YEAR;

/// Largest coupon count [`coupon_schedule`] accepts.
///
/// This is a scaffolding guard against an unbounded allocation, not a ratified
/// policy value. Without it a caller-supplied `u32` could ask for a vector of
/// billions of coupons and exhaust memory. An approved debt-instrument
/// specification must set the real maximum, and this placeholder must then
/// change with it.
pub const MAX_COUPON_PERIODS: u32 = 1_000;

/// Reasons a debt-servicing computation is refused.
///
/// This is a plain enum, not a `#[contracterror]`, because this crate has no
/// contract surface. A future contract that reuses this math can map these
/// variants onto its own error type.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Ord, PartialOrd)]
#[repr(u32)]
pub enum DebtError {
    /// The principal was negative. Principal is additive debt and is never
    /// negative.
    NegativePrincipal = 1,
    /// A rate, elapsed duration, or timestamp was negative.
    NegativeRateOrTime = 2,
    /// A coupon schedule asked for zero periods.
    PeriodsZero = 3,
    /// A coupon schedule asked for more than [`MAX_COUPON_PERIODS`] periods.
    PeriodsTooMany = 6,
    /// A coupon schedule needs maturity strictly after start.
    MaturityNotAfterStart = 4,
    /// An intermediate product did not fit `i128`.
    Overflow = 5,
}

/// Interest accrued on `principal` over `elapsed_secs`.
///
/// Simple interest, actual/365 fixed, floored:
///
/// ```text
/// interest = floor(principal * rate_bps * elapsed_secs
///                  / (10_000 * 31_536_000))
/// ```
///
/// A zero principal, a zero rate, or zero elapsed time yields exactly `0`;
/// a zero rate is allowed and is not an error.
///
/// # Errors
///
/// - [`DebtError::NegativePrincipal`] when `principal < 0`.
/// - [`DebtError::NegativeRateOrTime`] when `rate_bps < 0` or
///   `elapsed_secs < 0`.
/// - [`DebtError::Overflow`] when an intermediate product does not fit `i128`.
pub fn accrued_interest(
    principal: i128,
    rate_bps: i128,
    elapsed_secs: i128,
) -> Result<i128, DebtError> {
    validate_terms(principal, rate_bps)?;
    validate_time(elapsed_secs)?;
    interest(principal, rate_bps, elapsed_secs)
}

/// Interest accrued for one coupon period of `period_secs`.
///
/// This is [`accrued_interest`] with the elapsed time named as a period. It
/// exists so call sites read as debt servicing rather than as a raw duration,
/// and so a future accrual convention (for example a day-count change) has one
/// name to change.
///
/// # Errors
///
/// Same as [`accrued_interest`].
pub fn coupon_amount(
    principal: i128,
    rate_bps: i128,
    period_secs: i128,
) -> Result<i128, DebtError> {
    accrued_interest(principal, rate_bps, period_secs)
}

/// Principal plus accrued interest, owed at `elapsed_secs` after drawdown.
///
/// # Errors
///
/// Same as [`accrued_interest`], plus [`DebtError::Overflow`] when
/// `principal + interest` does not fit `i128`.
pub fn repayment_total(
    principal: i128,
    rate_bps: i128,
    elapsed_secs: i128,
) -> Result<i128, DebtError> {
    let interest = accrued_interest(principal, rate_bps, elapsed_secs)?;
    principal.checked_add(interest).ok_or(DebtError::Overflow)
}

/// Equal-period coupon schedule from `start_ts` to `maturity_ts`.
///
/// The span is split into `periods` equal lengths. When the span does not divide
/// evenly the last period absorbs the remainder seconds, so the schedule walks
/// the whole span and ends exactly at maturity.
///
/// Each coupon is the difference between cumulative accrued interest at two
/// consecutive boundaries. That construction makes the schedule exact:
///
/// ```text
/// sum(coupon_schedule(..)) == accrued_interest(principal, rate_bps,
///                                              maturity_ts - start_ts)
/// ```
///
/// holds for every input, including uneven spans. Rounding only ever floors a
/// cumulative amount, so no base unit is created and no coupon is negative.
///
/// If the span is shorter than `periods`, the earlier periods have zero length
/// and accrue nothing; the last period carries the whole span. Callers that
/// need one second or more per period must check the span themselves.
///
/// The returned vector holds exactly `periods` entries. [`MAX_COUPON_PERIODS`]
/// caps the count so a caller cannot ask for an unbounded allocation; that cap
/// is a scaffolding placeholder, not a ratified policy value.
///
/// One coupon can exceed the floor of its own period's interest by at most one
/// base unit, because a fraction carried from an earlier period is settled
/// later. The schedule total stays exact, so no value is created overall.
///
/// # Errors
///
/// Checks run in this order, so a value that is invalid in several ways gets
/// the first error listed:
///
/// 1. [`DebtError::NegativePrincipal`] when `principal < 0`.
/// 2. [`DebtError::NegativeRateOrTime`] when `rate_bps`, `start_ts`, or
///    `maturity_ts` is negative.
/// 3. [`DebtError::PeriodsZero`] when `periods == 0`.
/// 4. [`DebtError::PeriodsTooMany`] when `periods > MAX_COUPON_PERIODS`.
/// 5. [`DebtError::MaturityNotAfterStart`] when `maturity_ts <= start_ts`.
/// 6. [`DebtError::Overflow`] when an intermediate product does not fit `i128`.
pub fn coupon_schedule(
    principal: i128,
    rate_bps: i128,
    start_ts: i128,
    maturity_ts: i128,
    periods: u32,
) -> Result<Vec<i128>, DebtError> {
    validate_terms(principal, rate_bps)?;
    validate_time(start_ts)?;
    validate_time(maturity_ts)?;
    if periods == 0 {
        return Err(DebtError::PeriodsZero);
    }
    if periods > MAX_COUPON_PERIODS {
        return Err(DebtError::PeriodsTooMany);
    }
    if maturity_ts <= start_ts {
        return Err(DebtError::MaturityNotAfterStart);
    }

    let span = maturity_ts - start_ts;
    let period_count = i128::from(periods);
    let period_secs = span / period_count;

    // Grow on demand: `periods` is caller-supplied, so reserving it up front
    // would turn a large count into one large allocation before any work.
    let mut schedule = Vec::new();
    let mut previous_cumulative = 0i128;
    let mut index = 1i128;
    while index <= period_count {
        // The final boundary is maturity itself, so the schedule never stops
        // short of the contract's end date.
        let boundary_elapsed = if index == period_count {
            span
        } else {
            period_secs
                .checked_mul(index)
                .ok_or(DebtError::Overflow)?
        };
        let cumulative = interest(principal, rate_bps, boundary_elapsed)?;
        // Cumulative interest is monotone in elapsed time, so the difference is
        // never negative.
        schedule.push(cumulative - previous_cumulative);
        previous_cumulative = cumulative;
        index += 1;
    }

    Ok(schedule)
}

/// Reject a negative principal or rate.
fn validate_terms(principal: i128, rate_bps: i128) -> Result<(), DebtError> {
    if principal < 0 {
        return Err(DebtError::NegativePrincipal);
    }
    if rate_bps < 0 {
        return Err(DebtError::NegativeRateOrTime);
    }
    Ok(())
}

/// Reject a negative duration or timestamp.
fn validate_time(seconds: i128) -> Result<(), DebtError> {
    if seconds < 0 {
        return Err(DebtError::NegativeRateOrTime);
    }
    Ok(())
}

/// Floor-rounded simple interest for already-validated terms.
///
/// Inputs are non-negative, so the truncating `/` equals a floor division.
fn interest(principal: i128, rate_bps: i128, elapsed_secs: i128) -> Result<i128, DebtError> {
    if principal == 0 || rate_bps == 0 || elapsed_secs == 0 {
        return Ok(0);
    }
    let scaled = principal
        .checked_mul(rate_bps)
        .ok_or(DebtError::Overflow)?
        .checked_mul(elapsed_secs)
        .ok_or(DebtError::Overflow)?;
    Ok(scaled / YEAR_SCALE)
}

#[cfg(test)]
mod test;
