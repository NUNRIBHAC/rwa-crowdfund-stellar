import { Asset, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { HORIZON_URL } from './config.js';
import { networkPassphrase, server } from './stellar.js';

const FRIENDBOT = 'https://friendbot.stellar.org';

export type Balance = { code: string; issuer: string; balance: string };

export async function accountExists(pub: string): Promise<boolean> {
  try {
    await server.loadAccount(pub);
    return true;
  } catch {
    return false;
  }
}

export async function fundFromFriendbot(pub: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT}?addr=${pub}`);
  if (!res.ok) {
    throw new Error(`Friendbot failed (${res.status}): ${await res.text()}`);
  }
}

export async function ensureAccount(pub: string): Promise<void> {
  if (!(await accountExists(pub))) {
    await fundFromFriendbot(pub);
  }
}

export async function hasTrustline(pub: string, asset: Asset): Promise<boolean> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${pub}`);
    if (!res.ok) return false;
    const data: any = await res.json();
    return (data.balances ?? []).some((b: { asset_code?: string; asset_issuer?: string }) => b.asset_code === asset.code && b.asset_issuer === asset.issuer);
  } catch {
    return false;
  }
}

export async function ensureTrustline(kp: Keypair, asset: Asset): Promise<void> {
  if (await hasTrustline(kp.publicKey(), asset)) return;
  const account = await server.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(60)
    .build();
  tx.sign(kp);
  await server.submitTransaction(tx);
}

export async function submitPayment(from: Keypair, toPub: string, asset: Asset, amount: number | string): Promise<string> {
  const account = await server.loadAccount(from.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: toPub,
        asset,
        amount: typeof amount === 'number' ? amount.toFixed(7) : amount,
      }),
    )
    .setTimeout(60)
    .build();
  tx.sign(from);
  try {
    const resp = await server.submitTransaction(tx);
    return String(resp.hash ?? resp);
  } catch (e: any) {
    const rcs = e?.response?.data?.extras?.result_codes;
    if (rcs) console.error('SUBMIT_FAIL result_codes=', JSON.stringify(rcs, null, 2));
    throw e;
  }
}

export async function getBalances(pub: string): Promise<Balance[]> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${pub}`);
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.balances ?? []).map((b: any) => ({
      code: String(b.asset_code ?? ''),
      issuer: String(b.asset_issuer ?? ''),
      balance: String(b.balance ?? '0'),
    }));
  } catch {
    return [];
  }
}
