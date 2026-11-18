#![cfg(test)]
extern crate std;

use super::*;

/// One whole unit in base units (7 decimals).
const UNIT: i128 = 10_000_000;

/// 1_000 whole units.
const PRINCIPAL_1K: i128 = 1_000 * UNIT;

/// One actual/365 fixed year in seconds.
const ONE_YEAR: i128 = SECONDS_PER_YEAR;

#[test]
fn zero_elapsed_time_accrues_nothing() {
    assert_eq!(accrued_interest(PRINCIPAL_1K, 500, 0), Ok(0));
    assert_eq!(repayment_total(PRINCIPAL_1K, 500, 0), Ok(PRINCIPAL_1K));
}

#[test]
fn one_year_at_five_percent_is_exact() {
    // 1_000 units at 500 bps for one year = 50 units = 500_0000000 base units.
    assert_eq!(
        accrued_interest(PRINCIPAL_1K, 500, ONE_YEAR),
        Ok(50_0000000)
    );
    assert_eq!(repayment_total(PRINCIPAL_1K, 500, ONE_YEAR), Ok(1_050 * UNIT));
}

#[test]
fn year_scale_constants_are_the_documented_day_count() {
    assert_eq!(SECONDS_PER_YEAR, 31_536_000);
    assert_eq!(BPS_DENOMINATOR, 10_000);
    assert_eq!(BASE_UNITS_PER_UNIT, 10_000_000);
}

#[test]
fn partial_period_rounds_down_and_never_over_credits() {
    // 100 units at 10 % for one day is 273_972.60... base units. The result
    // must be the largest whole base-unit amount that does not exceed the exact
    // value: never the ceiling, and never one base unit of unearned interest.
    let day = 86_400;
    let exact_numerator = 100 * UNIT * 1_000 * day;
    let interest = accrued_interest(100 * UNIT, 1_000, day).unwrap();

    assert_eq!(interest, 273_972);
    // Not over-credited: the credited amount stays at or below the exact value.
    assert!(interest * YEAR_SCALE <= exact_numerator);
    // The case really is inexact, so the credited amount is strictly below it.
    assert_ne!(exact_numerator % YEAR_SCALE, 0);
    assert!(interest * YEAR_SCALE < exact_numerator);
    // Maximal: one more base unit would overshoot the exact value.
    assert!((interest + 1) * YEAR_SCALE > exact_numerator);
}

#[test]
fn sub_base_unit_interest_floors_to_zero() {
    // One unit at 5 % for a single second is far below one base unit.
    assert_eq!(accrued_interest(UNIT, 500, 1), Ok(0));
    assert_eq!(coupon_amount(UNIT, 500, 1), Ok(0));
}

#[test]
fn zero_rate_is_allowed_and_yields_zero_interest() {
    assert_eq!(accrued_interest(PRINCIPAL_1K, 0, ONE_YEAR), Ok(0));
    assert_eq!(coupon_amount(PRINCIPAL_1K, 0, ONE_YEAR / 4), Ok(0));
    assert_eq!(repayment_total(PRINCIPAL_1K, 0, ONE_YEAR), Ok(PRINCIPAL_1K));
    assert_eq!(
        coupon_schedule(PRINCIPAL_1K, 0, 1_700_000_000, 1_700_000_000 + ONE_YEAR, 4),
        Ok(std::vec![0i128; 4])
    );
}

#[test]
fn zero_principal_yields_zero_interest() {
    assert_eq!(accrued_interest(0, 500, ONE_YEAR), Ok(0));
    assert_eq!(repayment_total(0, 500, ONE_YEAR), Ok(0));
}

#[test]
fn negative_principal_is_refused() {
    assert_eq!(
        accrued_interest(-1, 500, ONE_YEAR),
        Err(DebtError::NegativePrincipal)
    );
    assert_eq!(
        repayment_total(-1, 500, ONE_YEAR),
        Err(DebtError::NegativePrincipal)
    );
    assert_eq!(
        coupon_schedule(-1, 500, 0, ONE_YEAR, 4),
        Err(DebtError::NegativePrincipal)
    );
}

#[test]
fn negative_time_is_refused() {
    assert_eq!(
        accrued_interest(PRINCIPAL_1K, 500, -1),
        Err(DebtError::NegativeRateOrTime)
    );
    assert_eq!(
        coupon_amount(PRINCIPAL_1K, 500, -1),
        Err(DebtError::NegativeRateOrTime)
    );
    assert_eq!(
        coupon_schedule(PRINCIPAL_1K, 500, -1, ONE_YEAR, 4),
        Err(DebtError::NegativeRateOrTime)
    );
    assert_eq!(
        coupon_schedule(PRINCIPAL_1K, 500, 0, -1, 4),
        Err(DebtError::NegativeRateOrTime)
    );
}

#[test]
fn negative_rate_is_refused() {
    assert_eq!(
        accrued_interest(PRINCIPAL_1K, -1, ONE_YEAR),
        Err(DebtError::NegativeRateOrTime)
    );
    assert_eq!(
        repayment_total(PRINCIPAL_1K, -1, ONE_YEAR),
        Err(DebtError::NegativeRateOrTime)
    );
    assert_eq!(
        coupon_schedule(PRINCIPAL_1K, -1, 0, ONE_YEAR, 4),
        Err(DebtError::NegativeRateOrTime)
    );
}

