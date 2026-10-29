if (process.env.LEGACY_MAINTENANCE !== 'explicitly_authorized') throw new Error('Legacy classic script disabled. Do not run without a separately reviewed migration/reconciliation plan.');
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Asset, Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import {
  createCampaign,
  buildInvestXdr,
  submitSignedInvest,
  listCampaigns,
  finalize,
} from './campaigns.js';
import { getBalances, submitPayment } from './chain.js';
import { USDC } from './config.js';
import { requirePlatform } from './stellar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

const GOAL = 40;
const AMOUNTS = [20, 12, 8];

async function main() {
  const map = JSON.parse(fs.readFileSync(path.join(backendRoot, '.demo-investors.json'), 'utf8'));
  const pubs = Object.keys(map);
  if (pubs.length < 3) throw new Error('You need 3 demo investors (seedDemoInvestors)');
  console.log('Demo investors:', pubs);

  const plat = requirePlatform();
  const usdc = new Asset(USDC.code, USDC.issuer);
  console.log('Platform:', plat.publicKey());
  console.log('USDC issuer:', USDC.issuer);
  console.log('Platform before:', JSON.stringify(await getBalances(plat.publicKey()), null, 2));

  // Re-fund the investors (they spent their USDC in the previous E2E) and prove the escrow.
  for (let n = 0; n < 3; n++) {
    await submitPayment(plat, pubs[n], usdc, AMOUNTS[n]);
    console.log(`Refunded ${AMOUNTS[n]} USDC -> ${pubs[n].slice(0, 8)}...`);
  }

  // Short deadline so the all-or-nothing time gate can pass before finalize.
  const deadline = new Date(Date.now() + 65 * 1000).toISOString();
  const c = await createCampaign({ name: 'Endpoint Flow Test', goalUsdc: GOAL, supply: 1000, deadline });
  console.log('\nCampaign created:', c.id, c.code, 'state', c.state);
  console.log('mintTx (supply issuance held in escrow):', c.mintTx);
  console.log('Explorer mint:', `https://stellar.expert/explorer/testnet/tx/${c.mintTx}`);

  for (let n = 0; n < 3; n++) {
    const pub = pubs[n];
    const built = await buildInvestXdr(c.id, { investorPub: pub, amountUsdc: AMOUNTS[n] });
    console.log(`\n[${n + 1}] buildInvestXdr -> amountUsdc=${built.amountUsdc} tokens=${built.tokens} ops in XDR`);
    const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
    tx.sign(Keypair.fromSecret(map[pub]));
    const signedXdr = tx.toXDR();
    const after = await submitSignedInvest(c.id, { investorPub: pub, xdr: signedXdr });
    const inv = after.investments[after.investments.length - 1];
    console.log('  investment:', inv.id, 'usdcTx', inv.usdcTx, 'tokenTx', inv.tokenTx);
    console.log('  explorer usdc:', `https://stellar.expert/explorer/testnet/tx/${inv.usdcTx}`);
    console.log('  explorer tokens:', `https://stellar.expert/explorer/testnet/tx/${inv.tokenTx}`);
  }

  const campaign = (await listCampaigns()).find((x) => x.id === c.id)!;
  const total = campaign.investments.reduce((s, i) => s + i.amountUsdc, 0);
  console.log('\nTotal invested in campaign:', total);
  console.log('Investments:', JSON.stringify(campaign.investments, null, 2));

  const waitMs = Date.parse(c.deadline) - Date.now() + 2000;
  console.log(`\nWaiting ${Math.ceil(waitMs / 1000)}s for the deadline (finalize is time-gated)…`);
  await new Promise((r) => setTimeout(r, Math.max(0, waitMs)));

  const finalized = await finalize(c.id);
  console.log('\nFinalized:', finalized.state, 'payoutTx', finalized.payoutTx);
  console.log('Explorer payout:', `https://stellar.expert/explorer/testnet/tx/${finalized.payoutTx}`);

  for (const pub of pubs) {
    const bals = await getBalances(pub);
    const rwa = bals.find((b) => b.code === c.code);
    const usdcBal = bals.find((b) => b.code === USDC.code);
    console.log(`\nBalance ${pub.slice(0, 8)}...: RWA${c.code}=${rwa?.balance ?? '0'} USDC=${usdcBal?.balance ?? '0'}`);
  }
  console.log('\nPlatform after:', JSON.stringify(await getBalances(plat.publicKey()), null, 2));
  const creatorBals = await getBalances(c.creatorPub);
  console.log('Creator after:', JSON.stringify(creatorBals, null, 2));

  console.log('\nEND-TO-END BUILD/SUBMIT OK');
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
