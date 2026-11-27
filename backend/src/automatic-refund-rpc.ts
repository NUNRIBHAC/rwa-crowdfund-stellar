import { proveRefundExpiry } from './automatic-refund-expiry-proof.js';
import type { RefundRecord } from './automatic-refunds.js';
import { createHash } from 'node:crypto';
import { Address, Contract, Transaction, TransactionBuilder, rpc, scValToNative, xdr, StrKey } from '@stellar/stellar-sdk';
import { TESTNET_PASSPHRASE, type RefundChain, type Inspection } from './automatic-refunds.js';
import { verifyRefundEnvelope, verifyUnsignedRefundEnvelope } from './automatic-refund-envelope.js';
import { decodeRefundEvent } from './automatic-refund-event.js';

export type TestnetRefundAdapterOptions = {
  rpcUrl: string;
  payer: string;
  contracts: Readonly<Record<string, { wasmHash: string; token: string; creator: string; goal: bigint; deadline: number }>>;
  maxFeeStroops: bigint;
  // Secret handling stays outside this module. Signer must return final XDR.
  sign: (unsignedXdr: string) => Promise<string>;
  now?: () => number;
};
export type RefundRpc = Pick<
  rpc.Server,
  | 'getNetwork'
  | 'getAccount'
  | 'simulateTransaction'
  | 'getContractWasmByContractId'
  | 'getLatestLedger'
  | 'prepareTransaction'
  | 'sendTransaction'
  | 'getTransaction'
