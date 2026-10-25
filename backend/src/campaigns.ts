import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Asset, Keypair } from '@stellar/stellar-sdk';
import { USDC, hasUsdcConfig } from './config.js';
import { requirePlatform } from './stellar.js';
import { ensureAccount, ensureTrustline, submitPayment } from './chain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const dataDir = path.join(backendRoot, 'data');
const storePath = path.join(dataDir, 'campaigns.json');
const creatorPath = path.join(backendRoot, '.creator.json');
const demoInvestorsPath = path.join(backendRoot, '.demo-investors.json');

export type Investment = {
  id: string;
  investorPub: string;
  amountUsdc: number;
  tokens: number;
  usdcTx: string;
  tokenTx: string;
  clawbackTx?: string;
  refundTx?: string;
};

export type Campaign = {
  id: string;
  code: string;
  name: string;
  goalUsdc: number;
  deadline: string;
  creatorPub: string;
  supply: number;
  state: 'funding' | 'finalized' | 'refunded';
  createdAt: string;
  mintTx: string;
  payoutTx?: string;
  finalizedAt?: string;
  refundedAt?: string;
  investments: Investment[];
};

type Store = { campaigns: Campaign[]; nextCode: number };

function loadStore(): Store {
  if (!fs.existsSync(storePath)) {
    fs.mkdirSync(dataDir, { recursive: true });
    return { campaigns: [], nextCode: 1 };
  }
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

function saveStore(store: Store): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
}

const usdcAsset = () => new Asset(USDC.code, USDC.issuer);
const rwaAsset = (code: string, issuer: string) => new Asset(code, issuer);

function investedUsdc(c: Campaign): number {
  return c.investments.reduce((sum, i) => sum + i.amountUsdc, 0);
}

function loadCreatorKp(): Keypair {
  if (fs.existsSync(creatorPath)) {
    const data = JSON.parse(fs.readFileSync(creatorPath, 'utf8'));
    return Keypair.fromSecret(data.secret);
  }
  const kp = Keypair.random();
  fs.writeFileSync(
    creatorPath,
    JSON.stringify({ secret: kp.secret(), publicKey: kp.publicKey() }, null, 2),
    'utf8',
  );
  return kp;
}

function demoSecretOf(pub: string): string | null {
  if (!fs.existsSync(demoInvestorsPath)) return null;
  const map = JSON.parse(fs.readFileSync(demoInvestorsPath, 'utf8'));
  const secret = map[pub];
  return typeof secret === 'string' ? secret : null;
}

export function listDemoInvestors(): string[] {
  if (!fs.existsSync(demoInvestorsPath)) return [];
  const map = JSON.parse(fs.readFileSync(demoInvestorsPath, 'utf8'));
  return Object.keys(map);
}

export async function seedDemoInvestors(): Promise<{ investors: string[] }> {
  if (!hasUsdcConfig) throw new Error('USDC_ISSUER non configurado');
  const map = fs.existsSync(demoInvestorsPath)
    ? JSON.parse(fs.readFileSync(demoInvestorsPath, 'utf8'))
    : {};
  const plat = requirePlatform();
  const usdc = usdcAsset();
  for (let n = Object.keys(map).length; n < 3; n++) {
    const kp = Keypair.random();
    const pub = kp.publicKey();
    await ensureAccount(pub);
    await ensureTrustline(kp, usdc);
    await submitPayment(plat, pub, usdc, 30);
    map[pub] = kp.secret();
  }
  fs.writeFileSync(demoInvestorsPath, JSON.stringify(map, null, 2), 'utf8');
  return { investors: Object.keys(map) };
}

export async function listCampaigns(): Promise<Campaign[]> {
  return loadStore().campaigns;
}

export async function createCampaign(input: {
  name: string;
  goalUsdc: number;
  deadline?: string;
  supply?: number;
}): Promise<Campaign> {
  const name = (input.name ?? '').trim();
  const goal = Number(input.goalUsdc);
  const supply = Math.floor(Number(input.supply ?? 1000));
  if (!name) throw new Error('name obrigatorio');
  if (!Number.isFinite(goal) || goal <= 0) throw new Error('goalUsdc debe ser > 0');
  if (supply <= 0) throw new Error('supply debe ser > 0');
  if (!hasUsdcConfig) throw new Error('USDC_ISSUER non configurado (backend/.env)');

  const plat = requirePlatform();
  const store = loadStore();
  const creator = loadCreatorKp();

  await ensureAccount(creator.publicKey());
  await ensureTrustline(creator, usdcAsset());

  const code = `RWA${String(store.nextCode).padStart(3, '0')}`;
  const id = `c${store.nextCode}`;
  store.nextCode += 1;

  const campaign: Campaign = {
    id,
    code,
    name,
    goalUsdc: Math.round(goal * 100) / 100,
    deadline: input.deadline
      ? new Date(input.deadline).toISOString()
      : new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    creatorPub: creator.publicKey(),
    supply,
    state: 'funding',
    createdAt: new Date().toISOString(),
    mintTx: '',
    investments: [],
  };

  // Emitir o supply e mantelo en escrow na conta da plataforma (crea o asset onchain).
  campaign.mintTx = await submitPayment(
    plat,
    plat.publicKey(),
    rwaAsset(code, plat.publicKey()),
    supply,
  );

  store.campaigns.push(campaign);
  saveStore(store);
  return campaign;
}

