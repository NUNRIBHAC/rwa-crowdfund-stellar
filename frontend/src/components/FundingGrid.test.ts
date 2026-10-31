import { test, expect } from 'vitest';
import { fundingState, formatTokenAmount, isValidUnits } from '../funding-math';

// Riverside: 155,400 / 250,000 USDC = 62.16%
const RAISED = '1554000000000';
const GOAL = '2500000000000';

test('verified zero raised is a real zero, not unavailable', () => {
  expect(fundingState('0', GOAL, 9)).toEqual({ kind: 'ready', filled: 0, inProgress: false, percent: 0 });
});

test('missing or invalid raised/goal is unavailable, never a fabricated zero', () => {
  for (const v of [undefined, null, '', 'abc', '-5', '12.3']) {
    expect(fundingState(v, GOAL, 9).kind).toBe('unavailable');
    expect(fundingState(RAISED, v, 9).kind).toBe('unavailable');
    expect(formatTokenAmount(v)).toBeNull();
  }
  expect(fundingState(RAISED, '0', 9).kind).toBe('unavailable');
});

test('exact BigInt units: 62.16% fills 5 of 9 summary tiles with one in progress', () => {
  expect(fundingState(RAISED, GOAL, 9)).toEqual({ kind: 'ready', filled: 5, inProgress: true, percent: 62.16 });
});

test('funded and over-goal: tiles capped, percent not capped', () => {
  expect(fundingState(GOAL, GOAL, 9)).toEqual({ kind: 'ready', filled: 9, inProgress: false, percent: 100 });
  expect(fundingState('6000000000000', GOAL, 9)).toEqual({ kind: 'ready', filled: 9, inProgress: false, percent: 240 });
});

test('display conversion keeps full precision', () => {
  expect(formatTokenAmount('1554000000000')).toBe('155,400');
  expect(formatTokenAmount('123456789')).toBe('12.3456789');
  expect(formatTokenAmount('0')).toBe('0');
  expect(isValidUnits('9007199254740993000000000')).toBe(true);
});