>;
export class TestnetRefundAdapter implements RefundChain {
  private readonly server: RefundRpc;
  private readonly now: () => number;
  constructor(
    private readonly options: TestnetRefundAdapterOptions,
    testServer?: RefundRpc,
  ) {
    const url = new URL(options.rpcUrl);
    // No redirects, credentials or arbitrary RPC hosts in this prototype.
    if (url.origin !== 'https://soroban-testnet.stellar.org' || url.username || url.password || url.search || url.hash || url.pathname !== '/')
      throw new Error('AUTO_REFUND_RPC_NOT_APPROVED');
    if (!StrKey.isValidEd25519PublicKey(options.payer) || options.maxFeeStroops <= 0n) throw new Error('AUTO_REFUND_ADAPTER_POLICY');
    this.options.rpcUrl = url.href;
    const server = new rpc.Server(url.href, { timeout: 15000 });
    server.httpClient.defaults.maxRedirects = 0;
    this.server = testServer ?? server;
    this.now = options.now ?? (() => Math.floor(Date.now() / 1000));
  }
  private async network(): Promise<void> {
    if ((await this.server.getNetwork()).passphrase !== TESTNET_PASSPHRASE) throw new Error('AUTO_REFUND_NETWORK_MISMATCH');
  }
  private async read(campaign: string, method: string, args: xdr.ScVal[] = []): Promise<unknown> {
    const account = await this.server.getAccount(this.options.payer);
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: TESTNET_PASSPHRASE })
      .addOperation(new Contract(campaign).call(method, ...args))
      .setTimeout(60)
      .build();
    const result = await this.server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(result) || rpc.Api.isSimulationRestore(result) || !result.result || result.result.auth.length)
      throw new Error('AUTO_REFUND_READ_FAILED');
    return scValToNative(result.result.retval);
  }
  async inspect(campaign: string, contributor: string): Promise<Inspection> {
    const approved = this.options.contracts[campaign];
    if (!approved || !/^[a-f0-9]{64}$/.test(approved.wasmHash)) throw new Error('AUTO_REFUND_CONTRACT_NOT_APPROVED');
    await this.network();
    const wasm = await this.server.getContractWasmByContractId(campaign);
    const wasmHash = createHash('sha256').update(wasm).digest('hex');
    if (wasmHash !== approved.wasmHash) throw new Error('AUTO_REFUND_WASM_MISMATCH');
    const config = (await this.read(campaign, 'get_config')) as Record<string, unknown>;
    if (
      config.token !== approved.token ||
      config.creator !== approved.creator ||
      config.goal !== approved.goal ||
      config.deadline !== BigInt(approved.deadline)
    )
      throw new Error('AUTO_REFUND_CONFIG_MISMATCH');
    const raised = await this.read(campaign, 'total_raised');
    const balance = await this.read(campaign, 'balance_of', [new Address(contributor).toScVal()]);
    const ledger = await this.server.getLatestLedger();
    const ledgerTimestamp = Number(ledger.closeTime);
    if (typeof raised !== 'bigint' || typeof balance !== 'bigint' || !Number.isSafeInteger(ledgerTimestamp) || Math.abs(this.now() - ledgerTimestamp) > 60)
      throw new Error('AUTO_REFUND_STALE_CHAIN');
    return { networkPassphrase: TESTNET_PASSPHRASE, wasmHash, deadline: approved.deadline, ledgerTimestamp, goal: approved.goal, raised, balance };
  }
  async prepare(campaign: string, contributor: string) {
    const facts = await this.inspect(campaign, contributor);
    if (facts.balance <= 0n || facts.raised >= facts.goal || facts.ledgerTimestamp < facts.deadline) throw new Error('AUTO_REFUND_NOT_ELIGIBLE');
    const account = await this.server.getAccount(this.options.payer);
    const sequence = (BigInt(account.sequenceNumber()) + 1n).toString();
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: TESTNET_PASSPHRASE })
      .addOperation(new Contract(campaign).call('refund_for', new Address(contributor).toScVal()))
      .setTimebounds(this.now(), this.now() + 120)
      .build();
    const prepared = await this.server.prepareTransaction(tx);
    const hash = Buffer.from(prepared.hash()).toString('hex');
    const unsignedXdr = prepared.toXDR();
    // Reject an unexpectedly expensive prepared transaction before requesting
    // any signature, then independently re-decode after the signer responds.
    if (BigInt(prepared.fee) > this.options.maxFeeStroops) throw new Error('AUTO_REFUND_FEE_LIMIT');
    verifyUnsignedRefundEnvelope(unsignedXdr, {
      payer: this.options.payer,
      contract: campaign,
      contributor,
      sequence,
      hash,
      maxFeeStroops: this.options.maxFeeStroops,
      now: this.now(),
      maxLifetimeSeconds: 120,
    });
    const signedXdr = await this.options.sign(unsignedXdr);
    const checked = verifyRefundEnvelope(signedXdr, {
      payer: this.options.payer,
      contract: campaign,
      contributor,
      sequence,
      hash,
      maxFeeStroops: this.options.maxFeeStroops,
      now: this.now(),
      maxLifetimeSeconds: 120,
    });
    return {
      ...checked,
      signedXdr,
      amount: facts.balance,
      contract: campaign,
      recipient: contributor,
      method: 'refund_for',
      networkPassphrase: TESTNET_PASSPHRASE,
    };
  }
  async expiry(record: RefundRecord) {
    return proveRefundExpiry(record, this.options, this.server, this.now());
  }
  async submit(signedXdr: string): Promise<void> {
    await this.network();
    const tx = new Transaction(signedXdr, TESTNET_PASSPHRASE);
    const op = tx.operations[0];
    if (op?.type !== 'invokeHostFunction' || op.func.type !== 'hostFunctionTypeInvokeContract') throw new Error('AUTO_REFUND_RETRY_ENVELOPE');
    const call = op.func.invokeContract;
    const contract = Address.fromScAddress(call.contractAddress).toString();
    if (!this.options.contracts[contract] || call.args.length !== 1) throw new Error('AUTO_REFUND_RETRY_CONTRACT');
    await this.inspect(contract, Address.fromScVal(call.args[0]).toString());
    verifyRefundEnvelope(signedXdr, {
      payer: this.options.payer,
      contract,
      contributor: Address.fromScVal(call.args[0]).toString(),
      sequence: tx.sequence,
      hash: Buffer.from(tx.hash()).toString('hex'),
      maxFeeStroops: this.options.maxFeeStroops,
      now: this.now(),
      maxLifetimeSeconds: 120,
    });
    const result = await this.server.sendTransaction(tx);
    if (!['PENDING', 'DUPLICATE'].includes(result.status) || result.hash !== Buffer.from(tx.hash()).toString('hex'))
      throw new Error('AUTO_REFUND_SEND_UNCERTAIN');
  }
  async status(hash: string): Promise<{
    state: 'pending' | 'not_found' | 'failed' | 'success';
    refundedAmount?: bigint;
    oldestCloseTime?: number;
    oldestLedger?: number;
    latestLedger?: number;
    latestCloseTime?: number;
    source?: string;
  }> {
    await this.network();
    const result = await this.server.getTransaction(hash);
    if (result.txHash !== hash) throw new Error('AUTO_REFUND_STATUS_HASH_MISMATCH');
    if (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      const oldestCloseTime = Number(result.oldestLedgerCloseTime);
      return {
        state: 'not_found',
        source: this.options.rpcUrl,
        oldestLedger: result.oldestLedger,
        latestLedger: result.latestLedger,
        latestCloseTime: Number(result.latestLedgerCloseTime),
        ...(Number.isSafeInteger(oldestCloseTime) && oldestCloseTime > 0 ? { oldestCloseTime } : {}),
      };
    }
    const tx = new Transaction(result.envelopeXdr, TESTNET_PASSPHRASE);
    if (result.feeBump || Buffer.from(tx.hash()).toString('hex') !== hash || tx.source !== this.options.payer || tx.operations.length !== 1)
      throw new Error('AUTO_REFUND_CONFIRMATION_ENVELOPE');
    if (result.status === rpc.Api.GetTransactionStatus.FAILED) return { state: 'failed' };
    if (result.resultXdr.result.type !== 'txSuccess') throw new Error('AUTO_REFUND_CONFIRMATION_RESULT');
    const op = tx.operations[0];
    if (op.type !== 'invokeHostFunction' || op.func.type !== 'hostFunctionTypeInvokeContract') throw new Error('AUTO_REFUND_CONFIRMATION_CALL');
    const call = op.func.invokeContract;
    const contract = Address.fromScAddress(call.contractAddress).toString();
    if (!this.options.contracts[contract] || call.functionName.toString() !== 'refund_for' || call.args.length !== 1)
      throw new Error('AUTO_REFUND_CONFIRMATION_CALL');
    const contributor = Address.fromScVal(call.args[0]).toString();
    const amount = decodeRefundEvent(result.events.contractEventsXdr.flat(), contract, contributor);
    if (!result.returnValue || scValToNative(result.returnValue) !== amount) throw new Error('AUTO_REFUND_CONFIRMATION_RETURN');
    return { state: 'success', refundedAmount: amount };
  }
}
