import { randomBytes } from 'node:crypto';
import type { CommunityStore, CommunityState } from './community-store.js';
import { AuthError, hashToken, verifySignature } from './accounts.js';

export const DELETION_PROOF_TTL_MS = 5 * 60 * 1000;
export type DeletionChallenge = { publicKey: string; sessionHash: string; nonce: string; message: string; expiresAt: number };
function sessionFor(state: CommunityState, authorization: string | undefined, now: number) {
  const token = authorization?.match(/^Bearer (bls_[0-9a-f]{48})$/)?.[1];
  const sessionHash = token ? hashToken(token) : '';
  const session = state.sessions[sessionHash];
  if (!session || session.expiresAt <= now || !state.accounts[session.publicKey]) throw new AuthError(401, 'sign in again', 'unauthorized');
  return { session, sessionHash };
}
// This is NOT a login challenge and is never accepted by verifyChallenge.
// Signing it approves deletion of the site profile only, never any transfer.
export async function createDeletionChallenge(store: CommunityStore, authorization: string | undefined, now = Date.now()) {
  return store.change((state) => {
    const { session, sessionHash } = sessionFor(state, authorization, now);
    const account = state.accounts[session.publicKey];
    if (account.authMethod) throw new AuthError(409, 'wallet proof is only available for wallet accounts', 'deletion_unsupported');
    state.deletionChallenges ??= {};
    for (const [id, challenge] of Object.entries(state.deletionChallenges))
      if (challenge.expiresAt <= now || challenge.sessionHash === sessionHash) delete state.deletionChallenges[id];
    const nonce = randomBytes(24).toString('hex');
    const expiresAt = now + DELETION_PROOF_TTL_MS;
    const message = [
      'Blockallisto prototype account deletion',
      'Purpose: permanently delete my Blockallisto site profile and all site sign-in sessions.',
      `Account: ${account.publicKey}`,
      `Session binding: ${sessionHash.slice(0, 16)}`,
      `Nonce: ${nonce}`,
      `Expires: ${new Date(expiresAt).toISOString()}`,
      'This is not a transaction. It moves no funds and does not delete my wallet or blockchain records.',
      'Protected records can prevent deletion. A separate typed confirmation and enabled second factor are still required.',
    ].join('\n');
    state.deletionChallenges[hashToken(nonce)] = { publicKey: account.publicKey, sessionHash, nonce, message, expiresAt };
    return { nonce, message, expiresAt };
  });
}
// Called in the SAME serialized mutation as deletion, so no approval can be
// transferred to another session or raced between proof and data removal.
export function consumeWalletDeletionProof(
  state: CommunityState,
  authorization: string | undefined,
  input: { nonce?: unknown; signature?: unknown },
  now: number,
): boolean {
  const { session, sessionHash } = sessionFor(state, authorization, now);
  if (typeof input.nonce !== 'string' || typeof input.signature !== 'string') return false;
  const id = hashToken(input.nonce);
  const challenge = state.deletionChallenges?.[id];
  if (!challenge || challenge.publicKey !== session.publicKey || challenge.sessionHash !== sessionHash || challenge.expiresAt <= now) return false;
  // A signature attempt consumes the purpose challenge even when invalid.
  delete state.deletionChallenges![id];
  const signature = Buffer.from(input.signature, 'base64');
  return signature.length === 64 && verifySignature(session.publicKey, challenge.message, signature);
}
