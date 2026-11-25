import { useEffect, useRef, useState } from 'react';
import { getAddress, getNetwork, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import { api } from '../api';
import { useI18n } from '../i18n';
import { isTerminal } from '../types';
import { routePath } from '../router';

const PASSPHRASE = 'Test SDF Network ; September 2015';
type SetupStatus = {
  address: string;
  network: 'testnet';
  productionEligible: false;
  accountExists: boolean;
  xlm: string;
  trustline: boolean;
  usdc: string;
  issuer: string;
};
const ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
export function hasPendingContribution(): boolean {
  try {
    const raw = localStorage.getItem('rwa-soroban-intent');
    if (!raw) return false;
    const value = JSON.parse(raw);
    return !value || typeof value.status !== 'string' || !isTerminal(value.status);
  } catch {
    return true;
  }
}
export function decodeSetupStatus(value: unknown, address: string): SetupStatus {
  if (!value || typeof value !== 'object') throw new Error('TESTNET_UPSTREAM_UNAVAILABLE');
  const s = value as SetupStatus;
  if (
    s.address !== address ||
    s.network !== 'testnet' ||
    s.productionEligible !== false ||
    s.issuer !== ISSUER ||
    typeof s.accountExists !== 'boolean' ||
    typeof s.trustline !== 'boolean' ||
    ![s.xlm, s.usdc].every((b) => typeof b === 'string' && /^[0-9]+(?:\.[0-9]{1,7})?$/.test(b))
  )
    throw new Error('TESTNET_UPSTREAM_UNAVAILABLE');
  return s;
}
const positive = (amount: string) => /[1-9]/.test(amount);
export default function TestnetSetup({ actor, onWallet }: { actor: string; onWallet: (address: string) => void }) {
  const { m } = useI18n();
  const t = m.testnetSetup;
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const current = useRef('');
  const running = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      current.current = '';
    };
  }, []);
  useEffect(() => {
    if (current.current && actor !== current.current) {
      current.current = '';
      setAddress('');
      setStatus(null);
      setError('TESTNET_WALLET_CHANGED');
    }
  }, [actor]);
  const blocked = hasPendingContribution();
  async function verify(expected: string) {
    if (hasPendingContribution()) throw new Error('TESTNET_INTENT_PENDING');
    const [network, wallet] = await Promise.all([getNetwork(), getAddress()]);
    if (network.error || network.networkPassphrase !== PASSPHRASE) throw new Error('TESTNET_NETWORK_REQUIRED');
    if (wallet.error || wallet.address !== expected || current.current !== expected || !mounted.current) {
      current.current = '';
      setAddress('');
      setStatus(null);
      throw new Error('TESTNET_WALLET_CHANGED');
    }
  }
  async function read(expected: string) {
    await verify(expected);
    const result = decodeSetupStatus(await api('/api/testnet-setup/status', { actor: expected }), expected);
    await verify(expected);
    setStatus(result);
    setUncertain(false);
  }
  async function run(work: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (e) {
      const code = e && typeof e === 'object' && 'code' in e && typeof e.code === 'string' ? e.code : e instanceof Error ? e.message : '';
      if (mounted.current) setError(code || 'TESTNET_UPSTREAM_UNAVAILABLE');
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function connect() {
    if (hasPendingContribution()) throw new Error('TESTNET_INTENT_PENDING');
    const installed = await isConnected();
    if (!installed.isConnected) throw new Error('TESTNET_WALLET_MISSING');
    const n = await getNetwork();
    if (n.error || n.networkPassphrase !== PASSPHRASE) throw new Error('TESTNET_NETWORK_REQUIRED');
    const wallet = await requestAccess();
    if (!mounted.current) throw new Error('TESTNET_WALLET_CHANGED');
    if (wallet.error || !/^G[A-Z2-7]{55}$/.test(wallet.address ?? '')) throw new Error('TESTNET_WALLET_REJECTED');
    current.current = wallet.address;
    setAddress(wallet.address);
    setStatus(null);
    onWallet(wallet.address);
    await read(wallet.address);
  }
  async function fund() {
    const expected = address;
    await verify(expected);
    // If a previous mutation's outcome is unknown, read first instead of retrying.
    if (uncertain) return read(expected);
    setUncertain(true);
    const result = decodeSetupStatus(await api('/api/testnet-setup/fund-xlm', { actor: expected }), expected);
    await verify(expected);
    setStatus(result);
    setUncertain(false);
  }
  async function trustline() {
    const expected = address;
    await verify(expected);
    if (uncertain) return read(expected);
    const built = await api('/api/testnet-setup/trustline/build', { actor: expected });
    if (built.address !== expected || built.network !== 'testnet' || typeof built.xdr !== 'string' || !/^[a-f0-9]{64}$/.test(built.hash))
      throw new Error('TESTNET_TRANSACTION_INVALID');
    await verify(expected);
    const signed = await signTransaction(built.xdr, { address: expected, networkPassphrase: PASSPHRASE });
    if (signed.error || !signed.signedTxXdr) throw new Error('TESTNET_WALLET_REJECTED');
    if (signed.signerAddress !== expected) throw new Error('TESTNET_WALLET_CHANGED');
    await verify(expected);
    // Never automatically retry submission after a timeout or uncertain response.
    setUncertain(true);
    const submitted = await api('/api/testnet-setup/trustline/submit', { actor: expected, xdr: signed.signedTxXdr });
    if (submitted.hash !== built.hash || submitted.network !== 'testnet' || submitted.productionEligible !== false)
      throw new Error('TESTNET_SUBMISSION_UNCONFIRMED');
    await read(expected);
  }
  const errorText =
    error === 'TESTNET_NETWORK_REQUIRED'
      ? t.networkError
      : error === 'TESTNET_WALLET_CHANGED'
        ? t.changedError
        : error === 'TESTNET_INTENT_PENDING'
          ? t.intentError
          : error === 'TESTNET_SETUP_DISABLED'
            ? t.disabledError
            : error === 'TESTNET_WALLET_MISSING'
              ? m.errors.freighterMissing
              : error === 'TESTNET_WALLET_REJECTED'
                ? t.rejectedError
                : t.failureError;
  const disabled = busy || blocked;
  return (
    <section className="testnet-setup" aria-labelledby="testnet-setup-title">
      <h1 id="testnet-setup-title" className="page-title">
        {t.title}
      </h1>
      <p className="testnet-setup-notice" role="note">
        {t.intro}
      </p>
      <p>{t.historyNote}</p>
      {blocked && (
        <p role="alert" className="error-banner">
          {t.intentError}
        </p>
      )}
      {error && (
        <p role="alert" className="error-banner">
          {errorText}
        </p>
      )}
      {uncertain && <p role="status">{t.uncertain}</p>}
      <ol className="testnet-setup-steps">
        <li>
          <h2>{t.walletTitle}</h2>
          <p>{t.walletHelp}</p>
          <button className="btn" disabled={disabled} onClick={() => run(connect)}>
            {t.connect}
          </button>
          {address && (
            <p className="testnet-setup-address">
              <span>{t.address}</span>
              <code dir="ltr">{address}</code>
            </p>
          )}
        </li>
        <li>
          <h2>{t.xlmTitle}</h2>
          <p>{t.xlmHelp}</p>
          {status && (
            <p>
              <bdi>{status.xlm} XLM</bdi>
            </p>
          )}
          <button className="btn" disabled={disabled || !status || status.accountExists || uncertain} onClick={() => run(fund)}>
            {t.fund}
          </button>
        </li>
        <li>
          <h2>{t.trustlineTitle}</h2>
          <p>{t.trustlineHelp}</p>
          {status && <p>{status.trustline ? t.done : t.notDone}</p>}
          <button className="btn" disabled={disabled || !status?.accountExists || status.trustline || uncertain} onClick={() => run(trustline)}>
            {t.sign}
          </button>
        </li>
        <li>
          <h2>{t.usdcTitle}</h2>
          <p>{t.usdcHelp}</p>
          <a className="btn" href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer">
            {t.faucet}
          </a>
          {status && (
            <p>
              <bdi>{status.usdc} USDC</bdi>
            </p>
          )}
        </li>
      </ol>
      <div className="testnet-setup-actions">
        <button className="btn" disabled={disabled || !address} onClick={() => run(() => read(address))}>
          {busy ? t.busy : t.check}
        </button>
        <a className="btn" href={routePath({ name: 'investments' })}>
          {t.campaigns}
        </a>
      </div>
      {status?.accountExists && status.trustline && positive(status.xlm) && positive(status.usdc) && <p role="status">{t.assetsDetected}</p>}
    </section>
  );
}
