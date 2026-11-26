// Indicative password strength for the sign-up, verification and reset forms.
// This is guidance only: the server enforces the real rule (minimum 10
// characters, maximum 200) and nothing here is sent anywhere or stored.
export const PASSWORD_MIN_LENGTH = 10;

export type PasswordStrength = 'empty' | 'tooShort' | 'weak' | 'fair' | 'strong';

const COMMON_FRAGMENTS = ['password', 'passw0rd', 'qwerty', '123456', 'abcdef', 'letmein', 'iloveyou', 'admin', 'welcome'];

export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'empty';
  // Same unit as the server rule (String length, UTF-16 code units).
  if (password.length < PASSWORD_MIN_LENGTH) return 'tooShort';
  const chars = Array.from(password);
  const distinct = new Set(chars).size;
  const classes = [/\p{Ll}/u, /\p{Lu}/u, /\p{Nd}/u, /[^\p{L}\p{Nd}]/u].filter((re) => re.test(password)).length;
  const lower = password.toLowerCase();
  let score = 0;
  if (chars.length >= 12) score += 1;
  if (chars.length >= 16) score += 1;
  if (classes >= 3) score += 1;
  if (classes >= 4 || distinct >= 12) score += 1;
  // Very repetitive input is penalised; a well-known fragment is always weak.
  if (distinct <= Math.ceil(chars.length / 3)) score -= 2;
  if (COMMON_FRAGMENTS.some((f) => lower.includes(f))) return 'weak';
  if (score >= 3) return 'strong';
  if (score >= 1) return 'fair';
  return 'weak';
}

export const STRENGTH_LEVEL: Record<PasswordStrength, number> = { empty: 0, tooShort: 1, weak: 2, fair: 3, strong: 4 };
