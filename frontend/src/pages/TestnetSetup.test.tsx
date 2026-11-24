// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import TestnetSetup, { decodeSetupStatus, hasPendingContribution } from './TestnetSetup';
import { en } from '../i18n/locales/en';
const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  signTransaction: vi.fn(),
}));
vi.mock('../api', () => ({ api: mocks.api }));
vi.mock('@stellar/freighter-api', () => mocks);
vi.mock('../i18n', () => ({ useI18n: () => ({ m: en, locale: 'en' }) }));
const address = 'G' + 'A'.repeat(55);
const other = 'G' + 'B'.repeat(55);
const issuer = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const passphrase = 'Test SDF Network ; September 2015';
const t = en.testnetSetup;
let state = () => ({ address, network: 'testnet', productionEligible: false, accountExists: false, xlm: '0', trustline: false, usdc: '0', issuer });
beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  state = () => ({ address, network: 'testnet', productionEligible: false, accountExists: false, xlm: '0', trustline: false, usdc: '0', issuer });
  mocks.isConnected.mockResolvedValue({ isConnected: true });
  mocks.getNetwork.mockResolvedValue({ network: 'TESTNET', networkPassphrase: passphrase });
  mocks.getAddress.mockResolvedValue({ address });
  mocks.requestAccess.mockResolvedValue({ address });
  mocks.signTransaction.mockResolvedValue({ signedTxXdr: 'signed', signerAddress: address });
  mocks.api.mockImplementation(async (path: string) =>
    path.endsWith('/build')
      ? { address, network: 'testnet', xdr: 'unsigned', hash: 'a'.repeat(64) }
      : path.endsWith('/submit')
        ? { hash: 'a'.repeat(64), network: 'testnet', productionEligible: false }
        : state(),
  );
});
afterEach(cleanup);
function setup() {
  const onWallet = vi.fn();
  const view = render(<TestnetSetup actor="" onWallet={onWallet} />);
  return { ...view, onWallet };
}
async function connect() {
  fireEvent.click(screen.getByRole('button', { name: t.connect }));
  await waitFor(() => expect((screen.getByRole('button', { name: t.check }) as HTMLButtonElement).disabled).toBe(false));
}
test('nothing contacts a wallet or API on page load and no key field exists', () => {
  setup();
  expect(mocks.api).not.toHaveBeenCalled();
  expect(mocks.requestAccess).not.toHaveBeenCalled();
  expect(document.querySelectorAll('input,textarea')).toHaveLength(0);
  expect(screen.getByText(t.walletHelp)).toBeTruthy();
  expect(screen.getByRole('link', { name: t.faucet }).getAttribute('href')).toBe('https://faucet.circle.com');
});
test('connect verifies selected account and testnet before status', async () => {
  const view = setup();
  await connect();
  expect(view.onWallet).toHaveBeenCalledWith(address);
  expect(mocks.api).toHaveBeenCalledExactlyOnceWith('/api/testnet-setup/status', { actor: address });
  expect(screen.getByText(address)).toBeTruthy();
  expect(mocks.signTransaction).not.toHaveBeenCalled();
});
test('no extension fails before requesting approval', async () => {
  mocks.isConnected.mockResolvedValue({ isConnected: false });
  setup();
  fireEvent.click(screen.getByRole('button', { name: t.connect }));
  await screen.findByRole('alert');
  expect(screen.getByRole('alert').textContent).toBe(en.errors.freighterMissing);
  expect(mocks.requestAccess).not.toHaveBeenCalled();
});
test('mainnet blocks before access request and all API effects', async () => {
  mocks.getNetwork.mockResolvedValue({ networkPassphrase: 'Public Global Stellar Network ; September 2015' });
  setup();
  fireEvent.click(screen.getByRole('button', { name: t.connect }));
  await screen.findByText(t.networkError);
  expect(mocks.requestAccess).not.toHaveBeenCalled();
  expect(mocks.api).not.toHaveBeenCalled();
});
test('wallet approval rejection is localized', async () => {
  mocks.requestAccess.mockResolvedValue({ error: { message: 'PRIVATE DIAGNOSTIC' } });
  setup();
  fireEvent.click(screen.getByRole('button', { name: t.connect }));
  await screen.findByText(t.rejectedError);
  expect(document.body.textContent).not.toContain('PRIVATE DIAGNOSTIC');
});
test('funding missing account is user initiated and freshly verified', async () => {
  setup();
  await connect();
  mocks.api.mockImplementation(async () => ({ ...state(), accountExists: true, xlm: '10000' }));
  fireEvent.click(screen.getByRole('button', { name: t.fund }));
  await waitFor(() => expect(screen.getByText('10000 XLM')).toBeTruthy());
  expect(mocks.api).toHaveBeenCalledWith('/api/testnet-setup/fund-xlm', { actor: address });
});
test('existing funded account disables XLM request', async () => {
  mocks.api.mockResolvedValue({ ...state(), accountExists: true, xlm: '10000' });
  setup();
  await connect();
  expect((screen.getByRole('button', { name: t.fund }) as HTMLButtonElement).disabled).toBe(true);
});
test('unfunded account cannot sign trustline', async () => {
  setup();
  await connect();
  expect((screen.getByRole('button', { name: t.sign }) as HTMLButtonElement).disabled).toBe(true);
});
test('trustline signing uses exact account and testnet and refreshes after submit', async () => {
  state = () => ({ address, network: 'testnet', productionEligible: false, accountExists: true, xlm: '10000', trustline: false, usdc: '0', issuer });
  setup();
  await connect();
  fireEvent.click(screen.getByRole('button', { name: t.sign }));
  await waitFor(() => expect(mocks.api).toHaveBeenCalledWith('/api/testnet-setup/trustline/submit', { actor: address, xdr: 'signed' }));
  await waitFor(() => expect((screen.getByRole('button', { name: t.check }) as HTMLButtonElement).disabled).toBe(false));
  expect(mocks.signTransaction).toHaveBeenCalledWith('unsigned', { address, networkPassphrase: passphrase });
  expect(mocks.api.mock.calls.filter(([p]) => p === '/api/testnet-setup/status')).toHaveLength(2);
});
test('wrong wallet after signing never submits', async () => {
  mocks.api.mockResolvedValue({ ...state(), accountExists: true, xlm: '10000' });
  setup();
  await connect();
  mocks.api.mockImplementation(async () => ({ address, network: 'testnet', xdr: 'unsigned', hash: 'a'.repeat(64) }));
  mocks.signTransaction.mockImplementation(async () => {
    mocks.getAddress.mockResolvedValue({ address: other });
    return { signerAddress: address, signedTxXdr: 'signed' };
  });
  fireEvent.click(screen.getByRole('button', { name: t.sign }));
  await screen.findByText(t.changedError);
  expect(mocks.api.mock.calls.some(([p]) => p.endsWith('/submit'))).toBe(false);
});
test('account changed before funding never calls funding endpoint', async () => {
  setup();
  await connect();
  mocks.getAddress.mockResolvedValue({ address: other });
  fireEvent.click(screen.getByRole('button', { name: t.fund }));
  await screen.findByText(t.changedError);
  expect(mocks.api.mock.calls.some(([p]) => p.endsWith('/fund-xlm'))).toBe(false);
});
test('network change before funding never calls funding endpoint', async () => {
  setup();
  await connect();
  mocks.getNetwork.mockResolvedValue({ networkPassphrase: 'public' });
  fireEvent.click(screen.getByRole('button', { name: t.fund }));
  await screen.findByText(t.networkError);
  expect(mocks.api.mock.calls.some(([p]) => p.endsWith('/fund-xlm'))).toBe(false);
});
test('saved unresolved intent disables setup without deleting it', () => {
  localStorage.setItem('rwa-soroban-intent', JSON.stringify({ status: 'SIGNED', signedXdr: 'preserved' }));
  setup();
  expect(screen.getByText(t.intentError)).toBeTruthy();
  expect((screen.getByRole('button', { name: t.connect }) as HTMLButtonElement).disabled).toBe(true);
  expect(localStorage.getItem('rwa-soroban-intent')).toContain('preserved');
});
test('intent appearing after render blocks writes before wallet access', async () => {
  setup();
  localStorage.setItem('rwa-soroban-intent', JSON.stringify({ status: 'BUILT' }));
  fireEvent.click(screen.getByRole('button', { name: t.connect }));
  await waitFor(() => expect(screen.getAllByText(t.intentError).length).toBeGreaterThan(0));
  expect(mocks.isConnected).not.toHaveBeenCalled();
});
test('terminal intent allows reads but malformed intent fails closed', () => {
  for (const status of ['SUCCESS', 'FAILED', 'CANCELLED_UNSIGNED']) {
    localStorage.setItem('rwa-soroban-intent', JSON.stringify({ status }));
    expect(hasPendingContribution()).toBe(false);
  }
  for (const raw of ['null', '{}', '{', '[]']) {
    localStorage.setItem('rwa-soroban-intent', raw);
    expect(hasPendingContribution()).toBe(true);
  }
});
test('server errors and unknown diagnostics never render raw text', async () => {
  mocks.api.mockRejectedValue({ code: 'TESTNET_SETUP_DISABLED', message: 'private details' });
  setup();
  fireEvent.click(screen.getByRole('button', { name: t.connect }));
  await screen.findByText(t.disabledError);
  expect(document.body.textContent).not.toContain('private details');
});
test('unknown error has visible localized fallback', async () => {
  mocks.api.mockRejectedValue(new Error('private details'));
  setup();
  fireEvent.click(screen.getByRole('button', { name: t.connect }));
  await screen.findByText(t.failureError);
  expect(document.body.textContent).not.toContain('private details');
});
test('uncertain funding disables repeat and requires manual check', async () => {
  setup();
  await connect();
  mocks.api.mockRejectedValue(new Error('network'));
  fireEvent.click(screen.getByRole('button', { name: t.fund }));
  await screen.findByText(t.uncertain);
  expect((screen.getByRole('button', { name: t.fund }) as HTMLButtonElement).disabled).toBe(true);
  expect(mocks.api.mock.calls.filter(([p]) => p.endsWith('/fund-xlm'))).toHaveLength(1);
});
test('existing trustline disables repeat signature', async () => {
  mocks.api.mockResolvedValue({ ...state(), accountExists: true, trustline: true });
  setup();
  await connect();
  expect((screen.getByRole('button', { name: t.sign }) as HTMLButtonElement).disabled).toBe(true);
});
test('ready assets do not make a contribution or promise campaign availability', async () => {
  mocks.api.mockResolvedValue({ ...state(), accountExists: true, trustline: true, xlm: '10000', usdc: '20' });
  setup();
  await connect();
  expect(screen.getByText(t.assetsDetected)).toBeTruthy();
  expect(mocks.signTransaction).not.toHaveBeenCalled();
  expect(mocks.api.mock.calls.some(([p]) => p.includes('/campaigns/'))).toBe(false);
});
test('decode refuses mismatched actor, issuer, network, units and eligibility', () => {
  for (const override of [
    { address: other },
    { issuer: other },
    { network: 'public' },
    { productionEligible: true },
    { usdc: '-1' },
    { xlm: 'NaN' },
    { trustline: 'true' },
  ])
    expect(() => decodeSetupStatus({ ...state(), ...override }, address)).toThrow();
});
test('global actor change clears stale status', async () => {
  const view = setup();
  await connect();
  view.rerender(<TestnetSetup actor={other} onWallet={view.onWallet} />);
  await screen.findByText(t.changedError);
  expect((screen.getByRole('button', { name: t.fund }) as HTMLButtonElement).disabled).toBe(true);
});
