import { test, expect } from 'vitest';
import { fundingState, formatTokenAmount, isValidUnits } from '../funding-math';

// Riverside: 155,400 / 250,000 USDC = 62.16%
const RAISED = '1554000000000';
const GOAL = '2500000000000';

test('verified zero raised is a real zero, not unavailable', () => {
  expect(fundingState('0', GOAL, 9)).toEqual({ kind: 'ready', filled: 0, inProgress: false, percent: 0, partial: 0 });
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
  expect(fundingState(RAISED, GOAL, 9)).toEqual({ kind: 'ready', filled: 5, inProgress: true, percent: 62.16, partial: 0.5944 });
});

test('fills the next tile geometrically as confirmed funds arrive', () => {
  // 56.5 of 500 USDC over 16 tiles = 1 full tile + 80.8% of the next
  const s = fundingState('565000000', '5000000000', 16);
  expect(s.kind).toBe('ready');
  if (s.kind !== 'ready') return;
  expect(s.filled).toBe(1);
  expect(s.partial).toBeCloseTo(0.808, 3);
  expect(s.percent).toBe(11.3);
  // a later confirmed contribution strictly increases the fill
  const later = fundingState('5650000000', '5000000000', 16);
  if (later.kind !== 'ready') throw new Error('unreachable');
  expect(later.filled).toBe(16);
  expect(later.inProgress).toBe(false);
});

test('funded and over-goal: tiles capped, percent not capped', () => {
  expect(fundingState(GOAL, GOAL, 9)).toEqual({ kind: 'ready', filled: 9, inProgress: false, percent: 100, partial: 0 });
  expect(fundingState('6000000000000', GOAL, 9)).toEqual({ kind: 'ready', filled: 9, inProgress: false, percent: 240, partial: 0 });
});

test('display conversion keeps full precision', () => {
  expect(formatTokenAmount('1554000000000')).toBe('155,400');
  expect(formatTokenAmount('123456789')).toBe('12.3456789');
  expect(formatTokenAmount('0')).toBe('0');
  expect(isValidUnits('9007199254740993000000000')).toBe(true);
});

