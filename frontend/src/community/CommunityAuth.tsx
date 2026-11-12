// Community sign-in state: wallet challenge-response authentication.
// Separate from the Freighter "actor" used for escrow transactions: an actor
// is a read-only wallet address, while a community session is a signed
// challenge proving key control, exchanged for a 30-day bearer token.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { isConnected, signMessage } from '@stellar/freighter-api';
import type { CommunityAccount } from './api';
import { getTurnstileToken } from './turnstile';
import { API_ERROR_MESSAGE_KEYS, storedLocale } from '../i18n';
import type { Messages as CatalogMessages } from '../i18n/locales/en';
import { tpl } from '../format';
import {
  ApiError,
  completeTotpLogin,
  confirmSocialEmailCode,
  farcasterChannelStatus,
  farcasterCreateChannel,
  farcasterLinkNonce,
  farcasterNonce,
  farcasterVerify,
  requestSocialEmailCode,
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
  emailResetRequest,
  emailResetConfirm,
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
  /** Ask for a password-reset token (anti-enumeration response). */
  emailRequestReset: (email: string) => Promise<void>;
  /** Redeem a reset token with a new password; the server revokes every
      existing session for the account. */
  emailConfirmReset: (email: string, resetToken: string, password: string) => Promise<void>;
  /** Set when the wallet signature passed but the account has a second
      factor: the session is not issued until completeTotp succeeds. */
  totpPending: { ticket: string } | null;
  /** Set when an identity-only provider (Telegram) signed in a NEW identity: an allowlisted email must be proven by code before the account exists. */
  socialEmailPending?: { ticket: string } | null;
  /** Farcaster deep link to approve the sign-in in the user's Farcaster app, while a relay channel is open. */
  farcasterLink?: string | null;
  cancelFarcaster?: () => void;
  /** Authenticated link of a Farcaster fid to the signed-in account (step-up proof already collected). */
  startFarcasterLink?: (proof: { password?: string; signature?: string }) => Promise<void>;
  socialEmailRequest?: (email: string) => Promise<void>;
  socialEmailConfirm?: (code: string) => Promise<void>;
  /** Second step of a gated sign-in: TOTP or a single-use recovery code. */
  completeTotp: (code: string) => Promise<void>;
  /** Social (OAuth) providers configured on this deployment (abuse-config);
      the sign-in panel renders a button per listed provider. */
  socialProviders: string[];
  socialValidationActive?: boolean;
  enableSocialValidation?: () => Promise<void>;
  disableSocialValidation?: () => void;
  /** Begin a social sign-in: bot check, then a top-level navigation to the
      provider through the backend /start route. */
  startSocialSignIn: (provider: string, registrationMethod?: 'phone') => Promise<void>;
  /** One-shot success notice from a social LINK callback
      (/account#social-linked=<provider>); consumed on render. */
  socialNotice: string;
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

// Social sign-in outcomes arrive from the backend callback as a redirect to
// /account#social-<kind>=<payload> (never in the query string: fragments do
// not reach access logs). Returns the cleaned hash-less outcome or null.
function readSocialFragment(): { kind: 'token' | 'totp' | 'email' | 'error' | 'linked'; value: string } | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/^#social-(token|totp|email|error|linked)=([A-Za-z0-9_\-]+)$/);
  if (!m) return null;
  // Strip the fragment immediately so a session token never lingers in the
  // URL (history, shoulder-surfing, screenshots).
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return { kind: m[1] as 'token' | 'totp' | 'email' | 'error', value: m[2] };
}

// Localize known API failures; pass through anything unknown verbatim.
// Exported so account-page sections (e.g. SecuritySection) render the same
// localized errors as the sign-in flow.
export function describeError(e: unknown, community: CatalogMessages['community'] | undefined): string {
  const key = e instanceof ApiError && e.code ? API_ERROR_MESSAGE_KEYS[e.code] : undefined;
  const localized = key ? community?.[key] : undefined;
  if (typeof localized === 'string') return localized;
  return e instanceof Error ? e.message : String(e);
}

// Bot-check token for the mail-triggering flows; undefined when the
// deployment has no Turnstile key (widget never loads in that case).
const turnstileToken = (): Promise<string | undefined> => getTurnstileToken(storedLocale());

