// Read-only opt-in view. No signer, network calls, queue, payer reservation or
// public actor selector. The authenticated wallet is supplied by the route.
import { readFile, stat } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { Asset, Networks, StrKey } from '@stellar/stellar-sdk';
import { FileRefundStore } from './automatic-refund-store.js';
import { refundStatusView } from './automatic-refund-batch.js';
import { TESTNET_PASSPHRASE } from './automatic-refunds.js';
export type AutomaticRefundReadRow = { campaign: string; status: 'pending' | 'submitted' | 'paid' | 'blocked'; amount?: string };
export async function readAutomaticRefunds(configPath: string, wallet: string): Promise<AutomaticRefundReadRow[]> {
  if (!isAbsolute(configPath) || !StrKey.isValidEd25519PublicKey(wallet)) throw new Error('AUTO_REFUND_READ_POLICY');
  const metadata = await stat(configPath);
  if (!metadata.isFile() || metadata.size > 65536 || (metadata.mode & 0o077) !== 0) throw new Error('AUTO_REFUND_READ_CONFIG');
  const c = JSON.parse(await readFile(configPath, 'utf8')) as {
    networkPassphrase: string;
    storeDirectory: string;
    contracts: Record<string, { token: string }>;
    recipients: { campaign: string; contributor: string }[];
  };
  // Initial screen supports native test XLM only. Never label another token
  // XLM or guess its decimals. Other token workers need a reviewed UI adapter.
  if (c.networkPassphrase !== TESTNET_PASSPHRASE || !isAbsolute(c.storeDirectory) || !Array.isArray(c.recipients) || c.recipients.length > 25)
    throw new Error('AUTO_REFUND_READ_POLICY');
  const store = new FileRefundStore(c.storeDirectory);
  const rows: AutomaticRefundReadRow[] = [];
  const seen = new Set<string>();
  for (const recipient of c.recipients) {
    if (
      !StrKey.isValidContract(recipient.campaign) ||
      !StrKey.isValidEd25519PublicKey(recipient.contributor) ||
      c.contracts[recipient.campaign]?.token !== Asset.native().contractId(Networks.TESTNET)
    )
      throw new Error('AUTO_REFUND_READ_POLICY');
    if (recipient.contributor !== wallet || seen.has(recipient.campaign)) continue;
    seen.add(recipient.campaign);
    const record = await store.read(JSON.stringify([recipient.campaign, wallet]));
    if (!record) continue; // No invented progress before the worker records it.
    if (record.campaign !== recipient.campaign || record.contributor !== wallet) throw new Error('AUTO_REFUND_READ_IDENTITY');
    const view = refundStatusView(record);
    rows.push({ campaign: recipient.campaign, status: view.status, ...(view.amount ? { amount: view.amount } : {}) });
  }
  return rows;
}
