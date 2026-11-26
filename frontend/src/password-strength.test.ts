import { describe, expect, it } from 'vitest';
import { passwordStrength } from './password-strength';

describe('passwordStrength', () => {
  it('reports empty and too-short inputs before any scoring', () => {
    expect(passwordStrength('')).toBe('empty');
    expect(passwordStrength('Ab1!xyz')).toBe('tooShort');
    expect(passwordStrength('123456789')).toBe('tooShort');
  });
  it('rates a minimum-length single-class password as weak', () => {
    expect(passwordStrength('abcdefghij')).toBe('weak');
  });
  it('penalises repetition and well-known fragments', () => {
    expect(passwordStrength('aaaaaaaaaaaaaaaaaaaa')).toBe('weak');
    expect(passwordStrength('Password1234!')).toBe('weak');
  });
  it('rewards length and variety', () => {
    expect(passwordStrength('correct horse')).toBe('fair');
    expect(passwordStrength('Tr4vel-Lisbon-Tiles-2026')).toBe('strong');
  });
  it('counts non-Latin letters by code point', () => {
    expect(passwordStrength('日本語のパスワードです')).not.toBe('tooShort');
    // The server counts UTF-16 units, so five emoji (10 units) pass its minimum.
    expect(passwordStrength('😀😀😀😀😀')).toBe('weak');
    expect(passwordStrength('😀😀😀😀')).toBe('tooShort');
  });
});
