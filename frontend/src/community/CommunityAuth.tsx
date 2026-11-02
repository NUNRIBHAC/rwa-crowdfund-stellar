// Community sign-in state: wallet challenge-response authentication.
// Separate from the Freighter "actor" used for escrow transactions: an actor
// is a read-only wallet address, while a community session is a signed
// challenge proving key control, exchanged for a 30-day bearer token.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { isConnected, signMessage } from '@stellar/freighter-api';
import type { CommunityAccount } from './api';
import type { Messages as CatalogMessages } from '../i18n/locales/en';
import {
  ApiError,
  completeTotpLogin,
  emailLogin,
  emailRegister,
  emailResend,
  emailVerify,
  fetchMe,
  loadCommunityToken,
  logout,
  requestChallenge,
  saveCommunityToken,
  updateDisplayName,
  verifyChallenge,
} from './api';

export type CommunityAuthState = {
  /** null = signed out. */
  account: CommunityAccount | null;
  token: string;
  /** Server-reported OPERATOR_WALLETS membership (display hint only; the
      operator API re-checks the allow-list on every request). */
  isOperator: boolean;
  busy: boolean;
  error: string;
  /** True once the stored token (if any) has been checked against the server. */
  restored: boolean;
  /** Sign in with the given wallet address via challenge-response. */
  signIn: (address: string) => Promise<void>;
  /** Register a new email account; on success a verification token is on
      its way (same response for existing addresses - anti-enumeration). */
  emailSignUp: (email: string, password: string) => Promise<void>;
  /** Sign in with email + password (verified accounts only). */
  emailSignIn: (email: string, password: string) => Promise<void>;
  /** Redeem a verification token; also signs the new account in. */
  emailCompleteVerification: (email: string, verificationToken: string) => Promise<void>;
  /** Ask for a fresh verification token (anti-enumeration response). */
  emailResendToken: (email: string) => Promise<void>;
  /** Set when the wallet signature passed but the account has a second
      factor: the session is not issued until completeTotp succeeds. */
  totpPending: { ticket: string } | null;
  /** Second step of a gated sign-in: TOTP or a single-use recovery code. */
  completeTotp: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  clearError: () => void;
};

const Ctx = createContext<CommunityAuthState | null>(null);

type Messages = {
  freighterMissing: string;
  walletNoSign: string;
  community?: CatalogMessages['community'];
};

// Backend error codes (AuthError/CommunityError code field) mapped to
// localized catalog keys. Codes not listed here - and any error without a
// code - fall back to the raw server message: known failures read in the
// user's language, unknown failures are shown honestly, never masked.
const API_ERROR_MESSAGE_KEYS: Record<string, keyof CatalogMessages['community']> = {
  email_provider_unconfigured: 'errorEmailProviderUnavailable',
  rate_limited: 'errorRateLimited',
  email_invalid: 'errorEmailInvalid',
  password_short: 'errorPasswordShort',
  password_long: 'errorPasswordLong',
  token_invalid: 'errorTokenInvalid',
  token_expired: 'errorTokenExpired',
  credentials_invalid: 'errorCredentialsInvalid',
  email_unverified: 'errorEmailUnverified',
  login_throttled: 'errorLoginThrottled',
  invalid_input: 'errorInvalidInput',
  email_recipient_restricted: 'errorEmailRecipientRestricted',
  email_budget_exceeded: 'errorEmailBudgetExceeded',
  totp_unconfigured: 'errorTotpUnconfigured',
  totp_already_enabled: 'errorTotpAlreadyEnabled',
  totp_no_enrollment: 'errorTotpNoEnrollment',
  totp_code_invalid: 'errorTotpCodeInvalid',
  totp_login_invalid: 'errorTotpLoginInvalid',
  totp_not_enabled: 'errorTotpNotEnabled',
};

// Localize known API failures; pass through anything unknown verbatim.
// Exported so account-page sections (e.g. SecuritySection) render the same
// localized errors as the sign-in flow.
export function describeError(e: unknown, community: CatalogMessages['community'] | undefined): string {
  const key = e instanceof ApiError && e.code ? API_ERROR_MESSAGE_KEYS[e.code] : undefined;
  const localized = key ? community?.[key] : undefined;
  if (typeof localized === 'string') return localized;
  return e instanceof Error ? e.message : String(e);
}

