import type { Campaign } from './types';

// Shared marketplace state threaded from App into the routed pages.
export type Market = {
  campaigns: Campaign[];
  loaded: boolean;
  fixtureMode: boolean;
  actor: string;
  busy: boolean;
  amounts: Record<string, string>;
  onAmount: (id: string, v: string) => void;
  onPrepare: (c: Campaign, action: 'contribute' | 'refund' | 'withdraw') => void;
  onRefresh: () => void;
  onToggleFixtures: () => void;
};
