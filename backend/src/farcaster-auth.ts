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
import { recoverMessageAddress } from 'viem';
import { parseSiweMessage } from 'viem/siwe';
import { AuthError } from './accounts.js';
import type { CommunityStore } from './community-store.js';
import { bindMatches, finishSocialIdentity, type SocialLoginResult } from './social-auth.js';

type EthereumConnector = Parameters<typeof createAppClient>[0]['ethereum'];
const NONCE_TTL_MS = 10 * 60 * 1000;
// The signed message must have been issued recently (clock skew allowed).
const MESSAGE_MAX_AGE_MS = NONCE_TTL_MS;
const MESSAGE_MAX_FUTURE_MS = 60 * 1000;
const FLOW_PROVIDER = 'farcaster';

export type FarcasterVerifier = (args: { nonce: string; domain: string; message: string; signature: `0x${string}` }) => Promise<{ fid: number } | null>;

export function farcasterDomain(env: NodeJS.ProcessEnv): string | null {
  const d = (env.FARCASTER_AUTH_DOMAIN ?? '').trim().toLowerCase();
  return /^[a-z0-9.-]+(:\d+)?$/.test(d) && d.length > 0 ? d : null;
}

// Production verifier: @farcaster/auth-client verifySignInMessage, which checks
// the signature on Optimism (Farcaster id registry / auth-address) through the
// configured RPC (FARCASTER_RPC_URL, else the library default).
export function defaultFarcasterVerifier(env: NodeJS.ProcessEnv, connector?: EthereumConnector): FarcasterVerifier {
  const rpcUrl = (env.FARCASTER_RPC_URL ?? '').trim();
  const client = createAppClient({ ethereum: connector ?? viemConnector(rpcUrl ? { rpcUrl } : {}) });
  return async (args) => {
    const res = (await client.verifySignInMessage(args)) as { success?: boolean; fid?: number; isError?: boolean };
    if (res.isError || !res.success || typeof res.fid !== 'number' || !Number.isSafeInteger(res.fid) || res.fid <= 0) return null;
    return { fid: res.fid };
  };
}

const nonceKey = (nonce: string): string => createHash('sha256').update(`farcaster:${nonce}`).digest('hex');

export async function issueFarcasterNonce(store: CommunityStore, bindHash: string, now = Date.now(), linkTo?: string): Promise<{ nonce: string }> {
  const nonce = randomBytes(16).toString('hex');
  await store.change((s) => {
    for (const [k, f] of Object.entries(s.socialFlows)) if (f.expiresAt <= now) delete s.socialFlows[k];
    s.socialFlows[nonceKey(nonce)] = {
      provider: FLOW_PROVIDER,
      nonce,
      codeVerifier: '',
      createdAt: now,
      expiresAt: now + NONCE_TTL_MS,
      bindHash,
      ...(linkTo ? { linkTo } : {}),
    };
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
  // The flow is consumed only after the browser binding validated: a request
  // without this browser's cookie neither spends nor burns the nonce, so a
  // third party cannot invalidate someone else's flow. After that it is
  // single use on ANY outcome (a failed verification burns it).
  const flow = await store.change((s) => {
    const f = s.socialFlows[key];
    if (!f || f.provider !== FLOW_PROVIDER || f.expiresAt <= now) return null;
    if (!f.bindHash || !bindMatches(f.bindHash, input.bind)) return null;
    delete s.socialFlows[key];
    return f;
  });
  if (!flow) throw expired();
  // Beyond the library's own checks (statement, chain id 10, fid resource,
  // nonce, domain, signature, custody/auth-address): the message must name
  // OUR uri and be fresh.
  const parsed = parseSiweMessage(message);
  const issuedAt = parsed.issuedAt?.getTime();
  const bad = new AuthError(401, 'the Farcaster sign-in message is not valid for this site; start again', 'social_exchange_failed');
  if (parsed.uri !== `https://${domain}/account`) throw bad;
  if (issuedAt === undefined || issuedAt < now - MESSAGE_MAX_AGE_MS || issuedAt > now + MESSAGE_MAX_FUTURE_MS) throw bad;
  if (parsed.expirationTime && parsed.expirationTime.getTime() <= now) throw bad;
  if (parsed.notBefore && parsed.notBefore.getTime() > now + MESSAGE_MAX_FUTURE_MS) throw bad;
  // Defense in depth: do not rely only on the RPC's verdict. The signature must
  // recover locally to the address named in the message (Farcaster custody and
  // auth addresses are EOAs). Smart-contract-wallet / ERC-6492 signatures fail
  // closed here.
  try {
    const signer = await recoverMessageAddress({ message, signature: signature as `0x${string}` });
    if (!parsed.address || signer.toLowerCase() !== parsed.address.toLowerCase()) throw bad;
  } catch {
    throw bad;
  }
  let verified: { fid: number } | null = null;
  try {
    verified = await verifier({ nonce, domain, message, signature: signature as `0x${string}` });
  } catch {
    throw new AuthError(502, 'the sign-in provider rejected the exchange; start again', 'social_exchange_failed');
  }
  if (!verified) throw new AuthError(401, 'the Farcaster signature could not be verified; start again', 'social_exchange_failed');
  return finishSocialIdentity(store, env, FLOW_PROVIDER, String(verified.fid), null, false, flow, now);
}
