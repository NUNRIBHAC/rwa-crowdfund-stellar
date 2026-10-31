import { describe, expect, it } from 'vitest';
import { contributionError } from './format';

// Mirrors backend amountUnits (7-decimal positive i128) and the server's
// remaining-goal cap (reject above, exact fill allowed).
describe('contributionError', () => {
  const goal = '10000000000'; // 1000.0000000 units
  const raised = '4000000000'; // 400.0000000 units -> 600 remaining

  it('requires a value', () => {
    expect(contributionError('', goal, raised)).toBe('required');
    expect(contributionError('   ', goal, raised)).toBe('required');
  });
  it('rejects non-numeric, negative and over-precise amounts', () => {
    expect(contributionError('abc', goal, raised)).toBe('invalid');
    expect(contributionError('-5', goal, raised)).toBe('invalid');
    expect(contributionError('1.12345678', goal, raised)).toBe('invalid');
    expect(contributionError('0', goal, raised)).toBe('invalid');
    expect(contributionError('0.0000000', goal, raised)).toBe('invalid');
  });
  it('accepts the smallest unit and plain integers', () => {
    expect(contributionError('0.0000001', goal, raised)).toBeNull();
    expect(contributionError('10', goal, raised)).toBeNull();
    expect(contributionError('10.5', goal, raised)).toBeNull();
  });
  it('rejects above the remaining goal but allows exact fill', () => {
    expect(contributionError('600.0000001', goal, raised)).toBe('exceeds');
    expect(contributionError('601', goal, raised)).toBe('exceeds');
    expect(contributionError('600.0000000', goal, raised)).toBeNull();
    expect(contributionError('600', goal, raised)).toBeNull();
  });
  it('treats a reached goal as exceeds for any positive amount', () => {
    expect(contributionError('1', goal, goal)).toBe('exceeds');
  });
});
