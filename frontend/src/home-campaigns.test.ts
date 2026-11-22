import { describe, expect, it, vi, afterEach } from 'vitest';
import type { Campaign } from './types';
import { selectHomeCampaigns } from './home-campaigns';
const now = 1900000000;
const campaign = (id: string, state: 'open' | 'funded' | 'ended', days: number): Campaign => ({
  id,
  name: id,
  contractId: id,
  raised: state === 'funded' ? '1000000000' : '100000000',
  balance: null,
  withdrawn: false,
  config: { creator: 'sample', token: 'sample', goal: '1000000000', deadline: String(now + days * 86400) },
});
afterEach(() => vi.useRealTimers());
describe('home campaigns use distinct existing states', () => {
  it('returns one open, one funded and one ended in that order', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);
    const rows = [
      campaign('old-ended', 'ended', -20),
      campaign('new-ended', 'ended', -2),
      campaign('funded', 'funded', -3),
      campaign('later-open', 'open', 25),
      campaign('closing-open', 'open', 2),
    ];
    expect(selectHomeCampaigns(rows).map((c) => c.id)).toEqual(['closing-open', 'funded', 'new-ended']);
    expect(rows.map((c) => c.id)).toEqual(['old-ended', 'new-ended', 'funded', 'later-open', 'closing-open']);
  });
  it('does not fill a missing funded state with another underfunded campaign or fake data', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);
    expect(selectHomeCampaigns([campaign('ended-1', 'ended', -1), campaign('ended-2', 'ended', -2), campaign('open', 'open', 1)]).map((c) => c.id)).toEqual([
      'open',
      'ended-1',
    ]);
  });
  it('shows only one existing state when no others exist, including one funded before deadline', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);
    expect(selectHomeCampaigns([campaign('funded', 'funded', 2), campaign('other', 'funded', -2)]).map((c) => c.id)).toEqual(['funded']);
    expect(selectHomeCampaigns([])).toEqual([]);
  });
  it('breaks equal deadlines by stable identity, independent of input or locale', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);
    const a = campaign('a', 'open', 1),
      b = campaign('b', 'open', 1);
    expect(selectHomeCampaigns([b, a]).map((c) => c.id)).toEqual(['a']);
    expect(selectHomeCampaigns([a, b]).map((c) => c.id)).toEqual(['a']);
  });
});
