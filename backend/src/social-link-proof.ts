import { randomBytes } from 'node:crypto';
import { AuthError, hashToken } from './accounts.js';
import type { CommunityState, CommunityStore } from './community-store.js';
export type SocialLinkPurpose = { publicKey: string; sessionHash: string; identityKey: string };
export type SocialLinkProof = SocialLinkPurpose & { expiresAt: number };
export async function socialLinkPurpose(
  store: CommunityStore,
  authorization: string | undefined,
  provider: string,
  now = Date.now(),
): Promise<SocialLinkPurpose> {
  const token = authorization?.match(/^Bearer (bls_[0-9a-f]{48})$/)?.[1];
  const sessionHash = token ? hashToken(token) : '';
  const state = await store.read();
  const session = state.sessions[sessionHash];
  if (!session || session.expiresAt <= now || state.accounts[session.publicKey]?.authMethod !== 'social')
    throw new AuthError(403, 'sign in to prove your existing provider identity', 'social_stepup_required');
  const identity = Object.entries(state.socialIdentities).find(([, i]) => i.publicKey === session.publicKey && i.provider === provider);
  if (!identity) throw new AuthError(403, 'choose an already linked provider', 'social_stepup_required');
  return { publicKey: session.publicKey, sessionHash, identityKey: identity[0] };
}
export function issueSocialLinkProof(state: CommunityState, purpose: SocialLinkPurpose, provider: string, subject: string, now: number) {
  const session = state.sessions[purpose.sessionHash];
  const identityKey = `${provider}:${subject}`;
  if (
    !session ||
    session.expiresAt <= now ||
    session.publicKey !== purpose.publicKey ||
    state.accounts[purpose.publicKey]?.authMethod !== 'social' ||
    identityKey !== purpose.identityKey ||
    state.socialIdentities[identityKey]?.publicKey !== purpose.publicKey
  )
    throw new AuthError(403, 'provider identity does not match your original account and session', 'social_stepup_failed');
  state.socialLinkProofs ??= {};
  for (const [key, proof] of Object.entries(state.socialLinkProofs))
    if (proof.expiresAt <= now || proof.sessionHash === purpose.sessionHash) delete state.socialLinkProofs[key];
  const proof = `bll_${randomBytes(24).toString('hex')}`;
  const expiresAt = now + 5 * 60000;
  state.socialLinkProofs[hashToken(proof)] = { ...purpose, expiresAt };
  return { proof, expiresAt };
}
export function consumeSocialLinkProof(state: CommunityState, publicKey: string, authorization: string | undefined, proof: unknown, now: number) {
  const token = authorization?.match(/^Bearer (bls_[0-9a-f]{48})$/)?.[1];
  if (!token || typeof proof !== 'string' || !/^bll_[0-9a-f]{48}$/.test(proof)) return false;
  const key = hashToken(proof);
  const stored = state.socialLinkProofs?.[key];
  if (!stored || stored.expiresAt <= now || stored.publicKey !== publicKey || stored.sessionHash !== hashToken(token)) return false;
  const session = state.sessions[stored.sessionHash];
  delete state.socialLinkProofs![key];
  return !!session && session.expiresAt > now && session.publicKey === publicKey && state.socialIdentities[stored.identityKey]?.publicKey === publicKey;
}
