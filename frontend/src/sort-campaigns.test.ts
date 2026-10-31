import { describe, expect, it } from 'vitest';
import { compareCampaigns } from './sort-campaigns';
import type { Campaign } from './types';

let seq = 0;
function campaign(name: string, raised: string, goal: string, deadline: string): Campaign {
  seq += 1;
  return {
    id: `c${seq}`,
    name,
    contractId: `C${seq}`,
    raised,
    balance: null,
    withdrawn: false,
    config: { creator: 'G', token: 'T', goal, deadline },
  };
}

// Three fixtures whose name, deadline and progress orderings ALL disagree,
// so each sort key is distinguished by the expected output alone.
// Pairwise-disagreeing orders: name=Alpha<Mike<Zulu, deadline=Mike<Zulu<Alpha,
// progress=Zulu(90%)>Mike(50%)>Alpha(1%).
const ALPHA = campaign('Alpha first', '1', '100', '300'); // 1%, latest deadline
const MIKE = campaign('Mike middle', '50', '100', '100'); // 50%, soonest deadline
const ZULU = campaign('Zulu last', '90', '100', '200'); // 90%, middle deadline

describe('compareCampaigns', () => {
  it('sorts by name A-Z', () => {
    const out = [ZULU, ALPHA, MIKE].sort(compareCampaigns('name')).map((c) => c.name);
    expect(out).toEqual(['Alpha first', 'Mike middle', 'Zulu last']);
  });

  it('sorts by deadline soonest first', () => {
    const out = [ZULU, ALPHA, MIKE].sort(compareCampaigns('deadline')).map((c) => c.name);
    expect(out).toEqual(['Mike middle', 'Zulu last', 'Alpha first']);
  });

  it('sorts by progress descending', () => {
    const out = [ZULU, ALPHA, MIKE].sort(compareCampaigns('progress')).map((c) => c.name);
    expect(out).toEqual(['Zulu last', 'Mike middle', 'Alpha first']);
  });

  it('handles huge BigInt amounts without float loss', () => {
    const whale = campaign('Whale', '1000000000000000000000000000001', '1000000000000000000', '300');
    const plankton = campaign('Plankton', '999999999999999999', '1000000000000000000', '300');
    const out = [plankton, whale].sort(compareCampaigns('progress')).map((c) => c.name);
    expect(out).toEqual(['Whale', 'Plankton']);
  });

  it('distinguishes equal-bps ties deterministically by staying stable', () => {
    const a = campaign('Same one', '10', '100', '400');
    const b = campaign('Same two', '10', '100', '500');
    const out = [a, b].sort(compareCampaigns('progress')).map((c) => c.name);
    expect(out).toEqual(['Same one', 'Same two']);
  });
});