export function CommunityAuthProvider({ children, messages }: { children: ReactNode; messages: Messages }) {
  const [account, setAccount] = useState<CommunityAccount | null>(null);
  const [token, setToken] = useState('');
  const [isOperator, setIsOperator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const [totpPending, setTotpPending] = useState<{ ticket: string } | null>(null);
  const [socialEmailPending, setSocialEmailPending] = useState<{ ticket: string } | null>(null);
  const [farcasterLink, setFarcasterLink] = useState<string | null>(null);
  const farcasterRun = useRef(0);
  const validationStorage = 'blockallisto-social-validation';
  const [validationProviders, setValidationProviders] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(validationStorage) ?? '[]');
      return Array.isArray(saved) ? saved.filter((p) => ['google', 'github', 'linkedin', 'telegram'].includes(p)) : [];
    } catch {
      return [];
    }
  });
  const [publicSocialProviders, setSocialProviders] = useState<string[]>([]);
  const socialProviders = useMemo(() => [...new Set([...publicSocialProviders, ...validationProviders])], [publicSocialProviders, validationProviders]);
  const enableSocialValidation = useCallback(async () => {
    const res = await fetch('/api/auth/social/validation-providers', { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) throw new Error('Validation is unavailable for this account.');
    const json = await res.json();
    const providers = Array.isArray(json.socialProviders) ? json.socialProviders.filter((p: unknown) => typeof p === 'string') : [];
    sessionStorage.setItem(validationStorage, JSON.stringify(providers));
    setValidationProviders(providers);
  }, [token]);
  const disableSocialValidation = useCallback(() => {
    sessionStorage.removeItem(validationStorage);
    setValidationProviders([]);
  }, []);
  const [socialNotice, setSocialNotice] = useState('');

  // A social sign-in returns here with its outcome in the URL fragment;
  // consume it before the stored-session restore so a fresh sign-in wins.
  useEffect(() => {
    const social = readSocialFragment();
    Promise.resolve()
      .then(() => fetch('/api/auth/abuse-config'))
      .then((r) => (r && r.ok ? r.json() : null))
      .then((j) => setSocialProviders(Array.isArray(j?.socialProviders) ? j.socialProviders.filter((p: unknown) => typeof p === 'string') : []))
      .catch(() => undefined);
    const restore = (stored: string) =>
      fetchMe(stored)
        .then(({ account, isOperator }) => {
          setToken(stored);
          setAccount(account);
          setIsOperator(isOperator === true);
          saveCommunityToken(stored);
        })
        .catch(() => saveCommunityToken(''))
        .finally(() => setRestored(true));
    if (social?.kind === 'token') {
      restore(social.value);
      return;
    }
    if (social?.kind === 'totp') {
      // Provider accepted the identity; the account's second factor is still
      // owed. Keep only the one-purpose ticket (same gate as email/wallet).
      setTotpPending({ ticket: social.value });
      setRestored(true);
      return;
    }
    if (social?.kind === 'email') {
      setSocialEmailPending({ ticket: social.value });
      setRestored(true);
      return;
    }
    if (social?.kind === 'linked') {
      setSocialNotice(tpl(messages.community?.socialLinkedSuccess ?? '', { provider: social.value }));
    }
    if (social?.kind === 'error') {
      setError(describeError(new ApiError(social.value, social.value), messages.community));
    }
    // Restore a stored session once on mount; drop it if the server rejects it.
    const stored = loadCommunityToken();
    if (!stored) {
      setRestored(true);
      return;
    }
    restore(stored);
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
        await emailRegister(email, password, await turnstileToken());
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
        await emailResend(email, await turnstileToken());
      } catch (e) {
        setError(describeError(e, messages.community));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [messages],
  );

  const emailRequestReset = useCallback(
    async (email: string) => {
      setBusy(true);
      setError('');
      try {
        await emailResetRequest(email, await turnstileToken());
      } catch (e) {
        setError(describeError(e, messages.community));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [messages],
  );

  const emailConfirmReset = useCallback(
    async (email: string, resetToken: string, password: string) => {
      setBusy(true);
      setError('');
      try {
        await emailResetConfirm(email, resetToken, password);
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

  const socialEmailRequest = useCallback(
    async (email: string) => {
      if (!socialEmailPending) return;
      setBusy(true);
      setError('');
      try {
        await requestSocialEmailCode(socialEmailPending.ticket, email);
      } catch (e) {
        if (e instanceof ApiError && e.code === 'social_pending_expired') setSocialEmailPending(null);
        setError(describeError(e, messages.community));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [socialEmailPending, messages],
  );

  const socialEmailConfirm = useCallback(
    async (code: string) => {
      if (!socialEmailPending) return;
      setBusy(true);
      setError('');
      try {
        const v = await confirmSocialEmailCode(socialEmailPending.ticket, code);
        setSocialEmailPending(null);
        if (v.totpTicket) {
          setTotpPending({ ticket: v.totpTicket });
        } else {
          saveCommunityToken(v.token);
          setToken(v.token);
          setAccount(v.account);
          setIsOperator(v.isOperator === true);
        }
      } catch (e) {
        if (e instanceof ApiError && (e.code === 'social_pending_expired' || e.code === 'social_email_in_use')) setSocialEmailPending(null);
        setError(describeError(e, messages.community));
      } finally {
        setBusy(false);
      }
    },
    [socialEmailPending, messages],
  );

  const cancelFarcaster = useCallback(() => {
    farcasterRun.current += 1;
    setFarcasterLink(null);
    setBusy(false);
  }, []);

  const runFarcaster = useCallback(
    async (
      getNonce: () => Promise<{ nonce: string; domain: string; siweUri: string }>,
      onVerified: (v: Awaited<ReturnType<typeof farcasterVerify>>) => void,
    ) => {
      const run = ++farcasterRun.current;
      setBusy(true);
      setError('');
      try {
        const { nonce, domain, siweUri } = await getNonce();
        const { channelToken, url } = await farcasterCreateChannel(nonce, domain, siweUri);
        if (run !== farcasterRun.current) return;
        setFarcasterLink(url);
        const deadline = Date.now() + 5 * 60 * 1000;
        while (Date.now() < deadline && run === farcasterRun.current) {
          await new Promise((r) => setTimeout(r, 2000));
          if (run !== farcasterRun.current) return;
          const st = await farcasterChannelStatus(channelToken);
          if (st.state === 'error') throw new ApiError('Farcaster relay unavailable', 'social_exchange_failed');
          if (st.state === 'completed' && st.message && st.signature) {
            const v = await farcasterVerify(nonce, st.message, st.signature);
            setFarcasterLink(null);
            onVerified(v);
            return;
          }
        }
        if (run === farcasterRun.current) throw new ApiError('sign-in expired', 'social_flow_expired');
      } catch (e) {
        if (run === farcasterRun.current) {
          setFarcasterLink(null);
          setError(describeError(e, messages.community));
        }
      } finally {
        if (run === farcasterRun.current) setBusy(false);
      }
    },
    [messages],
  );

  const startFarcaster = useCallback(async () => {
    const t = await turnstileToken().catch(() => undefined);
    await runFarcaster(
      () => farcasterNonce(t),
      (v) => {
        if (v.socialEmailTicket) setSocialEmailPending({ ticket: v.socialEmailTicket });
        else if (v.totpTicket) setTotpPending({ ticket: v.totpTicket });
        else if (v.token && v.account) {
          saveCommunityToken(v.token);
          setToken(v.token);
          setAccount(v.account);
          setIsOperator(v.isOperator === true);
        }
      },
    );
  }, [runFarcaster]);

  const startFarcasterLink = useCallback(
    async (proof: { password?: string; signature?: string }) => {
      await runFarcaster(
        () => farcasterLinkNonce(token, proof),
        () => setSocialNotice(tpl(messages.community?.socialLinkedSuccess ?? '', { provider: 'Farcaster' })),
      );
    },
    [runFarcaster, token, messages],
  );

  const startSocialSignIn = useCallback(
    async (provider: string, registrationMethod?: 'phone') => {
      if (provider === 'farcaster') return startFarcaster();
      setBusy(true);
      setError('');
      try {
        const t = await turnstileToken();
        const params = new URLSearchParams();
        if (t) params.set('turnstileToken', t);
        if (provider === 'telegram' && registrationMethod === 'phone') params.set('registration', 'phone');
        const q = params.size ? `?${params}` : '';
        // Top-level navigation: the backend validates the bot check, starts
        // the OIDC flow and 302s to the provider. busy stays set - the page
        // is leaving.
        window.location.assign(`/api/auth/social/${encodeURIComponent(provider)}/start${q}`);
      } catch (e) {
        setError(describeError(e, messages.community));
        setBusy(false);
      }
    },
    [messages, startFarcaster],
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
      setSocialEmailPending(null);
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
      emailRequestReset,
      emailConfirmReset,
      signOut,
      totpPending,
      completeTotp,
      socialEmailPending,
      socialEmailRequest,
      socialEmailConfirm,
      farcasterLink,
      cancelFarcaster,
      startFarcasterLink,
      socialProviders,
      socialValidationActive: validationProviders.length > 0,
      enableSocialValidation,
      disableSocialValidation,
      startSocialSignIn,
      socialNotice,
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
      emailRequestReset,
      emailConfirmReset,
      signOut,
      setName,
      totpPending,
      completeTotp,
      socialEmailPending,
      socialEmailRequest,
      socialEmailConfirm,
      farcasterLink,
      cancelFarcaster,
      startFarcasterLink,
      socialProviders,
      validationProviders,
      enableSocialValidation,
      disableSocialValidation,
      startSocialSignIn,
      socialNotice,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommunityAuth(): CommunityAuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCommunityAuth must be used within CommunityAuthProvider');
  return v;
}
