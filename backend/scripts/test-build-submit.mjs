import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const demoFile = path.join(backendRoot, '.demo-investors.json');

const BASE_URL = process.env.API_URL ?? 'http://localhost:4000';

const log = (msg) => console.log(`[test-build-submit] ${msg}`);
const fail = (msg) => { console.error(`[test-build-submit] ERRO: ${msg}`); process.exit(1); };

async function api(pathname, options) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) fail(`${options?.method ?? 'GET'} ${pathname} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

if (!fs.existsSync(demoFile)) fail(`${demoFile} não existe; corre npm.cmd run setup primeiro.`);
const investors = JSON.parse(fs.readFileSync(demoFile, 'utf8'));
const pubs = Object.keys(investors);
if (pubs.length === 0) fail('Sem investidores demo em .demo-investors.json.');

// Escolhe o primeiro investidor (o do setup; após o demo c1 ficou com 40 USDC).
const investorPub = pubs[0];
const wallet = await api(`/api/demo/wallet/${investorPub}`);
const usdc = wallet.balances?.find((b) => b.code === 'USDC');
const usdcBalance = usdc ? Number(usdc.balance) : 0;
if (usdcBalance <= 0) fail(`Investidor ${investorPub.slice(0, 6)}… sem USDC (${usdcBalance}); precisa de setup novo.`);
log(`Investidor ${investorPub.slice(0, 6)}… com ${usdc.balance} USDC`);

// 1. Campanha nova
log('A criar campanha de teste (goal 40 USDC)...');
const campaign = await api('/api/campaigns', {
  method: 'POST',
  body: JSON.stringify({ name: 'Test Build/Submit', goalUsdc: 40, supply: 1000 }),
});
log(`Campanha ${campaign.id} (${campaign.code}) criada.`);

// 2. Build
log('A pedir XDR de investimento...');
const build = await api(`/api/campaigns/${campaign.id}/invest/build`, {
  method: 'POST',
  body: JSON.stringify({ investorPub, amountUsdc: 40 }),
});
log(`XDR recebido (amountUsdc=${build.amountUsdc}, tokens=${build.tokens}).`);

// 3. Assinar (simula o Freighter)
const kp = Keypair.fromSecret(investors[investorPub]);
const tx = TransactionBuilder.fromXDR(build.xdr, build.networkPassphrase);
tx.sign(kp);
const signedXdr = tx.toXDR();
log('XDR assinado.');

// 4. Submeter
log('A submeter XDR assinado...');
const updated = await api(`/api/campaigns/${campaign.id}/invest/submit`, {
  method: 'POST',
  body: JSON.stringify({ investorPub, xdr: signedXdr }),
});
const inv = updated.investments?.find((i) => i.investorPub === investorPub);
if (!inv) fail('Resposta sem investment registado.');
log(`Investimento registado: ${inv.amountUsdc} USDC -> ${inv.tokens} tokens (usdcTx=${inv.usdcTx.slice(0, 16)}…, tokenTx=${inv.tokenTx.slice(0, 16)}…).`);

// 5. Verificar saldo do ativo RWA novo
const wallet2 = await api(`/api/demo/wallet/${investorPub}`);
const rwa = wallet2.balances?.find((b) => b.code === campaign.code);
if (!rwa) fail(`Sem saldo de ${campaign.code} na carteira.`);
log(`Saldo ${campaign.code}: ${rwa.balance}`);

console.log('\n[test-build-submit] SUCESSO: fluxo build → assinatura → submit → tokens entregues.');