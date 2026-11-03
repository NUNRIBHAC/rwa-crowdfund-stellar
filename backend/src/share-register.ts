import type { Intent } from './journal.js';
import type { ContributorRecord } from './community-store.js';
import { amountUnits } from './soroban.js';

// Share-register export (read-only, admin-gated). Derives a per-campaign
// register from THIS app's durable contributor registry plus the intent
// journal. Same honesty bar as RECONCILIATION_SEMANTICS: journal amounts are
// INTENDED amounts recorded by this app; per-hash network confirmation is
// the only source of transferred truth. Contributors recovered from chain
// events (actor=backend-backfill) carry no journal rows and appear with zero
// journal-derived amounts; journal actors missing from the registry appear
// flagged unregistered (an undrained pending-proof queue entry, not absent
// funds). This is an operator export aid over testnet demo data - not an
// accounting, custody, audit-opinion or legal share register.
export const SHARE_REGISTER_SEMANTICS =
  "Per-campaign contributor register derived from THIS app's intent journal and durable contributor registry. " +
  'Amounts are INTENDED amounts from SUCCESS intents recorded by this app only; per-hash network confirmation (see intentHashes) is the only source of transferred truth. ' +
  'netIntended = contributedIntended - refundedIntended; a negative value means refund intents exceed journal-recorded contributions for that wallet (e.g. a chain-recovered contributor whose contribution predates the journal window). ' +
  'registered=false rows come from the journal but not (yet) the durable registry - check the pending-proof queue before treating them as gaps. ' +
  'Operator export aid over testnet demo data; no accounting, custody, audit-opinion or legal share-register claim is made or implied.';

// v2 contract-set campaigns: on-chain positions read from the pinned
// share-token/offering contracts at export time (code hash verified before
// every read; see readV2SharePositions). The share-token contract does not
// enumerate holders, so balances are queried for app-known addresses only
// (durable contributor registry + SUCCESS journal actors): a holder unknown
// to this app is ABSENT here, not zero. onChainBalance is the contract's
// transferred truth for that address and can legitimately differ from the
// journal-derived intended amounts above (transfers, burns, out-of-band
// movements). Same honesty bar as the v1 register: demo-grade testnet
// scaffolds without external security review; no accounting, custody,
// audit-opinion or legal share-register claim is made or implied.
export const V2_ONCHAIN_SEMANTICS =
  'On-chain v2 share-token positions read at export time from the pinned, code-hash-verified contracts. ' +
  'onChainBalance is transferred truth per the contract; intended amounts remain journal-derived. ' +
  'Only app-known addresses (contributor registry + journal actors) were queried: the token contract does not enumerate holders, so an unknown holder is absent, not zero. ' +
  'Demo-grade testnet scaffolds without external security review; no accounting, custody or legal register claim is made or implied.';

export type V2OnChainData = {
  tokenContractId: string;
  offeringContractId: string;
  token: { name: string; symbol: string; decimals: number; totalSupply: string };
  offering: { token: string; issuer: string; minPerInvestor: string; maxPerInvestor: string; goal: string; deadline: string };
  holders: { publicKey: string; balance: string }[];
  holdersTruncated: boolean;
};

export type ShareRegisterRow = {
  publicKey: string;
  firstConfirmedAt: string | null;
  registered: boolean;
  contributeCount: number;
  refundCount: number;
  contributedIntended: string;
  refundedIntended: string;
  // 'UNKNOWN' when any SUCCESS intent for this wallet has no usable amount:
  // the known subtotals above are then INCOMPLETE and no net is computable.
  netIntended: string;
  contributedComplete: boolean;
  refundedComplete: boolean;
  missingAmountIntents: number;
  intentHashes: string[];
  // Present only for v2 contract-set campaigns when the address was in the
  // queried holder set (7-decimal base units as a decimal string).
  onChainBalance?: string;
};

