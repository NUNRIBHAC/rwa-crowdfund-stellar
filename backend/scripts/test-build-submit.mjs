import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const demoFile = path.join(backendRoot, '.demo-investors.json');

const BASE_URL = process.env.API_URL ?? 'http://localhost:4000';

const log = (msg) => console.log(`[test-build-submit] ${msg}`);
const fail = (msg) => { console.error(`[test-build-submit] ERROR: ${msg}`); process.exit(1); };

async function api(pathname, options) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) fail(`${options?.method ?? 'GET'} ${pathname} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

if (!fs.existsSync(demoFile)) fail(`${demoFile} does not exist; run npm.cmd run setup first.`);
const investors = JSON.parse(fs.readFileSync(demoFile, 'utf8'));
const pubs = Object.keys(investors);
if (pubs.length === 0) fail('No demo investors in .demo-investors.json.');

// Pick the first investor (the one from setup; after the demo c1 is left with 40 USDC).
const investorPub = pubs[0];
const wallet = await api(`/api/demo/wallet/${investorPub}`);
const usdc = wallet.balances?.find((b) => b.code === 'USDC');
const usdcBalance = usdc ? Number(usdc.balance) : 0;
if (usdcBalance <= 0) fail(`Investor ${investorPub.slice(0, 6)}… has no USDC (${usdcBalance}); needs a fresh setup.`);
log(`Investor ${investorPub.slice(0, 6)}… with ${usdc.balance} USDC`);

// 1. New campaign
log('Creating test campaign (40 USDC goal)...');
const campaign = await api('/api/campaigns', {
  method: 'POST',
  body: JSON.stringify({ name: 'Test Build/Submit', goalUsdc: 40, supply: 1000 }),
});
log(`Campaign ${campaign.id} (${campaign.code}) created.`);

// 2. Build
log('Requesting investment XDR...');
const build = await api(`/api/campaigns/${campaign.id}/invest/build`, {
  method: 'POST',
  body: JSON.stringify({ investorPub, amountUsdc: 40 }),
});
log(`XDR received (amountUsdc=${build.amountUsdc}, tokens=${build.tokens}).`);

// 3. Sign (simulates Freighter)
const kp = Keypair.fromSecret(investors[investorPub]);
const tx = TransactionBuilder.fromXDR(build.xdr, build.networkPassphrase);
tx.sign(kp);
const signedXdr = tx.toXDR();
log('XDR signed.');

// 4. Submit
log('Submitting signed XDR...');
const updated = await api(`/api/campaigns/${campaign.id}/invest/submit`, {
  method: 'POST',
  body: JSON.stringify({ investorPub, xdr: signedXdr }),
});
const inv = updated.investments?.find((i) => i.investorPub === investorPub);
if (!inv) fail('Response without a recorded investment.');
log(`Investment recorded: ${inv.amountUsdc} USDC -> ${inv.tokens} tokens (usdcTx=${inv.usdcTx.slice(0, 16)}…, tokenTx=${inv.tokenTx.slice(0, 16)}…).`);

// 5. Check the new RWA asset balance
const wallet2 = await api(`/api/demo/wallet/${investorPub}`);
const rwa = wallet2.balances?.find((b) => b.code === campaign.code);
if (!rwa) fail(`No ${campaign.code} balance in wallet.`);
log(`Balance ${campaign.code}: ${rwa.balance}`);

console.log('\n[test-build-submit] SUCCESS: build → sign → submit → tokens delivered.');