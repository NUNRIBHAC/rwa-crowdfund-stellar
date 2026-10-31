// Community sign-in state: wallet challenge-response authentication.
// Separate from the Freighter "actor" used for escrow transactions: an actor
// is a read-only wallet address, while a community session is a signed
// challenge proving key control, exchanged for a 30-day bearer token.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { isConnected, signMessage } from '@stellar/freighter-api';
import type { CommunityAccount } from './api';
import { fetchMe, loadCommunityToken, logout, requestChallenge, saveCommunityToken, updateDisplayName, verifyChallenge } from './api';

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
  signOut: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  clearError: () => void;
};

const Ctx = createContext<CommunityAuthState | null>(null);

type Messages = {
  freighterMissing: string;
  walletNoSign: string;
};

export function CommunityAuthProvider({ children, messages }: { children: ReactNode; messages: Messages }) {
  const [account, setAccount] = useState<CommunityAccount | null>(null);
  const [token, setToken] = useState('');
  const [isOperator, setIsOperator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);

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
  }, []);

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
        saveCommunityToken(v.token);
        setToken(v.token);
        setAccount(v.account);
        setIsOperator(v.isOperator === true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [messages],
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
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [token],
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
      signOut,
      setDisplayName: setName,
      clearError: () => setError(''),
    }),
    [account, token, isOperator, busy, error, restored, signIn, signOut, setName],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommunityAuth(): CommunityAuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCommunityAuth must be used within CommunityAuthProvider');
  return v;
}
