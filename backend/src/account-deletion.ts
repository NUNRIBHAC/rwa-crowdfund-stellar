import { consumeWalletDeletionProof } from './deletion-proof.js';
import type { CommunityStore } from './community-store.js';
import { AuthError, hashToken, TOTP_LOCK_MS, TOTP_MAX_FAILURES } from './accounts.js';
import { EMAIL_MAX_FAILURES, EMAIL_LOCK_MS, verifyPassword } from './email-auth.js';
import { decryptSeed, verifyTotp } from './totp.js';

// Deliberately limited to verified email identities. Wallet/social deletion
// needs a purpose-bound proof and external-record retention adapter, not a
// login signature or a recent bearer session treated as destructive consent.
export async function deleteEmailAccount(
  store: CommunityStore,
  authorization: string | undefined,
  input: { confirmation?: unknown; password?: unknown; totpCode?: unknown; nonce?: unknown; signature?: unknown },
  operatorKeys: string[] = [],
  now = Date.now(),
  walletRetentionCheck?: (publicKey: string) => Promise<'clear' | 'protected' | 'unavailable'>,
): Promise<void> {
  if (input.confirmation !== 'DELETE') throw new AuthError(400, 'type DELETE to confirm account deletion', 'deletion_confirmation_required');
  const token = authorization?.match(/^Bearer (bls_[0-9a-f]{48})$/)?.[1] ?? '';
  if (!token) throw new AuthError(401, 'sign in again', 'unauthorized');
  // External safety records are read before the atomic mutation. The final
  // mutation rechecks the same session/account and all local protected records.
  const before = await store.read();
  const beforeSession = before.sessions[hashToken(token)];
  const beforeAccount = beforeSession && beforeSession.expiresAt > now ? before.accounts[beforeSession.publicKey] : undefined;
  let walletRetention: 'clear' | 'protected' | 'unavailable' = 'unavailable';
  if (beforeAccount && !beforeAccount.authMethod && walletRetentionCheck) {
    try {
      walletRetention = await walletRetentionCheck(beforeAccount.publicKey);
    } catch {
      walletRetention = 'unavailable';
    }
  }
  const result = await store.change((state) => {
    const session = state.sessions[hashToken(token)];
    const account = session && session.expiresAt > now ? state.accounts[session.publicKey] : undefined;
    if (!account) return 'unauthorized';
    const key = account.publicKey;
    const credential = account.email ? state.emailCredentials[account.email] : undefined;
    const wallet = !account.authMethod;
    if (!wallet && (account.authMethod !== 'email' || !credential?.verified || credential.publicKey !== key)) return 'unsupported';
    if (wallet && walletRetention !== 'clear') return walletRetention === 'protected' ? 'protected' : 'unavailable';
    // Do not orphan financial, issuer, assessment, operator or fixture-meeting
    // records. No manual request is created by this response.
    const protectedRecords = [
      state.contributors,
      state.applications,
      state.companies,
      state.appropriateness,
      state.investmentDocuments,
      state.audit,
      state.simulatedMeetings,
    ];
    if (operatorKeys.includes(key) || protectedRecords.some((records) => JSON.stringify(records ?? {}).includes(key))) return 'protected';
    if (wallet) {
      if (!consumeWalletDeletionProof(state, authorization, input, now)) return 'proof';
    } else {
      if (credential!.lockUntil && credential!.lockUntil > now) return 'locked';
      if (typeof input.password !== 'string' || !verifyPassword(input.password, credential!.passwordRecord)) {
        credential!.failedAttempts += 1;
        if (credential!.failedAttempts >= EMAIL_MAX_FAILURES) {
          credential!.lockUntil = now + EMAIL_LOCK_MS;
          credential!.failedAttempts = 0;
        }
        return 'proof';
      }
    }
    const factor = account.totp;
    if (factor?.status === 'enabled') {
      if (factor.lockUntil && factor.lockUntil > now) return 'locked';
      const secret = process.env.COMMUNITY_TOTP_KEY ?? process.env.PLATFORM_SECRET;
      if (!secret) return 'unavailable';
      const step =
        typeof input.totpCode === 'string'
          ? verifyTotp(decryptSeed(secret, factor.encSeed), input.totpCode, Math.floor(now / 1000), factor.lastUsedStep)
          : null;
      if (step === null) {
        factor.failedAttempts += 1;
        if (factor.failedAttempts >= TOTP_MAX_FAILURES) {
          factor.lockUntil = now + TOTP_LOCK_MS;
          factor.failedAttempts = 0;
        }
        return 'factor';
      }
    }
    const identities = Object.values(state.socialIdentities).filter((identity) => identity.publicKey === key);
    for (const identity of identities) {
      state.deletedSocialIdentityBefore ??= {};
      state.deletedSocialIdentityBefore[hashToken(`${identity.provider}:${identity.subject}`)] = now;
    }
    for (const [id, record] of Object.entries(state.socialPending)) {
      if (record.email === account.email || identities.some((identity) => identity.provider === record.provider && identity.subject === record.subject))
        delete state.socialPending[id];
    }
    for (const [id, record] of Object.entries(state.deletionChallenges ?? {})) if (record.publicKey === key) delete state.deletionChallenges![id];
    for (const [id, record] of Object.entries(state.socialFlows)) if (record.linkTo === key) delete state.socialFlows[id];
    for (const records of [
      state.emailCredentials,
      state.socialIdentities,
      state.sessions,
      state.challenges,
      state.totpTickets,
      state.comments,
      state.tickets,
      state.notifications,
    ]) {
      for (const [id, record] of Object.entries(records)) if (record.publicKey === key) delete records[id];
    }
    if (wallet) {
      state.deletedWalletBefore ??= {};
      state.deletedWalletBefore[key] = now;
    }
    delete state.accounts[key];
    return 'deleted';
  });
  if (result === 'deleted') return;
  const failures: Record<string, [number, string, string]> = {
    unauthorized: [401, 'sign in again', 'unauthorized'],
    unsupported: [409, 'self-service deletion currently supports verified email accounts only; no request has been submitted', 'deletion_unsupported'],
    protected: [
      409,
      'linked protected records prevent self-service deletion; nothing was deleted and no review request was submitted',
      'deletion_protected_records',
    ],
    locked: [429, 'too many failed attempts; retry later', 'deletion_locked'],
    proof: [403, 'fresh account deletion proof did not match', 'deletion_proof_failed'],
    factor: [403, 'enter a new current authenticator code', 'deletion_factor_required'],
    unavailable: [503, 'required deletion safety checks are unavailable; nothing was deleted', 'deletion_unavailable'],
  };
  const [status, message, code] = failures[result];
  throw new AuthError(status, message, code);
}
