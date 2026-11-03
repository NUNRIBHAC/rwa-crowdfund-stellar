import type { ShareRegisterPayload } from './share-register.js';
import { amountUnits } from './soroban.js';
import { formatUnits } from './share-register.js';

// Corporate-actions PROTOTYPE (off-chain, intended-only, read-only).
// Derives a cap table and a distribution PREVIEW from the share register. It
// moves no funds, signs nothing and creates no holder right or obligation: a
// preview is a calculation an operator can inspect, not a declared dividend.
// Same honesty bar as the share register: positions come from this app's
// intent journal (INTENDED amounts) or, for v2 campaigns, from the on-chain
// balance read at export time; a holder whose position cannot be computed is
// listed as UNKNOWN and excluded from the percentage base, never shown as 0.
export const CORPORATE_ACTIONS_SEMANTICS =
  'Prototype cap table and distribution preview derived from the share register. ' +
  'Positions use the on-chain balance when the register has one (v2), otherwise the journal-derived net INTENDED amount; per-hash network confirmation remains the only source of transferred truth. ' +
  'A holder whose position cannot be computed (missing amounts, negative net) is UNKNOWN and excluded from the base; it is not zero. ' +
  'A preview moves no funds and declares no dividend: no payment, custody, tax, legal or holder-rights claim is made or implied.';

export type CapTableRow = {
  publicKey: string;
  position: string; // decimal units string, or 'UNKNOWN'
  positionSource: 'on-chain' | 'journal-intended' | 'unknown';
  // Share of the KNOWN base in basis points (1/100 %), null when unknown.
  basisPoints: number | null;
  note?: string;
};

export type CapTable = {
  campaignId: string;
  generatedAt: string;
  semantics: string;
  knownBase: string;
  holdersKnown: number;
  holdersUnknown: number;
  complete: boolean; // false when any holder is UNKNOWN
  // How many positions rest on each basis. 'mixed' means on-chain balances and
  // journal-intended amounts are combined: not a finalized register.
  basis: { onChain: number; journalIntended: number; unknown: number; mixed: boolean };
  rows: CapTableRow[];
};

const toUnits = (s: string): bigint | null => {
  try {
    return amountUnits(s);
  } catch {
    return null;
  }
};

export function buildCapTable(register: ShareRegisterPayload): CapTable {
  const raw: { publicKey: string; units: bigint | null; source: CapTableRow['positionSource']; note?: string }[] = register.contributors.map((c) => {
    if (c.onChainBalance !== undefined) {
      const u = toUnits(c.onChainBalance);
      return u !== null && u >= 0n
        ? { publicKey: c.publicKey, units: u, source: 'on-chain' as const }
        : { publicKey: c.publicKey, units: null, source: 'unknown' as const, note: 'unreadable on-chain balance' };
    }
    if (c.netIntended === 'UNKNOWN') return { publicKey: c.publicKey, units: null, source: 'unknown' as const, note: 'a SUCCESS intent has no usable amount' };
    const u = toUnits(c.netIntended.startsWith('-') ? '0' : c.netIntended);
    if (c.netIntended.startsWith('-'))
      return { publicKey: c.publicKey, units: null, source: 'unknown' as const, note: 'refunds exceed journal-recorded contributions' };
    return u !== null
      ? { publicKey: c.publicKey, units: u, source: 'journal-intended' as const }
      : { publicKey: c.publicKey, units: null, source: 'unknown' as const, note: 'unparseable amount' };
  });
  const base = raw.reduce((s, r) => s + (r.units ?? 0n), 0n);
  const rows: CapTableRow[] = raw.map((r) => ({
    publicKey: r.publicKey,
    position: r.units === null ? 'UNKNOWN' : formatUnits(r.units),
    positionSource: r.source,
    basisPoints: r.units === null || base === 0n ? null : Number((r.units * 10000n) / base),
    ...(r.note ? { note: r.note } : {}),
  }));
  const unknown = raw.filter((r) => r.units === null).length;
  return {
    campaignId: register.campaignId,
    generatedAt: register.generatedAt,
    semantics: CORPORATE_ACTIONS_SEMANTICS,
    knownBase: formatUnits(base),
    holdersKnown: raw.length - unknown,
    holdersUnknown: unknown,
    complete: unknown === 0,
    basis: {
      onChain: raw.filter((r) => r.source === 'on-chain').length,
      journalIntended: raw.filter((r) => r.source === 'journal-intended').length,
      unknown,
      mixed: raw.some((r) => r.source === 'on-chain') && raw.some((r) => r.source === 'journal-intended'),
    },
    rows,
  };
}

