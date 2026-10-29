if (process.env.LEGACY_MAINTENANCE !== 'explicitly_authorized') throw new Error('Legacy classic script disabled. Do not run without a separately reviewed migration/reconciliation plan.');
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Asset,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import {
  HORIZON_URL,
  NETWORK,
  PLATFORM_SECRET,
  USDC,
  hasUsdcConfig,
} from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const envPath = path.join(backendRoot, '.env');
const demoFile = path.join(backendRoot, '.demo-investors.json');

const networkPassphrase =
  NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;
const server = new Horizon.Server(HORIZON_URL);
const friendbot = 'https://friendbot.stellar.org';

const log = (msg: string) => console.log(`[setup] ${msg}`);
const warn = (msg: string) => console.log(`[setup] ⚠ ${msg}`);

const is404 = (err: unknown): boolean => {
  const e = err as { status?: number; response?: { status?: number } };
  return e?.status === 404 || e?.response?.status === 404;
};

function ensureEnvSecret(name: string, current: string): string {
  if (current) return current;
  const kp = Keypair.random();
  const secret = kp.secret();
  log(`${name} not configured; generating a new one and saving to backend/.env.`);
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  env = env
    .split('\n')
    .filter((l) => !l.startsWith(`${name}=`))
    .join('\n')
    .trim();
  fs.writeFileSync(envPath, `${env}\n${name}=${secret}\n`, 'utf8');
  return secret;
}

let platformSecret = ensureEnvSecret('PLATFORM_SECRET', PLATFORM_SECRET);
ensureEnvSecret('ADMIN_SECRET', process.env.ADMIN_SECRET ?? '');

const platform = Keypair.fromSecret(platformSecret);
const platformPub = platform.publicKey();
log(`Platform: ${platformPub}`);

async function ensureAccount(pub: string): Promise<void> {
  try {
    await server.loadAccount(pub);
    log(`Account ${pub.slice(0, 6)}… already exists.`);
    return;
  } catch (err: unknown) {
    if (!is404(err)) throw err;
  }
  log(`Account ${pub.slice(0, 6)}… does not exist; requesting XLM from Friendbot.`);
  const res = await fetch(`${friendbot}?addr=${pub}`);
  if (!res.ok) throw new Error(`Friendbot failed (${res.status}): ${await res.text()}`);
  log('Funded with XLM.');
}

async function addUsdcTrustline(kp: Keypair): Promise<void> {
  if (!hasUsdcConfig) return;
  const account = await server.loadAccount(kp.publicKey());
  const asset = new Asset(USDC.code, USDC.issuer);
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(30)
    .build();
  tx.sign(kp);
  await server.submitTransaction(tx);
  log('USDC trustline added.');
}

async function claimUsdc(pub: string): Promise<void> {
  try {
    const out = execSync(`npx --yes @sozu/faucet@latest claim ${pub}`, {
      cwd: backendRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    log(`Sozu faucet OK: ${out.trim().slice(0, 400)}`);
  } catch (err) {
    warn(`Sozu claim failed: ${err instanceof Error ? err.message : String(err)}`);
    warn(`Run manually: npx --yes @sozu/faucet@latest claim ${pub}`);
  }
}

async function main(): Promise<void> {
  log(`Network: ${NETWORK}`);
  if (!hasUsdcConfig) warn('USDC_ISSUER empty; skipping USDC trustline/claim.');

  await ensureAccount(platformPub);
  await addUsdcTrustline(platform);
  if (hasUsdcConfig) await claimUsdc(platformPub);

  // Demo investor (1 of 3 for the demo E2E)
  const demo = Keypair.random();
  const demoPub = demo.publicKey();
  log(`Demo investor: ${demoPub}`);
  await ensureAccount(demoPub);
  await addUsdcTrustline(demo);
  if (hasUsdcConfig) await claimUsdc(demoPub);

  const investors: Record<string, string> = fs.existsSync(demoFile)
    ? JSON.parse(fs.readFileSync(demoFile, 'utf8'))
    : {};
  investors[demoPub] = demo.secret();
  fs.writeFileSync(demoFile, JSON.stringify(investors, null, 2), 'utf8');
  log(`Demo investors saved to ${demoFile}`);

  log('Platform ready. RWA asset: per-campaign code (e.g. RWA001), issuer = platform; minted at investment time.');
}

main().catch((err) => {
  console.error('[setup] Fatal error:', err);
  process.exit(1);
});
