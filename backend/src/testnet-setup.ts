import { Account, Asset, Keypair, Networks, Operation, StrKey, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';

// No key creation or custody. Every transaction is signed by the user's wallet.
export const TEST_USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
export const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';
export type TestnetSetupConfig = { enabled: boolean; network: string; horizon: string; issuer: string };
export type SetupBalance = { asset_type: string; balance: string; asset_code?: string; asset_issuer?: string };
export type SetupAccount = { sequence: string; balances: SetupBalance[] };
export type SetupPorts = {
  // null means confirmed HTTP404, never a transport failure.
  loadAccount: (address: string) => Promise<SetupAccount | null>;
  fundXlm: (address: string) => Promise<void>;
  submit: (transaction: Transaction) => Promise<{ hash: string }>;
  now?: () => number;
};
export class TestnetSetupError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
function fail(code: string): never {
  throw new TestnetSetupError(code);
}
export function assertTestnetSetup(config: TestnetSetupConfig, address: string): void {
  if (!config.enabled || config.network !== 'testnet' || config.horizon !== TESTNET_HORIZON || config.issuer !== TEST_USDC_ISSUER) {
    fail('TESTNET_SETUP_DISABLED');
  }
  if (!StrKey.isValidEd25519PublicKey(address)) fail('TESTNET_ADDRESS_INVALID');
}

export function createTestnetSetup(config: TestnetSetupConfig, ports: SetupPorts) {
  const now = () => Math.floor((ports.now?.() ?? Date.now()) / 1000);
  async function load(address: string) {
    assertTestnetSetup(config, address);
    try {
      return await ports.loadAccount(address);
    } catch {
      return fail('TESTNET_UPSTREAM_UNAVAILABLE');
    }
  }
  async function status(address: string) {
    const account = await load(address);
    const usdc = account?.balances.find((b) => b.asset_type === 'credit_alphanum4' && b.asset_code === 'USDC' && b.asset_issuer === TEST_USDC_ISSUER);
    return {
      address,
      network: 'testnet' as const,
      productionEligible: false as const,
      accountExists: account !== null,
      xlm: account?.balances.find((b) => b.asset_type === 'native')?.balance ?? '0',
      trustline: !!usdc,
      usdc: usdc?.balance ?? '0',
      issuer: TEST_USDC_ISSUER,
    };
  }
  async function fundXlm(address: string) {
    // A failed read must never be mistaken for a missing account.
    const account = await load(address);
    if (account) return status(address);
    try {
      await ports.fundXlm(address);
    } catch {
      return fail('TESTNET_FAUCET_UNAVAILABLE');
    }
    const result = await status(address);
    if (!result.accountExists) fail('TESTNET_FUNDING_UNCONFIRMED');
    return result;
  }
  async function buildTrustline(address: string) {
    const account = await load(address);
    if (!account) fail('TESTNET_ACCOUNT_MISSING');
    if (account.balances.some((b) => b.asset_type === 'credit_alphanum4' && b.asset_code === 'USDC' && b.asset_issuer === TEST_USDC_ISSUER))
      fail('TESTNET_TRUSTLINE_EXISTS');
    const transaction = new TransactionBuilder(new Account(address, account.sequence), { fee: '100', networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.changeTrust({ asset: new Asset('USDC', TEST_USDC_ISSUER), limit: '1000' }))
      .setTimebounds(0, now() + 180)
      .build();
    return { address, network: 'testnet' as const, xdr: transaction.toXDR(), hash: Buffer.from(transaction.hash()).toString('hex') };
  }
  async function submitTrustline(address: string, signedXdr: string) {
    assertTestnetSetup(config, address);
    if (typeof signedXdr !== 'string' || signedXdr.length > 8192) fail('TESTNET_TRANSACTION_INVALID');
    let tx: Transaction;
    try {
      const parsed = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
      if (!(parsed instanceof Transaction)) fail('TESTNET_TRANSACTION_INVALID');
      tx = parsed;
    } catch {
      return fail('TESTNET_TRANSACTION_INVALID');
    }
    const op = tx.operations[0];
    if (
      tx.source !== address ||
      tx.operations.length !== 1 ||
      op.type !== 'changeTrust' ||
      (op.source !== undefined && op.source !== address) ||
      !('getCode' in op.line) ||
      op.line.getCode() !== 'USDC' ||
      op.line.getIssuer() !== TEST_USDC_ISSUER ||
      op.limit !== '1000.0000000' ||
      tx.memo.type !== 'none' ||
      BigInt(tx.fee) > 1000n ||
      !tx.timeBounds ||
      Number(tx.timeBounds.minTime) > now() ||
      Number(tx.timeBounds.maxTime) <= now() ||
      Number(tx.timeBounds.maxTime) > now() + 180 ||
      tx.signatures.length !== 1
    )
      fail('TESTNET_TRANSACTION_INVALID');
    // Validate actual signature, not only the envelope's claimed source.
    try {
      if (!Keypair.fromPublicKey(address).verify(tx.hash(), tx.signatures[0].signature)) fail('TESTNET_TRANSACTION_INVALID');
    } catch {
      return fail('TESTNET_TRANSACTION_INVALID');
    }
    const account = await load(address);
    if (!account) fail('TESTNET_ACCOUNT_MISSING');
    if (BigInt(tx.sequence) !== BigInt(account.sequence) + 1n) fail('TESTNET_TRANSACTION_STALE');
    try {
      const result = await ports.submit(tx);
      if (result.hash !== Buffer.from(tx.hash()).toString('hex')) fail('TESTNET_SUBMISSION_UNCONFIRMED');
      return { hash: result.hash, network: 'testnet' as const, productionEligible: false as const };
    } catch (error) {
      if (error instanceof TestnetSetupError) throw error;
      return fail('TESTNET_SUBMISSION_UNCONFIRMED');
    }
  }
  return { status, fundXlm, buildTrustline, submitTrustline };
}
