/**
 * Funding math - exact integer (BigInt) computation behind the Fraction token
 * grid. Amounts are integer strings in the token's smallest unit, exactly as
 * returned by the Soroban contract (7 decimals on Stellar). No float ever
 * touches the math.
 *
 * Honesty rule: a missing, invalid or negative amount, or a missing, invalid
 * or non-positive goal, is UNAVAILABLE (progress unknown) - it must never be
 * rendered as 0% funded. A verified "0" raised with a valid goal is a real
 * zero and renders 0 filled, 0%.
 */

export type FundingState =
  | { kind: 'unavailable' }
  | { kind: 'ready'; filled: number; inProgress: boolean; percent: number; partial: number };

/** True only for a non-negative integer string: a verified on-chain amount. */
export function isValidUnits(v: string | null | undefined): v is string {
  return typeof v === 'string' && /^[0-9]+$/.test(v);
}

/** Exact filled-tile count from chain values; never rounds up. */
export function fundingState(raised: string | null | undefined, goal: string | null | undefined, tileCount: number): FundingState {
  if (!isValidUnits(raised) || !isValidUnits(goal)) return { kind: 'unavailable' };
  const r = BigInt(raised);
  const g = BigInt(goal);
  if (g <= 0n) return { kind: 'unavailable' };
  const total = BigInt(tileCount);
  const scaled = r * total;
  let filled = Number(scaled / g);
  if (filled > tileCount) filled = tileCount;
  const remainder = scaled % g;
  const inProgress = remainder > 0n && filled < tileCount;
  // Exact fractional fill of the next tile (0-1), so the grid shows the
  // campaign filling up progressively, not just a tinted "partial" tile.
  const partial = inProgress ? Number((remainder * 1000000n) / g) / 1000000 : 0;
  const percent = Number((r * 10000n) / g) / 100; // 2-decimal percent, same integers
  return { kind: 'ready', filled, inProgress, percent, partial };
}

/**
 * Display-unit string from an exact smallest-unit integer string: grouped
 * thousands, full precision, trailing zeros trimmed. Returns null when the
 * amount is missing or invalid, so callers can show "Data unavailable"
 * instead of a fabricated zero.
 */
export function formatTokenAmount(raw: string | null | undefined, decimals = 7): string | null {
  if (!isValidUnits(raw)) return null;
  const v = BigInt(raw);
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = (v % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${grouped}.${frac}` : grouped;
}

