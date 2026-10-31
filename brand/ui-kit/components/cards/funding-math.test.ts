import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fundingState, formatTokenAmount, isValidUnits } from './funding-math.ts';

// Riverside: 155,400 / 250,000 USDC = 62.16%
const RAISED = '1554000000000';
const GOAL = '2500000000000';

test('verified zero raised is a real zero, not unavailable', () => {
  const s = fundingState('0', GOAL, 100);
  assert.deepEqual(s, { kind: 'ready', filled: 0, inProgress: false, percent: 0 });
});

test('missing raised is unavailable', () => {
  for (const v of [undefined, null, '']) {
    assert.equal(fundingState(v, GOAL, 100).kind, 'unavailable');
  }
});

test('invalid raised is unavailable (no fabricated zero)', () => {
  for (const v of ['abc', '-5', '12.3', '1e9', ' 100', '100 ']) {
    assert.equal(fundingState(v, GOAL, 100).kind, 'unavailable');
  }
});

test('missing, invalid or non-positive goal is unavailable', () => {
  for (const g of [undefined, null, '', 'abc', '0', '-1']) {
    assert.equal(fundingState(RAISED, g, 100).kind, 'unavailable');
  }
});

test('exact BigInt units: riverside 62.16% fills 62 of 100 with one in progress', () => {
  assert.deepEqual(fundingState(RAISED, GOAL, 100), { kind: 'ready', filled: 62, inProgress: true, percent: 62.16 });
});

test('3x3 summary grid: same ratio fills 5 of 9', () => {
  const s = fundingState(RAISED, GOAL, 9);
  assert.deepEqual(s, { kind: 'ready', filled: 5, inProgress: true, percent: 62.16 });
});

test('fully funded: all tiles filled, no in-progress tile', () => {
  assert.deepEqual(fundingState(GOAL, GOAL, 100), { kind: 'ready', filled: 100, inProgress: false, percent: 100 });
});

test('over goal: tiles capped at the grid, percent NOT capped', () => {
  const s = fundingState('6000000000000', GOAL, 100); // 240%
  assert.deepEqual(s, { kind: 'ready', filled: 100, inProgress: false, percent: 240 });
});

test('huge integers beyond float precision stay exact', () => {
  const big = '9007199254740993000000000'; // > 2^53 scaled by 10^7
  const s = fundingState(big, BigInt(big) * 2n + '', 100);
  assert.deepEqual(s, { kind: 'ready', filled: 50, inProgress: false, percent: 50 });
});

test('floor never rounds up a partially funded tile', () => {
  const s = fundingState('999999999999', GOAL, 100); // 39.99999999996% of goal
  assert.equal(s.kind, 'ready');
  if (s.kind === 'ready') {
    assert.equal(s.filled, 39);
    assert.equal(s.inProgress, true);
  }
});

test('formatTokenAmount converts with full precision', () => {
  assert.equal(formatTokenAmount('1554000000000'), '155,400');
  assert.equal(formatTokenAmount('2500000000000'), '250,000');
  assert.equal(formatTokenAmount('123456789'), '12.3456789');
  assert.equal(formatTokenAmount('1'), '0.0000001');
  assert.equal(formatTokenAmount('0'), '0');
  assert.equal(formatTokenAmount('10000000000000'), '1,000,000');
});

test('formatTokenAmount returns null for missing or invalid input', () => {
  for (const v of [undefined, null, '', 'abc', '-5', '12.3']) {
    assert.equal(formatTokenAmount(v), null);
  }
});

test('formatTokenAmount honors a decimals override', () => {
  assert.equal(formatTokenAmount('123456789', 2), '1,234,567.89');
});

test('isValidUnits accepts only non-negative integer strings', () => {
  assert.equal(isValidUnits('0'), true);
  assert.equal(isValidUnits('1554000000000'), true);
  assert.equal(isValidUnits('01'), true);
  assert.equal(isValidUnits('1.0'), false);
  assert.equal(isValidUnits('-1'), false);
  assert.equal(isValidUnits(''), false);
  assert.equal(isValidUnits(null), false);
  assert.equal(isValidUnits(undefined), false);
});
