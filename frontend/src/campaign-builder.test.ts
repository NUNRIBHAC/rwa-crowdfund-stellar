import { describe, expect, it } from 'vitest';
import { builderComplete, builderPreview, deadlineToTimestamp, GOAL_UNITS_MAX, goalToUnits, validateBuilder } from './campaign-builder';

// Fixed reference instant: 2026-11-15T12:00:00Z.
const NOW = Math.floor(Date.parse('2026-11-15T12:00:00Z') / 1000);

describe('goalToUnits', () => {
  it('parses exact decimal strings into 7-decimal base units', () => {
    expect(goalToUnits('10000')).toBe(10000n * 10_000_000n);
    expect(goalToUnits('0.0000001')).toBe(1n);
    expect(goalToUnits('1.5')).toBe(15_000_000n);
  });
  it('parses amounts beyond float precision without rounding', () => {
    // 9007199254.740993 is past 2^53 as a float product; the string parse
    // must keep the last digit exact.
    expect(goalToUnits('9007199254.740993')).toBe(90071992547409930n);
  });
  it('rejects non-positive, over-precise and malformed amounts', () => {
    expect(goalToUnits('0')).toBeNull();
    expect(goalToUnits('0.00000001')).toBeNull(); // 8 decimal places
    expect(goalToUnits('-5')).toBeNull();
    expect(goalToUnits('abc')).toBeNull();
    expect(goalToUnits('')).toBeNull();
    expect(goalToUnits('1.')).toBeNull();
  });
});

describe('goal i128 range (constructor takes goal: i128)', () => {
  it('accepts exactly the i128 maximum and rejects one unit above', () => {
    const maxGoal = (GOAL_UNITS_MAX / 10_000_000n).toString() + '.' + (GOAL_UNITS_MAX % 10_000_000n).toString().padStart(7, '0');
    const overGoal = ((GOAL_UNITS_MAX + 1n) / 10_000_000n).toString() + '.' + ((GOAL_UNITS_MAX + 1n) % 10_000_000n).toString().padStart(7, '0');
    expect(goalToUnits(maxGoal)).toBe(GOAL_UNITS_MAX);
    expect(goalToUnits(overGoal)).toBe(GOAL_UNITS_MAX + 1n);
    const base = { name: 'P', slug: 'p', deadline: '2026-11-16' };
    expect(validateBuilder({ ...base, goal: maxGoal }, NOW).goal).toBeUndefined();
    expect(validateBuilder({ ...base, goal: overGoal }, NOW).goal).toBe('goalOutOfRange');
    expect(builderComplete({ ...base, goal: maxGoal }, NOW, 'GCREATOR')).toBe(true);
    expect(builderComplete({ ...base, goal: overGoal }, NOW, 'GCREATOR')).toBe(false);
  });
});

describe('deadlineToTimestamp', () => {
  it('interprets a date as 00:00 UTC regardless of timezone', () => {
    expect(deadlineToTimestamp('2026-12-31')).toBe(Date.parse('2026-12-31T00:00:00Z') / 1000);
  });
  it('rejects malformed dates', () => {
    expect(deadlineToTimestamp('31/12/2026')).toBeNull();
    expect(deadlineToTimestamp('2026-13-01')).toBeNull();
  });
});

describe('validateBuilder boundaries', () => {
  it('rejects today (00:00 UTC already past) and accepts tomorrow', () => {
    const base = { name: 'P', slug: 'p', goal: '1', deadline: '' };
    expect(validateBuilder({ ...base, deadline: '2026-11-15' }, NOW).deadline).toBe('deadlinePast');
    expect(validateBuilder({ ...base, deadline: '2026-11-14' }, NOW).deadline).toBe('deadlinePast');
    expect(validateBuilder({ ...base, deadline: '2026-11-16' }, NOW).deadline).toBeUndefined();
  });
  it('enforces the registry slug and name rules', () => {
    const base = { name: 'P', slug: 'ok-slug_1', goal: '1', deadline: '2026-11-16' };
    expect(validateBuilder({ ...base, slug: 'has space' }, NOW).slug).toBe('slugInvalid');
    expect(validateBuilder({ ...base, slug: 'x'.repeat(49) }, NOW).slug).toBe('slugInvalid');
    expect(validateBuilder({ ...base, slug: 'x'.repeat(48) }, NOW).slug).toBeUndefined();
    expect(validateBuilder({ ...base, name: 'n'.repeat(121) }, NOW).name).toBe('nameTooLong');
    expect(validateBuilder({ ...base, name: 'n'.repeat(120) }, NOW).name).toBeUndefined();
    // Empty optional fields are not errors until filled.
    expect(validateBuilder({ name: '', slug: '', goal: '', deadline: '' }, NOW)).toEqual({});
  });
});

describe('builderComplete and builderPreview', () => {
  const good = { name: 'Solar park', slug: 'solar-park', goal: '10000', deadline: '2026-12-31' };
  it('requires every field plus a connected creator', () => {
    expect(builderComplete(good, NOW, null)).toBe(false);
    expect(builderComplete(good, NOW, 'GCREATOR')).toBe(true);
    expect(builderComplete({ ...good, goal: '0' }, NOW, 'GCREATOR')).toBe(false);
    expect(builderComplete({ ...good, deadline: '2026-11-15' }, NOW, 'GCREATOR')).toBe(false);
  });
  it('derives the exact constructor arguments', () => {
    const p = builderPreview(good, 'GCREATOR', 'CTOKEN');
    expect(p.constructorArgs).toEqual({
      creator: 'GCREATOR',
      token: 'CTOKEN',
      goal: '100000000000',
      deadline: Date.parse('2026-12-31T00:00:00Z') / 1000,
    });
    expect(p.registryEntry).toEqual({ id: 'solar-park', name: 'Solar park', contractId: '<assigned at deployment>' });
  });
});