export function CommunityAuthProvider({ children, messages }: { children: ReactNode; messages: Messages }) {
  const [account, setAccount] = useState<CommunityAccount | null>(null);
  const [token, setToken] = useState('');
  const [isOperator, setIsOperator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const [totpPending, setTotpPending] = useState<{ ticket: string } | null>(null);

  // Restore a stored session once on mount; drop it if the server rejects it.
  useEffect(() => {
    const stored = loadCommunityToken();
    if (!stored) {
      setRestored(true);
      return;
    }
    fetchMe(stored)
      .then(({ account, isOperator }) => {
        setToken(stored);
        setAccount(account);
        setIsOperator(isOperator === true);
      })
      .catch(() => saveCommunityToken(''))
      .finally(() => setRestored(true));
  }, [messages]);

  const signIn = useCallback(
    async (address: string) => {
      setBusy(true);
      setError('');
      try {
        const conn = await isConnected();
        if (!conn.isConnected) throw new Error(messages.freighterMissing);
        const { message } = await requestChallenge(address);
        const signed = await signMessage(message, { address });
        if (signed.error || !signed.signedMessage) throw new Error(signed.error?.message ?? messages.walletNoSign);
        // freighter-api types the result string | Buffer; in the browser it is
        // a base64 string. Coerce a byte array defensively (the server expects
        // base64).
        const raw = signed.signedMessage;
        const signature = typeof raw === 'string' ? raw : btoa(String.fromCharCode(...Array.from(raw as unknown as Uint8Array)));
        const v = await verifyChallenge(address, signature);
        if ('requiresTotp' in v) {
          // Wallet signature accepted, second factor still owed: no session
          // yet, keep only the one-purpose ticket.
          setTotpPending({ ticket: v.ticket });
          return;
        }
        saveCommunityToken(v.token);
        setToken(v.token);
        setAccount(v.account);
        setIsOperator(v.isOperator === true);
      } catch (e) {
        setError(describeError(e, messages.community));
      } finally {
        setBusy(false);
      }
    },
    [messages],
  );

  const emailSignUp = useCallback(
    async (email: string, password: string) => {
      setBusy(true);
      setError('');
      try {
        await emailRegister(email, password);
      } catch (e) {
        setError(describeError(e, messages.community));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [messages],
  );

  const emailSignIn = useCallback(
    async (email: string, password: string) => {
      setBusy(true);
      setError('');
      try {
        const v = await emailLogin(email, password);
        if ('requiresTotp' in v) {
          // Password accepted, second factor still owed: no session yet,
          // keep only the one-purpose ticket (same gate as wallet sign-in).
          setTotpPending({ ticket: v.ticket });
          return;
        }
        saveCommunityToken(v.token);
        setToken(v.token);
        setAccount(v.account);
        setIsOperator(v.isOperator === true);
      } catch (e) {
        setError(describeError(e, messages.community));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [messages],
  );

  const emailCompleteVerification = useCallback(
    async (email: string, verificationToken: string) => {
      setBusy(true);
      setError('');
      try {
        const v = await emailVerify(email, verificationToken);
        saveCommunityToken(v.token);
        setToken(v.token);
        setAccount(v.account);
        setIsOperator(v.isOperator === true);
      } catch (e) {
        setError(describeError(e, messages.community));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [messages],
  );

  const emailResendToken = useCallback(
    async (email: string) => {
      setBusy(true);
      setError('');
      try {
        await emailResend(email);
      } catch (e) {
        setError(describeError(e, messages.community));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [messages],
  );

  const completeTotp = useCallback(
    async (code: string) => {
      if (!totpPending) return;
      setBusy(true);
      setError('');
      try {
        const v = await completeTotpLogin(totpPending.ticket, code);
        saveCommunityToken(v.token);
        setToken(v.token);
        setAccount(v.account);
        setIsOperator(v.isOperator === true);
        setTotpPending(null);
      } catch (e) {
        setError(describeError(e, messages.community));
      } finally {
        setBusy(false);
      }
    },
    [totpPending, messages],
  );

  const signOut = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      if (token) await logout(token).catch(() => undefined);
    } finally {
      saveCommunityToken('');
      setToken('');
      setAccount(null);
      setIsOperator(false);
      setTotpPending(null);
      setBusy(false);
    }
  }, [token]);

  const setName = useCallback(
    async (name: string) => {
      if (!token) return;
      setBusy(true);
      setError('');
      try {
        const { account } = await updateDisplayName(token, name);
        setAccount(account);
      } catch (e) {
        setError(describeError(e, messages.community));
      } finally {
        setBusy(false);
      }
    },
    [token, messages],
  );

  const value = useMemo<CommunityAuthState>(
    () => ({
      account,
      token,
      isOperator,
      busy,
      error,
      restored,
      signIn,
      emailSignUp,
      emailSignIn,
      emailCompleteVerification,
      emailResendToken,
      signOut,
      totpPending,
      completeTotp,
      setDisplayName: setName,
      clearError: () => setError(''),
    }),
    [
      account,
      token,
      isOperator,
      busy,
      error,
      restored,
      signIn,
      emailSignUp,
      emailSignIn,
      emailCompleteVerification,
      emailResendToken,
      signOut,
      setName,
      totpPending,
      completeTotp,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommunityAuth(): CommunityAuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCommunityAuth must be used within CommunityAuthProvider');
  return v;
}
