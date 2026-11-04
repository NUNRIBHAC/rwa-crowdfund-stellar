import type { CommunityAccount } from './community/api';

// A restored wallet session proves this public key without reconnecting an
// extension. This selects read-only records, never the transaction actor.
// Email/social account keys are internal identities, not connected wallets.
export function accountReadActor(connectedActor: string, account: CommunityAccount | null): string {
  return connectedActor || (account?.authMethod === 'wallet' ? account.publicKey : '');
}
