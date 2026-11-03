import { isValidUnits } from './funding-math';

/** Testnet USDC has seven decimal places. This preview never prepares or
 * submits a transaction. All amounts remain exact integers until display. */
export function previewAmountUnits(value: string): string | null {
  if (!/^\d+(\.\d{1,7})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const units = BigInt(whole) * 10000000n + BigInt(fraction.padEnd(7, '0'));
  return units > 0n ? units.toString() : null;
}

export type PreviewPercentage = { text: string; roundedDown: boolean };
function percentage(value: bigint, goal: bigint): PreviewPercentage {
  const scaled = value * 10000n;
  const hundredths = scaled / goal;
  const whole = hundredths / 100n;
  const decimals = (hundredths % 100n).toString().padStart(2, '0').replace(/0+$/, '');
  return { text: `${whole}${decimals ? `.${decimals}` : ''}`, roundedDown: scaled % goal !== 0n };
}

export type ContributionPreview =
  | { kind: 'unavailable' }
  | { kind: 'invalid-amount' }
  | { kind: 'over-goal'; remainingUnits: string }
  | { kind: 'ready'; current: PreviewPercentage; share: PreviewPercentage; projected: PreviewPercentage; contributionUnits: string; projectedUnits: string };

/** Existing all-or-nothing v1 funding rejects over-goal contributions. Fees
 * are paid separately; no fee is invented or silently deducted here. */
export function contributionPreview(raised: string | null | undefined, goal: string | null | undefined, amount: string): ContributionPreview {
  if (!isValidUnits(raised) || !isValidUnits(goal) || BigInt(goal) <= 0n) return { kind: 'unavailable' };
  const contribution = previewAmountUnits(amount);
  if (!contribution) return { kind: 'invalid-amount' };
  const r = BigInt(raised),
    g = BigInt(goal),
    c = BigInt(contribution);
  if (r + c > g) return { kind: 'over-goal', remainingUnits: (g > r ? g - r : 0n).toString() };
  return {
    kind: 'ready',
    current: percentage(r, g),
    share: percentage(c, g),
    projected: percentage(r + c, g),
    contributionUnits: contribution,
    projectedUnits: (r + c).toString(),
  };
}
