import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Account, Asset, Keypair, Memo, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { createTestnetSetup, TEST_USDC_ISSUER, TESTNET_HORIZON, TestnetSetupError, type SetupAccount, type TestnetSetupConfig } from '../src/testnet-setup.js';

// Public deterministic test fixtures only. Never used on a network.
const wallet = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 1));
const other = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 2));
const address = wallet.publicKey();
const config: TestnetSetupConfig = { enabled: true, network: 'testnet', horizon: TESTNET_HORIZON, issuer: TEST_USDC_ISSUER };
const seconds = 1800000000;
function fixture(overrides: Partial<TestnetSetupConfig> = {}) {
  let account: SetupAccount | null = { sequence: '4', balances: [{ asset_type: 'native', balance: '10000.0000000' }] };
  let reads = 0;
  let funded = 0;
  let submitted = 0;
  let readFailure = false;
  let fundFailure = false;
  let submitFailure = false;
  let confirmFunding = true;
  let wrongHash = false;
  const service = createTestnetSetup(
    { ...config, ...overrides },
    {
      now: () => seconds * 1000,
      loadAccount: async () => {
        reads++;
        if (readFailure) throw new Error('private upstream detail');
        return account;
      },
      fundXlm: async () => {
        funded++;
        if (fundFailure) throw new Error('private faucet detail');
        if (confirmFunding) account = { sequence: '4', balances: [{ asset_type: 'native', balance: '10000' }] };
      },
      submit: async (tx) => {
        submitted++;
        if (submitFailure) throw new Error('private submit detail');
        return { hash: wrongHash ? 'bad' : Buffer.from(tx.hash()).toString('hex') };
      },
    },
  );
  return {
    service,
    setAccount: (a: SetupAccount | null) => {
      account = a;
    },
    counters: () => ({ reads, funded, submitted }),
    readFailure: () => {
      readFailure = true;
    },
    fundFailure: () => {
      fundFailure = true;
    },
    submitFailure: () => {
      submitFailure = true;
    },
    unconfirmed: () => {
      confirmFunding = false;
    },
    wrongHash: () => {
      wrongHash = true;
    },
  };
}
function code(expected: string) {
  return (e: unknown) => e instanceof TestnetSetupError && e.code === expected && e.message === expected;
}
for (const [name, overrides] of Object.entries({
  disabled: { enabled: false },
  public: { network: 'public' },
  typo: { network: 'Testnet' },
  local: { horizon: 'http://localhost' },
  mainnet: { horizon: 'https://horizon.stellar.org' },
  alternate: { horizon: TESTNET_HORIZON + '/' },
  issuer: { issuer: other.publicKey() },
})) {
  test(`fails closed before I/O: ${name}`, async () => {
    const f = fixture(overrides);
    await assert.rejects(f.service.status(address), code('TESTNET_SETUP_DISABLED'));
    assert.deepEqual(f.counters(), { reads: 0, funded: 0, submitted: 0 });
  });
}
test('rejects malformed, secret and contract addresses before reads', async () => {
  const f = fixture();
  for (const a of ['', 'G'.repeat(56), 'S'.repeat(56), 'C'.repeat(56), address.toLowerCase()])
    await assert.rejects(f.service.status(a), code('TESTNET_ADDRESS_INVALID'));
  assert.equal(f.counters().reads, 0);
});
test('status distinguishes confirmed absence and never funds', async () => {
  const f = fixture();
  f.setAccount(null);
  assert.deepEqual(await f.service.status(address), {
    address,
    network: 'testnet',
    productionEligible: false,
    accountExists: false,
    xlm: '0',
    trustline: false,
    usdc: '0',
    issuer: TEST_USDC_ISSUER,
  });
  assert.equal(f.counters().funded, 0);
});
test('balance requires exact code, issuer and credit type', async () => {
  const f = fixture();
  f.setAccount({
    sequence: '4',
    balances: [
      { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: other.publicKey(), balance: '999' },
      { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: TEST_USDC_ISSUER, balance: '20.0000000' },
    ],
  });
  const s = await f.service.status(address);
  assert.equal(s.usdc, '20.0000000');
  assert.equal(s.trustline, true);
});
test('read failure is not absence and cannot trigger funding', async () => {
  const f = fixture();
  f.readFailure();
  await assert.rejects(f.service.fundXlm(address), code('TESTNET_UPSTREAM_UNAVAILABLE'));
  assert.equal(f.counters().funded, 0);
});
test('funding an existing account does not call faucet', async () => {
  const f = fixture();
  assert.equal((await f.service.fundXlm(address)).accountExists, true);
  assert.equal(f.counters().funded, 0);
});
test('funding missing account must be confirmed by fresh read', async () => {
  const f = fixture();
  f.setAccount(null);
  assert.equal((await f.service.fundXlm(address)).accountExists, true);
  assert.equal(f.counters().funded, 1);
  assert.equal(f.counters().reads, 2);
});
test('faucet failure is safe code only', async () => {
  const f = fixture();
  f.setAccount(null);
  f.fundFailure();
  await assert.rejects(f.service.fundXlm(address), code('TESTNET_FAUCET_UNAVAILABLE'));
});
test('faucet response alone is not success', async () => {
  const f = fixture();
  f.setAccount(null);
  f.unconfirmed();
  await assert.rejects(f.service.fundXlm(address), code('TESTNET_FUNDING_UNCONFIRMED'));
});
test('trustline build requires funded account and no existing exact trustline', async () => {
  const f = fixture();
  f.setAccount(null);
  await assert.rejects(f.service.buildTrustline(address), code('TESTNET_ACCOUNT_MISSING'));
  f.setAccount({ sequence: '4', balances: [{ asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: TEST_USDC_ISSUER, balance: '0' }] });
  await assert.rejects(f.service.buildTrustline(address), code('TESTNET_TRUSTLINE_EXISTS'));
});
test('build returns unsigned testnet transaction with one bounded trustline and expiry', async () => {
  const f = fixture();
  const result = await f.service.buildTrustline(address);
  const tx = TransactionBuilder.fromXDR(result.xdr, Networks.TESTNET);
  assert.ok('operations' in tx);
  assert.equal(tx.signatures.length, 0);
  assert.equal(tx.operations.length, 1);
  assert.equal(tx.operations[0].type, 'changeTrust');
  assert.equal(tx.timeBounds?.maxTime, String(seconds + 180));
  assert.equal(Buffer.from(tx.hash()).toString('hex'), result.hash);
  assert.equal(f.counters().submitted, 0);
});
test('valid signed trustline is submitted and exact hash confirmed', async () => {
  const f = fixture();
  const result = await f.service.buildTrustline(address);
  const tx = TransactionBuilder.fromXDR(result.xdr, Networks.TESTNET);
  tx.sign(wallet);
  const out = await f.service.submitTrustline(address, tx.toXDR());
  assert.equal(out.hash, result.hash);
  assert.equal(f.counters().submitted, 1);
});
function transaction(
  options: {
    source?: string;
    sequence?: string;
    issuer?: string;
    asset?: string;
    limit?: string;
    fee?: string;
    min?: number;
    max?: number;
    memo?: boolean;
    payment?: boolean;
    extra?: boolean;
    signer?: Keypair | null;
    passphrase?: string;
    opSource?: string;
  } = {},
) {
  const b = new TransactionBuilder(new Account(options.source ?? address, options.sequence ?? '4'), {
    fee: options.fee ?? '100',
    networkPassphrase: options.passphrase ?? Networks.TESTNET,
  });
  b.addOperation(
    options.payment
      ? Operation.payment({ destination: other.publicKey(), asset: Asset.native(), amount: '1' })
      : Operation.changeTrust({
          asset: new Asset(options.asset ?? 'USDC', options.issuer ?? TEST_USDC_ISSUER),
          limit: options.limit ?? '1000',
          ...(options.opSource ? { source: options.opSource } : {}),
        }),
  );
  if (options.extra) b.addOperation(Operation.manageData({ name: 'x', value: 'y' }));
  if (options.memo) b.addMemo(Memo.text('unexpected'));
  b.setTimebounds(options.min ?? 0, options.max ?? seconds + 180);
  const tx = b.build();
  if (options.signer !== null) tx.sign(options.signer ?? wallet);
  return tx;
}
for (const [name, options] of Object.entries({
  unsigned: { signer: null },
  wrongSigner: { signer: other },
  mainnetSignature: { passphrase: Networks.PUBLIC },
  source: { source: other.publicKey(), signer: other },
  payment: { payment: true },
  extra: { extra: true },
  asset: { asset: 'EURC' },
  issuer: { issuer: other.publicKey() },
  unlimited: { limit: '2000' },
  memo: { memo: true },
  fee: { fee: '1001' },
  expired: { max: seconds },
  future: { min: seconds + 10 },
  longLived: { max: seconds + 181 },
  opSource: { opSource: other.publicKey() },
})) {
  test(`rejects altered envelope before submission: ${name}`, async () => {
    const f = fixture();
    await assert.rejects(f.service.submitTrustline(address, transaction(options).toXDR()), code('TESTNET_TRANSACTION_INVALID'));
    assert.equal(f.counters().submitted, 0);
  });
}
test('rejects malformed or oversized XDR', async () => {
  const f = fixture();
  for (const xdr of ['', 'not-xdr', 'a'.repeat(8193)]) await assert.rejects(f.service.submitTrustline(address, xdr), code('TESTNET_TRANSACTION_INVALID'));
});
test('rejects stale sequence and missing source account', async () => {
  const f = fixture();
  await assert.rejects(f.service.submitTrustline(address, transaction({ sequence: '3' }).toXDR()), code('TESTNET_TRANSACTION_STALE'));
  f.setAccount(null);
  await assert.rejects(f.service.submitTrustline(address, transaction().toXDR()), code('TESTNET_ACCOUNT_MISSING'));
  assert.equal(f.counters().submitted, 0);
});
test('unverifiable submit outcome is not completion', async () => {
  for (const mode of ['failure', 'hash']) {
    const f = fixture();
    if (mode === 'failure') f.submitFailure();
    else f.wrongHash();
    await assert.rejects(f.service.submitTrustline(address, transaction().toXDR()), code('TESTNET_SUBMISSION_UNCONFIRMED'));
  }
});