export type ShareRegisterPayload = {
  generatedAt: string;
  network: string;
  demo: true;
  campaignId: string;
  semantics: string;
  totals: {
    contributors: number;
    contributeCount: number;
    refundCount: number;
    contributedIntended: string;
    refundedIntended: string;
    // 'UNKNOWN' when any wallet is incomplete; the subtotals are then known-amount sums only.
    netIntended: string;
    netKnownSubtotal: string;
    contributedComplete: boolean;
    refundedComplete: boolean;
    missingAmountIntents: number;
  };
  notes: string[];
  contributors: ShareRegisterRow[];
  // Present only for v2 contract-set campaigns.
  v2OnChain?: (V2OnChainData & { semantics: string }) | null;
};

// Inverse of amountUnits: 7-decimal base units back to a trimmed decimal
// string. Handles negative sums (refund > journal-recorded contribution).
export function formatUnits(units: bigint): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const whole = abs / 10000000n;
  const fraction = (abs % 10000000n).toString().padStart(7, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole.toString()}${fraction ? `.${fraction}` : ''}`;
}

type Accum = {
  publicKey: string;
  firstConfirmedAt: string | null;
  registered: boolean;
  contributeCount: number;
  refundCount: number;
  contributed: bigint;
  refunded: bigint;
  missing: number;
  missingContribute: number;
  missingRefund: number;
  hashes: string[];
};

export function buildShareRegister(
  campaignId: string,
  intents: Intent[],
  contributors: ContributorRecord[],
  network: string,
  v2OnChain?: V2OnChainData | null,
): ShareRegisterPayload {
  const rows = new Map<string, Accum>();
  const ensure = (publicKey: string): Accum => {
    let acc = rows.get(publicKey);
    if (!acc) {
      acc = {
        publicKey,
        firstConfirmedAt: null,
        registered: false,
        contributeCount: 0,
        refundCount: 0,
        contributed: 0n,
        refunded: 0n,
        missing: 0,
        missingContribute: 0,
        missingRefund: 0,
        hashes: [],
      };
      rows.set(publicKey, acc);
    }
    return acc;
  };
  for (const c of contributors) {
    if (c.campaignId !== campaignId) continue;
    const acc = ensure(c.publicKey);
    acc.registered = true;
    acc.firstConfirmedAt = new Date(c.firstConfirmedAt).toISOString();
  }
  for (const i of intents) {
    if (i.campaign !== campaignId || i.status !== 'SUCCESS') continue;
    if (i.action !== 'contribute' && i.action !== 'refund') continue;
    const acc = ensure(i.actor);
    if (i.amount === undefined || i.amount === '') {
      // Rows written before the journal captured amounts: counted as intents
      // but excluded from the sums, and disclosed below.
      acc.missing += 1;
      if (i.action === 'contribute') acc.missingContribute += 1;
      else acc.missingRefund += 1;
    } else {
      try {
        if (i.action === 'contribute') acc.contributed += amountUnits(i.amount);
        else acc.refunded += amountUnits(i.amount);
      } catch {
        // Semantic journal validation should make this unreachable; a
        // malformed amount is excluded from the sums and disclosed.
        acc.missing += 1;
        if (i.action === 'contribute') acc.missingContribute += 1;
        else acc.missingRefund += 1;
      }
    }
    if (i.action === 'contribute') acc.contributeCount += 1;
    else acc.refundCount += 1;
    acc.hashes.push(i.hash);
  }
  const sorted = [...rows.values()].sort(
    (a, b) => (a.firstConfirmedAt ?? '').localeCompare(b.firstConfirmedAt ?? '') || a.publicKey.localeCompare(b.publicKey),
  );
  const notes: string[] = [];
  let missingTotal = 0;
  let incompleteContribute = false;
  let incompleteRefund = false;
  let negativeNet = 0;
  let unregistered = 0;
  let contributedTotal = 0n;
  let refundedTotal = 0n;
  let contributeCountTotal = 0;
  let refundCountTotal = 0;
  const balanceByHolder = new Map<string, string>((v2OnChain?.holders ?? []).map((h) => [h.publicKey, h.balance]));
  const outRows: ShareRegisterRow[] = sorted.map((acc) => {
    missingTotal += acc.missing;
    if (acc.missingContribute > 0) incompleteContribute = true;
    if (acc.missingRefund > 0) incompleteRefund = true;
    contributeCountTotal += acc.contributeCount;
    refundCountTotal += acc.refundCount;
    contributedTotal += acc.contributed;
    refundedTotal += acc.refunded;
    if (!acc.registered) unregistered += 1;
    if (acc.missing === 0 && acc.refunded > acc.contributed) negativeNet += 1;
    return {
      publicKey: acc.publicKey,
      firstConfirmedAt: acc.firstConfirmedAt,
      registered: acc.registered,
      contributeCount: acc.contributeCount,
      refundCount: acc.refundCount,
      contributedIntended: formatUnits(acc.contributed),
      refundedIntended: formatUnits(acc.refunded),
      netIntended: acc.missing > 0 ? 'UNKNOWN' : formatUnits(acc.contributed - acc.refunded),
      contributedComplete: acc.missingContribute === 0,
      refundedComplete: acc.missingRefund === 0,
      missingAmountIntents: acc.missing,
      intentHashes: acc.hashes,
      ...(balanceByHolder.has(acc.publicKey) ? { onChainBalance: balanceByHolder.get(acc.publicKey)! } : {}),
    };
  });
  if (missingTotal > 0)
    notes.push(
      `${missingTotal} SUCCESS intent(s) carry no parseable amount (recorded before amount capture or malformed) and are excluded from the known-amount subtotals; affected wallets and the aggregate show net UNKNOWN (never 0 or a partial net), refunded/contributed there are INCOMPLETE lower bounds`,
    );
  if (negativeNet > 0)
    notes.push(
      `${negativeNet} contributor row(s) show refund intents exceeding journal-recorded contributions: the contribution predates this journal (e.g. chain-recovered contributor) or came from outside this app`,
    );
  if (unregistered > 0)
    notes.push(`${unregistered} journal actor(s) are not in the durable contributor registry: check the pending-proof queue before treating them as gaps`);
  if (v2OnChain?.holdersTruncated) notes.push('the app-known holder list exceeded the read cap: positions beyond the cap are absent, not zero');
  return {
    generatedAt: new Date().toISOString(),
    network,
    demo: true,
    campaignId,
    semantics: SHARE_REGISTER_SEMANTICS,
    totals: {
      contributors: outRows.length,
      contributeCount: contributeCountTotal,
      refundCount: refundCountTotal,
      contributedIntended: formatUnits(contributedTotal),
      refundedIntended: formatUnits(refundedTotal),
      netIntended: missingTotal > 0 ? 'UNKNOWN' : formatUnits(contributedTotal - refundedTotal),
      netKnownSubtotal: formatUnits(contributedTotal - refundedTotal),
      contributedComplete: !incompleteContribute,
      refundedComplete: !incompleteRefund,
      missingAmountIntents: missingTotal,
    },
    notes,
    contributors: outRows,
    ...(v2OnChain ? { v2OnChain: { ...v2OnChain, semantics: V2_ONCHAIN_SEMANTICS } } : {}),
  };
}

const CSV_FIELDS: Array<[keyof ShareRegisterRow, string]> = [
  ['publicKey', 'public_key'],
  ['firstConfirmedAt', 'first_confirmed_at'],
  ['registered', 'registered'],
  ['contributeCount', 'contribute_count'],
  ['refundCount', 'refund_count'],
  ['contributedIntended', 'contributed_intended'],
  ['refundedIntended', 'refunded_intended'],
  ['netIntended', 'net_intended'],
  ['contributedComplete', 'contributed_complete'],
  ['refundedComplete', 'refunded_complete'],
  ['missingAmountIntents', 'missing_amount_intents'],
  ['intentHashes', 'intent_hashes'],
];

const csvCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;

export function shareRegisterCsv(payload: ShareRegisterPayload): string {
  const v2 = Boolean(payload.v2OnChain);
  const fields: Array<[keyof ShareRegisterRow, string]> = v2 ? [...CSV_FIELDS, ['onChainBalance', 'onchain_balance']] : CSV_FIELDS;
  const header = fields.map(([, label]) => csvCell(label)).join(',');
  const lines = payload.contributors.map((row) =>
    fields
      .map(([key]) => {
        const value = row[key];
        if (Array.isArray(value)) return csvCell(value.join(' '));
        return csvCell(value === null || value === undefined ? '' : String(value));
      })
      .join(','),
  );
  return [header, ...lines].join('\n') + '\n';
}