export type DistributionPreviewRow = { publicKey: string; position: string; amount: string };
export type DistributionPreview = {
  campaignId: string;
  semantics: string;
  kind: 'distribution-preview';
  // 'illustration' only when every holder is known and one basis is used;
  // otherwise 'unavailable' and NO amounts are returned (a partial table
  // could be read as entitlements).
  status: 'illustration' | 'unavailable';
  unavailableReason?: string;
  declarable: false;
  basis: CapTable['basis'];
  total: string;
  allocated: string;
  complete: boolean;
  excludedUnknownHolderCount: number;
  excludedUnknownHolders: string[];
  rows: DistributionPreviewRow[];
  notice: string;
};

// Pro-rata allocation of `total` over holders with a KNOWN positive position,
// largest-remainder so the rows add up to the total EXACTLY (no dust lost or
// invented). Unknown holders are listed, not paid, and flip complete=false.
export function buildDistributionPreview(table: CapTable, totalDecimal: string): DistributionPreview {
  const total = toUnits(totalDecimal);
  if (total === null || total <= 0n) throw new Error('total must be a positive decimal amount with at most 7 decimals');
  const holders = table.rows.filter((r) => r.positionSource !== 'unknown' && r.position !== 'UNKNOWN');
  const units = holders.map((h) => ({ h, u: amountUnits(h.position) })).filter((x) => x.u > 0n);
  const base = units.reduce((s, x) => s + x.u, 0n);
  const alloc = units.map((x) => ({ ...x, a: base === 0n ? 0n : (total * x.u) / base, rem: base === 0n ? 0n : (total * x.u) % base }));
  let left = total - alloc.reduce((s, x) => s + x.a, 0n);
  if (base > 0n) {
    [...alloc]
      .sort((a, b) => (a.rem === b.rem ? a.h.publicKey.localeCompare(b.h.publicKey) : a.rem > b.rem ? -1 : 1))
      .forEach((x) => {
        if (left > 0n) {
          x.a += 1n;
          left -= 1n;
        }
      });
  }
  const excluded = table.rows.filter((r) => r.positionSource === 'unknown').map((r) => r.publicKey);
  const complete = excluded.length === 0 && base > 0n;
  const reason =
    excluded.length > 0
      ? `${excluded.length} holder position(s) are UNKNOWN; allocating the total among the rest would imply wrong entitlements`
      : base === 0n
        ? 'no known positive positions'
        : table.basis.mixed
          ? 'positions mix on-chain balances and journal-intended amounts; not a finalized register'
          : undefined;
  const available = complete && !table.basis.mixed;
  return {
    campaignId: table.campaignId,
    semantics: CORPORATE_ACTIONS_SEMANTICS,
    kind: 'distribution-preview',
    status: available ? 'illustration' : 'unavailable',
    ...(reason && !available ? { unavailableReason: reason } : {}),
    declarable: false,
    basis: table.basis,
    total: formatUnits(total),
    allocated: available ? formatUnits(alloc.reduce((s, x) => s + x.a, 0n)) : '0',
    complete,
    excludedUnknownHolderCount: excluded.length,
    excludedUnknownHolders: excluded,
    rows: available ? alloc.map((x) => ({ publicKey: x.h.publicKey, position: x.h.position, amount: formatUnits(x.a) })) : [],
    notice: available
      ? 'ILLUSTRATION ONLY: no funds move and no dividend is declared; this is not a final or declarable allocation.'
      : 'ALLOCATION UNAVAILABLE: ' + (reason ?? 'incomplete basis') + '. Nothing is declared or payable.',
  };
}

export type Holding = {
  campaignId: string;
  position: string; // decimal units string, or 'UNKNOWN' (never 0 when unknown)
  positionSource: CapTableRow['positionSource'];
  basisPoints: number | null;
  note?: string;
  // Register-level honesty: the base the percentage rests on.
  registerComplete: boolean;
  basisMixed: boolean;
};

// One wallet's own position taken from a cap table. Returns null when the
// wallet has no row; an UNKNOWN row stays UNKNOWN and is never coerced to 0.
export function holdingFromCapTable(table: CapTable, publicKey: string): Holding | null {
  const row = table.rows.find((r) => r.publicKey === publicKey);
  if (!row) return null;
  return {
    campaignId: table.campaignId,
    position: row.position,
    positionSource: row.positionSource,
    basisPoints: row.basisPoints,
    ...(row.note ? { note: row.note } : {}),
    registerComplete: table.complete,
    basisMixed: table.basis.mixed,
  };
}