export async function invest(
  id: string,
  input: { investorPub: string; amountUsdc: number },
): Promise<Campaign> {
  const store = loadStore();
  const campaign = store.campaigns.find((c) => c.id === id);
  if (!campaign) throw new Error(`campaña ${id} non existe`);
  if (campaign.state !== 'funding') throw new Error(`campaña en estado ${campaign.state}`);
  if (Date.now() > Date.parse(campaign.deadline)) throw new Error('prazo rematado');

  const investorPub = (input.investorPub ?? '').trim();
  const amount = Number(input.amountUsdc);
  if (!investorPub.startsWith('G')) throw new Error('investorPub inválido');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('amountUsdc debe ser > 0');

  const remaining = campaign.goalUsdc - investedUsdc(campaign);
  if (remaining <= 0) throw new Error('obxectivo xa alcanzado');
  const rounded = Math.round(Math.min(amount, remaining) * 100) / 100;

  const tokens = Math.floor((rounded / campaign.goalUsdc) * campaign.supply);
  if (tokens <= 0) throw new Error('cantidade moi pequena: non xenera tokens');

  const secret = demoSecretOf(investorPub);
  if (!secret) {
    throw new Error(
      'Conta non demo: asinatura con Freighter no seguinte paso. ' +
        `Usa unha conta de backend/.demo-investors.json para o E2E: ${listDemoInvestors().join(', ')}`,
    );
  }
  const investor = Keypair.fromSecret(secret);

  const plat = requirePlatform();
  const usdc = usdcAsset();
  const rwa = rwaAsset(campaign.code, plat.publicKey());

  await ensureAccount(investorPub);
  await ensureTrustline(investor, usdc);
  await ensureTrustline(investor, rwa);

  const usdcTx = await submitPayment(investor, plat.publicKey(), usdc, rounded);
  const tokenTx = await submitPayment(plat, investorPub, rwa, tokens);

  campaign.investments.push({
    id: `i${campaign.investments.length + 1}`,
    investorPub,
    amountUsdc: rounded,
    tokens,
    usdcTx,
    tokenTx,
  });
  saveStore(store);
  return campaign;
}

export async function finalize(id: string): Promise<Campaign> {
  const store = loadStore();
  const campaign = store.campaigns.find((c) => c.id === id);
  if (!campaign) throw new Error(`campaña ${id} non existe`);
  if (campaign.state !== 'funding') throw new Error(`campaña en estado ${campaign.state}`);

  const total = investedUsdc(campaign);
  if (total <= 0) throw new Error('sen investimentos; non se pode finalizar');
  if (total < campaign.goalUsdc) {
    throw new Error(`obxectivo non alcanzado (${total}/${campaign.goalUsdc})`);
  }

  const plat = requirePlatform();
  const creator = loadCreatorKp();
  await ensureTrustline(creator, usdcAsset());

  campaign.payoutTx = await submitPayment(plat, campaign.creatorPub, usdcAsset(), total);
  campaign.state = 'finalized';
  campaign.finalizedAt = new Date().toISOString();
  saveStore(store);
  return campaign;
}

export async function refund(id: string): Promise<Campaign> {
  const store = loadStore();
  const campaign = store.campaigns.find((c) => c.id === id);
  if (!campaign) throw new Error(`campaña ${id} non existe`);
  if (campaign.state !== 'funding') throw new Error(`campaña en estado ${campaign.state}`);

  const plat = requirePlatform();
  for (const inv of campaign.investments) {
    if (inv.refundTx) continue;
    inv.refundTx = await submitPayment(plat, inv.investorPub, usdcAsset(), inv.amountUsdc);
    const secret = demoSecretOf(inv.investorPub);
    if (secret) {
      const kp = Keypair.fromSecret(secret);
      inv.clawbackTx = await submitPayment(
        kp,
        plat.publicKey(),
        rwaAsset(campaign.code, plat.publicKey()),
        inv.tokens,
      );
    }
  }
  campaign.state = 'refunded';
  campaign.refundedAt = new Date().toISOString();
  saveStore(store);
  return campaign;
}