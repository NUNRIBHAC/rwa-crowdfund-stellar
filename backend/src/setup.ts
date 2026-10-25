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

let platformSecret = PLATFORM_SECRET;
if (!platformSecret) {
  const kp = Keypair.random();
  platformSecret = kp.secret();
  log('PLATFORM_SECRET não configurado; a xerar novo e gravar no backend/.env.');
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  env = env
    .split('\n')
    .filter((l) => !l.startsWith('PLATFORM_SECRET='))
    .join('\n')
    .trim();
  fs.writeFileSync(envPath, `${env}\nPLATFORM_SECRET=${platformSecret}\n`, 'utf8');
}

const platform = Keypair.fromSecret(platformSecret);
const platformPub = platform.publicKey();
log(`Plataforma: ${platformPub}`);

async function ensureAccount(pub: string): Promise<void> {
  try {
    await server.loadAccount(pub);
    log(`Conta ${pub.slice(0, 6)}… xa existe.`);
    return;
  } catch (err: unknown) {
    if (!is404(err)) throw err;
  }
  log(`Conta ${pub.slice(0, 6)}… non existe; a pedir XLM ao Friendbot.`);
  const res = await fetch(`${friendbot}?addr=${pub}`);
  if (!res.ok) throw new Error(`Friendbot falhou (${res.status}): ${await res.text()}`);
  log('Funded con XLM.');
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
  log('Trustline USDC adicionada.');
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
    warn(`Claim Sozu fallou: ${err instanceof Error ? err.message : String(err)}`);
    warn(`Corre manualmente: npx --yes @sozu/faucet@latest claim ${pub}`);
  }
}

async function main(): Promise<void> {
  log(`Rede: ${NETWORK}`);
  if (!hasUsdcConfig) warn('USDC_ISSUER vazio; a saltar trustline/claim USDC.');

  await ensureAccount(platformPub);
  await addUsdcTrustline(platform);
  if (hasUsdcConfig) await claimUsdc(platformPub);

  // Investidor demo (1 de 3 para o demo E2E)
  const demo = Keypair.random();
  const demoPub = demo.publicKey();
  log(`Investidor demo: ${demoPub}`);
  await ensureAccount(demoPub);
  await addUsdcTrustline(demo);
  if (hasUsdcConfig) await claimUsdc(demoPub);

  const investors: Record<string, string> = fs.existsSync(demoFile)
    ? JSON.parse(fs.readFileSync(demoFile, 'utf8'))
    : {};
  investors[demoPub] = demo.secret();
  fs.writeFileSync(demoFile, JSON.stringify(investors, null, 2), 'utf8');
  log(`Investidores demo gardados en ${demoFile}`);

  log('Plataforma pronta. Asset RWA: código por campaña (ex: RWA001), issuer = plataforma; emisión no momento do investimento.');
}

main().catch((err) => {
  console.error('[setup] Erro fatal:', err);
  process.exit(1);
});