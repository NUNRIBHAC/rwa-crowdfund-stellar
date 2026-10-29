// Display-only formatting. Amounts stay integer strings in 7-decimal units everywhere else.
export function units(v: string): string {
  const n = BigInt(v);
  return `${n / 10000000n}.${String(n % 10000000n).padStart(7, '0')}`;
}

export function formatAmount(v: string): string {
  const n = BigInt(v);
  const whole = n / 10000000n;
  const frac = String(n % 10000000n).padStart(7, '0').replace(/0+$/, '');
  const grouped = whole.toLocaleString('en-US');
  return frac ? `${grouped}.${frac}` : grouped;
}

export function percent(raised: string, goal: string): number {
  const g = BigInt(goal);
  if (g === 0n) return 0;
  const r = BigInt(raised);
  return Math.min(100, Number((r * 10000n) / g) / 100);
}

export function deadlineInfo(seconds: string): { date: string; label: string; state: 'open' | 'closing' | 'ended' } {
  const ms = Number(seconds) * 1000;
  const now = Date.now();
  const date = new Date(ms).toISOString().slice(0, 10);
  const days = Math.ceil((ms - now) / 86400000);
  if (days < 0) return { date, label: 'Ended', state: 'ended' };
  if (days === 0) return { date, label: 'Ends today', state: 'closing' };
  if (days <= 3) return { date, label: `${days} day${days === 1 ? '' : 's'} left`, state: 'closing' };
  return { date, label: `${days} days left`, state: 'open' };
}

export function shorten(id: string, head = 6, tail = 4): string {
  return id.length > head + tail + 3 ? `${id.slice(0, head)}...${id.slice(-tail)}` : id;
}