#[test]
fn maturity_must_be_after_start() {
    let start = 1_700_000_000;
    assert_eq!(
        coupon_schedule(PRINCIPAL_1K, 500, start, start, 4),
        Err(DebtError::MaturityNotAfterStart)
    );
    assert_eq!(
        coupon_schedule(PRINCIPAL_1K, 500, start, start - 1, 4),
        Err(DebtError::MaturityNotAfterStart)
    );
}

#[test]
fn zero_periods_is_refused() {
    let start = 1_700_000_000;
    assert_eq!(
        coupon_schedule(PRINCIPAL_1K, 500, start, start + ONE_YEAR, 0),
        Err(DebtError::PeriodsZero)
    );
}

#[test]
fn coupon_amount_matches_accrued_interest_for_the_same_period() {
    let period = ONE_YEAR / 12;
    assert_eq!(
        coupon_amount(PRINCIPAL_1K, 737, period),
        accrued_interest(PRINCIPAL_1K, 737, period)
    );
}

#[test]
fn schedule_sum_equals_accrued_interest_when_span_divides_evenly() {
    let principal = 2_500 * UNIT;
    let rate_bps = 640;
    let start = 1_700_000_000;
    let maturity = start + ONE_YEAR;
    let periods = 4u32;

    let schedule = coupon_schedule(principal, rate_bps, start, maturity, periods).unwrap();
    assert_eq!(schedule.len(), periods as usize);

    let total: i128 = schedule.iter().sum();
    assert_eq!(
        total,
        accrued_interest(principal, rate_bps, maturity - start).unwrap()
    );
    // Four equal quarters, and the last quarter is a whole quarter too.
    assert!(schedule.iter().all(|coupon| *coupon >= 0));
}

#[test]
fn schedule_sum_equals_accrued_interest_on_an_uneven_span() {
    let principal = 123_4567890i128;
    let rate_bps = 737;
    let start = 1_700_000_000;
    // One second more than a year, split into 7 periods: no period boundary
    // falls on a whole base unit and the span does not divide evenly.
    let maturity = start + ONE_YEAR + 1;
    let periods = 7u32;

    let schedule = coupon_schedule(principal, rate_bps, start, maturity, periods).unwrap();
    assert_eq!(schedule.len(), periods as usize);

    let total: i128 = schedule.iter().sum();
    assert_eq!(
        total,
        accrued_interest(principal, rate_bps, maturity - start).unwrap()
    );
    // 1_234.567890 units at 737 bps over one year plus one second.
    assert_eq!(total, 90_987_656);
    assert!(schedule.iter().all(|coupon| *coupon >= 0));
    // The last period absorbs the remainder seconds, so it is the largest.
    let last = *schedule.last().unwrap();
    assert!(schedule[..periods as usize - 1]
        .iter()
        .all(|coupon| *coupon <= last));
}

#[test]
fn schedule_sum_equals_accrued_interest_when_periods_exceed_seconds() {
    // More periods than elapsed seconds: early periods are zero length.
    let principal = 50 * UNIT;
    let rate_bps = 9_000;
    let start = 1_000;
    let maturity = start + 3;
    let periods = 5u32;

    let schedule = coupon_schedule(principal, rate_bps, start, maturity, periods).unwrap();
    assert_eq!(schedule.len(), periods as usize);
    let total: i128 = schedule.iter().sum();
    assert_eq!(
        total,
        accrued_interest(principal, rate_bps, maturity - start).unwrap()
    );
}

#[test]
fn schedule_total_plus_principal_equals_repayment_at_maturity() {
    // Exact-boundary case: settlement at maturity moves exactly the schedule
    // sum plus principal, with no base unit left over.
    let principal = PRINCIPAL_1K;
    let rate_bps = 500;
    let start = 1_700_000_000;
    let maturity = start + ONE_YEAR;
    let periods = 12u32;

    let schedule = coupon_schedule(principal, rate_bps, start, maturity, periods).unwrap();
    let coupons: i128 = schedule.iter().sum();

    assert_eq!(coupons, 50_0000000);
    assert_eq!(
        repayment_total(principal, rate_bps, maturity - start),
        Ok(1_050 * UNIT)
    );
    assert_eq!(principal + coupons, 1_050 * UNIT);
}

#[test]
fn interest_at_maturity_boundary_is_monotone_between_periods() {
    // Boundary check: one second either side of maturity brackets the value.
    let principal = PRINCIPAL_1K;
    let rate_bps = 500;
    let at = accrued_interest(principal, rate_bps, ONE_YEAR).unwrap();
    let before = accrued_interest(principal, rate_bps, ONE_YEAR - 1).unwrap();
    let after = accrued_interest(principal, rate_bps, ONE_YEAR + 1).unwrap();
    assert!(before <= at && at <= after);
}

#[test]
fn overflow_scale_inputs_return_overflow_instead_of_panicking() {
    // i128::MAX * 10_000 does not fit, so the product is refused.
    assert_eq!(
        accrued_interest(i128::MAX, 10_000, ONE_YEAR),
        Err(DebtError::Overflow)
    );
    assert_eq!(
        coupon_amount(i128::MAX, 1, ONE_YEAR),
        Err(DebtError::Overflow)
    );
    assert_eq!(
        coupon_schedule(i128::MAX, 10_000, 0, ONE_YEAR, 4),
        Err(DebtError::Overflow)
    );
    // A repayment whose sum would exceed i128::MAX is refused too.
    assert_eq!(
        repayment_total(i128::MAX, 10_000, ONE_YEAR),
        Err(DebtError::Overflow)
    );
}
