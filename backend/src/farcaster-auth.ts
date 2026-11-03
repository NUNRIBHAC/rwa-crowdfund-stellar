// Sign In With Farcaster (SIWF, EIP-4361/ERC-6492 message signed by the user's
// Farcaster wallet). Identity = the numeric fid. Farcaster carries no email,
// so a NEW fid is an identity-only provider: it gets the same pending-email
// ticket as Telegram and can only become an account by proving an allowlisted
// email by code. An existing identity signs in (session or TOTP ticket).
//
// Server-side binding (never trusts the client's claim):
//   - /nonce issues a single-use server nonce stored with the hash of a
//     per-browser httpOnly cookie secret (same bind as every social flow).
//   - /verify consumes the nonce (single use, 10 min, cookie must match) and
//     runs the SIWF verification against the CONFIGURED domain, so a message
//     signed for another site/nonce is rejected. The fid is read from the
//     verified result, never from the request body.
// Disabled (404) unless FARCASTER_AUTH_DOMAIN is set: fail-closed.
import { createHash, randomBytes } from 'node:crypto';
import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { AuthError } from './accounts.js';
import type { CommunityStore } from './community-store.js';
import { bindMatches, finishSocialIdentity, type SocialLoginResult } from './social-auth.js';

const NONCE_TTL_MS = 10 * 60 * 1000;
const FLOW_PROVIDER = 'farcaster';

export type FarcasterVerifier = (args: { nonce: string; domain: string; message: string; signature: `0x${string}` }) => Promise<{ fid: number } | null>;

export function farcasterDomain(env: NodeJS.ProcessEnv): string | null {
  const d = (env.FARCASTER_AUTH_DOMAIN ?? '').trim().toLowerCase();
  return /^[a-z0-9.-]+(:\d+)?$/.test(d) && d.length > 0 ? d : null;
}

// Production verifier: @farcaster/auth-client verifySignInMessage, which checks
// the signature on Optimism (Farcaster id registry / auth-address) through the
// configured RPC (FARCASTER_RPC_URL, else the library default).
export function defaultFarcasterVerifier(env: NodeJS.ProcessEnv): FarcasterVerifier {
  const rpcUrl = (env.FARCASTER_RPC_URL ?? '').trim();
  const client = createAppClient({ ethereum: viemConnector(rpcUrl ? { rpcUrl } : {}) });
  return async (args) => {
    const res = await client.verifySignInMessage(args);
    const data = res.data as { success?: boolean; fid?: number } | undefined;
    if (res.isError || !data?.success || typeof data.fid !== 'number' || !Number.isSafeInteger(data.fid) || data.fid <= 0) return null;
    return { fid: data.fid };
  };
}

const nonceKey = (nonce: string): string => createHash('sha256').update(`farcaster:${nonce}`).digest('hex');

export async function issueFarcasterNonce(store: CommunityStore, bindHash: string, now = Date.now()): Promise<{ nonce: string }> {
  const nonce = randomBytes(16).toString('hex');
  await store.change((s) => {
    for (const [k, f] of Object.entries(s.socialFlows)) if (f.expiresAt <= now) delete s.socialFlows[k];
    s.socialFlows[nonceKey(nonce)] = { provider: FLOW_PROVIDER, nonce, codeVerifier: '', createdAt: now, expiresAt: now + NONCE_TTL_MS, bindHash };
  });
  return { nonce };
}

export async function verifyFarcasterSignIn(
  store: CommunityStore,
  env: NodeJS.ProcessEnv,
  verifier: FarcasterVerifier,
  input: { nonce: unknown; message: unknown; signature: unknown; bind: unknown },
  now = Date.now(),
): Promise<SocialLoginResult> {
  const expired = () => new AuthError(401, 'sign-in flow expired; start again', 'social_flow_expired');
  const domain = farcasterDomain(env);
  if (!domain) throw new AuthError(404, 'not found', 'not_found');
  const { nonce, message, signature } = input;
  if (typeof nonce !== 'string' || !/^[0-9a-f]{32}$/.test(nonce)) throw expired();
  if (typeof message !== 'string' || message.length === 0 || message.length > 4096)
    throw new AuthError(400, 'invalid sign-in message', 'social_exchange_failed');
  if (typeof signature !== 'string' || !/^0x[0-9a-fA-F]{2,2048}$/.test(signature))
    throw new AuthError(400, 'invalid sign-in signature', 'social_exchange_failed');
  const key = nonceKey(nonce);
  // Consume first: single use on ANY outcome (a failed verification burns it).
  const flow = await store.change((s) => {
    const f = s.socialFlows[key];
    if (!f || f.provider !== FLOW_PROVIDER || f.expiresAt <= now) return null;
    delete s.socialFlows[key];
    if (!f.bindHash || !bindMatches(f.bindHash, input.bind)) return null;
    return f;
  });
  if (!flow) throw expired();
  let verified: { fid: number } | null = null;
  try {
    verified = await verifier({ nonce, domain, message, signature: signature as `0x${string}` });
  } catch {
    throw new AuthError(502, 'the sign-in provider rejected the exchange; start again', 'social_exchange_failed');
  }
  if (!verified) throw new AuthError(401, 'the Farcaster signature could not be verified; start again', 'social_exchange_failed');
  return finishSocialIdentity(store, env, FLOW_PROVIDER, String(verified.fid), null, false, flow, now);
}
