import { expect, test } from 'vitest';
import { contributionPreview, previewAmountUnits } from './contribution-preview';

test('approved 250 USDC example is decimal safe: 66%, 0.25%, 66.25%', () => {
  expect(contributionPreview('660000000000', '1000000000000', '250')).toEqual({
    kind: 'ready',
    current: { text: '66', roundedDown: false },
    share: { text: '0.25', roundedDown: false },
    projected: { text: '66.25', roundedDown: false },
    contributionUnits: '2500000000',
    projectedUnits: '662500000000',
  });
});
test('rejects invalid, zero, negative, exponent and unsupported precision amounts', () => {
  for (const v of ['', '0', '-1', 'NaN', '1e3', '.1', '1.00000001', '1,000', ' 2']) expect(previewAmountUnits(v)).toBeNull();
  expect(previewAmountUnits('0.0000001')).toBe('1');
  expect(previewAmountUnits('9007199254740993.0000001')).toBe('90071992547409930000001');
});
test('missing/invalid funding remains unavailable, never zero', () => {
  for (const [r, g] of [
    [null, '1'],
    ['1', null],
    ['-1', '1'],
    ['1', '0'],
    ['1', 'invalid'],
  ])
    expect(contributionPreview(r, g, '1')).toEqual({ kind: 'unavailable' });
});
test('repeating fractions identify display rounding, not exactness', () => {
  const p = contributionPreview('0', '30000000', '1');
  expect(p.kind).toBe('ready');
  if (p.kind === 'ready') expect(p.share).toEqual({ text: '33.33', roundedDown: true });
});
test('current v1 cap blocks an over-goal preview instead of silently capping percent', () => {
  expect(contributionPreview('90000000', '100000000', '2')).toEqual({ kind: 'over-goal', remainingUnits: '10000000' });
  expect(contributionPreview('110000000', '100000000', '1')).toEqual({ kind: 'over-goal', remainingUnits: '0' });
});
