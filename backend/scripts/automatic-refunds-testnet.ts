import { diagnoseRefundPayer } from '../src/automatic-refund-diagnostics.js';
// Deliberately not wired into npm start/server.ts. One explicit bounded run.
// No secrets in arguments/config: an existing CLI identity signs via stdin.
import { readFile, stat } from 'node:fs/promises';
import { resolve, isAbsolute } from 'node:path';
import { execFile } from 'node:child_process';
import { recoverExpiredRefundForPayer } from '../src/automatic-refund-recovery.js';
import { runRefundBatch } from '../src/automatic-refund-batch.js';
import { TestnetRefundAdapter } from '../src/automatic-refund-rpc.js';
import { FileRefundStore } from '../src/automatic-refund-store.js';
import { TESTNET_PASSPHRASE } from '../src/automatic-refunds.js';
import { pathToFileURL } from 'node:url';

type Config = {
  networkPassphrase: string;
  rpcUrl: string;
  payer: string;
  signerIdentity: string;
  stellarBinary: string;
  storeDirectory: string;
  maxFeeStroops: string;
  maxRecipients: number;
  contracts: Record<string, { wasmHash: string; token: string; creator: string; goal: string; deadline: number }>;
  recipients: { campaign: string; contributor: string }[];
};
export function signWithIdentity(binary: string, identity: string, unsignedXdr: string): Promise<string> {
  if (!isAbsolute(binary) || !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(identity) || /^S[A-Z2-7]{55}$/.test(identity)) throw new Error('AUTO_REFUND_SIGNER_CONFIG');
  return new Promise((ok, fail) => {
    const child = execFile(
      binary,
      ['tx', 'sign', '--sign-with-key', identity, '--network-passphrase', TESTNET_PASSPHRASE],
      {
        timeout: 15000,
        maxBuffer: 256 * 1024,
        // Do not inherit STELLAR_SECRET_KEY, network overrides, RPC headers or
        // key/seed overrides from a surrounding shell or service environment.
        env: { HOME: process.env.HOME, PATH: process.env.PATH, XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME },
      },
      (error, stdout) => {
        if (error) {
          fail(new Error('AUTO_REFUND_SIGNER_FAILED'));
          return;
        }
        const signed = stdout.trim();
        if (!/^[A-Za-z0-9+/=]+$/.test(signed)) {
          fail(new Error('AUTO_REFUND_SIGNER_OUTPUT'));
          return;
        }
        ok(signed);
      },
    );
    child.stdin?.on('error', () => fail(new Error('AUTO_REFUND_SIGNER_PIPE')));
    child.stdin?.end(unsignedXdr + '\n');
  });
}
async function main(): Promise<void> {
  const diagnostics = process.argv[3] === '--diagnose';
  const recovery = process.argv[3] === '--recover-expired';
  if (process.env.AUTO_REFUND_EXECUTION !== 'testnet_only_explicit' || process.argv.length !== (recovery || diagnostics ? 4 : 3))
    throw new Error('AUTO_REFUND_EXPLICIT_EXECUTION_REQUIRED');
  const configPath = resolve(process.argv[2]);
  const metadata = await stat(configPath);
  if ((metadata.mode & 0o077) !== 0 || metadata.size > 65536 || !metadata.isFile()) throw new Error('AUTO_REFUND_PRIVATE_CONFIG_REQUIRED');
  const c = JSON.parse(await readFile(configPath, 'utf8')) as Config;
  if (c.networkPassphrase !== TESTNET_PASSPHRASE || !/^[1-9][0-9]*$/.test(c.maxFeeStroops) || !isAbsolute(c.storeDirectory))
    throw new Error('AUTO_REFUND_COMMAND_POLICY');
  const contracts = Object.fromEntries(
    Object.entries(c.contracts).map(([id, v]) => {
      if (!/^[1-9][0-9]*$/.test(v.goal) || !Number.isSafeInteger(v.deadline) || v.deadline < 1) throw new Error('AUTO_REFUND_COMMAND_CONTRACT');
      return [id, { ...v, goal: BigInt(v.goal) }];
    }),
  );
  const chain = new TestnetRefundAdapter({
    rpcUrl: c.rpcUrl,
    payer: c.payer,
    contracts,
    maxFeeStroops: BigInt(c.maxFeeStroops),
    sign: (unsigned) => {
      if (recovery || diagnostics) throw new Error('AUTO_REFUND_RECOVERY_SIGNING_FORBIDDEN');
      return signWithIdentity(c.stellarBinary, c.signerIdentity, unsigned);
    },
  });
  const hashes = new Set(Object.values(contracts).map((v) => v.wasmHash));
  // The worker policy is one reviewed binary, never a wildcard family.
  if (hashes.size !== 1) throw new Error('AUTO_REFUND_SINGLE_REVIEWED_WASM_REQUIRED');
  if (diagnostics) {
    console.log(JSON.stringify(await diagnoseRefundPayer(c.payer, new FileRefundStore(c.storeDirectory), chain)));
    return;
  }
  if (recovery) {
    const row = await recoverExpiredRefundForPayer(
      c.payer,
      {
        enabled: true,
        networkPassphrase: TESTNET_PASSPHRASE,
        reviewedWasmHash: [...hashes][0],
        approvedContracts: Object.keys(contracts),
        maxFeeStroops: BigInt(c.maxFeeStroops),
      },
      chain,
      new FileRefundStore(c.storeDirectory),
    );
    console.log(JSON.stringify(row ? { state: row.state, hash: row.hash, error: row.error, expiryProof: row.expiryProof } : { state: 'idle' }));
    return;
  }
  const results = await runRefundBatch(
    { payer: c.payer, recipients: c.recipients, maxRecipients: c.maxRecipients },
    {
      enabled: true,
      networkPassphrase: TESTNET_PASSPHRASE,
      reviewedWasmHash: [...hashes][0],
      approvedContracts: Object.keys(contracts),
      maxFeeStroops: BigInt(c.maxFeeStroops),
    },
    chain,
    new FileRefundStore(c.storeDirectory),
  );
  // Private operator output excludes serialized signed envelopes.
  console.log(
    JSON.stringify(
      results.map(({ record, ...row }) => ({
        ...row,
        record: record
          ? { state: record.state, hash: record.hash, amount: record.amount, confirmedAmount: record.confirmedAmount, error: record.error }
          : undefined,
      })),
    ),
  );
  if (results.length !== c.recipients.length || results.some((r) => r.error || r.record?.state !== 'confirmed')) process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    console.error('AUTO_REFUND_COMMAND_BLOCKED');
    process.exitCode = 1;
  });
}
